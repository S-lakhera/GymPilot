import request from 'supertest';
import app from '../src/app.js';
import { generateAccessToken } from '../src/utils/jwt.js';
import { pool } from '../src/config/db.js';

describe('Attendance Management Module (Milestone 6.2)', () => {
  let adminToken;
  let trainerAlexToken;
  let memberRahulToken;
  let memberVikramToken;
  let noPassMemberToken;
  let testNoPassMemberId;
  let createdAttendanceId;

  beforeAll(async () => {
    adminToken = `Bearer ${generateAccessToken({ id: 1, email: 'admin@gympilot.com', role: 'admin' })}`;
    trainerAlexToken = `Bearer ${generateAccessToken({ id: 2, email: 'trainer.alex@gympilot.com', role: 'trainer' })}`;
    memberRahulToken = `Bearer ${generateAccessToken({ id: 5, email: 'rahul.sharma@gmail.com', role: 'member' })}`;
    memberVikramToken = `Bearer ${generateAccessToken({ id: 9, email: 'vikram.singh@gmail.com', role: 'member' })}`;

    // Create an active member with NO active passes to test soft pass requirement
    const [uRes] = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, is_active)
       VALUES ('NoPassAtt', 'Tester', 'nopass.att@gympilot.com', 'dummy_hash', 'member', TRUE)`
    );
    testNoPassMemberId = uRes.insertId;
    noPassMemberToken = `Bearer ${generateAccessToken({ id: testNoPassMemberId, email: 'nopass.att@gympilot.com', role: 'member' })}`;

    // Clean up any test attendance records created in previous test runs
    await pool.query("DELETE FROM attendance_records WHERE notes LIKE '%TEST_ATT%' OR member_id = ?", [testNoPassMemberId]);
  });

  afterAll(async () => {
    // Clean up test attendance records
    await pool.query("DELETE FROM attendance_records WHERE notes LIKE '%TEST_ATT%' OR member_id = ?", [testNoPassMemberId]);
    if (testNoPassMemberId) {
      await pool.query('DELETE FROM users WHERE id = ?', [testNoPassMemberId]);
    }
  });

  // ============================================================================
  // 1. RBAC & Security Boundaries
  // ============================================================================
  describe('1. Security & Role Guards', () => {
    it('should return 401 Unauthorized when requesting /api/attendance/check-in without token', async () => {
      const res = await request(app)
        .post('/api/attendance/check-in')
        .send({ memberId: 5 });
      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
    });

    it('should return 403 Forbidden when member attempts to check-in attendance', async () => {
      const res = await request(app)
        .post('/api/attendance/check-in')
        .set('Authorization', memberRahulToken)
        .send({ memberId: 5 });
      expect(res.status).toBe(403);
    });

    it('should return 403 Forbidden when trainer attempts to check-in attendance', async () => {
      const res = await request(app)
        .post('/api/attendance/check-in')
        .set('Authorization', trainerAlexToken)
        .send({ memberId: 5 });
      expect(res.status).toBe(403);
    });

    it('should return 403 Forbidden when member attempts to access admin overview', async () => {
      const res = await request(app)
        .get('/api/attendance/admin/overview')
        .set('Authorization', memberRahulToken);
      expect(res.status).toBe(403);
    });

    it('should return 403 Forbidden when admin attempts to access member-only my-history route', async () => {
      const res = await request(app)
        .get('/api/attendance/my-history')
        .set('Authorization', adminToken);
      expect(res.status).toBe(403);
    });

    it('should return 403 Forbidden when member attempts to access trainer-only clients attendance route', async () => {
      const res = await request(app)
        .get('/api/attendance/clients/5')
        .set('Authorization', memberRahulToken);
      expect(res.status).toBe(403);
    });
  });

  // ============================================================================
  // 2. Admin Check-In & Soft Pass Validation
  // ============================================================================
  describe('2. Admin Check-In & Soft Pass Validation', () => {
    it('should require override when member has no active pass and overrideConfirmed is false', async () => {
      const res = await request(app)
        .post('/api/attendance/check-in')
        .set('Authorization', adminToken)
        .send({
          memberId: testNoPassMemberId,
          overrideConfirmed: false,
          notes: 'TEST_ATT: No pass attempt',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('PASS_OVERRIDE_REQUIRED');
      expect(res.body.data?.requiresOverride).toBe(true);
      expect(res.body.data?.passStatus).toBe('NO_PASS');
    });

    it('should successfully record check-in with soft override for member without active pass', async () => {
      const res = await request(app)
        .post('/api/attendance/check-in')
        .set('Authorization', adminToken)
        .send({
          memberId: testNoPassMemberId,
          overrideConfirmed: true,
          overrideNote: 'TEST_ATT: Admin guest trial pass approved',
          notes: 'TEST_ATT: Soft override trial visit',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.member_id).toBe(testNoPassMemberId);
      expect(res.body.data.status).toBe('CHECKED_IN');
      expect(res.body.data.pass_status_at_checkin).toBe('NO_PASS');
      expect(res.body.data.override_note).toContain('Admin guest trial pass approved');

      createdAttendanceId = res.body.data.id;
    });

    it('should reject duplicate active check-in with 409 Conflict when member is already checked in today', async () => {
      const res = await request(app)
        .post('/api/attendance/check-in')
        .set('Authorization', adminToken)
        .send({
          memberId: testNoPassMemberId,
          overrideConfirmed: true,
          notes: 'TEST_ATT: Duplicate check-in attempt',
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('ACTIVE_SESSION_EXISTS');
      expect(res.body.data?.existingSessionId).toBe(createdAttendanceId);
    });
  });

  // ============================================================================
  // 3. Check-Out Lifecycle & Duration Calculation
  // ============================================================================
  describe('3. Check-Out Lifecycle & Duration Calculation', () => {
    it('should successfully check out active member session and calculate duration', async () => {
      // Simulate check-out 45 minutes later
      const now = new Date();
      const pastCheckIn = new Date(now.getTime() - 45 * 60 * 1000);
      const pad = (n) => String(n).padStart(2, '0');
      const toMysql = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

      // First update check_in_time to 45 mins ago in server-local representation
      await pool.query('UPDATE attendance_records SET check_in_time = ? WHERE id = ?', [
        toMysql(pastCheckIn),
        createdAttendanceId,
      ]);

      const res = await request(app)
        .put(`/api/attendance/${createdAttendanceId}/check-out`)
        .set('Authorization', adminToken)
        .send({
          checkOutTime: toMysql(now),
          notes: 'TEST_ATT: Completed workout session',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.status).toBe('CHECKED_OUT');
      expect(res.body.data.check_out_time).toBeTruthy();
      expect(res.body.data.duration_minutes).toBeGreaterThanOrEqual(44);
      expect(res.body.data.duration_minutes).toBeLessThanOrEqual(46);
    });

    it('should successfully check out active member session when checkOutTime is omitted', async () => {
      // Create a new check-in
      const checkInRes = await request(app)
        .post('/api/attendance/check-in')
        .set('Authorization', adminToken)
        .send({
          memberId: testNoPassMemberId,
          overrideConfirmed: true,
          notes: 'TEST_ATT: Omitted checkout time test',
        });
      expect(checkInRes.status).toBe(201);
      const sessionAttId = checkInRes.body.data.id;

      // Set check-in to 30 minutes ago
      await pool.query(
        'UPDATE attendance_records SET check_in_time = DATE_SUB(NOW(), INTERVAL 30 MINUTE) WHERE id = ?',
        [sessionAttId]
      );

      // Perform checkout with checkOutTime omitted
      const res = await request(app)
        .put(`/api/attendance/${sessionAttId}/check-out`)
        .set('Authorization', adminToken)
        .send({
          notes: 'TEST_ATT: Checked out without explicit timestamp',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.status).toBe('CHECKED_OUT');
      expect(res.body.data.check_out_time).toBeTruthy();
      expect(res.body.data.duration_minutes).toBeGreaterThanOrEqual(29);
      expect(res.body.data.duration_minutes).toBeLessThanOrEqual(31);

      // Verify persisted timestamps match duration
      const [persisted] = await pool.query(
        'SELECT check_in_time, check_out_time, duration_minutes FROM attendance_records WHERE id = ?',
        [sessionAttId]
      );
      expect(persisted[0].duration_minutes).toBe(res.body.data.duration_minutes);

      // Clean up test record
      await pool.query('DELETE FROM attendance_records WHERE id = ?', [sessionAttId]);
    });

    it('should reject check-out attempt on already checked-out session with 400 Bad Request', async () => {
      const res = await request(app)
        .put(`/api/attendance/${createdAttendanceId}/check-out`)
        .set('Authorization', adminToken)
        .send({ notes: 'TEST_ATT: Duplicate checkout' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already been checked out');
    });

    it('should check in member with an active pass without requiring override', async () => {
      const res = await request(app)
        .post('/api/attendance/check-in')
        .set('Authorization', adminToken)
        .send({
          memberId: 9, // Vikram Singh holds active CrossFit pass
          notes: 'TEST_ATT: Active pass check-in',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.member_id).toBe(9);
      expect(res.body.data.status).toBe('CHECKED_IN');
      expect(res.body.data.pass_status_at_checkin).toBe('ACTIVE_PASS');
      expect(res.body.data.subscription_id).toBeTruthy();

      // Clean up by checking Vikram out
      await request(app)
        .put(`/api/attendance/${res.body.data.id}/check-out`)
        .set('Authorization', adminToken);
    });
  });

  // ============================================================================
  // 4. Admin Corrections & Deletion
  // ============================================================================
  describe('4. Admin Corrections & Deletions', () => {
    it('should reject setting status to CHECKED_IN when check-out time is present', async () => {
      const res = await request(app)
        .put(`/api/attendance/${createdAttendanceId}`)
        .set('Authorization', adminToken)
        .send({
          status: 'CHECKED_IN',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot set status to CHECKED_IN while a check-out time is present');
    });

    it('should allow admin to correct notes and timestamps on an attendance record', async () => {
      const res = await request(app)
        .put(`/api/attendance/${createdAttendanceId}`)
        .set('Authorization', adminToken)
        .send({
          notes: 'TEST_ATT: Corrected front-desk notes',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.notes).toBe('TEST_ATT: Corrected front-desk notes');
    });

    it('should allow admin to delete an attendance record', async () => {
      const res = await request(app)
        .delete(`/api/attendance/${createdAttendanceId}`)
        .set('Authorization', adminToken);

      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);

      // Verify deletion from database
      const [rows] = await pool.query('SELECT id FROM attendance_records WHERE id = ?', [createdAttendanceId]);
      expect(rows.length).toBe(0);
    });
  });

  // ============================================================================
  // 5. Admin Overview & Aggregations
  // ============================================================================
  describe('5. Admin Overview & Member Search', () => {
    it('should return complete admin attendance overview with 4 core metrics, 7-day trend, and logs', async () => {
      const res = await request(app)
        .get('/api/attendance/admin/overview')
        .set('Authorization', adminToken);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('stats');
      expect(res.body.data.stats).toHaveProperty('currentlyInGym');
      expect(res.body.data.stats).toHaveProperty('totalVisitsToday');
      expect(res.body.data.stats).toHaveProperty('completedVisitsToday');

      expect(res.body.data).toHaveProperty('trend');
      expect(Array.isArray(res.body.data.trend)).toBe(true);
      expect(res.body.data.trend.length).toBe(7);

      expect(res.body.data).toHaveProperty('currentlyInGym');
      expect(Array.isArray(res.body.data.currentlyInGym)).toBe(true);

      expect(res.body.data).toHaveProperty('logs');
      expect(Array.isArray(res.body.data.logs)).toBe(true);

      expect(res.body.data).toHaveProperty('pagination');
      expect(res.body.data.pagination.page).toBe(1);
    });

    it('should search members for quick check-in suggestions', async () => {
      const res = await request(app)
        .get('/api/attendance/admin/members/search?q=Rahul')
        .set('Authorization', adminToken);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].name).toContain('Rahul');
      expect(res.body.data[0]).toHaveProperty('isCurrentlyInGym');
      expect(res.body.data[0]).toHaveProperty('hasActivePass');
    });
  });

  // ============================================================================
  // 6. Member Attendance History & Streak
  // ============================================================================
  describe('6. Member Personal Attendance History', () => {
    it('should return authenticated member personal attendance records, streak, and heatmap', async () => {
      const res = await request(app)
        .get('/api/attendance/my-history')
        .set('Authorization', memberRahulToken);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('records');
      expect(res.body.data).toHaveProperty('stats');
      expect(res.body.data.stats).toHaveProperty('totalVisits');
      expect(res.body.data.stats).toHaveProperty('visitsThisMonth');
      expect(res.body.data.stats).toHaveProperty('currentStreak');
      expect(res.body.data).toHaveProperty('heatmap');
      expect(Array.isArray(res.body.data.heatmap)).toBe(true);
    });
  });

  // ============================================================================
  // 7. Trainer Client Attendance Inspection
  // ============================================================================
  describe('7. Trainer Client Attendance Inspection', () => {
    it('should allow trainer to view assigned client attendance history', async () => {
      // Alex (User 2) is assigned to Rahul (User 5)
      const res = await request(app)
        .get('/api/attendance/clients/5')
        .set('Authorization', trainerAlexToken);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('records');
      expect(res.body.data).toHaveProperty('stats');
    });

    it('should reject trainer from viewing unassigned member attendance history with 403 Forbidden', async () => {
      // Alex (User 2) is NOT assigned to Vikram (User 9)
      const res = await request(app)
        .get('/api/attendance/clients/9')
        .set('Authorization', trainerAlexToken);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('not assigned to your coaching roster');
    });

    it('should allow trainer to get attendance overview of all assigned clients', async () => {
      const res = await request(app)
        .get('/api/attendance/trainer/overview')
        .set('Authorization', trainerAlexToken);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('clients');
      expect(res.body.data).toHaveProperty('metrics');
      expect(Array.isArray(res.body.data.clients)).toBe(true);
      expect(res.body.data.metrics).toHaveProperty('totalClients');
      expect(res.body.data.metrics).toHaveProperty('activeInGymNow');
    });
  });
});
