import { trainerAssignmentService } from '../services/trainerAssignmentService.js';
import { trainerAssignmentRepository } from '../repositories/trainerAssignmentRepository.js';
import { ApiResponse } from '../utils/apiResponse.js';

function normalizeBoolean(val) {
  if (val === true || val === 'true' || val === 1 || val === '1') return true;
  return false;
}

function cleanQueryParams(query = {}) {
  const cleaned = {};
  for (const [key, value] of Object.entries(query)) {
    if (value !== '' && value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export const trainerAssignmentController = {
  /**
   * Member: Get own coaching assignment and request status.
   */
  async getMemberStatus(req, res) {
    const status = await trainerAssignmentService.getMemberCoachingStatus(req.user.id);
    return ApiResponse.success(res, status, 'Coaching status retrieved successfully.');
  },

  /**
   * Member: Submit a new coaching request to an available trainer.
   */
  async requestTrainer(req, res) {
    const { trainerId, notes } = req.body;
    const request = await trainerAssignmentService.requestTrainer({
      memberId: req.user.id,
      trainerId: Number(trainerId),
      notes,
    });
    return ApiResponse.created(res, request, 'Trainer assignment request submitted successfully.');
  },

  /**
   * Member: Cancel own pending request.
   */
  async cancelRequest(req, res) {
    const requestId = Number(req.params.id);
    const request = await trainerAssignmentService.cancelRequest(requestId, req.user.id);
    return ApiResponse.success(res, request, 'Coaching request cancelled successfully.');
  },

  /**
   * All authenticated users: List all trainers with capacity metrics and active client counts.
   */
  async getTrainersWithCapacity(req, res) {
    const trainers = await trainerAssignmentRepository.listTrainersWithCapacity();
    return ApiResponse.success(res, trainers, 'Available trainers retrieved successfully.');
  },

  /**
   * Trainer: Get assigned member roster with medical notes, emergency contact, and passes.
   */
  async getTrainerRoster(req, res) {
    const query = cleanQueryParams(req.query);
    if (query.page) query.page = Number(query.page);
    if (query.limit) query.limit = Number(query.limit);
    const roster = await trainerAssignmentService.getTrainerRoster(req.user.id, query);
    return ApiResponse.success(res, roster, 'Client roster retrieved successfully.');
  },

  /**
   * Admin: Get full coaching dashboard overview (trainers, pending queue, and assignments ledger).
   */
  async getAdminOverview(req, res) {
    const query = cleanQueryParams(req.query);
    if (query.page) query.page = Number(query.page);
    if (query.limit) query.limit = Number(query.limit);
    const overview = await trainerAssignmentService.getAdminCoachingOverview(query);
    return ApiResponse.success(res, overview, 'Coaching overview retrieved successfully.');
  },

  /**
   * Admin: Review (Approve or Reject) a member coaching request.
   */
  async reviewRequest(req, res) {
    const requestId = Number(req.params.id);
    const { action, rejectionReason, overrideCapacity } = req.body;

    const result = await trainerAssignmentService.reviewRequest(requestId, {
      action,
      adminId: req.user.id,
      rejectionReason,
      overrideCapacity: normalizeBoolean(overrideCapacity),
    });

    const msg = action === 'APPROVE' ? 'Coaching request approved and assigned.' : 'Coaching request rejected.';
    return ApiResponse.success(res, result, msg);
  },

  /**
   * Admin: Directly assign or reassign a trainer to a member.
   */
  async assignTrainerDirectly(req, res) {
    const { memberId, trainerId, notes, overrideCapacity } = req.body;
    const assignment = await trainerAssignmentService.assignTrainerDirectly({
      memberId: Number(memberId),
      trainerId: Number(trainerId),
      adminId: req.user.id,
      notes,
      overrideCapacity: normalizeBoolean(overrideCapacity),
    });

    return ApiResponse.created(res, assignment, 'Trainer assigned successfully.');
  },

  /**
   * Admin: Terminate an active or paused assignment.
   */
  async terminateAssignment(req, res) {
    const assignmentId = Number(req.params.id);
    const { reason, notes } = req.body;

    const assignment = await trainerAssignmentService.terminateAssignment(assignmentId, {
      adminId: req.user.id,
      reason,
      notes,
    });

    return ApiResponse.success(res, assignment, 'Trainer assignment terminated successfully.');
  },

  /**
   * Admin: Run lifecycle reconciliation for 10-day grace periods and pass pauses.
   */
  async syncGracePeriods(req, res) {
    const result = await trainerAssignmentService.syncGracePeriodsAndPauses();
    return ApiResponse.success(res, result, 'Grace periods and pass pauses reconciled successfully.');
  },
};

export default trainerAssignmentController;
