import request from 'supertest';
import app from '../src/app.js';
import { generateAccessToken } from '../src/utils/jwt.js';
import { pool } from '../src/config/db.js';

describe('Dedicated Refund Management, Cancellation Governance & Status Maintenance (Milestone 4.3 - Commit 5)', () => {
  let adminToken;
  let memberToken;
  let otherMemberToken;
  const memberId = 6; // Priya Patel
  const otherMemberId = 7; // Amit Verma

  beforeAll(async () => {
    adminToken = `Bearer ${generateAccessToken({ id: 1, email: 'admin@gympilot.com', role: 'admin' })}`;
    memberToken = `Bearer ${generateAccessToken({ id: memberId, email: 'priya.patel@gmail.com', role: 'member' })}`;
    otherMemberToken = `Bearer ${generateAccessToken({ id: otherMemberId, email: 'amit.verma@gmail.com', role: 'member' })}`;

    // Clean up test data
    await pool.query('DELETE FROM refunds WHERE user_id IN (?, ?)', [memberId, otherMemberId]);
    await pool.query('DELETE FROM payments WHERE user_id IN (?, ?)', [memberId, otherMemberId]);
    await pool.query('DELETE FROM subscriptions WHERE user_id IN (?, ?)', [memberId, otherMemberId]);
  });

  afterAll(async () => {
    await pool.query('DELETE FROM refunds WHERE user_id IN (?, ?)', [memberId, otherMemberId]);
    await pool.query('DELETE FROM payments WHERE user_id IN (?, ?)', [memberId, otherMemberId]);
    await pool.query('DELETE FROM subscriptions WHERE user_id IN (?, ?)', [memberId, otherMemberId]);
  });

  describe('1. Dedicated Refund Management (POST /api/refunds)', () => {
    let completedPaymentId;
    let paymentAmount;

    beforeAll(async () => {
      // Setup a completed checkout for testing refunds
      const checkoutRes = await request(app)
        .post('/api/subscriptions/checkout')
        .set('Authorization', adminToken)
        .send({
          memberId,
          planId: 1, // Strength Monthly: ₹899
          paymentMethod: 'CASH',
        });

      completedPaymentId = checkoutRes.body.data.payment.id;
      paymentAmount = Number(checkoutRes.body.data.payment.amount);
    });

    it('POST /api/refunds should reject non-admin users with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/refunds')
        .set('Authorization', memberToken)
        .send({
          paymentId: completedPaymentId,
          amount: 200,
          reason: 'Member request',
        });

      expect(res.status).toBe(403);
    });

    it('POST /api/refunds should process a partial refund and set payment_status to PARTIALLY_REFUNDED', async () => {
      const partialAmount = 300.0;
      const res = await request(app)
        .post('/api/refunds')
        .set('Authorization', adminToken)
        .send({
          paymentId: completedPaymentId,
          amount: partialAmount,
          reason: 'Partial courtesy refund',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');

      const data = res.body.data;
      expect(data.refund.id).toBeDefined();
      expect(Number(data.refund.amount)).toBe(partialAmount);
      expect(data.paymentStatus).toBe('PARTIALLY_REFUNDED');
      expect(Number(data.totalRefunded)).toBe(partialAmount);
      expect(Number(data.remainingBalance)).toBe(paymentAmount - partialAmount);
      expect(data.isFullyRefunded).toBe(false);

      // Verify in DB
      const [payRows] = await pool.query('SELECT payment_status FROM payments WHERE id = ?', [completedPaymentId]);
      expect(payRows[0].payment_status).toBe('PARTIALLY_REFUNDED');
    });

    it('POST /api/refunds should reject refund amount that exceeds the remaining balance ceiling with 400 Bad Request', async () => {
      // Remaining is 899 - 300 = 599. Requesting 600 must fail.
      const res = await request(app)
        .post('/api/refunds')
        .set('Authorization', adminToken)
        .send({
          paymentId: completedPaymentId,
          amount: 600.0,
          reason: 'Excessive refund attempt',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/exceeds remaining refundable balance/i);
    });

    it('POST /api/refunds should process remaining balance and transition payment_status to REFUNDED', async () => {
      const remainingAmount = paymentAmount - 300.0; // 599.00
      const res = await request(app)
        .post('/api/refunds')
        .set('Authorization', adminToken)
        .send({
          paymentId: completedPaymentId,
          amount: remainingAmount,
          reason: 'Final settlement refund',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.paymentStatus).toBe('REFUNDED');
      expect(res.body.data.isFullyRefunded).toBe(true);
      expect(Number(res.body.data.remainingBalance)).toBe(0);

      const [payRows] = await pool.query('SELECT payment_status FROM payments WHERE id = ?', [completedPaymentId]);
      expect(payRows[0].payment_status).toBe('REFUNDED');
    });

    it('POST /api/refunds should reject further refunds on a fully REFUNDED payment', async () => {
      const res = await request(app)
        .post('/api/refunds')
        .set('Authorization', adminToken)
        .send({
          paymentId: completedPaymentId,
          amount: 10.0,
          reason: 'Over-refund attempt',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot refund a payment with status 'REFUNDED'/i);
    });

    it('GET /api/refunds/payment/:paymentId should allow member to view own refunds and reject other members', async () => {
      const ownRes = await request(app)
        .get(`/api/refunds/payment/${completedPaymentId}`)
        .set('Authorization', memberToken);

      expect(ownRes.status).toBe(200);
      expect(Array.isArray(ownRes.body.data.refunds)).toBe(true);
      expect(ownRes.body.data.refunds.length).toBe(2);

      const forbiddenRes = await request(app)
        .get(`/api/refunds/payment/${completedPaymentId}`)
        .set('Authorization', otherMemberToken);

      expect(forbiddenRes.status).toBe(403);
    });
  });

  describe('2. Subscription Cancellation & Queued Governance (PATCH /api/subscriptions/:id/cancel)', () => {
    let activeSubId;
    let queuedSubId;

    beforeAll(async () => {
      // Clean up member subs in reverse foreign key order
      await pool.query('DELETE FROM refunds WHERE user_id = ?', [memberId]);
      await pool.query('DELETE FROM payments WHERE user_id = ?', [memberId]);
      await pool.query('DELETE FROM subscriptions WHERE user_id = ?', [memberId]);

      // 1. Create Active Strength Subscription
      const sub1Res = await request(app)
        .post('/api/subscriptions/checkout')
        .set('Authorization', adminToken)
        .send({
          memberId,
          planId: 1, // Category 1: Strength
          paymentMethod: 'CASH',
        });
      activeSubId = sub1Res.body.data.subscription.id;

      // 2. Create Queued Strength Renewal
      const sub2Res = await request(app)
        .post('/api/subscriptions/checkout')
        .set('Authorization', adminToken)
        .send({
          memberId,
          planId: 2, // Category 1: Strength (90 days)
          paymentMethod: 'CASH',
        });
      queuedSubId = sub2Res.body.data.subscription.id;
    });

    it('should cancel active subscription and promote queued renewal to active starting today when promoteQueued is true', async () => {
      const res = await request(app)
        .patch(`/api/subscriptions/${activeSubId}/cancel`)
        .set('Authorization', memberToken)
        .send({
          promoteQueued: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.subscription.status).toBe('cancelled');

      // Verify the queued subscription was promoted to active
      expect(res.body.data.promotedSubscription).toBeDefined();
      expect(res.body.data.promotedSubscription.id).toBe(queuedSubId);
      expect(res.body.data.promotedSubscription.status).toBe('active');

      // Verify in DB
      const [promotedRows] = await pool.query('SELECT status FROM subscriptions WHERE id = ?', [queuedSubId]);
      expect(promotedRows[0].status).toBe('active');
    });

    it('should reject cancelling an already cancelled subscription with 400 Bad Request', async () => {
      const res = await request(app)
        .patch(`/api/subscriptions/${activeSubId}/cancel`)
        .set('Authorization', memberToken)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already cancelled/i);
    });
  });

  describe('3. Status Synchronization Maintenance Job (POST /api/subscriptions/sync-statuses)', () => {
    it('POST /api/subscriptions/sync-statuses should reject non-admin with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/subscriptions/sync-statuses')
        .set('Authorization', memberToken);

      expect(res.status).toBe(403);
    });

    it('POST /api/subscriptions/sync-statuses should execute sync and return operation counts for Admin', async () => {
      const res = await request(app)
        .post('/api/subscriptions/sync-statuses')
        .set('Authorization', adminToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.expiredSubscriptions).toBeDefined();
      expect(res.body.data.activatedQueuedSubscriptions).toBeDefined();
      expect(res.body.data.purgedStaleSubscriptions).toBeDefined();
      expect(res.body.data.purgedStalePayments).toBeDefined();
    });
  });
});
