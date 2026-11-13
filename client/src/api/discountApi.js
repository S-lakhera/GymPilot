import { axiosClient } from "./axiosClient.js";
import { normalizeApiError } from "./authApi.js";

/**
 * Promotional Discounts API Service Module.
 * Admin interfaces for coupon creation, updates, and status toggles.
 */
export const discountApi = {
  /**
   * List all discount coupons with pagination, search, and status filter (Admin only).
   *
   * @param {{
   *   page?: number,
   *   limit?: number,
   *   search?: string,
   *   isActive?: boolean
   * }} [params={}]
   * @param {Object} [config]
   * @returns {Promise<{ discounts: Array<Object>, pagination: Object }>}
   */
  async listDiscounts(params = {}, config = {}) {
    try {
      const res = await axiosClient.get("/discounts", { params, ...config });
      return {
        discounts: res.data.data || [],
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
   * Retrieve single discount details by ID.
   *
   * @param {number|string} id
   * @param {Object} [config]
   * @returns {Promise<Object>}
   */
  async getDiscountById(id, config = {}) {
    try {
      const res = await axiosClient.get(`/discounts/${id}`, config);
      return res.data.data?.discount;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Create a new promotional discount or coupon.
   *
   * @param {{
   *   code: string,
   *   name: string,
   *   description?: string,
   *   discountType: 'PERCENTAGE'|'FIXED',
   *   discountValue: number,
   *   maxDiscountAmount?: number|null,
   *   minPurchaseAmount?: number,
   *   startDate: string,
   *   endDate: string,
   *   usageLimit?: number|null,
   *   perUserLimit?: number,
   *   isActive?: boolean,
   *   eligiblePlanIds?: Array<number>
   * }} payload
   * @param {Object} [config]
   * @returns {Promise<Object>}
   */
  async createDiscount(payload, config = {}) {
    try {
      const res = await axiosClient.post("/discounts", payload, config);
      return res.data.data?.discount;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Update an existing discount coupon.
   *
   * @param {number|string} id
   * @param {Object} payload
   * @param {Object} [config]
   * @returns {Promise<Object>}
   */
  async updateDiscount(id, payload, config = {}) {
    try {
      const res = await axiosClient.patch(`/discounts/${id}`, payload, config);
      return res.data.data?.discount;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Toggle a discount coupon's active status.
   *
   * @param {number|string} id
   * @param {boolean} isActive
   * @param {Object} [config]
   * @returns {Promise<Object>}
   */
  async toggleDiscountStatus(id, isActive, config = {}) {
    try {
      const res = await axiosClient.patch(`/discounts/${id}/status`, { isActive }, config);
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};

export default discountApi;

