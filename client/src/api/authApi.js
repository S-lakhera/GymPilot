import { axiosClient } from './axiosClient.js';

/**
 * Normalizes backend error responses into a consistent, predictable structure.
 * Backend JSend error shape: { status: 'error', message: '...', code: '...', errors: [...] }
 *
 * @param {Error} error - Axios error object
 * @returns {{ message: string, code: string, errors: Array|null, status: number }}
 */
export function normalizeApiError(error) {
  const res = error.response;
  if (!res) {
    return {
      message: error.message || 'Network connectivity error. Please check your internet connection.',
      code: 'NETWORK_ERROR',
      errors: null,
      status: 0,
    };
  }

  const data = res.data;
  return {
    message: data?.message || (res.status === 404 ? 'Resource not found' : 'Request failed. Please try again.'),
    code: data?.code || `HTTP_${res.status}`,
    errors: Array.isArray(data?.errors) ? data.errors : null,
    status: res.status,
  };
}

/**
 * Authentication API Service Module
 * Handles all requests related to user registration, credential login,
 * silent session rotation, profile retrieval, and credential updates.
 */
export const authApi = {
  /**
   * Public Member Registration.
   * Onboards new member and receives user identity + access token.
   * Backend also sets HttpOnly refreshToken cookie.
   *
   * @param {{ firstName: string, lastName: string, email: string, password: string, phone?: string }} payload
   * @returns {Promise<{ user: Object, accessToken: string, message: string }>}
   */
  async register({ firstName, lastName, email, password, phone }) {
    try {
      const res = await axiosClient.post('/auth/register', {
        firstName,
        lastName,
        email,
        password,
        phone: phone || undefined,
      });

      return {
        ...res.data.data,
        message: res.data.message || 'Registration successful.',
      };
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * User Credential Login.
   * Validates credentials and returns user profile + access token.
   * Backend also sets HttpOnly refreshToken cookie.
   *
   * @param {{ email: string, password: string }} payload
   * @returns {Promise<{ user: Object, accessToken: string, message: string }>}
   */
  async login({ email, password }) {
    try {
      const res = await axiosClient.post('/auth/login', {
        email,
        password,
      });

      return {
        ...res.data.data,
        message: res.data.message || 'Login successful.',
      };
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Silent Refresh Token rotation.
   * Uses HttpOnly cookie to issue a new access token and rotated refresh cookie.
   *
   * @returns {Promise<{ accessToken: string, message: string }>}
   */
  async refreshToken() {
    try {
      const res = await axiosClient.post('/auth/refresh');
      return {
        ...res.data.data,
        message: res.data.message || 'Session refreshed successfully.',
      };
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * User Logout.
   * Clears the refresh token cookie and revokes the active session in MySQL.
   *
   * @returns {Promise<{ message: string }>}
   */
  async logout() {
    try {
      const res = await axiosClient.post('/auth/logout');
      return {
        message: res.data.message || 'Logged out successfully.',
      };
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Fetch current authenticated user's profile and completeness status.
   * Requires valid in-memory Bearer token.
   *
   * @returns {Promise<{ user: Object, profile: Object|null, isProfileComplete: boolean, message: string }>}
   */
  async getMe() {
    try {
      const res = await axiosClient.get('/auth/me');
      return {
        ...res.data.data,
        message: res.data.message || 'Profile retrieved.',
      };
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Change current user's password.
   * Invalidates all other active refresh sessions across devices.
   *
   * @param {{ currentPassword: string, newPassword: string }} payload
   * @returns {Promise<{ message: string }>}
   */
  async changePassword({ currentPassword, newPassword }) {
    try {
      const res = await axiosClient.patch('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      return {
        message: res.data.message || 'Password changed successfully.',
      };
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};

export default authApi;

