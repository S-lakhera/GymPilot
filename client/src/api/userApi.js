import { axiosClient } from "./axiosClient.js";
import { normalizeApiError } from "./authApi.js";

/**
 * User & Profile API Service Module
 * Handles retrieving and updating the authenticated user's profile.
 */
export const userApi = {
  /**
   * Retrieves profile data and completeness status for the authenticated user.
   *
   * @returns {Promise<{ user: Object, profile: Object|null, isProfileComplete: boolean, message: string }>}
   */
  async getProfile() {
    try {
      const res = await axiosClient.get("/users/profile");
      return {
        ...res.data.data,
        message: res.data.message || "Profile retrieved successfully",
      };
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Updates personal contact information and (if member) member profile details.
   *
   * @param {Object} payload
   * @returns {Promise<{ user: Object, profile: Object|null, isProfileComplete: boolean, message: string }>}
   */
  async updateProfile(payload) {
    try {
      const res = await axiosClient.patch("/users/profile", payload);
      return {
        ...res.data.data,
        message: res.data.message || "Profile updated successfully",
      };
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Admin: List member accounts with pagination, search, and status filtering.
   *
   * @param {{
   *   page?: number,
   *   limit?: number,
   *   search?: string,
   *   status?: 'all'|'active'|'inactive',
   *   sortBy?: string,
   *   sortOrder?: 'ASC'|'DESC'|'asc'|'desc'
   * }} [params={}]
   * @param {Object} [config]
   * @returns {Promise<{ members: Array<Object>, pagination: Object }>}
   */
  async listMembers(params = {}, config = {}) {
    try {
      const res = await axiosClient.get("/users/members", { params, ...config });
      return {
        members: res.data.data || [],
        pagination: res.data.pagination || {
          page: 1,
          limit: 10,
          totalRecords: 0,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Admin: Retrieve comprehensive member details by ID.
   *
   * @param {number|string} id
   * @param {Object} [config]
   * @returns {Promise<Object>}
   */
  async getMemberById(id, config = {}) {
    try {
      const res = await axiosClient.get(`/users/members/${id}`, config);
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Admin: Activate or deactivate a member account.
   *
   * @param {number|string} id
   * @param {boolean} isActive
   * @param {Object} [config]
   * @returns {Promise<{ id: number, email: string, isActive: boolean, message: string }>}
   */
  async setMemberStatus(id, isActive, config = {}) {
    try {
      const res = await axiosClient.patch(
        `/users/members/${id}/status`,
        { isActive },
        config
      );
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};

export default userApi;
