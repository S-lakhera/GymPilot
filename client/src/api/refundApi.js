import { axiosClient } from "./axiosClient.js";
import { normalizeApiError } from "./authApi.js";

/**
 * Refund Operations API Service Module.
 * Provides client interfaces for issuing refunds with row-level locks,
 * inspecting payment refund histories, and querying system-wide refund audit logs.
 */
export const refundApi = {
  /**
   * Process a partial or full refund for a completed payment transaction.
   *
   * @param {{
   *   paymentId: number,
   *   amount: number,
   *   reason: string,
   *   gatewayRefundReference?: string
   * }} payload
   * @param {Object} [config]
   * @returns {Promise<Object>}
   */
  async processRefund(payload, config = {}) {
    try {
      const res = await axiosClient.post("/refunds", payload, config);
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * List system-wide refund audit logs with pagination and filters (Admin only).
   *
   * @param {{
   *   page?: number,
   *   limit?: number,
   *   paymentId?: number,
   *   userId?: number,
   *   refundStatus?: string
   * }} [params={}]
   * @param {Object} [config]
   * @returns {Promise<{ refunds: Array<Object>, pagination: Object }>}
   */
  async listRefunds(params = {}, config = {}) {
    try {
      const res = await axiosClient.get("/refunds", { params, ...config });
      return {
        refunds: res.data.data || [],
        pagination: res.data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 1,
        },
      };
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * List all refund records associated with a specific payment transaction.
   *
   * @param {number|string} paymentId
   * @param {Object} [config]
   * @returns {Promise<Array<Object>>}
   */
  async getRefundsByPaymentId(paymentId, config = {}) {
    try {
      const res = await axiosClient.get(`/refunds/payment/${paymentId}`, config);
      return res.data.data?.refunds || [];
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Retrieve single refund record by ID.
   *
   * @param {number|string} id
   * @param {Object} [config]
   * @returns {Promise<Object>}
   */
  async getRefundById(id, config = {}) {
    try {
      const res = await axiosClient.get(`/refunds/${id}`, config);
      return res.data.data?.refund;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};

export default refundApi;

