import { notificationRepository } from '../repositories/notificationRepository.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';

export const notificationService = {
  /**
   * Generic notification dispatcher with idempotency protection.
   */
  async createNotification(
    {
      userId,
      type,
      title,
      message,
      eventKey = null,
      actionUrl = null,
      metadata = null,
    },
    connection
  ) {
    if (!userId || !type || !title || !message) {
      throw new BadRequestError(
        'userId, type, title, and message are required fields.',
        null,
        'NOTIFICATION_FIELDS_REQUIRED'
      );
    }

    return notificationRepository.create(
      {
        userId,
        type,
        title,
        message,
        eventKey,
        isRead: false,
        actionUrl,
        metadata,
      },
      connection
    );
  },

  /**
   * Dispatch upcoming pass expiration notification (7 days or 3 days).
   */
  async notifyPassExpiring(
    { userId, subscriptionId, daysRemaining, planName, endDate },
    connection
  ) {
    const type = daysRemaining <= 3 ? 'PASS_EXPIRING_3D' : 'PASS_EXPIRING_7D';
    const title = `Membership Pass Expiring Soon (${daysRemaining} Days)`;
    const message = `Your "${planName}" pass is set to expire in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''} on ${endDate}. Renew now to avoid any interruption in gym access.`;
    const eventKey = `EXP_${daysRemaining}D_SUB_${subscriptionId}`;
    const actionUrl = '/passes';

    return this.createNotification(
      {
        userId,
        type,
        title,
        message,
        eventKey,
        actionUrl,
        metadata: { subscriptionId, daysRemaining, planName, endDate },
      },
      connection
    );
  },

  /**
   * Dispatch pass expired notification.
   */
  async notifyPassExpired(
    { userId, subscriptionId, planName, endDate },
    connection
  ) {
    const type = 'PASS_EXPIRED';
    const title = 'Membership Pass Expired';
    const message = `Your "${planName}" pass expired on ${endDate}. You have a 10-day grace period to retain any assigned personal coach. Renew your pass today!`;
    const eventKey = `EXPIRED_SUB_${subscriptionId}`;
    const actionUrl = '/passes';

    return this.createNotification(
      {
        userId,
        type,
        title,
        message,
        eventKey,
        actionUrl,
        metadata: { subscriptionId, planName, endDate },
      },
      connection
    );
  },

  /**
   * Dispatch pass renewed / activated notification.
   */
  async notifyPassRenewed(
    { userId, subscriptionId, planName },
    connection
  ) {
    const type = 'PASS_RENEWED';
    const title = 'Membership Pass Activated';
    const message = `Your "${planName}" pass is now active. Time to get moving and crush your goals!`;
    const eventKey = `RENEWED_SUB_${subscriptionId}`;
    const actionUrl = '/passes';

    return this.createNotification(
      {
        userId,
        type,
        title,
        message,
        eventKey,
        actionUrl,
        metadata: { subscriptionId, planName },
      },
      connection
    );
  },

  /**
   * Dispatch coach request lifecycle status notification.
   */
  async notifyCoachRequestStatus(
    { userId, status, trainerName = null, reason = null, requestId = null },
    connection
  ) {
    let type = 'COACH_REQUEST_SUBMITTED';
    let title = 'Coaching Request Submitted';
    let message = `Your personal coaching request${trainerName ? ` for Coach ${trainerName}` : ''} has been submitted for review.`;
    let eventKey = `COACH_REQ_SUBMITTED_${requestId || userId}_${Date.now()}`;

    if (status === 'APPROVED') {
      type = 'COACH_REQUEST_APPROVED';
      title = 'Coaching Request Approved!';
      message = `Your personal coaching request${trainerName ? ` with Coach ${trainerName}` : ''} has been approved! Check your workouts hub to get started.`;
      eventKey = `COACH_REQ_APPROVED_${requestId || userId}`;
    } else if (status === 'REJECTED') {
      type = 'COACH_REQUEST_REJECTED';
      title = 'Coaching Request Update';
      message = `Your personal coaching request was not approved${reason ? `: ${reason}` : '.'}`;
      eventKey = `COACH_REQ_REJECTED_${requestId || userId}`;
    }

    return this.createNotification(
      {
        userId,
        type,
        title,
        message,
        eventKey,
        actionUrl: '/workouts',
        metadata: { status, trainerName, reason, requestId },
      },
      connection
    );
  },

  /**
   * Dispatch coach assignment grace period alert.
   */
  async notifyCoachGracePeriod(
    { userId, daysRemaining = 10, coachName = null },
    connection
  ) {
    const type = 'COACH_GRACE_PERIOD';
    const title = `Coach Assignment In Grace Period (${daysRemaining} Days Remaining)`;
    const message = `Your gym pass has expired. Your assignment with coach ${coachName || 'trainer'} will be released in ${daysRemaining} days unless you renew your pass.`;
    const eventKey = `COACH_GRACE_${userId}_${daysRemaining}D`;
    const actionUrl = '/passes';

    return this.createNotification(
      {
        userId,
        type,
        title,
        message,
        eventKey,
        actionUrl,
        metadata: { daysRemaining, coachName },
      },
      connection
    );
  },

  /**
   * Dispatch workout plan assigned notification.
   */
  async notifyWorkoutPlanAssigned(
    { memberId, trainerId, planId, planTitle, trainerName = null },
    connection
  ) {
    const type = 'WORKOUT_PLAN_ASSIGNED';
    const title = 'New Workout Plan Assigned!';
    const message = `${trainerName ? `Coach ${trainerName}` : 'Your trainer'} assigned you a new workout plan: "${planTitle}". Open your workouts to start!`;
    const eventKey = `WORKOUT_PLAN_${planId}_MEMBER_${memberId}`;
    const actionUrl = '/workouts';

    return this.createNotification(
      {
        userId: memberId,
        type,
        title,
        message,
        eventKey,
        actionUrl,
        metadata: { planId, planTitle, trainerId, trainerName },
      },
      connection
    );
  },

  /**
   * Retrieve paginated notifications for the authenticated user.
   */
  async getUserNotifications(userId, { limit = 20, offset = 0, unreadOnly = false } = {}) {
    return notificationRepository.findByUserId(userId, { limit, offset, unreadOnly });
  },

  /**
   * Get unread notifications badge count.
   */
  async getUnreadCount(userId) {
    return notificationRepository.getUnreadCount(userId);
  },

  /**
   * Mark single notification as read.
   */
  async markAsRead(notificationId, userId) {
    const updated = await notificationRepository.markAsRead(notificationId, userId);
    if (!updated) {
      throw new NotFoundError(
        'Notification not found or access denied.',
        null,
        'NOTIFICATION_NOT_FOUND'
      );
    }
    return { success: true, notificationId };
  },

  /**
   * Mark all unread notifications as read.
   */
  async markAllAsRead(userId) {
    const affectedCount = await notificationRepository.markAllAsRead(userId);
    return { success: true, count: affectedCount };
  },

  /**
   * Delete a notification.
   */
  async deleteNotification(notificationId, userId) {
    const deleted = await notificationRepository.delete(notificationId, userId);
    if (!deleted) {
      throw new NotFoundError(
        'Notification not found or access denied.',
        null,
        'NOTIFICATION_NOT_FOUND'
      );
    }
    return { success: true, notificationId };
  },
};

export default notificationService;
