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
   * @param {Object} [config] - Optional Axios request config (e.g. { signal })
   * @returns {Promise<Object>}
   */
  async getAdminDashboard(config) {
    try {
      const res = await (config ? axiosClient.get("/dashboard/admin", config) : axiosClient.get("/dashboard/admin"));
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
   * @param {Object} [config] - Optional Axios request config (e.g. { signal })
   * @returns {Promise<Object>}
   */
  async getTrainerDashboard(config) {
    try {
      const res = await (config ? axiosClient.get("/dashboard/trainer", config) : axiosClient.get("/dashboard/trainer"));
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
   * @param {Object} [config] - Optional Axios request config (e.g. { signal })
   * @returns {Promise<Object>}
   */
  async getMemberDashboard(config) {
    try {
      const res = await (config ? axiosClient.get("/dashboard/member", config) : axiosClient.get("/dashboard/member"));
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
   * @param {Object} [config] - Optional Axios request config (e.g. { signal })
   * @returns {Promise<{ expiredSubscriptions: number, activatedQueuedSubscriptions: number, purgedStaleSubscriptions: number, purgedStalePayments: number, syncedAt: string }>}
   */
  async syncSubscriptionStatuses(config) {
    try {
      const res = await (config ? axiosClient.post("/subscriptions/sync-statuses", {}, config) : axiosClient.post("/subscriptions/sync-statuses"));
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

