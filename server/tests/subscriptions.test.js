import request from 'supertest';
import app from '../src/app.js';
import { generateAccessToken } from '../src/utils/jwt.js';
import { pool } from '../src/config/db.js';

describe('Subscription Lifecycle & Concurrency Engine (Milestone 4.3 - Commit 3)', () => {
  let adminToken;
  let memberToken;
  let otherMemberToken;
  let memberId = 6; // Priya Patel
  let otherMemberId = 7; // Amit Verma
  let createdSubIds = [];

  beforeAll(async () => {
    adminToken = `Bearer ${generateAccessToken({ id: 1, email: 'admin@gympilot.com', role: 'admin' })}`;
    memberToken = `Bearer ${generateAccessToken({ id: memberId, email: 'priya.patel@gmail.com', role: 'member' })}`;
    otherMemberToken = `Bearer ${generateAccessToken({ id: otherMemberId, email: 'amit.verma@gmail.com', role: 'member' })}`;

    // Clean up test subscriptions & payments for test members
    await pool.query('DELETE FROM payments WHERE user_id IN (?, ?)', [memberId, otherMemberId]);
    await pool.query('DELETE FROM subscriptions WHERE user_id IN (?, ?)', [memberId, otherMemberId]);
  });

  afterAll(async () => {
    // Teardown
    await pool.query('DELETE FROM payments WHERE user_id IN (?, ?)', [memberId, otherMemberId]);
    await pool.query('DELETE FROM subscriptions WHERE user_id IN (?, ?)', [memberId, otherMemberId]);
  });

  describe('1. Real-Time Pricing Quote Previews (POST /api/subscriptions/quote)', () => {
    it('should generate a base pricing quote preview without discount', async () => {
      const res = await request(app)
        .post('/api/subscriptions/quote')
        .set('Authorization', memberToken)
        .send({
          planId: 1, // Strength Monthly Pass: ₹899.00
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.quote).toBeDefined();
      expect(res.body.data.quote.planId).toBe(1);
      expect(Number(res.body.data.quote.baseAmount)).toBe(899.0);
      expect(Number(res.body.data.quote.discountAmount)).toBe(0.0);
      expect(Number(res.body.data.quote.finalAmount)).toBe(899.0);
      expect(res.body.data.quote.currency).toBe('INR');
    });

    it('should generate a quote preview with valid percentage discount (WELCOME10)', async () => {
      const res = await request(app)
        .post('/api/subscriptions/quote')
        .set('Authorization', memberToken)
        .send({
          planId: 1, // ₹899.00
          discountCode: 'WELCOME10', // 10% = ₹89.90 discount
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      const quote = res.body.data.quote;
      expect(Number(quote.baseAmount)).toBe(899.0);
      expect(Number(quote.discountAmount)).toBe(89.9);
      expect(Number(quote.finalAmount)).toBe(809.1);
      expect(quote.discountCode).toBe('WELCOME10');
    });

    it('should reject quote preview for an inactive or non-existent plan ID', async () => {
      const res = await request(app)
        .post('/api/subscriptions/quote')
        .set('Authorization', memberToken)
        .send({
          planId: 99999,
        });

      expect(res.status).toBe(404);
      expect(res.body.status).toBe('error');
    });
  });

  describe('2. Subscription Checkout Lifecycle (POST /api/subscriptions/checkout)', () => {
    it('should reject CASH payment method when attempted by a non-admin member with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/subscriptions/checkout')
        .set('Authorization', memberToken)
        .send({
          planId: 1,
          paymentMethod: 'CASH',
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/front-desk administrator/i);
    });

    it('should allow online checkout (CARD/UPI) by member and initiate pending_payment subscription and PENDING payment', async () => {
      const res = await request(app)
        .post('/api/subscriptions/checkout')
        .set('Authorization', memberToken)
        .send({
          planId: 1, // Strength Monthly Pass: ₹899
          paymentMethod: 'UPI',
          discountCode: 'WELCOME10',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');

      const { subscription, payment, pricing } = res.body.data;
      expect(subscription.id).toBeDefined();
      expect(subscription.status).toBe('pending_payment');
      expect(Number(subscription.final_amount)).toBe(809.1);

      expect(payment.id).toBeDefined();
      expect(payment.payment_status).toBe('PENDING');
      expect(payment.payment_method).toBe('UPI');
      expect(payment.transaction_reference).toMatch(/^TXN-\d+-[A-F0-9]+$/);
      expect(Number(payment.amount)).toBe(809.1);

      expect(pricing.finalAmount).toBe(809.1);

      // Clean up this pending checkout for subsequent category tests
      await pool.query('DELETE FROM payments WHERE id = ?', [payment.id]);
      await pool.query('DELETE FROM subscriptions WHERE id = ?', [subscription.id]);
    });

    it('should allow Admin to process front-desk CASH checkout, immediately activating subscription and completing payment', async () => {
      const res = await request(app)
        .post('/api/subscriptions/checkout')
        .set('Authorization', adminToken)
        .send({
          memberId: memberId,
          planId: 1, // Strength Monthly Pass (30 days, Category 1)
          paymentMethod: 'CASH',
          discountCode: 'STRENGTH50', // ₹50 off Strength plans
        });

      expect(res.status).toBe(201);
      const { subscription, payment, pricing } = res.body.data;

      expect(subscription.status).toBe('active');
      expect(Number(subscription.base_amount)).toBe(899.0);
      expect(Number(subscription.discount_amount)).toBe(50.0);
      expect(Number(subscription.final_amount)).toBe(849.0);

      expect(payment.payment_status).toBe('COMPLETED');
      expect(payment.payment_method).toBe('CASH');
      expect(payment.recorded_by_id).toBe(1);

      createdSubIds.push(subscription.id);
    });

    it('should queue renewal subscription sequentially after the active subscription in the same category', async () => {
      // Member buys another Strength plan (Plan 2: 90 days) via front-desk CASH
      const res = await request(app)
        .post('/api/subscriptions/checkout')
        .set('Authorization', adminToken)
        .send({
          memberId: memberId,
          planId: 2, // Strength Quarterly Pass (90 days, Category 1)
          paymentMethod: 'CASH',
        });

      expect(res.status).toBe(201);
      const { subscription } = res.body.data;

      expect(subscription.status).toBe('queued');

      // Fetch the active subscription in Category 1
      const [activeRows] = await pool.query(
        'SELECT end_date FROM subscriptions WHERE user_id = ? AND plan_id = 1 AND status = ?',
        [memberId, 'active']
      );
      const activeEndDate = activeRows[0].end_date;

      // The queued subscription start_date must be activeEndDate + 1 day
      const expectedStart = new Date(activeEndDate);
      expectedStart.setDate(expectedStart.getDate() + 1);
      const expectedStartStr = expectedStart.toISOString().slice(0, 10);

      // Verify start date matches expected sequential renewal
      expect(subscription.start_date.slice(0, 10)).toBe(expectedStartStr);

      createdSubIds.push(subscription.id);
    });

    it('should reject a 3rd subscription in the same category when active + queued already exist', async () => {
      const res = await request(app)
        .post('/api/subscriptions/checkout')
        .set('Authorization', adminToken)
        .send({
          memberId: memberId,
          planId: 1, // Category 1 again
          paymentMethod: 'CASH',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/queued renewal in this category/i);
    });

    it('should allow concurrent active subscription in a DIFFERENT category (Cross-Category isolation)', async () => {
      // Member has active + queued in Strength (Category 1).
      // They now purchase Yoga Monthly Zen (Plan 6, Category 3).
      const res = await request(app)
        .post('/api/subscriptions/checkout')
        .set('Authorization', adminToken)
        .send({
          memberId: memberId,
          planId: 6, // Yoga Monthly Zen (Category 3)
          paymentMethod: 'CASH',
        });

      expect(res.status).toBe(201);
      const { subscription } = res.body.data;

      // Because there was NO active subscription in Yoga, this should be immediately active!
      expect(subscription.status).toBe('active');
      createdSubIds.push(subscription.id);
    });
  });

  describe('3. Subscriptions Listing & Permission Governance', () => {
    it('GET /api/subscriptions should return only member own subscriptions when requested by member', async () => {
      const res = await request(app)
        .get('/api/subscriptions')
        .set('Authorization', memberToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();

      // All returned subscriptions must belong to memberId
      res.body.data.forEach((sub) => {
        expect(sub.user_id).toBe(memberId);
      });
    });

    it('GET /api/subscriptions should allow Admin to view and filter subscriptions for any member', async () => {
      const res = await request(app)
        .get(`/api/subscriptions?userId=${memberId}`)
        .set('Authorization', adminToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('GET /api/subscriptions/:id should allow member to view own subscription details', async () => {
      const targetId = createdSubIds[0];
      const res = await request(app)
        .get(`/api/subscriptions/${targetId}`)
        .set('Authorization', memberToken);

      expect(res.status).toBe(200);
      expect(res.body.data.subscription.id).toBe(targetId);
      expect(res.body.data.subscription.user_id).toBe(memberId);
      expect(res.body.data.subscription.plan_name).toBeDefined();
    });

    it('GET /api/subscriptions/:id should reject other member with 403 Forbidden', async () => {
      const targetId = createdSubIds[0]; // belongs to memberId (Priya)
      const res = await request(app)
        .get(`/api/subscriptions/${targetId}`)
        .set('Authorization', otherMemberToken); // requested by Amit

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/do not have permission/i);
    });
  });
});

