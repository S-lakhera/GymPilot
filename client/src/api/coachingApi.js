import { axiosClient } from './axiosClient.js';
import { normalizeApiError } from './authApi.js';

function cleanParams(params) {
  if (!params) return {};
  const cleaned = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Coaching & Trainer-Member Assignment API Client
 */
export const coachingApi = {
  /**
   * Member: Get own coaching assignment and request status.
   */
  async getMemberStatus() {
    try {
      const res = await axiosClient.get('/coaching/status');
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Member: Submit a new coaching request to a trainer.
   */
  async requestTrainer({ trainerId, notes = '' }) {
    try {
      const res = await axiosClient.post('/coaching/requests', { trainerId, notes });
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Member: Cancel own pending request.
   */
  async cancelRequest(requestId) {
    try {
      const res = await axiosClient.delete(`/coaching/requests/${requestId}`);
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * All authenticated users: List all trainers with capacity metrics and client loads.
   */
  async getTrainersWithCapacity() {
    try {
      const res = await axiosClient.get('/coaching/trainers');
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Trainer: Get assigned client roster with health notes and passes.
   */
  async getTrainerRoster(params = {}) {
    try {
      const res = await axiosClient.get('/coaching/roster', { params: cleanParams(params) });
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Admin: Get full coaching dashboard overview.
   */
  async getAdminOverview(params = {}) {
    try {
      const res = await axiosClient.get('/coaching/admin/overview', { params: cleanParams(params) });
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Admin: Review (Approve or Reject) a member coaching request.
   */
  async reviewRequest(requestId, { action, rejectionReason = null, overrideCapacity = false }) {
    try {
      const res = await axiosClient.post(`/coaching/admin/requests/${requestId}/review`, {
        action,
        rejectionReason,
        overrideCapacity,
      });
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Admin: Directly assign or reassign a trainer to a member.
   */
  async assignTrainerDirectly({ memberId, trainerId, notes = '', overrideCapacity = false }) {
    try {
      const res = await axiosClient.post('/coaching/admin/assign', {
        memberId,
        trainerId,
        notes,
        overrideCapacity,
      });
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Admin: Terminate an active or paused assignment.
   */
  async terminateAssignment(assignmentId, { reason = 'ADMIN_TERMINATED', notes = '' } = {}) {
    try {
      const res = await axiosClient.post(`/coaching/admin/assignments/${assignmentId}/terminate`, {
        reason,
        notes,
      });
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Admin: Run on-demand reconciliation of 10-day grace periods and pass pauses.
   */
  async syncGracePeriods() {
    try {
      const res = await axiosClient.post('/coaching/admin/sync');
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};

export default coachingApi;

