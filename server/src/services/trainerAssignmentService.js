import { withTransaction, pool } from '../config/db.js';
import { trainerAssignmentRepository } from '../repositories/trainerAssignmentRepository.js';
import { trainerRequestRepository } from '../repositories/trainerRequestRepository.js';
import { trainerRepository } from '../repositories/trainerRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { subscriptionRepository } from '../repositories/subscriptionRepository.js';
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from '../utils/errors.js';

export const trainerAssignmentService = {
  /**
   * Helper: Check if member holds at least one currently active subscription.
   */
  async checkMemberHasActivePass(memberId, connection = pool) {
    const query = `
      SELECT COUNT(*) AS active_count
      FROM subscriptions
      WHERE user_id = ? AND status = 'active' AND end_date >= CURRENT_DATE
    `;
    const [rows] = await connection.query(query, [memberId]);
    return Number(rows[0]?.active_count || 0) > 0;
  },

  /**
   * Member submits a new coach assignment request.
   * Serializes per member within an ACID transaction to prevent duplicate pending requests.
   */
  async requestTrainer({ memberId, trainerId, notes = null }) {
    if (!memberId || !trainerId) {
      throw new BadRequestError('Member ID and Trainer ID are required.', null, 'MISSING_REQUIRED_FIELDS');
    }

    return withTransaction(async (connection) => {
      // 1. Lock member row to serialize request submissions per member
      await userRepository.lockUser(memberId, connection);

      // 2. Verify member exists and is active
      const member = await userRepository.findById(memberId, connection);
      if (!member || !member.is_active || member.deleted_at) {
        throw new NotFoundError('Member not found or account is deactivated.', null, 'MEMBER_NOT_FOUND');
      }
      if (member.role !== 'member') {
        throw new BadRequestError('Only members can request a personal coach.', null, 'INVALID_ROLE');
      }

      // 3. Enforce prerequisite: Must hold at least one active membership pass
      const hasActivePass = await this.checkMemberHasActivePass(memberId, connection);
      if (!hasActivePass) {
        throw new BadRequestError(
          'You must have an active membership pass to request a personal coach.',
          null,
          'ACTIVE_PASS_REQUIRED'
        );
      }

      // 4. Verify member doesn't already have an ACTIVE or PAUSED assignment
      const existingAssignment = await trainerAssignmentRepository.findActiveByMemberId(memberId, connection, true);
      if (existingAssignment) {
        throw new ConflictError(
          'You already have an active or paused trainer assignment.',
          { assignmentId: existingAssignment.id, status: existingAssignment.status },
          'ASSIGNMENT_ALREADY_EXISTS'
        );
      }

      // 5. Verify member doesn't already have a PENDING request
      const existingRequest = await trainerRequestRepository.findPendingByMemberId(memberId, connection, true);
      if (existingRequest) {
        throw new ConflictError(
          'You already have a pending trainer assignment request under review.',
          { requestId: existingRequest.id },
          'PENDING_REQUEST_ALREADY_EXISTS'
        );
      }

      // 6. Verify requested trainer exists and is active
      const trainer = await trainerRepository.findByUserId(trainerId, connection);
      if (!trainer || !trainer.is_active || trainer.deleted_at) {
        throw new NotFoundError('Requested trainer not found or is currently inactive.', null, 'TRAINER_NOT_FOUND');
      }

      // 7. Create the pending request
      return trainerRequestRepository.create({ memberId, trainerId, notes }, connection);
    });
  },

  /**
   * Member cancels their own pending coach request.
   */
  async cancelRequest(requestId, memberId) {
    const request = await trainerRequestRepository.findById(requestId);
    if (!request) {
      throw new NotFoundError('Coaching request not found.', null, 'REQUEST_NOT_FOUND');
    }
    if (Number(request.member_id) !== Number(memberId)) {
      throw new ForbiddenError('You can only cancel your own coaching requests.', null, 'FORBIDDEN');
    }
    if (request.status !== 'PENDING') {
      throw new BadRequestError(`Cannot cancel a request that is already ${request.status}.`, null, 'INVALID_STATE');
    }

    return trainerRequestRepository.cancelByMember(requestId, memberId);
  },

  /**
   * Administrator reviews (approves or rejects) a member request.
   */
  async reviewRequest(requestId, { action, adminId, rejectionReason = null, overrideCapacity = false }) {
    if (!['APPROVE', 'REJECT'].includes(action)) {
      throw new BadRequestError("Action must be either 'APPROVE' or 'REJECT'.", null, 'INVALID_ACTION');
    }

    return withTransaction(async (connection) => {
      // 1. Fetch and lock request row with SELECT ... FOR UPDATE
      const request = await trainerRequestRepository.findById(requestId, connection, true);
      if (!request) {
        throw new NotFoundError('Coaching request not found.', null, 'REQUEST_NOT_FOUND');
      }
      if (request.status !== 'PENDING') {
        throw new BadRequestError(`Request has already been reviewed (${request.status}).`, null, 'REQUEST_ALREADY_REVIEWED');
      }

      // 2. If rejecting: update status and exit
      if (action === 'REJECT') {
        return trainerRequestRepository.updateStatus(
          requestId,
          { status: 'REJECTED', reviewedById: adminId, rejectionReason, expectedStatus: 'PENDING' },
          connection
        );
      }

      // 3. If approving: acquire resource locks in strictly consistent order (Member then Trainer)
      await userRepository.lockUser(request.member_id, connection);
      const trainer = await trainerRepository.findByUserId(request.trainer_id, connection, false, true);
      if (!trainer || !trainer.is_active || trainer.deleted_at) {
        throw new NotFoundError('Assigned trainer is no longer active.', null, 'TRAINER_INACTIVE');
      }

      // Validate member pass
      const hasActivePass = await this.checkMemberHasActivePass(request.member_id, connection);
      if (!hasActivePass) {
        throw new BadRequestError(
          'Cannot approve request: Member does not currently hold an active membership pass.',
          null,
          'ACTIVE_PASS_REQUIRED'
        );
      }

      // Check member does not have active assignment
      const existingAssignment = await trainerAssignmentRepository.findActiveByMemberId(request.member_id, connection, true);
      if (existingAssignment) {
        throw new ConflictError(
          'Cannot approve request: Member already has an active coach assignment.',
          null,
          'ASSIGNMENT_ALREADY_EXISTS'
        );
      }

      // Check trainer capacity with locking read to observe current committed state
      const activeClientCount = await trainerAssignmentRepository.getActiveClientCount(request.trainer_id, connection, true);
      const maxClients = Number(trainer.max_clients) || 10;
      if (activeClientCount >= maxClients && !overrideCapacity) {
        throw new BadRequestError(
          `Coach ${trainer.first_name} ${trainer.last_name} is at capacity (${activeClientCount}/${maxClients} clients). Confirmation with admin override is required.`,
          { activeClients: activeClientCount, maxClients, requiresOverride: true },
          'TRAINER_AT_CAPACITY'
        );
      }

      // 4. Mark request APPROVED conditioned on PENDING status
      const updatedRequest = await trainerRequestRepository.updateStatus(
        requestId,
        { status: 'APPROVED', reviewedById: adminId, expectedStatus: 'PENDING' },
        connection
      );
      if (!updatedRequest) {
        throw new ConflictError(
          'Coaching request is no longer pending or was cancelled by member.',
          null,
          'REQUEST_NOT_PENDING'
        );
      }

      // 5. Create active assignment
      const assignment = await trainerAssignmentRepository.create(
        {
          memberId: request.member_id,
          trainerId: request.trainer_id,
          requestId: request.id,
          assignedById: adminId,
          notes: request.notes,
        },
        connection
      );

      return assignment;
    });
  },

  /**
   * Administrator directly assigns a trainer to a member (with optional reassignment).
   */
  async assignTrainerDirectly({ memberId, trainerId, adminId, notes = null, overrideCapacity = false }) {
    if (!memberId || !trainerId || !adminId) {
      throw new BadRequestError('Member ID, Trainer ID, and Admin ID are required.', null, 'MISSING_FIELDS');
    }

    return withTransaction(async (connection) => {
      // 1. Acquire resource locks in strictly consistent order (Member then Trainer)
      await userRepository.lockUser(memberId, connection);
      const trainer = await trainerRepository.findByUserId(trainerId, connection, false, true);
      if (!trainer || !trainer.is_active || trainer.deleted_at) {
        throw new NotFoundError('Trainer not found or is currently inactive.', null, 'TRAINER_NOT_FOUND');
      }

      // 2. Verify member and active pass
      const member = await userRepository.findById(memberId, connection);
      if (!member || !member.is_active || member.deleted_at) {
        throw new NotFoundError('Member not found or account is deactivated.', null, 'MEMBER_NOT_FOUND');
      }

      const hasActivePass = await this.checkMemberHasActivePass(memberId, connection);
      if (!hasActivePass) {
        throw new BadRequestError(
          'Member must hold an active membership pass to be assigned a trainer.',
          null,
          'ACTIVE_PASS_REQUIRED'
        );
      }

      // 3. Check trainer capacity with locking read to observe current committed state
      const activeClientCount = await trainerAssignmentRepository.getActiveClientCount(trainerId, connection, true);
      const maxClients = Number(trainer.max_clients) || 10;
      if (activeClientCount >= maxClients && !overrideCapacity) {
        throw new BadRequestError(
          `Coach ${trainer.first_name} ${trainer.last_name} is at capacity (${activeClientCount}/${maxClients} clients). Confirmation with admin override is required.`,
          { activeClients: activeClientCount, maxClients, requiresOverride: true },
          'TRAINER_AT_CAPACITY'
        );
      }

      // 4. Check existing assignment: If already assigned, terminate existing assignment with reason 'MEMBER_REASSIGNED'
      const existingAssignment = await trainerAssignmentRepository.findActiveByMemberId(memberId, connection, true);
      if (existingAssignment) {
        if (Number(existingAssignment.trainer_id) === Number(trainerId)) {
          throw new ConflictError(
            'Member is already actively assigned to this trainer.',
            null,
            'ALREADY_ASSIGNED_TO_TRAINER'
          );
        }
        await trainerAssignmentRepository.terminateAssignment(
          existingAssignment.id,
          { terminationReason: 'MEMBER_REASSIGNED', notes: `Reassigned to ${trainer.first_name} ${trainer.last_name}` },
          connection
        );
      }

      // 5. Cancel any open pending requests for this member
      const pendingRequest = await trainerRequestRepository.findPendingByMemberId(memberId, connection, true);
      if (pendingRequest) {
        await trainerRequestRepository.updateStatus(
          pendingRequest.id,
          { status: 'CANCELLED', reviewedById: adminId, rejectionReason: 'Superseded by direct Admin assignment' },
          connection
        );
      }

      // 6. Create the new assignment
      return trainerAssignmentRepository.create(
        {
          memberId,
          trainerId,
          requestId: pendingRequest?.id || null,
          assignedById: adminId,
          notes,
        },
        connection
      );
    });
  },

  /**
   * Administrator terminates an active or paused assignment.
   */
  async terminateAssignment(assignmentId, { adminId, reason = 'ADMIN_TERMINATED', notes = null }) {
    const assignment = await trainerAssignmentRepository.findById(assignmentId);
    if (!assignment) {
      throw new NotFoundError('Trainer assignment not found.', null, 'ASSIGNMENT_NOT_FOUND');
    }
    if (assignment.status === 'TERMINATED') {
      throw new BadRequestError('Assignment is already terminated.', null, 'ALREADY_TERMINATED');
    }

    return trainerAssignmentRepository.terminateAssignment(assignmentId, {
      terminationReason: reason,
      notes: notes || `Manually terminated by Admin ID ${adminId}`,
    });
  },

  /**
   * Member views their current coaching status and options.
   */
  async getMemberCoachingStatus(memberId) {
    const [currentAssignment, pendingRequest, hasActivePass] = await Promise.all([
      trainerAssignmentRepository.findActiveByMemberId(memberId),
      trainerRequestRepository.findPendingByMemberId(memberId),
      this.checkMemberHasActivePass(memberId),
    ]);

    return {
      currentAssignment,
      pendingRequest,
      hasActivePass,
      canRequestCoach: Boolean(hasActivePass && !currentAssignment && !pendingRequest),
    };
  },

  /**
   * Trainer views their assigned client roster.
   */
  async getTrainerRoster(trainerId, queryParams = {}) {
    const trainer = await trainerRepository.findByUserId(trainerId);
    if (!trainer) {
      throw new NotFoundError('Trainer profile not found.', null, 'TRAINER_NOT_FOUND');
    }

    const [rosterData, activeCount] = await Promise.all([
      trainerAssignmentRepository.listAssignmentsByTrainer(trainerId, queryParams),
      trainerAssignmentRepository.getActiveClientCount(trainerId),
    ]);

    const maxClients = Number(trainer.max_clients) || 10;

    return {
      ...rosterData,
      trainerProfile: {
        id: trainer.id,
        firstName: trainer.first_name,
        lastName: trainer.last_name,
        specialization: trainer.specialization,
        gender: trainer.gender,
        experienceYears: trainer.experience_years,
        certification: trainer.certification,
        bio: trainer.bio,
        maxClients,
        activeClientsCount: activeCount,
      },
      metrics: {
        activeClients: activeCount,
        maxClients,
        capacityPercent: Math.min(100, Math.round((activeCount / maxClients) * 100)),
        isAtCapacity: activeCount >= maxClients,
      },
    };
  },

  /**
   * Admin coaching dashboard overview.
   */
  async getAdminCoachingOverview(queryParams = {}) {
    const [trainers, requestsData, assignmentsData] = await Promise.all([
      trainerAssignmentRepository.listTrainersWithCapacity(),
      trainerRequestRepository.findAll({ status: 'PENDING', limit: 10 }),
      trainerAssignmentRepository.listAllAssignments(queryParams),
    ]);

    return {
      trainers,
      pendingRequests: requestsData.requests,
      pendingRequestsCount: requestsData.pagination.total,
      assignments: assignmentsData.assignments,
      pagination: assignmentsData.pagination,
    };
  },

  /**
   * Daily maintenance & reconciliation lifecycle engine.
   * 1. Pauses ACTIVE assignments whose member has 0 active passes (starts 10-day grace period).
   * 2. Auto-terminates PAUSED assignments whose 10-day grace period has expired.
   */
  async syncGracePeriodsAndPauses() {
    return withTransaction(async (connection) => {
      // 1. Find active assignments with no active passes -> coordinate with pass activation & PAUSE them
      const assignmentsToPause = await trainerAssignmentRepository.findActiveAssignmentsWithNoActivePasses(connection);
      let pausedCount = 0;
      for (const item of assignmentsToPause) {
        // Lock member row to coordinate with any concurrent pass activation / renewal
        await userRepository.lockUser(item.member_id, connection);
        // Re-check member pass eligibility within the locked transaction
        const hasActivePass = await this.checkMemberHasActivePass(item.member_id, connection);
        if (!hasActivePass) {
          await trainerAssignmentRepository.pauseAssignment(item.id, { gracePeriodDays: 10 }, connection);
          pausedCount++;
        }
      }

      // 2. Find paused assignments where grace period has elapsed -> TERMINATE them with row lock
      const assignmentsToTerminate = await trainerAssignmentRepository.findExpiredGraceAssignments(connection, true);
      let terminatedCount = 0;
      for (const item of assignmentsToTerminate) {
        await trainerAssignmentRepository.terminateAssignment(
          item.id,
          {
            terminationReason: 'GRACE_PERIOD_EXPIRED',
            notes: '10-day renewal grace period elapsed without pass activation.',
          },
          connection
        );
        terminatedCount++;
      }

      return {
        pausedCount,
        terminatedCount,
        syncedAt: new Date().toISOString(),
      };
    });
  },

  /**
   * Hook: Triggered automatically upon subscription purchase or renewal.
   * If member has a PAUSED assignment within the unexpired grace period, restores it to ACTIVE.
   */
  async restoreAssignmentIfInGracePeriod(memberId, connection = pool) {
    const existing = await trainerAssignmentRepository.findActiveByMemberId(memberId, connection, true);
    if (existing && existing.status === 'PAUSED') {
      const restored = await trainerAssignmentRepository.restoreAssignment(existing.id, connection);
      return Boolean(restored);
    }
    return false;
  },
};

export default trainerAssignmentService;
