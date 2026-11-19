import request from 'supertest';
import app from '../src/app.js';
import { generateAccessToken } from '../src/utils/jwt.js';
import { pool } from '../src/config/db.js';
import { notificationRepository } from '../src/repositories/notificationRepository.js';
import { notificationService } from '../src/services/notificationService.js';
import { subscriptionService } from '../src/services/subscriptionService.js';

describe('Notifications & Membership Expirations Engine (Milestone 6.4)', () => {
  let adminToken;
  let memberToken;
  let trainerToken;
  let otherMemberToken;

  const adminId = 1;
  const trainerId = 2; // Trainer Alex
  const memberId = 6;  // Priya Patel
  const otherMemberId = 7; // Amit Verma

  beforeAll(async () => {
    adminToken = `Bearer ${generateAccessToken({ id: adminId, email: 'admin@gympilot.com', role: 'admin' })}`;
    trainerToken = `Bearer ${generateAccessToken({ id: trainerId, email: 'trainer.alex@gympilot.com', role: 'trainer' })}`;
    memberToken = `Bearer ${generateAccessToken({ id: memberId, email: 'priya.patel@gmail.com', role: 'member' })}`;
    otherMemberToken = `Bearer ${generateAccessToken({ id: otherMemberId, email: 'amit.verma@gmail.com', role: 'member' })}`;

    // Clean up test notifications
    await pool.query('DELETE FROM notifications WHERE user_id IN (?, ?, ?, ?)', [
      adminId,
      trainerId,
      memberId,
      otherMemberId,
    ]);
  });

  afterAll(async () => {
    // Teardown
    await pool.query('DELETE FROM notifications WHERE user_id IN (?, ?, ?, ?)', [
      adminId,
      trainerId,
      memberId,
      otherMemberId,
    ]);
  });

  describe('1. Security & RBAC Guards', () => {
    it('should return 401 Unauthorized when accessing notifications without token', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
    });

    it('should return 401 Unauthorized when accessing unread count without token', async () => {
      const res = await request(app).get('/api/notifications/unread-count');
      expect(res.status).toBe(401);
    });

    it('should reject non-admin from triggering expiration sync with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/notifications/sync-expirations')
        .set('Authorization', memberToken);
      expect(res.status).toBe(403);
    });

    it('should reject non-admin from accessing admin expirations queue with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/notifications/admin/expirations-queue')
        .set('Authorization', trainerToken);
      expect(res.status).toBe(403);
    });

    it('should reject non-admin from triggering manual reminder with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/notifications/admin/remind/1')
        .set('Authorization', memberToken);
      expect(res.status).toBe(403);
    });
  });

  describe('2. Notification Repository & Idempotent Creation', () => {
    it('should create notification and return populated entity', async () => {
      const notif = await notificationRepository.create({
        userId: memberId,
        type: 'SYSTEM_ALERT',
        title: 'Welcome to GymPilot',
        message: 'Your account is fully configured and ready.',
        eventKey: `TEST_WELCOME_${memberId}`,
        actionUrl: '/dashboard',
        metadata: { source: 'test' },
      });

      expect(notif).toBeDefined();
      expect(notif.id).toBeDefined();
      expect(notif.userId).toBe(memberId);
      expect(notif.type).toBe('SYSTEM_ALERT');
      expect(notif.title).toBe('Welcome to GymPilot');
      expect(notif.isRead).toBe(false);
      expect(notif.metadata).toEqual({ source: 'test' });
    });

    it('should enforce idempotency via event_key without throwing errors or duplicating rows', async () => {
      const eventKey = `TEST_IDEMPOTENT_${Date.now()}`;

      const notif1 = await notificationRepository.create({
        userId: memberId,
        type: 'SYSTEM_ALERT',
        title: 'Original Title',
        message: 'Original Message',
        eventKey,
      });

      const notif2 = await notificationRepository.create({
        userId: memberId,
        type: 'SYSTEM_ALERT',
        title: 'Duplicate Title',
        message: 'Duplicate Message',
        eventKey,
      });

      expect(notif1.id).toBe(notif2.id);

      const [rows] = await pool.query(
        'SELECT COUNT(*) AS count FROM notifications WHERE event_key = ?',
        [eventKey]
      );
      expect(Number(rows[0].count)).toBe(1);
    });
  });

  describe('3. User Notification Center Endpoints', () => {
    let createdNotificationId;

    beforeEach(async () => {
      const created = await notificationService.createNotification({
        userId: memberId,
        type: 'WORKOUT_PLAN_ASSIGNED',
        title: 'New Plan Ready',
        message: 'Trainer Alex assigned you a 3-Day Split.',
        eventKey: `TEST_PLAN_${Date.now()}`,
        actionUrl: '/workouts',
      });
      createdNotificationId = created.id;
    });

    it('should fetch user notifications with unread count', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', memberToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data.notifications)).toBe(true);
      expect(res.body.data.total).toBeGreaterThanOrEqual(1);

      const countRes = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', memberToken);

      expect(countRes.status).toBe(200);
      expect(countRes.body.data.unreadCount).toBeGreaterThanOrEqual(1);
    });

    it('should mark single notification as read', async () => {
      const res = await request(app)
        .patch(`/api/notifications/${createdNotificationId}/read`)
        .set('Authorization', memberToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.success).toBe(true);

      const notif = await notificationRepository.findById(createdNotificationId);
      expect(notif.isRead).toBe(true);
    });

    it('should prevent other user from marking notification as read', async () => {
      const res = await request(app)
        .patch(`/api/notifications/${createdNotificationId}/read`)
        .set('Authorization', otherMemberToken);

      expect(res.status).toBe(404);
    });

    it('should mark all notifications as read for current user', async () => {
      // Create another unread notification
      await notificationService.createNotification({
        userId: memberId,
        type: 'PASS_EXPIRING_7D',
        title: 'Expiring Soon',
        message: 'Renew your pass.',
        eventKey: `TEST_EXP_${Date.now()}`,
      });

      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', memberToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');

      const countRes = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', memberToken);

      expect(countRes.body.data.unreadCount).toBe(0);
    });

    it('should delete a notification successfully', async () => {
      const res = await request(app)
        .delete(`/api/notifications/${createdNotificationId}`)
        .set('Authorization', memberToken);

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);

      const notif = await notificationRepository.findById(createdNotificationId);
      expect(notif).toBeNull();
    });
  });

  describe('4. Automated Expiration Sync & Reminders Lifecycle', () => {
    let testSubId;

    beforeAll(async () => {
      // Clean up previous test subscriptions for memberId
      await pool.query('DELETE FROM payments WHERE user_id = ?', [memberId]);
      await pool.query('DELETE FROM subscriptions WHERE user_id = ?', [memberId]);

      // Create a test subscription expiring in 7 days
      const [res] = await pool.query(
        `INSERT INTO subscriptions (
          user_id, plan_id, start_date, end_date, base_amount, final_amount, price_paid, status
        ) VALUES (?, 1, DATE_SUB(CURDATE(), INTERVAL 23 DAY), DATE_ADD(CURDATE(), INTERVAL 7 DAY), 899.00, 899.00, 899.00, 'active')`,
        [memberId]
      );
      testSubId = res.insertId;
    });

    afterAll(async () => {
      await pool.query('DELETE FROM subscriptions WHERE id = ?', [testSubId]);
    });

    it('should run sync-expirations and dispatch 7-day expiration reminder', async () => {
      const res = await request(app)
        .post('/api/notifications/sync-expirations')
        .set('Authorization', adminToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.stats).toBeDefined();
      expect(res.body.data.stats.expiring7DaysCount).toBeGreaterThanOrEqual(1);

      // Verify notification was created for member
      const memberNotifs = await notificationRepository.findByUserId(memberId);
      const expiringNotif = memberNotifs.notifications.find(
        (n) => n.eventKey === `EXP_7D_SUB_${testSubId}`
      );
      expect(expiringNotif).toBeDefined();
      expect(expiringNotif.type).toBe('PASS_EXPIRING_7D');
    });

    it('should be idempotent: subsequent sync within same day does not duplicate notification', async () => {
      const res = await request(app)
        .post('/api/notifications/sync-expirations')
        .set('Authorization', adminToken);

      expect(res.status).toBe(200);

      const [rows] = await pool.query(
        'SELECT COUNT(*) AS cnt FROM notifications WHERE event_key = ?',
        [`EXP_7D_SUB_${testSubId}`]
      );
      expect(Number(rows[0].cnt)).toBe(1);
    });
  });

  describe('5. Admin Expirations Desk & Manual Reminder Dispatch', () => {
    let activeExpiringSubId;

    beforeAll(async () => {
      const [res] = await pool.query(
        `INSERT INTO subscriptions (
          user_id, plan_id, start_date, end_date, base_amount, final_amount, price_paid, status
        ) VALUES (?, 1, DATE_SUB(CURDATE(), INTERVAL 27 DAY), DATE_ADD(CURDATE(), INTERVAL 3 DAY), 899.00, 899.00, 899.00, 'active')`,
        [otherMemberId]
      );
      activeExpiringSubId = res.insertId;
    });

    afterAll(async () => {
      await pool.query('DELETE FROM subscriptions WHERE id = ?', [activeExpiringSubId]);
    });

    it('should retrieve expirations queue with summary metrics and renewal items', async () => {
      const res = await request(app)
        .get('/api/notifications/admin/expirations-queue?windowDays=7&status=all')
        .set('Authorization', adminToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.metrics).toBeDefined();
      expect(res.body.data.metrics.expiringWindow).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(res.body.data.items)).toBe(true);

      const found = res.body.data.items.find((item) => Number(item.id) === Number(activeExpiringSubId));
      expect(found).toBeDefined();
      expect(found.memberEmail).toBe('amit.verma@gmail.com');
      expect(found.daysRemaining).toBeLessThanOrEqual(3);
    });

    it('should allow admin to send on-demand manual reminder to member', async () => {
      const res = await request(app)
        .post(`/api/notifications/admin/remind/${activeExpiringSubId}`)
        .set('Authorization', adminToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.success).toBe(true);

      // Verify member received notification
      const otherNotifs = await notificationRepository.findByUserId(otherMemberId);
      const manualNotif = otherNotifs.notifications.find(
        (n) => n.eventKey && n.eventKey.startsWith(`MANUAL_REMIND_`)
      );
      expect(manualNotif).toBeDefined();
    });
  });
});
