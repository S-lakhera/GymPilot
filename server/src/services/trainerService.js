import bcrypt from 'bcryptjs';
import { withTransaction } from '../config/db.js';
import { userRepository } from '../repositories/userRepository.js';
import { trainerRepository } from '../repositories/trainerRepository.js';
import { refreshTokenRepository } from '../repositories/refreshTokenRepository.js';
import {
  ConflictError,
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from '../utils/errors.js';

export const trainerService = {
  /**
   * Provision a new trainer account and profile atomically (Admin only).
   */
  async createTrainer({
    firstName,
    lastName,
    email,
    password,
    phone,
    specialization,
    experienceYears = 0,
    certification = null,
    bio = null,
    monthlySalary = null,
  }) {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError(
        'A user with this email address already exists.',
        null,
        'EMAIL_EXISTS'
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const created = await withTransaction(async (conn) => {
      // 1. Create user with role 'trainer'
      const userId = await userRepository.create(
        {
          email,
          passwordHash,
          firstName,
          lastName,
          phone,
          role: 'trainer',
          isActive: true,
        },
        conn
      );

      // 2. Create trainer profile
      const profile = await trainerRepository.createProfile(
        {
          userId,
          specialization,
          experienceYears: Number(experienceYears) || 0,
          certification,
          bio,
          monthlySalary: monthlySalary !== null && monthlySalary !== undefined ? Number(monthlySalary) : null,
        },
        conn
      );

      return {
        id: userId,
        firstName,
        lastName,
        email,
        phone,
        role: 'trainer',
        isActive: true,
        profile: {
          id: profile.id,
          specialization: profile.specialization,
          experienceYears: profile.experienceYears,
          certification: profile.certification,
          bio: profile.bio,
          monthlySalary: profile.monthlySalary,
        },
      };
    });

    return created;
  },

  /**
   * List trainers with pagination, search, and visibility controls.
   */
  async listTrainers(
    { page = 1, limit = 10, search = '', isActive = null, sortBy = 'created_at', sortOrder = 'DESC' },
    requestingUser = null
  ) {
    const isAdmin = requestingUser?.role === 'admin';

    // Non-admin can only see active trainers
    const filterIsActive = isAdmin ? isActive : true;

    const result = await trainerRepository.findAll({
      page,
      limit,
      search,
      isActive: filterIsActive,
      sortBy,
      sortOrder,
    });

    // Strip monthly_salary if not Admin
    const sanitizedTrainers = result.trainers.map((t) => {
      const trainerObj = {
        id: t.id,
        firstName: t.first_name,
        lastName: t.last_name,
        email: t.email,
        phone: t.phone,
        role: t.role,
        isActive: Boolean(t.is_active),
        createdAt: t.created_at,
        updatedAt: t.updated_at,
        profile: {
          id: t.profile_id,
          specialization: t.specialization,
          experienceYears: t.experience_years,
          certification: t.certification,
          bio: t.bio,
        },
      };

      if (isAdmin) {
        trainerObj.profile.monthlySalary = t.monthly_salary !== null ? Number(t.monthly_salary) : null;
      }

      return trainerObj;
    });

    return {
      trainers: sanitizedTrainers,
      pagination: result.pagination,
    };
  },

  /**
   * Retrieve trainer details by ID with access control for salary.
   */
  async getTrainerById(id, requestingUser = null) {
    const isAdmin = requestingUser?.role === 'admin';
    const isSelf = requestingUser?.id === Number(id);

    const trainer = await trainerRepository.findByUserId(id, undefined, isAdmin);
    if (!trainer) {
      throw new NotFoundError('Trainer not found.', null, 'TRAINER_NOT_FOUND');
    }

    const result = {
      id: trainer.id,
      firstName: trainer.first_name,
      lastName: trainer.last_name,
      email: trainer.email,
      phone: trainer.phone,
      role: trainer.role,
      isActive: Boolean(trainer.is_active),
      createdAt: trainer.created_at,
      updatedAt: trainer.updated_at,
      profile: {
        id: trainer.profile_id,
        specialization: trainer.specialization,
        experienceYears: trainer.experience_years,
        certification: trainer.certification,
        bio: trainer.bio,
      },
    };

    if (isAdmin || isSelf) {
      result.profile.monthlySalary =
        trainer.monthly_salary !== null ? Number(trainer.monthly_salary) : null;
    }

    return result;
  },

  /**
   * Update trainer details (Admin or Trainer self-profile).
   */
  async updateTrainer(id, updateData, requestingUser) {
    const isAdmin = requestingUser?.role === 'admin';
    const isSelf = requestingUser?.id === Number(id);

    if (!isAdmin && !isSelf) {
      throw new ForbiddenError(
        'You are not authorized to update this trainer profile.',
        null,
        'FORBIDDEN'
      );
    }

    const existingTrainer = await trainerRepository.findByUserId(id, undefined, true);
    if (!existingTrainer) {
      throw new NotFoundError('Trainer not found.', null, 'TRAINER_NOT_FOUND');
    }

    // Security check: Trainer cannot modify salary or active status
    if (!isAdmin) {
      if (updateData.monthlySalary !== undefined) {
        throw new ForbiddenError(
          'Trainers cannot modify their own salary.',
          null,
          'FORBIDDEN'
        );
      }
      if (updateData.isActive !== undefined) {
        throw new ForbiddenError(
          'Trainers cannot modify account status.',
          null,
          'FORBIDDEN'
        );
      }
    }

    return await withTransaction(async (conn) => {
      // 1. Update user fields if provided
      const userUpdates = {};
      if (updateData.firstName !== undefined) userUpdates.firstName = updateData.firstName;
      if (updateData.lastName !== undefined) userUpdates.lastName = updateData.lastName;
      if (updateData.phone !== undefined) userUpdates.phone = updateData.phone;

      if (Object.keys(userUpdates).length > 0) {
        await userRepository.update(id, userUpdates, conn);
      }

      // 2. Update profile fields if provided
      const profileUpdates = {};
      if (updateData.specialization !== undefined) profileUpdates.specialization = updateData.specialization;
      if (updateData.experienceYears !== undefined) profileUpdates.experienceYears = updateData.experienceYears;
      if (updateData.certification !== undefined) profileUpdates.certification = updateData.certification;
      if (updateData.bio !== undefined) profileUpdates.bio = updateData.bio;
      if (isAdmin && updateData.monthlySalary !== undefined) {
        profileUpdates.monthlySalary = updateData.monthlySalary;
      }

      if (Object.keys(profileUpdates).length > 0) {
        await trainerRepository.updateProfileByUserId(id, profileUpdates, conn);
      }

      const updated = await trainerRepository.findByUserId(id, conn, true);

      const response = {
        id: updated.id,
        firstName: updated.first_name,
        lastName: updated.last_name,
        email: updated.email,
        phone: updated.phone,
        role: updated.role,
        isActive: Boolean(updated.is_active),
        profile: {
          id: updated.profile_id,
          specialization: updated.specialization,
          experienceYears: updated.experience_years,
          certification: updated.certification,
          bio: updated.bio,
        },
      };

      if (isAdmin || isSelf) {
        response.profile.monthlySalary =
          updated.monthly_salary !== null ? Number(updated.monthly_salary) : null;
      }

      return response;
    });
  },

  /**
   * Toggle trainer active/inactive status (Admin only).
   */
  async setTrainerStatus(id, isActive) {
    const existing = await trainerRepository.findByUserId(id, undefined, true);
    if (!existing) {
      throw new NotFoundError('Trainer not found.', null, 'TRAINER_NOT_FOUND');
    }

    await withTransaction(async (conn) => {
      await userRepository.updateStatus(id, isActive, conn);

      if (!isActive) {
        await refreshTokenRepository.revokeAllForUser(id, conn);
      }
    });

    return {
      id: existing.id,
      email: existing.email,
      isActive: Boolean(isActive),
      message: isActive ? 'Trainer account activated successfully.' : 'Trainer account deactivated successfully.',
    };
  },
};
