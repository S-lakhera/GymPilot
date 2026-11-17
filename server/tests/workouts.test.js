import request from 'supertest';
import app from '../src/app.js';
import { generateAccessToken } from '../src/utils/jwt.js';
import { pool } from '../src/config/db.js';

describe('Workout Plan Management Module (Milestone 6.3)', () => {
  let adminToken;
  let trainerAlexToken;
  let trainerSarahToken;
  let memberRahulToken;
  let memberVikramToken;

  let benchPressId;
  let deadliftId;
  let squatId;
  let createdPlanId;

  beforeAll(async () => {
    adminToken = `Bearer ${generateAccessToken({ id: 1, email: 'admin@gympilot.com', role: 'admin' })}`;
    trainerAlexToken = `Bearer ${generateAccessToken({ id: 2, email: 'trainer.alex@gympilot.com', role: 'trainer' })}`;
    trainerSarahToken = `Bearer ${generateAccessToken({ id: 3, email: 'trainer.sarah@gympilot.com', role: 'trainer' })}`;
    memberRahulToken = `Bearer ${generateAccessToken({ id: 5, email: 'rahul.sharma@gmail.com', role: 'member' })}`;
    memberVikramToken = `Bearer ${generateAccessToken({ id: 9, email: 'vikram.singh@gmail.com', role: 'member' })}`;

    // Query standard exercise IDs for tests
    const [bench] = await pool.query("SELECT id FROM exercises WHERE name = 'Barbell Bench Press' LIMIT 1");
    const [dead] = await pool.query("SELECT id FROM exercises WHERE name = 'Deadlift' LIMIT 1");
    const [sq] = await pool.query("SELECT id FROM exercises WHERE name = 'Barbell Back Squat' LIMIT 1");

    benchPressId = bench[0]?.id;
    deadliftId = dead[0]?.id;
    squatId = sq[0]?.id;

    // Clean up test workout plans
    await pool.query("DELETE FROM workout_plans WHERE notes LIKE '%TEST_PLAN%'");
  });

  afterAll(async () => {
    // Clean up test workout plans & custom exercises
    await pool.query("DELETE FROM workout_plans WHERE notes LIKE '%TEST_PLAN%'");
    await pool.query("DELETE FROM exercises WHERE name LIKE '%TEST_EXERCISE%'");
  });

  // ============================================================================
  // 1. Security & Role Guards
  // ============================================================================
  describe('1. Security & Role Guards', () => {
    it('should return 401 Unauthorized when accessing /api/workouts without token', async () => {
      const res = await request(app).get('/api/workouts/my-plan');
      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
    });

    it('should return 403 Forbidden when member attempts to create a workout plan', async () => {
      const res = await request(app)
        .post('/api/workouts')
        .set('Authorization', memberRahulToken)
        .send({
          memberId: 5,
          title: 'TEST_PLAN: Unauthorized Member Plan',
          days: [{ dayName: 'Day 1', exercises: [{ customName: 'Curls', sets: 3, reps: '10' }] }],
        });

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('error');
    });

    it('should return 403 Forbidden when trainer attempts to access member-only /api/workouts/my-plan', async () => {
      const res = await request(app)
        .get('/api/workouts/my-plan')
        .set('Authorization', trainerAlexToken);

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('error');
    });

    it('should return 403 Forbidden when trainer attempts to create a plan for an athlete NOT assigned to them', async () => {
      // Member 9 (Vikram) is not assigned to Trainer Alex (Trainer 2)
      const res = await request(app)
        .post('/api/workouts')
        .set('Authorization', trainerAlexToken)
        .send({
          memberId: 9,
          title: 'TEST_PLAN: Unassigned Athlete Plan',
          days: [
            {
              dayName: 'Day 1',
              exercises: [{ exerciseId: benchPressId, sets: 3, reps: '10' }],
            },
          ],
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('only create workout plans for athletes currently assigned to you');
    });
  });

  // ============================================================================
  // 2. Exercise Catalog Discovery & Custom Exercise Creation
  // ============================================================================
  describe('2. Exercise Catalog Discovery & Custom Creation', () => {
    it('should return standard exercises catalog', async () => {
      const res = await request(app)
        .get('/api/workouts/exercises')
        .set('Authorization', trainerAlexToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(28);
    });

    it('should filter exercises by muscleGroup', async () => {
      const res = await request(app)
        .get('/api/workouts/exercises?muscleGroup=chest')
        .set('Authorization', trainerAlexToken);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      res.body.data.forEach((ex) => {
        expect(ex.muscleGroup).toBe('chest');
      });
    });

    it('should search exercises by name query', async () => {
      const res = await request(app)
        .get('/api/workouts/exercises?search=Press')
        .set('Authorization', memberRahulToken);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.some((ex) => ex.name.includes('Press'))).toBe(true);
    });

    it('should allow trainer to create a custom exercise', async () => {
      const res = await request(app)
        .post('/api/workouts/exercises')
        .set('Authorization', trainerAlexToken)
        .send({
          name: 'TEST_EXERCISE: Deficit Romanian Deadlift',
          muscleGroup: 'legs',
          equipment: 'Barbell & Platform',
          category: 'Posterior Chain',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.name).toBe('TEST_EXERCISE: Deficit Romanian Deadlift');
      expect(res.body.data.isCustom).toBe(1);
      expect(res.body.data.createdByTrainerId).toBe(2);
    });

    it('should reject custom exercise creation with invalid muscleGroup', async () => {
      const res = await request(app)
        .post('/api/workouts/exercises')
        .set('Authorization', trainerAlexToken)
        .send({
          name: 'TEST_EXERCISE: Invalid Muscle',
          muscleGroup: 'eyeballs',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid muscle group');
    });
  });

  // ============================================================================
  // 3. Workout Plan Creation & Input Validation
  // ============================================================================
  describe('3. Workout Plan Creation & Input Validation', () => {
    it('should reject plan creation with missing title or days', async () => {
      const res = await request(app)
        .post('/api/workouts')
        .set('Authorization', trainerAlexToken)
        .send({
          memberId: 5,
          title: 'Hi', // too short
          days: [],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('at least 3 characters');
    });

    it('should reject plan creation with day having no exercises', async () => {
      const res = await request(app)
        .post('/api/workouts')
        .set('Authorization', trainerAlexToken)
        .send({
          memberId: 5,
          title: 'TEST_PLAN: Incomplete Plan',
          days: [{ dayName: 'Day 1 Empty', exercises: [] }],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('must contain at least 1 exercise');
    });

    it('should successfully create and assign a multi-day workout plan to an assigned athlete', async () => {
      const res = await request(app)
        .post('/api/workouts')
        .set('Authorization', trainerAlexToken)
        .send({
          memberId: 5, // Rahul Sharma
          title: 'TEST_PLAN: 2-Day Power Upper/Lower Split',
          goal: 'Strength & Hypertrophy',
          difficulty: 'intermediate',
          notes: 'TEST_PLAN: Focus on explosive concentric power and controlled 3s eccentric.',
          days: [
            {
              dayNumber: 1,
              dayName: 'Day 1 - Heavy Upper Body',
              warmupNotes: 'Band pull aparts + arm circles',
              exercises: [
                {
                  exerciseId: benchPressId,
                  sets: 4,
                  reps: '6-8',
                  restSeconds: 120,
                  notes: 'RPE 8-9 on final set',
                },
                {
                  exerciseId: deadliftId,
                  sets: 3,
                  reps: '5',
                  restSeconds: 150,
                  notes: 'Reset breath between reps',
                },
              ],
            },
            {
              dayNumber: 2,
              dayName: 'Day 2 - Lower & Core',
              warmupNotes: 'Hip 90/90 flow',
              exercises: [
                {
                  exerciseId: squatId,
                  sets: 4,
                  reps: '8-10',
                  restSeconds: 90,
                  notes: 'Deep squat with vertical torso',
                },
                {
                  customName: 'Hanging Windshield Wipers',
                  sets: 3,
                  reps: '12',
                  restSeconds: 60,
                  notes: 'Slow rotational core control',
                },
              ],
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id).toBeTruthy();
      expect(res.body.data.title).toBe('TEST_PLAN: 2-Day Power Upper/Lower Split');
      expect(res.body.data.memberId).toBe(5);
      expect(res.body.data.trainerId).toBe(2);
      expect(res.body.data.isActive).toBe(1);
      expect(res.body.data.days.length).toBe(2);
      expect(res.body.data.days[0].exercises.length).toBe(2);
      expect(res.body.data.days[1].exercises.length).toBe(2);

      createdPlanId = res.body.data.id;
    });
  });

  // ============================================================================
  // 4. Single Active Plan Exclusivity & Archiving
  // ============================================================================
  describe('4. Single Active Plan Exclusivity & Archiving', () => {
    it('should archive previous plan when a new active plan is assigned to the member', async () => {
      // Create a second active plan for Member 5
      const res = await request(app)
        .post('/api/workouts')
        .set('Authorization', trainerAlexToken)
        .send({
          memberId: 5,
          title: 'TEST_PLAN: Replacement Phase 2 Split',
          goal: 'Conditioning',
          difficulty: 'advanced',
          notes: 'TEST_PLAN: New active routine superseding old plan.',
          days: [
            {
              dayName: 'Day 1 - Full Body Circuit',
              exercises: [{ exerciseId: benchPressId, sets: 5, reps: '10', restSeconds: 45 }],
            },
          ],
        });

      expect(res.status).toBe(201);
      const newPlanId = res.body.data.id;

      // Verify that createdPlanId was archived (is_active = FALSE)
      const [oldPlanRows] = await pool.query('SELECT is_active FROM workout_plans WHERE id = ?', [createdPlanId]);
      expect(oldPlanRows[0].is_active).toBe(0);

      // Verify newPlanId is active (is_active = TRUE)
      const [newPlanRows] = await pool.query('SELECT is_active FROM workout_plans WHERE id = ?', [newPlanId]);
      expect(newPlanRows[0].is_active).toBe(1);

      // Clean up second plan and restore createdPlanId to active for subsequent tests
      await pool.query('DELETE FROM workout_plans WHERE id = ?', [newPlanId]);
      await pool.query('UPDATE workout_plans SET is_active = TRUE WHERE id = ?', [createdPlanId]);
    });
  });

  // ============================================================================
  // 5. Plan Retrieval by Member & Trainer
  // ============================================================================
  describe('5. Plan Retrieval by Member & Trainer', () => {
    it('should allow member to retrieve their active workout plan with all days and exercises', async () => {
      const res = await request(app)
        .get('/api/workouts/my-plan')
        .set('Authorization', memberRahulToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id).toBe(createdPlanId);
      expect(res.body.data.days.length).toBe(2);
      expect(res.body.data.trainerName).toContain('Alex');
    });

    it('should return null when member has no active workout plan assigned', async () => {
      const res = await request(app)
        .get('/api/workouts/my-plan')
        .set('Authorization', memberVikramToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toBeFalsy();
    });

    it('should allow trainer to retrieve all plans authored by them', async () => {
      const res = await request(app)
        .get('/api/workouts/trainer/plans')
        .set('Authorization', trainerAlexToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((p) => p.id === createdPlanId)).toBe(true);
    });

    it('should allow trainer to view specific assigned client plan', async () => {
      const res = await request(app)
        .get('/api/workouts/client/5')
        .set('Authorization', trainerAlexToken);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createdPlanId);
    });

    it('should reject trainer from viewing unassigned client plan with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/workouts/client/9')
        .set('Authorization', trainerAlexToken);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('not authorized to view this member’s workout plan');
    });
  });

  // ============================================================================
  // 6. Plan Updates & Deletion
  // ============================================================================
  describe('6. Plan Updates & Deletions', () => {
    it('should allow authoring trainer to update plan title, difficulty, and notes', async () => {
      const res = await request(app)
        .put(`/api/workouts/${createdPlanId}`)
        .set('Authorization', trainerAlexToken)
        .send({
          title: 'TEST_PLAN: Updated Power Routine',
          difficulty: 'advanced',
          notes: 'TEST_PLAN: Updated tempo and rest periods.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('TEST_PLAN: Updated Power Routine');
      expect(res.body.data.difficulty).toBe('advanced');
      expect(res.body.data.notes).toBe('TEST_PLAN: Updated tempo and rest periods.');
    });

    it('should reject update attempt from another trainer with 403 Forbidden', async () => {
      const res = await request(app)
        .put(`/api/workouts/${createdPlanId}`)
        .set('Authorization', trainerSarahToken)
        .send({
          title: 'TEST_PLAN: Unauthorized Trainer Edit',
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('not have permission to modify this workout plan');
    });

    it('should allow authoring trainer to delete the workout plan', async () => {
      const res = await request(app)
        .delete(`/api/workouts/${createdPlanId}`)
        .set('Authorization', trainerAlexToken);

      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);

      // Verify cascading deletion from database
      const [pRows] = await pool.query('SELECT id FROM workout_plans WHERE id = ?', [createdPlanId]);
      expect(pRows.length).toBe(0);

      const [dRows] = await pool.query('SELECT id FROM workout_plan_days WHERE plan_id = ?', [createdPlanId]);
      expect(dRows.length).toBe(0);
    });
  });
});
