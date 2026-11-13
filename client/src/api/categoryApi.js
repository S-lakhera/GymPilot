import { axiosClient } from "./axiosClient.js";
import { normalizeApiError } from "./authApi.js";

/**
 * Plan Categories API Service Module.
 * Provides client interfaces for listing, creating, and modifying workout categories.
 */
export const categoryApi = {
  /**
   * List all workout plan categories.
   *
   * @param {{
   *   includeInactive?: boolean,
   *   search?: string
   * }} [params={}]
   * @param {Object} [config]
   * @returns {Promise<Array<Object>>}
   */
  async listCategories(params = {}, config = {}) {
    try {
      const res = await axiosClient.get("/categories", { params, ...config });
      return res.data.data || [];
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Retrieve single category by ID.
   *
   * @param {number|string} id
   * @param {Object} [config]
   * @returns {Promise<Object>}
   */
  async getCategoryById(id, config = {}) {
    try {
      const res = await axiosClient.get(`/categories/${id}`, config);
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Create a workout category (Admin only).
   *
   * @param {{ name: string, description?: string, isActive?: boolean }} data
   * @param {Object} [config]
   * @returns {Promise<Object>}
   */
  async createCategory(data, config = {}) {
    try {
      const res = await axiosClient.post("/categories", data, config);
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Update an existing workout category (Admin only).
   *
   * @param {number|string} id
   * @param {{ name?: string, description?: string, isActive?: boolean }} data
   * @param {Object} [config]
   * @returns {Promise<Object>}
   */
  async updateCategory(id, data, config = {}) {
    try {
      const res = await axiosClient.patch(`/categories/${id}`, data, config);
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Toggle a category's active status (Admin only).
   *
   * @param {number|string} id
   * @param {boolean} isActive
   * @param {Object} [config]
   * @returns {Promise<Object>}
   */
  async toggleCategoryStatus(id, isActive, config = {}) {
    try {
      const res = await axiosClient.patch(`/categories/${id}/status`, { isActive }, config);
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};

export default categoryApi;

