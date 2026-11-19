import { notificationService } from '../services/notificationService.js';
import { subscriptionService } from '../services/subscriptionService.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const notificationController = {
  /**
   * GET /api/notifications
   * Get notifications for the authenticated user.
   */
  async getUserNotifications(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = parseInt(req.query.offset, 10) || 0;
      const unreadOnly = req.query.unreadOnly === 'true';

      const data = await notificationService.getUserNotifications(req.user.id, {
        limit,
        offset,
        unreadOnly,
      });

      return ApiResponse.success(res, data, 'Notifications retrieved successfully.');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/notifications/unread-count
   * Get unread notifications badge count for current user.
   */
  async getUnreadCount(req, res, next) {
    try {
      const unreadCount = await notificationService.getUnreadCount(req.user.id);
      return ApiResponse.success(res, { unreadCount }, 'Unread count retrieved successfully.');
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/notifications/:id/read
   * Mark a single notification as read.
   */
  async markAsRead(req, res, next) {
    try {
      const notificationId = req.params.id;
      const result = await notificationService.markAsRead(notificationId, req.user.id);
      return ApiResponse.success(res, result, 'Notification marked as read.');
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/notifications/read-all
   * Mark all unread notifications as read for current user.
   */
  async markAllAsRead(req, res, next) {
    try {
      const result = await notificationService.markAllAsRead(req.user.id);
      return ApiResponse.success(res, result, 'All notifications marked as read.');
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/notifications/:id
   * Delete a notification for current user.
   */
  async deleteNotification(req, res, next) {
    try {
      const notificationId = req.params.id;
      const result = await notificationService.deleteNotification(notificationId, req.user.id);
      return ApiResponse.success(res, result, 'Notification deleted successfully.');
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/notifications/sync-expirations
   * Admin-triggered system-wide pass expiration and reconciliation sync.
   */
  async syncExpirations(req, res, next) {
    try {
      const result = await subscriptionService.syncStatuses();
      return ApiResponse.success(
        res,
        { stats: result },
        'Membership pass expirations and notifications synchronized successfully.'
      );
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/notifications/admin/expirations-queue
   * Admin Expirations Desk queue with filters and metric counters.
   */
  async getAdminExpirationsQueue(req, res, next) {
    try {
      const windowDays = parseInt(req.query.windowDays, 10) || 7;
      const status = req.query.status || 'all';
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const search = req.query.search || '';

      const data = await subscriptionService.getExpiringSubscriptions({
        windowDays,
        status,
        page,
        limit,
        search,
      });

      return ApiResponse.success(res, data, 'Expiring subscriptions queue retrieved successfully.');
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/notifications/admin/remind/:subscriptionId
   * Admin-triggered on-demand renewal reminder for a member.
   */
  async sendManualReminder(req, res, next) {
    try {
      const subscriptionId = req.params.subscriptionId;
      const result = await subscriptionService.sendManualReminder(subscriptionId);
      return ApiResponse.success(res, result, result.message);
    } catch (err) {
      next(err);
    }
  },
};

export default notificationController;
