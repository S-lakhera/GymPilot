import { axiosClient } from './axiosClient.js';
import { normalizeApiError } from './authApi.js';

function cleanParams(params) {
  if (!params) return {};
  const cleaned = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export const workoutApi = {
  /**
   * List exercises catalog.
   */
  async getExercises(params = {}) {
    try {
      const res = await axiosClient.get('/workouts/exercises', {
        params: cleanParams(params),
      });
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Trainer: Create a custom exercise.
   */
  async createCustomExercise(data) {
    try {
      const res = await axiosClient.post('/workouts/exercises', data);
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Member: Get active workout plan.
   */
  async getMyPlan() {
    try {
      const res = await axiosClient.get('/workouts/my-plan');
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Trainer: Get all authored workout plans.
   */
  async getTrainerPlans() {
    try {
      const res = await axiosClient.get('/workouts/trainer/plans');
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Trainer: Get active workout plan for a specific assigned client.
   */
  async getClientPlan(memberId) {
    try {
      const res = await axiosClient.get(`/workouts/client/${memberId}`);
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Trainer: Get a specific workout plan by ID.
   */
  async getPlanById(id) {
    try {
      const res = await axiosClient.get(`/workouts/${id}`);
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Trainer: Create and assign a workout plan.
   */
  async createPlan(data) {
    try {
      const res = await axiosClient.post('/workouts', data);
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Trainer: Update an existing workout plan.
   */
  async updatePlan(id, data) {
    try {
      const res = await axiosClient.put(`/workouts/${id}`, data);
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Trainer: Delete a workout plan.
   */
  async deletePlan(id) {
    try {
      const res = await axiosClient.delete(`/workouts/${id}`);
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};
