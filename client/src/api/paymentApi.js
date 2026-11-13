import { axiosClient } from "./axiosClient.js";
import { normalizeApiError } from "./authApi.js";

/**
 * Payments API Service Module.
 * Provides client interfaces for confirming simulated or gateway payments,
 * retrieving member receipts, and fetching the administrative transaction ledger.
 */
export const paymentApi = {
  /**
   * Confirm two-phase payment and promote pending subscription.
   *
   * @param {{
   *   transactionReference: string,
   *   gatewayReference?: string,
   *   simulatedStatus?: 'SUCCESS'|'FAILED'
   * }} payload
   * @param {Object} [config]
   * @returns {Promise<{
   *   alreadyProcessed: boolean,
   *   payment: Object,
   *   message: string
   * }>}
   */
  async confirmPayment(payload, config = {}) {
    try {
      const res = await axiosClient.post("/payments/confirm", payload, config);
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * List personal payment receipts for the authenticated member.
   *
   * @param {{ page?: number, limit?: number }} [params={}]
   * @param {Object} [config]
   * @returns {Promise<{ payments: Array<Object>, pagination: Object }>}
   */
  async getMyPayments(params = {}, config = {}) {
    try {
      const res = await axiosClient.get("/payments/my", { params, ...config });
      return {
        payments: res.data.data || [],
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
   * List all payment transactions for administrators.
   *
   * @param {{
   *   page?: number,
   *   limit?: number,
   *   status?: string,
   *   userId?: number,
   *   paymentMethod?: string,
   *   startDate?: string,
   *   endDate?: string,
   *   sortBy?: string,
   *   sortOrder?: string
   * }} [params={}]
   * @param {Object} [config]
   * @returns {Promise<{ payments: Array<Object>, pagination: Object }>}
   */
  async listAllPayments(params = {}, config = {}) {
    try {
      const res = await axiosClient.get("/payments", { params, ...config });
      return {
        payments: res.data.data || [],
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
   * Retrieve single payment details by ID.
   *
   * @param {number|string} id
   * @param {Object} [config]
   * @returns {Promise<Object>}
   */
  async getPaymentById(id, config = {}) {
    try {
      const res = await axiosClient.get(`/payments/${id}`, config);
      return res.data.data.payment;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};

export default paymentApi;
