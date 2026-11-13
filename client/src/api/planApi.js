import { axiosClient } from "./axiosClient.js";
import { normalizeApiError } from "./authApi.js";

/**
 * Membership Plans API Service Module.
 * Provides client interfaces for listing, retrieving, creating, and modifying membership plans.
 */
export const planApi = {
  /**
   * List all membership plans with optional filters.
   *
   * @param {{
   *   categoryId?: number|string,
   *   isActive?: boolean|string,
   *   search?: string,
   *   minPrice?: number,
   *   maxPrice?: number
   * }} [params={}]
   * @param {Object} [config] - Optional Axios request config
   * @returns {Promise<Array<Object>>}
   */
  async listPlans(params = {}, config = {}) {
    try {
      const res = await axiosClient.get("/plans", { params, ...config });
      return res.data.data || [];
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Retrieve a specific membership plan by ID.
   *
   * @param {number|string} id
   * @param {Object} [config]
   * @returns {Promise<Object>}
   */
  async getPlanById(id, config = {}) {
    try {
      const res = await axiosClient.get(`/plans/${id}`, config);
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Create a new membership plan (Admin only).
   *
   * @param {{
   *   categoryId: number,
   *   name: string,
   *   description?: string,
   *   durationDays: number,
   *   price: number,
   *   isActive?: boolean
   * }} data
   * @param {Object} [config]
   * @returns {Promise<Object>}
   */
  async createPlan(data, config = {}) {
    try {
      const res = await axiosClient.post("/plans", data, config);
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Update an existing membership plan (Admin only).
   *
   * @param {number|string} id
   * @param {Object} data
   * @param {Object} [config]
   * @returns {Promise<Object>}
   */
  async updatePlan(id, data, config = {}) {
    try {
      const res = await axiosClient.patch(`/plans/${id}`, data, config);
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Toggle a plan's active status (Admin only).
   *
   * @param {number|string} id
   * @param {boolean} isActive
   * @param {Object} [config]
   * @returns {Promise<Object>}
   */
  async togglePlanStatus(id, isActive, config = {}) {
    try {
      const res = await axiosClient.patch(
        `/plans/${id}/status`,
        { isActive },
        config,
      );
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};

export default planApi;
