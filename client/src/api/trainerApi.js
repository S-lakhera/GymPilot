import { axiosClient } from "./axiosClient.js";
import { normalizeApiError } from "./authApi.js";

/**
 * Trainer API Service Module
 * Handles trainer profile operations.
 */
export const trainerApi = {
  /**
   * Updates trainer profile and identity information.
   * Resolves the trainer ID from the authenticated user.
   *
   * @param {number|string} trainerId
   * @param {Object} payload
   * @returns {Promise<{ user: Object, profile: Object, message: string }>}
   */
  async updateTrainerProfile(trainerId, payload) {
    if (!trainerId) {
      throw new Error("Trainer ID is required to update trainer profile");
    }

    try {
      const res = await axiosClient.patch(`/trainers/${trainerId}`, payload);
      const trainer = res.data.data?.trainer || res.data.data;
      return {
        user: {
          id: trainer.id,
          firstName: trainer.firstName,
          lastName: trainer.lastName,
          email: trainer.email,
          phone: trainer.phone,
          role: trainer.role,
          isActive: trainer.isActive,
        },
        profile: trainer.profile,
        isProfileComplete: Boolean(trainer.profile?.specialization),
        message: res.data.message || "Trainer profile updated successfully",
      };
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};

export default trainerApi;
