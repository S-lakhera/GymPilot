import { axiosClient } from "./axiosClient.js";
import { normalizeApiError } from "./authApi.js";

/**
 * Subscriptions & Checkout API Service Module.
 * Provides client interfaces for pricing quotes, checkout with row-level locking,
 * subscription pass listing, and cancellation governance.
 */
export const subscriptionApi = {
  /**
   * Calculate a real-time pricing quote preview.
   *
   * @param {{ planId: number, discountCode?: string }} payload
   * @param {Object} [config]
   * @returns {Promise<{
   *   planId: number,
   *   planName: string,
   *   durationDays: number,
   *   baseAmount: number,
   *   discountAmount: number,
   *   finalAmount: number,
   *   currency: string,
   *   discount?: Object|null
   * }>}
   */
  async getPricingQuote(payload, config = {}) {
    try {
      const res = await axiosClient.post("/subscriptions/quote", payload, config);
      return res.data.data.quote;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Initiate subscription checkout.
   *
   * @param {{
   *   planId: number,
   *   paymentMethod: string,
   *   discountCode?: string,
   *   startDate?: string,
   *   memberId?: number,
   *   gatewayReference?: string
   * }} payload
   * @param {Object} [config]
   * @returns {Promise<{
   *   subscription: Object,
   *   payment: Object,
   *   pricing: Object
   * }>}
   */
  async checkoutSubscription(payload, config = {}) {
    try {
      const res = await axiosClient.post("/subscriptions/checkout", payload, config);
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * List subscriptions with pagination and optional filters.
   * Scoped to the authenticated user for members; unscoped for administrators.
   *
   * @param {{
   *   page?: number,
   *   limit?: number,
   *   status?: string,
   *   categoryId?: number,
   *   userId?: number,
   *   sortBy?: string,
   *   sortOrder?: string
   * }} [params={}]
   * @param {Object} [config]
   * @returns {Promise<{ subscriptions: Array<Object>, pagination: Object }>}
   */
  async listSubscriptions(params = {}, config = {}) {
    try {
      const res = await axiosClient.get("/subscriptions", { params, ...config });
      const rawData = res.data.data;
      const subscriptions = Array.isArray(rawData)
        ? rawData
        : (rawData?.items || rawData?.subscriptions || []);
      const pagination = res.data.pagination || {
        page: rawData?.page || 1,
        limit: rawData?.limit || (params.limit || 20),
        total: rawData?.total ?? subscriptions.length,
        totalPages: rawData?.totalPages || 1,
      };
      return {
        subscriptions,
        pagination,
      };
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Retrieve single subscription details by ID.
   *
   * @param {number|string} id
   * @param {Object} [config]
   * @returns {Promise<Object>}
   */
  async getSubscriptionById(id, config = {}) {
    try {
      const res = await axiosClient.get(`/subscriptions/${id}`, config);
      return res.data.data.subscription;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Cancel an existing active or queued subscription.
   *
   * @param {number|string} id
   * @param {{
   *   refundAmount?: number,
   *   refundReason?: string,
   *   promoteQueued?: boolean,
   *   cancelQueued?: boolean
   * }} [options={}]
   * @param {Object} [config]
   * @returns {Promise<Object>}
   */
  async cancelSubscription(id, options = {}, config = {}) {
    try {
      const res = await axiosClient.patch(`/subscriptions/${id}/cancel`, options, config);
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};

export default subscriptionApi;

