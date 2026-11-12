import { axiosClient } from "./axiosClient.js";
import { normalizeApiError } from "./authApi.js";

/**
 * Dashboard & Maintenance API Service Module.
 * Provides typed access to role-specific dashboard metrics and explicit
 * subscription status synchronization.
 */
export const dashboardApi = {
  /**
   * Retrieve executive metrics, category distribution, recent transactions,
   * and recent registrations for Administrators.
   *
   * @returns {Promise<Object>}
   */
  async getAdminDashboard() {
    try {
      const res = await axiosClient.get("/dashboard/admin");
      return {
        ...res.data.data,
        message: res.data.message || "Admin dashboard metrics retrieved successfully.",
      };
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Retrieve coaching credentials and Phase 6 placeholder stubs for Trainers.
   *
   * @returns {Promise<Object>}
   */
  async getTrainerDashboard() {
    try {
      const res = await axiosClient.get("/dashboard/trainer");
      return {
        ...res.data.data,
        message: res.data.message || "Trainer dashboard metrics retrieved successfully.",
      };
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Retrieve active passes, queued renewals, nearest expiration, recent receipts,
   * and 5-field profile completeness for Members.
   *
   * @returns {Promise<Object>}
   */
  async getMemberDashboard() {
    try {
      const res = await axiosClient.get("/dashboard/member");
      return {
        ...res.data.data,
        message: res.data.message || "Member dashboard metrics retrieved successfully.",
      };
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Explicit Admin maintenance action to batch-expire outdated passes,
   * promote eligible queued renewals, and purge stale 24h pending checkouts.
   *
   * Note: This operation is idempotent and MUST ONLY be called upon explicit Admin action.
   *
   * @returns {Promise<{ expiredSubscriptions: number, activatedQueuedSubscriptions: number, purgedStaleSubscriptions: number, purgedStalePayments: number, syncedAt: string }>}
   */
  async syncSubscriptionStatuses() {
    try {
      const res = await axiosClient.post("/subscriptions/sync-statuses");
      return {
        ...res.data.data,
        message: res.data.message || "Subscription statuses synchronized successfully.",
      };
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};

export default dashboardApi;

