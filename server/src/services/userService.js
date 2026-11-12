import { userRepository } from "../repositories/userRepository.js";
import { memberProfileRepository } from "../repositories/memberProfileRepository.js";
import { refreshTokenRepository } from "../repositories/refreshTokenRepository.js";
import { withTransaction, pool } from "../config/db.js";
import { NotFoundError, BadRequestError } from "../utils/errors.js";
import { UserRoles } from "../models/UserRoles.js";

export const userService = {
  /**
   * Get the current authenticated user's profile with role-specific details.
   */
  async getOwnProfile(userId, role) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    let profile = null;
    let isProfileComplete = false;

    if (role === UserRoles.MEMBER) {
      profile = await memberProfileRepository.findByUserId(userId);
      // Optional profile completeness calculation for UI reminders (non-blocking)
      isProfileComplete = Boolean(
        profile &&
        profile.date_of_birth &&
        profile.gender &&
        profile.emergency_contact_name &&
        profile.emergency_contact_phone,
      );
    } else if (role === UserRoles.TRAINER) {
      const [trainerRows] = await pool.query(
        "SELECT * FROM trainer_profiles WHERE user_id = ?",
        [userId],
      );
      profile = trainerRows[0] || null;
      isProfileComplete = Boolean(profile && profile.specialization);
    } else if (role === UserRoles.ADMIN) {
      isProfileComplete = true;
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
        isActive: Boolean(user.is_active),
        createdAt: user.created_at,
      },
      profile,
      isProfileComplete,
    };
  },

  /**
   * Update the current authenticated user's profile with role-specific allowlists.
   * - Member: updates user identity (users table) and member profile (member_profiles table).
   * - Admin: updates user identity (users table) only; member_profiles is not touched.
   * - Trainer: updates user identity (users table) only (professional trainer fields are managed via trainerService).
   * Returns getOwnProfile(userId, role) ensuring accurate profile completeness calculation.
   *
   * @param {number} userId
   * @param {string} role
   * @param {Object} updateData
   * @returns {Promise<Object>}
   */
  async updateOwnProfile(
    userId,
    role,
    {
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      emergencyContactName,
      emergencyContactPhone,
      healthConditions,
    },
  ) {
    await withTransaction(async (conn) => {
      // 1. Update user identity fields if supplied (allowed for all roles)
      if (firstName || lastName || phone !== undefined) {
        await userRepository.update(
          userId,
          { firstName, lastName, phone },
          conn,
        );
      }

      // 2. Update member profile fields strictly for members
      if (role === UserRoles.MEMBER) {
        await memberProfileRepository.updateByUserId(
          userId,
          {
            dateOfBirth,
            gender,
            emergencyContactName,
            emergencyContactPhone,
            healthConditions,
          },
          conn,
        );
      }
    });

    return await this.getOwnProfile(userId, role);
  },

  /**
   * Backwards-compatible alias for updateOwnProfile (defaults to member role).
   *
   * @param {number} userId
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async updateOwnMemberProfile(userId, data) {
    return this.updateOwnProfile(userId, UserRoles.MEMBER, data);
  },

  /**
   * Admin: List members with pagination, search, and status filters.
   */
  async listMembers(queryParams) {
    return await userRepository.findAllMembers(queryParams);
  },

  /**
   * Admin: Get comprehensive member details by ID (including deactivated members).
   */
  async getMemberById(id) {
    const user = await userRepository.findById(id, pool, true);
    if (!user || user.role !== UserRoles.MEMBER) {
      throw new NotFoundError("Member not found");
    }

    const profile = await memberProfileRepository.findByUserId(id);

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      role: user.role,
      isActive: Boolean(user.is_active),
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      profile,
    };
  },

  /**
   * Admin: Activate or Deactivate (soft-delete) a member account.
   */
  async setMemberStatus(id, isActive) {
    const user = await userRepository.findById(id, pool, true);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (user.role === UserRoles.ADMIN) {
      throw new BadRequestError(
        "Admin accounts cannot be deactivated via this endpoint",
      );
    }

    await withTransaction(async (conn) => {
      await userRepository.updateStatus(id, isActive, conn);

      // If deactivating, immediately revoke all active refresh sessions
      if (!isActive) {
        await refreshTokenRepository.revokeAllForUser(id, conn);
      }
    });

    return {
      id: user.id,
      email: user.email,
      isActive,
      message: isActive
        ? "Account reactivated successfully"
        : "Account deactivated successfully",
    };
  },
};

export default userService;
