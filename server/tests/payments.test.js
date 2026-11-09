import request from 'supertest';
import app from '../src/app.js';
import { generateAccessToken } from '../src/utils/jwt.js';
import { pool } from '../src/config/db.js';

describe('Two-Phase Payment Confirmation, Webhooks & Financial Audit (Milestone 4.3 - Commit 4)', () => {
  let adminToken;
  let memberToken;
  let otherMemberToken;
  const memberId = 6; // Priya Patel
  const otherMemberId = 7; // Amit Verma

  beforeAll(async () => {
    adminToken = `Bearer ${generateAccessToken({ id: 1, email: 'admin@gympilot.com', role: 'admin' })}`;
    memberToken = `Bearer ${generateAccessToken({ id: memberId, email: 'priya.patel@gmail.com', role: 'member' })}`;
    otherMemberToken = `Bearer ${generateAccessToken({ id: otherMemberId, email: 'amit.verma@gmail.com', role: 'member' })}`;

    // Clean up test subscriptions & payments for test members
    await pool.query('DELETE FROM payments WHERE user_id IN (?, ?)', [memberId, otherMemberId]);
    await pool.query('DELETE FROM subscriptions WHERE user_id IN (?, ?)', [memberId, otherMemberId]);
  });

  afterAll(async () => {
    await pool.query('DELETE FROM payments WHERE user_id IN (?, ?)', [memberId, otherMemberId]);
    await pool.query('DELETE FROM subscriptions WHERE user_id IN (?, ?)', [memberId, otherMemberId]);
  });

  describe('1. Two-Phase Payment Confirmation (POST /api/payments/confirm)', () => {
    let pendingTxnRef;
    let pendingSubId;
    let initialTimesUsed;

    it('should initiate a pending checkout without immediately incrementing discount times_used', async () => {
      // Get initial discount times_used
      const [discRows] = await pool.query('SELECT times_used FROM discounts WHERE code = ?', ['WELCOME10']);
      initialTimesUsed = discRows[0].times_used;

      const checkoutRes = await request(app)
        .post('/api/subscriptions/checkout')
        .set('Authorization', memberToken)
        .send({
          planId: 4, // Cardio Monthly Kickstart (Category 2)
          paymentMethod: 'CARD',
          discountCode: 'WELCOME10',
        });

      expect(checkoutRes.status).toBe(201);
      pendingTxnRef = checkoutRes.body.data.payment.transaction_reference;
      pendingSubId = checkoutRes.body.data.subscription.id;

      expect(checkoutRes.body.data.subscription.status).toBe('pending_payment');
      expect(checkoutRes.body.data.payment.payment_status).toBe('PENDING');

      // Verify coupon times_used is NOT incremented yet
      const [checkDisc] = await pool.query('SELECT times_used FROM discounts WHERE code = ?', ['WELCOME10']);
      expect(checkDisc[0].times_used).toBe(initialTimesUsed);
    });

    it('POST /api/payments/confirm should confirm payment, activate subscription, and increment discount counter', async () => {
      const confirmRes = await request(app)
        .post('/api/payments/confirm')
        .set('Authorization', memberToken)
        .send({
          transactionReference: pendingTxnRef,
          gatewayReference: 'gw_card_mock_9911',
          simulatedStatus: 'SUCCESS',
        });

      expect(confirmRes.status).toBe(200);
      expect(confirmRes.body.status).toBe('success');
      expect(confirmRes.body.data.alreadyProcessed).toBe(false);

      const payment = confirmRes.body.data.payment;
      expect(payment.payment_status).toBe('COMPLETED');
      expect(payment.gateway_reference).toBe('gw_card_mock_9911');

      const subscription = confirmRes.body.data.subscription;
      expect(subscription.status).toBe('active');

      // Verify discount times_used was atomically incremented on confirmation
      const [checkDisc] = await pool.query('SELECT times_used FROM discounts WHERE code = ?', ['WELCOME10']);
      expect(checkDisc[0].times_used).toBe(initialTimesUsed + 1);
    });

    it('POST /api/payments/confirm should be idempotent on repeated calls without double coupon increments', async () => {
      const duplicateRes = await request(app)
        .post('/api/payments/confirm')
        .set('Authorization', memberToken)
        .send({
          transactionReference: pendingTxnRef,
          gatewayReference: 'gw_card_mock_9911',
          simulatedStatus: 'SUCCESS',
        });

      expect(duplicateRes.status).toBe(200);
      expect(duplicateRes.body.status).toBe('success');
      expect(duplicateRes.body.data.alreadyProcessed).toBe(true);

      // Verify discount times_used did NOT increment again
      const [checkDisc] = await pool.query('SELECT times_used FROM discounts WHERE code = ?', ['WELCOME10']);
      expect(checkDisc[0].times_used).toBe(initialTimesUsed + 1);
    });

    it('POST /api/payments/confirm should handle simulated payment failure', async () => {
      // Create another checkout
      const checkoutRes = await request(app)
        .post('/api/subscriptions/checkout')
        .set('Authorization', memberToken)
        .send({
          planId: 6, // Yoga Monthly Zen
          paymentMethod: 'NET_BANKING',
        });

      expect(checkoutRes.status).toBe(201);
      const failTxnRef = checkoutRes.body.data.payment.transaction_reference;

      const failRes = await request(app)
        .post('/api/payments/confirm')
        .set('Authorization', memberToken)
        .send({
          transactionReference: failTxnRef,
          simulatedStatus: 'FAILED',
        });

      expect(failRes.status).toBe(200);
      expect(failRes.body.data.payment.payment_status).toBe('FAILED');
    });
  });

  describe('2. Inbound Webhook Processing (POST /api/payments/webhook)', () => {
    it('should process simulated gateway webhook event idempotently', async () => {
      // Create new checkout
      const checkoutRes = await request(app)
        .post('/api/subscriptions/checkout')
        .set('Authorization', memberToken)
        .send({
          planId: 1, // Strength Monthly
          paymentMethod: 'UPI',
        });

      expect(checkoutRes.status).toBe(201);
      const webhookTxnRef = checkoutRes.body.data.payment.transaction_reference;

      // Webhook payload from payment gateway
      const webhookPayload = {
        event: 'payment.captured',
        data: {
          transactionReference: webhookTxnRef,
          id: 'pay_rzp_mock_12345',
          status: 'SUCCESS',
        },
      };

      const webhookRes = await request(app)
        .post('/api/payments/webhook')
        .send(webhookPayload);

      expect(webhookRes.status).toBe(200);
      expect(webhookRes.body.status).toBe('success');
      expect(webhookRes.body.data.payment.payment_status).toBe('COMPLETED');
      expect(webhookRes.body.data.payment.gateway_reference).toBe('pay_rzp_mock_12345');

      // Duplicate webhook call should be safe and idempotent
      const dupWebhookRes = await request(app)
        .post('/api/payments/webhook')
        .send(webhookPayload);

      expect(dupWebhookRes.status).toBe(200);
      expect(dupWebhookRes.body.data.alreadyProcessed).toBe(true);
    });
  });

  describe('3. Financial Audit Logs & Member Receipts', () => {
    let testPaymentId;

    beforeAll(async () => {
      const [rows] = await pool.query(
        'SELECT id FROM payments WHERE user_id = ? ORDER BY id DESC LIMIT 1',
        [memberId]
      );
      testPaymentId = rows[0]?.id;
    });

    it('GET /api/payments should reject non-admin with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/payments')
        .set('Authorization', memberToken);

      expect(res.status).toBe(403);
    });

    it('GET /api/payments should allow Admin to view full financial audit log', async () => {
      const res = await request(app)
        .get('/api/payments?paymentStatus=COMPLETED')
        .set('Authorization', adminToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });

    it('GET /api/payments/my should allow member to view their own payment receipts', async () => {
      const res = await request(app)
        .get('/api/payments/my')
        .set('Authorization', memberToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      res.body.data.forEach((p) => {
        expect(p.user_id).toBe(memberId);
      });
    });

    it('GET /api/payments/:id should allow member to view own payment receipt', async () => {
      const res = await request(app)
        .get(`/api/payments/${testPaymentId}`)
        .set('Authorization', memberToken);

      expect(res.status).toBe(200);
      expect(res.body.data.payment.id).toBe(testPaymentId);
    });

    it('GET /api/payments/:id should reject other member from accessing receipt with 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/payments/${testPaymentId}`)
        .set('Authorization', otherMemberToken);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/do not have permission/i);
    });
  });
});
