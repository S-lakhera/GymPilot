import request from 'supertest';
import app from '../src/app.js';
import { generateAccessToken } from '../src/utils/jwt.js';
import { pool } from '../src/config/db.js';

describe('Plan Categories & Membership Plans Module (Milestone 4.2)', () => {
  let adminToken;
  let memberToken;
  let testCategoryId;
  let testPlanId;
  let inactiveCategoryId;

  beforeAll(async () => {
    adminToken = `Bearer ${generateAccessToken({ id: 1, email: 'admin@gympilot.com', role: 'admin' })}`;
    memberToken = `Bearer ${generateAccessToken({ id: 5, email: 'rahul.sharma@gmail.com', role: 'member' })}`;

    // Clean up any lingering test categories and plans
    await pool.query('DELETE FROM plans WHERE name LIKE ?', ['Pilates%']);
    await pool.query('DELETE FROM plan_categories WHERE name IN (?, ?)', ['Pilates & Core', 'Archived Discipline']);
  });

  afterAll(async () => {
    // Clean up created test plan and test category
    if (testPlanId) {
      await pool.query('DELETE FROM plans WHERE id = ?', [testPlanId]);
    }
    if (testCategoryId) {
      await pool.query('DELETE FROM plan_categories WHERE id = ?', [testCategoryId]);
    }
    if (inactiveCategoryId) {
      await pool.query('DELETE FROM plan_categories WHERE id = ?', [inactiveCategoryId]);
    }
  });

  describe('1. Plan Categories Management (/api/categories)', () => {
    it('GET /api/categories should return active categories for public/member', async () => {
      const res = await request(app).get('/api/categories');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data.categories)).toBe(true);
      expect(res.body.data.categories.length).toBeGreaterThanOrEqual(4); // Seeded 4 categories
    });

    it('POST /api/categories should return 403 Forbidden for non-admin', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', memberToken)
        .send({ name: 'Martial Arts' });

      expect(res.status).toBe(403);
    });

    it('POST /api/categories should allow Admin to create a category', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', adminToken)
        .send({
          name: 'Pilates & Core',
          description: 'Reformer and mat-based core conditioning workouts.',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.category).toHaveProperty('id');
      expect(res.body.data.category.name).toBe('Pilates & Core');

      testCategoryId = res.body.data.category.id;
    });

    it('POST /api/categories should return 409 CATEGORY_EXISTS on duplicate name', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', adminToken)
        .send({ name: 'Pilates & Core' });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('CATEGORY_EXISTS');
    });

    it('PATCH /api/categories/:id should allow Admin to update category', async () => {
      const res = await request(app)
        .patch(`/api/categories/${testCategoryId}`)
        .set('Authorization', adminToken)
        .send({ description: 'Updated pilates description with mat core routines.' });

      expect(res.status).toBe(200);
      expect(res.body.data.category.description).toBe('Updated pilates description with mat core routines.');
    });

    it('PATCH /api/categories/:id/status should toggle category active state', async () => {
      const res = await request(app)
        .patch(`/api/categories/${testCategoryId}/status`)
        .set('Authorization', adminToken)
        .send({ isActive: false });

      expect(res.status).toBe(200);
      expect(res.body.data.category.isActive).toBe(false);

      // Reactivate for subsequent plan tests
      const reactivateRes = await request(app)
        .patch(`/api/categories/${testCategoryId}/status`)
        .set('Authorization', adminToken)
        .send({ isActive: true });

      expect(reactivateRes.status).toBe(200);
      expect(reactivateRes.body.data.category.isActive).toBe(true);
    });
  });

  describe('2. Membership Plans Management (/api/plans)', () => {
    it('POST /api/plans should reject creation by non-admin with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/plans')
        .set('Authorization', memberToken)
        .send({
          categoryId: testCategoryId,
          name: 'Pilates Monthly',
          durationDays: 30,
          price: 999,
        });

      expect(res.status).toBe(403);
    });

    it('POST /api/plans should return 404 CATEGORY_NOT_FOUND for invalid categoryId', async () => {
      const res = await request(app)
        .post('/api/plans')
        .set('Authorization', adminToken)
        .send({
          categoryId: 999999,
          name: 'Ghost Plan',
          durationDays: 30,
          price: 500,
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('CATEGORY_NOT_FOUND');
    });

    it('POST /api/plans should reject creating plan under an inactive category', async () => {
      // Create a separate inactive category
      const [catResult] = await pool.query(
        'INSERT INTO plan_categories (name, description, is_active) VALUES (?, ?, FALSE)',
        ['Archived Discipline', 'Historical inactive category']
      );
      inactiveCategoryId = catResult.insertId;

      const res = await request(app)
        .post('/api/plans')
        .set('Authorization', adminToken)
        .send({
          categoryId: inactiveCategoryId,
          name: 'Archived Plan',
          durationDays: 30,
          price: 799,
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INACTIVE_CATEGORY');
    });

    it('POST /api/plans should successfully create a plan by Admin', async () => {
      const res = await request(app)
        .post('/api/plans')
        .set('Authorization', adminToken)
        .send({
          categoryId: testCategoryId,
          name: 'Pilates Foundation Monthly',
          description: 'Unlimited access to pilates and core sessions for 30 days.',
          durationDays: 30,
          price: 899,
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.plan).toHaveProperty('id');
      expect(res.body.data.plan.name).toBe('Pilates Foundation Monthly');
      expect(res.body.data.plan.price).toBe(899);
      expect(res.body.data.plan.durationDays).toBe(30);

      testPlanId = res.body.data.plan.id;
    });

    it('GET /api/plans should browse active catalog plans', async () => {
      const res = await request(app).get('/api/plans');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data.plans)).toBe(true);
      expect(res.body.data.plans.length).toBeGreaterThanOrEqual(8); // 8 seeded plans + test plan
    });

    it('GET /api/plans should filter plans by categoryId', async () => {
      const res = await request(app).get(`/api/plans?categoryId=${testCategoryId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.plans.length).toBe(1);
      expect(res.body.data.plans[0].id).toBe(testPlanId);
    });

    it('GET /api/plans/:id should return plan details', async () => {
      const res = await request(app).get(`/api/plans/${testPlanId}`);

      expect(res.status).toBe(200);
      expect(res.body.data.plan.id).toBe(testPlanId);
      expect(res.body.data.plan.name).toBe('Pilates Foundation Monthly');
    });

    it('PATCH /api/plans/:id should update plan pricing and details by Admin', async () => {
      const res = await request(app)
        .patch(`/api/plans/${testPlanId}`)
        .set('Authorization', adminToken)
        .send({
          price: 949,
          description: 'Updated price with complimentary mat.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.plan.price).toBe(949);
      expect(res.body.data.plan.description).toBe('Updated price with complimentary mat.');
    });

    it('PATCH /api/plans/:id/status should toggle plan active state', async () => {
      const res = await request(app)
        .patch(`/api/plans/${testPlanId}/status`)
        .set('Authorization', adminToken)
        .send({ isActive: false });

      expect(res.status).toBe(200);
      expect(res.body.data.plan.isActive).toBe(false);

      // Public listing should not include the deactivated plan
      const publicList = await request(app).get('/api/plans');
      const found = publicList.body.data.plans.find((p) => p.id === testPlanId);
      expect(found).toBeUndefined();
    });
  });
});
