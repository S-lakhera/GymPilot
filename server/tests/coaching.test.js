import request from 'supertest';
import app from '../src/app.js';
import { generateAccessToken } from '../src/utils/jwt.js';
import { pool } from '../src/config/db.js';

describe('Coaching & Trainer-Member Assignment Module (Milestone 6.1)', () => {
  let adminToken;
  let trainerAlexToken;
  let trainerSarahToken;
  let memberRahulToken; // Member 5 (Active Strength pass, assigned to Alex)
  let memberVikramToken; // Member 9 (Active CrossFit pass, unassigned)
  let noPassMemberToken;
  let testMemberId;

  beforeAll(async () => {
    adminToken = `Bearer ${generateAccessToken({ id: 1, email: 'admin@gympilot.com', role: 'admin' })}`;
    trainerAlexToken = `Bearer ${generateAccessToken({ id: 2, email: 'trainer.alex@gympilot.com', role: 'trainer' })}`;
    trainerSarahToken = `Bearer ${generateAccessToken({ id: 3, email: 'trainer.sarah@gympilot.com', role: 'trainer' })}`;
    memberRahulToken = `Bearer ${generateAccessToken({ id: 5, email: 'rahul.sharma@gmail.com', role: 'member' })}`;
    memberVikramToken = `Bearer ${generateAccessToken({ id: 9, email: 'vikram.singh@gmail.com', role: 'member' })}`;

    // Create an active member with NO active passes to test pass requirement
    const [uRes] = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, is_active)
       VALUES ('NoPass', 'Tester', 'nopass.tester@gympilot.com', 'dummy_hash', 'member', TRUE)`
    );
    testMemberId = uRes.insertId;
    noPassMemberToken = `Bearer ${generateAccessToken({ id: testMemberId, email: 'nopass.tester@gympilot.com', role: 'member' })}`;

    // Clean up any test assignments or requests created in previous test runs
    await pool.query("DELETE FROM trainer_assignment_requests WHERE notes LIKE '%TEST_COACH%'");
    await pool.query("DELETE FROM trainer_member_assignments WHERE notes LIKE '%TEST_COACH%'");
  });

  afterAll(async () => {
    // Clean up any test artifacts
    await pool.query("DELETE FROM trainer_assignment_requests WHERE notes LIKE '%TEST_COACH%'");
    await pool.query("DELETE FROM trainer_member_assignments WHERE notes LIKE '%TEST_COACH%'");
    if (testMemberId) {
      await pool.query('DELETE FROM users WHERE id = ?', [testMemberId]);
    }
  });

  // ============================================================================
  // 1. RBAC & Security Boundaries
  // ============================================================================
  describe('1. Security & Role Guards', () => {
    it('should return 401 Unauthorized when requesting /api/coaching/trainers without token', async () => {
      const res = await request(app).get('/api/coaching/trainers');
      expect(res.status).toBe(401);
    });

    it('should return 403 Forbidden when member attempts to access admin coaching overview', async () => {
      const res = await request(app)
        .get('/api/coaching/admin/overview')
        .set('Authorization', memberRahulToken);
      expect(res.status).toBe(403);
    });

    it('should return 403 Forbidden when trainer attempts to access admin overview', async () => {
      const res = await request(app)
        .get('/api/coaching/admin/overview')
        .set('Authorization', trainerAlexToken);
      expect(res.status).toBe(403);
    });

    it('should return 403 Forbidden when member attempts to access trainer roster', async () => {
      const res = await request(app)
        .get('/api/coaching/roster')
        .set('Authorization', memberRahulToken);
      expect(res.status).toBe(403);
    });
  });

  // ============================================================================
  // 2. Trainer Capacity Listing
  // ============================================================================
  describe('2. Trainer Capacity & Availability Listing (GET /api/coaching/trainers)', () => {
    it('should return all active trainers with max_clients, active_clients_count, and is_at_capacity flag', async () => {
      const res = await request(app)
        .get('/api/coaching/trainers')
        .set('Authorization', memberVikramToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);

      const alex = res.body.data.find((t) => t.id === 2);
      expect(alex).toBeDefined();
      expect(alex.specialization).toBe('Strength & Hypertrophy');
      expect(typeof alex.max_clients).toBe('number');
      expect(typeof alex.active_clients_count).toBe('number');
      expect(typeof alex.is_at_capacity).toBe('boolean');
    });
  });

  // ============================================================================
  // 3. Member Coaching Request Lifecycle
  // ============================================================================
  describe('3. Member Coaching Request Lifecycle', () => {
    let createdRequestId;

    it('should reject request with 400 when member does not hold an active subscription', async () => {
      const res = await request(app)
        .post('/api/coaching/requests')
        .set('Authorization', noPassMemberToken)
        .send({
          trainerId: 4,
          notes: 'TEST_COACH: I would like coaching.',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('ACTIVE_PASS_REQUIRED');
    });

    it('should reject request with 409 when member already has an active assignment', async () => {
      // Member 5 (Rahul Sharma) is already actively assigned to Coach Alex
      const res = await request(app)
        .post('/api/coaching/requests')
        .set('Authorization', memberRahulToken)
        .send({
          trainerId: 3,
          notes: 'TEST_COACH: Trying second coach.',
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('ASSIGNMENT_ALREADY_EXISTS');
    });

    it('should allow eligible member with active pass to submit a coaching request', async () => {
      // Member 9 (Vikram Singh) has an active CrossFit pass and no coach
      const res = await request(app)
        .post('/api/coaching/requests')
        .set('Authorization', memberVikramToken)
        .send({
          trainerId: 4, // Marcus (CrossFit)
          notes: 'TEST_COACH: Looking for Olympic weightlifting form checks.',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.member_id).toBe(9);
      expect(res.body.data.trainer_id).toBe(4);
      createdRequestId = res.body.data.id;
    });

    it('should reject duplicate request with 409 when member already has a pending request', async () => {
      const res = await request(app)
        .post('/api/coaching/requests')
        .set('Authorization', memberVikramToken)
        .send({
          trainerId: 3,
          notes: 'TEST_COACH: Duplicate request.',
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('PENDING_REQUEST_ALREADY_EXISTS');
    });

    it('should reflect pending request in member status (GET /api/coaching/status)', async () => {
      const res = await request(app)
        .get('/api/coaching/status')
        .set('Authorization', memberVikramToken);

      expect(res.status).toBe(200);
      expect(res.body.data.hasActivePass).toBe(true);
      expect(res.body.data.canRequestCoach).toBe(false);
      expect(res.body.data.pendingRequest).toBeDefined();
      expect(res.body.data.pendingRequest.id).toBe(createdRequestId);
    });

    it('should allow member to cancel their pending request (DELETE /api/coaching/requests/:id)', async () => {
      const res = await request(app)
        .delete(`/api/coaching/requests/${createdRequestId}`)
        .set('Authorization', memberVikramToken);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CANCELLED');

      // Now canRequestCoach should be true again
      const statusRes = await request(app)
        .get('/api/coaching/status')
        .set('Authorization', memberVikramToken);
      expect(statusRes.body.data.canRequestCoach).toBe(true);
      expect(statusRes.body.data.pendingRequest).toBeNull();
    });
  });

  // ============================================================================
  // 4. Admin Request Review & Direct Assignment
  // ============================================================================
  describe('4. Admin Request Review & Direct Assignment', () => {
    let reviewTestRequestId;
    let approvedAssignmentId;

    it('should allow member to submit request and admin to reject it with a reason', async () => {
      // 1. Member 9 submits request
      const reqRes = await request(app)
        .post('/api/coaching/requests')
        .set('Authorization', memberVikramToken)
        .send({
          trainerId: 4,
          notes: 'TEST_COACH: Request to be rejected.',
        });
      expect(reqRes.status).toBe(201);
      const reqId = reqRes.body.data.id;

      // 2. Admin rejects with reason
      const rejectRes = await request(app)
        .post(`/api/coaching/admin/requests/${reqId}/review`)
        .set('Authorization', adminToken)
        .send({
          action: 'REJECT',
          rejectionReason: 'Coach Marcus is fully booked for Olympic lifting sessions.',
        });

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.data.status).toBe('REJECTED');
      expect(rejectRes.body.data.rejection_reason).toContain('fully booked');
    });

    it('should allow member to submit request and admin to approve it, creating an ACTIVE assignment', async () => {
      // 1. Member 9 submits request
      const reqRes = await request(app)
        .post('/api/coaching/requests')
        .set('Authorization', memberVikramToken)
        .send({
          trainerId: 4,
          notes: 'TEST_COACH: Request to be approved.',
        });
      expect(reqRes.status).toBe(201);
      reviewTestRequestId = reqRes.body.data.id;

      // 2. Admin approves
      const approveRes = await request(app)
        .post(`/api/coaching/admin/requests/${reviewTestRequestId}/review`)
        .set('Authorization', adminToken)
        .send({ action: 'APPROVE' });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.status).toBe('ACTIVE');
      expect(approveRes.body.data.member_id).toBe(9);
      expect(approveRes.body.data.trainer_id).toBe(4);
      approvedAssignmentId = approveRes.body.data.id;
    });

    it('should allow Admin to terminate an active assignment with reason', async () => {
      const termRes = await request(app)
        .post(`/api/coaching/admin/assignments/${approvedAssignmentId}/terminate`)
        .set('Authorization', adminToken)
        .send({
          reason: 'ADMIN_TERMINATED',
          notes: 'TEST_COACH: Terminated by admin request test.',
        });

      expect(termRes.status).toBe(200);
      expect(termRes.body.data.status).toBe('TERMINATED');
      expect(termRes.body.data.termination_reason).toBe('ADMIN_TERMINATED');
      expect(termRes.body.data.end_date).toBeDefined();
    });

    it('should allow Admin to directly assign a coach to a member without a request', async () => {
      const directRes = await request(app)
        .post('/api/coaching/admin/assign')
        .set('Authorization', adminToken)
        .send({
          memberId: 9,
          trainerId: 3, // Sarah
          notes: 'TEST_COACH: Direct front-desk assignment by Admin.',
        });

      expect(directRes.status).toBe(201);
      expect(directRes.body.data.status).toBe('ACTIVE');
      expect(directRes.body.data.member_id).toBe(9);
      expect(directRes.body.data.trainer_id).toBe(3);
    });

    it('should reassign member cleanly when Admin assigns another coach, terminating the previous assignment', async () => {
      // Member 9 is currently with Sarah (3); assign to Marcus (4)
      const reassignRes = await request(app)
        .post('/api/coaching/admin/assign')
        .set('Authorization', adminToken)
        .send({
          memberId: 9,
          trainerId: 4,
          notes: 'TEST_COACH: Reassigned to Marcus.',
        });

      expect(reassignRes.status).toBe(201);
      expect(reassignRes.body.data.trainer_id).toBe(4);
      expect(reassignRes.body.data.status).toBe('ACTIVE');

      // Verify old assignment to Sarah was terminated with MEMBER_REASSIGNED
      const [oldRows] = await pool.query(
        "SELECT * FROM trainer_member_assignments WHERE member_id = 9 AND trainer_id = 3 AND status = 'TERMINATED'"
      );
      expect(oldRows.length).toBeGreaterThanOrEqual(1);
      expect(oldRows[0].termination_reason).toBe('MEMBER_REASSIGNED');
    });
  });

  // ============================================================================
  // 5. Trainer Roster & Client Data Visibility
  // ============================================================================
  describe('5. Trainer Roster (GET /api/coaching/roster)', () => {
    it('should return assigned clients with health notes, emergency contact, and capacity metrics for the authenticated coach', async () => {
      // Trainer Alex (User 2) has active assignments (Member 5 and Member 6)
      const res = await request(app)
        .get('/api/coaching/roster')
        .set('Authorization', trainerAlexToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.assignments).toBeDefined();
      expect(res.body.data.metrics).toBeDefined();
      expect(res.body.data.metrics.activeClients).toBeGreaterThanOrEqual(2);
      expect(res.body.data.metrics.maxClients).toBe(10);
      expect(typeof res.body.data.metrics.capacityPercent).toBe('number');

      // Verify member inspection details in roster
      const rahul = res.body.data.assignments.find((a) => a.member_id === 5);
      expect(rahul).toBeDefined();
      expect(rahul.member_first_name).toBe('Rahul');
      expect(Array.isArray(rahul.active_subscriptions)).toBe(true);

      const priya = res.body.data.assignments.find((a) => a.member_id === 6);
      expect(priya).toBeDefined();
      expect(priya.member_first_name).toBe('Priya');
      expect(priya.emergency_contact_name).toBe('Ramesh Patel');
      expect(priya.emergency_contact_phone).toBe('+91-9866699992');
    });
  });

  // ============================================================================
  // 6. 10-Day Grace Period Reconciliation Engine (POST /api/coaching/admin/sync)
  // ============================================================================
  describe('6. Grace Period Lifecycle Engine', () => {
    it('should reconcile and report paused/terminated assignments on demand', async () => {
      const res = await request(app)
        .post('/api/coaching/admin/sync')
        .set('Authorization', adminToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(typeof res.body.data.pausedCount).toBe('number');
      expect(typeof res.body.data.terminatedCount).toBe('number');
      expect(res.body.data.syncedAt).toBeDefined();
    });

    it('should verify seeded paused assignment has 10-day grace period timestamp set', async () => {
      // Seeded Assignment 3 (Amit Verma with Coach Sarah) is PAUSED with grace ending 2026-11-20
      const [rows] = await pool.query(
        'SELECT * FROM trainer_member_assignments WHERE id = 3'
      );
      expect(rows.length).toBe(1);
      expect(rows[0].status).toBe('PAUSED');
      expect(rows[0].grace_period_ends_at).toBeDefined();
    });
  });
});
