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
};

export default userApi;
