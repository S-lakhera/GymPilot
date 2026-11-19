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

export const notificationApi = {
  /**
   * Fetch paginated notifications for current user.
   */
  async getNotifications(params = {}) {
    try {
      const res = await axiosClient.get('/notifications', {
        params: cleanParams(params),
      });
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Fetch unread notification count badge.
   */
  async getUnreadCount() {
    try {
      const res = await axiosClient.get('/notifications/unread-count');
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Mark a single notification as read.
   */
  async markAsRead(id) {
    try {
      const res = await axiosClient.patch(`/notifications/${id}/read`);
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Mark all notifications as read.
   */
  async markAllAsRead() {
    try {
      const res = await axiosClient.patch('/notifications/read-all');
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Delete a notification.
   */
  async deleteNotification(id) {
    try {
      const res = await axiosClient.delete(`/notifications/${id}`);
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Admin: Trigger manual expiration synchronization and renewal checks.
   */
  async syncExpirations() {
    try {
      const res = await axiosClient.post('/notifications/sync-expirations');
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Admin: Get expirations desk queue with counters and filters.
   */
  async getAdminExpirationsQueue(params = {}) {
    try {
      const res = await axiosClient.get('/notifications/admin/expirations-queue', {
        params: cleanParams(params),
      });
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Admin: Trigger manual renewal reminder dispatch.
   */
  async sendManualReminder(subscriptionId) {
    try {
      const res = await axiosClient.post(`/notifications/admin/remind/${subscriptionId}`);
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};

export default notificationApi;
