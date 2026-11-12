import { axiosClient } from './axiosClient.js';
import { normalizeApiError } from './authApi.js';

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
      throw new Error('Trainer ID is required to update trainer profile');
    }

    try {
      const res = await axiosClient.patch(`/trainers/${trainerId}`, payload);
      const data = res.data.data;
      return {
        user: {
          id: data.id,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          role: data.role,
          isActive: data.isActive,
        },
        profile: data.profile,
        isProfileComplete: Boolean(data.profile?.specialization),
        message: res.data.message || 'Trainer profile updated successfully',
      };
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};

export default trainerApi;
