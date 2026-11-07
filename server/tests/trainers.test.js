import request from 'supertest';
import app from '../src/app.js';
import { generateAccessToken } from '../src/utils/jwt.js';
import { pool } from '../src/config/db.js';

describe('Trainers Module (Milestone 4.2)', () => {
  let adminToken;
  let trainerToken;
  let memberToken;
  let createdTrainerId;

  beforeAll(async () => {
    adminToken = `Bearer ${generateAccessToken({ id: 1, email: 'admin@gympilot.com', role: 'admin' })}`;
    // Trainer 3 is Sarah Khan (seeded trainer)
    trainerToken = `Bearer ${generateAccessToken({ id: 3, email: 'trainer.sarah@gympilot.com', role: 'trainer' })}`;
    // Member 5 is Rahul Sharma (seeded member)
    memberToken = `Bearer ${generateAccessToken({ id: 5, email: 'rahul.sharma@gmail.com', role: 'member' })}`;

    // Clean up test trainer if lingering from previous run
    await pool.query('DELETE FROM users WHERE email = ?', ['dev.rathore@gympilot.com']);
    // Ensure seeded Sarah salary is clean
    await pool.query('UPDATE trainer_profiles SET monthly_salary = 38000 WHERE user_id = 3');
  });

  afterAll(async () => {
    // Reset seeded trainer salary
    await pool.query('UPDATE trainer_profiles SET monthly_salary = 38000 WHERE user_id = 3');
    // Clean up created test trainer
    if (createdTrainerId) {
      await pool.query('DELETE FROM users WHERE id = ?', [createdTrainerId]);
    }
  });

  describe('1. Provision Trainer Account (POST /api/trainers)', () => {
    it('should return 401 Unauthorized without auth header', async () => {
      const res = await request(app).post('/api/trainers').send({});
      expect(res.status).toBe(401);
    });

    it('should return 403 Forbidden when member attempts to provision a trainer', async () => {
      const res = await request(app)
        .post('/api/trainers')
        .set('Authorization', memberToken)
        .send({
          firstName: 'Rohan',
          lastName: 'Kapoor',
          email: 'rohan.kapoor@gympilot.com',
          password: 'Password@123',
          phone: '+91-9877788888',
          specialization: 'CrossFit & Conditioning',
        });

      expect(res.status).toBe(403);
    });

    it('should return 400 VALIDATION_ERROR on missing required fields', async () => {
      const res = await request(app)
        .post('/api/trainers')
        .set('Authorization', adminToken)
        .send({
          firstName: 'Rohan',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should successfully provision a trainer atomically by Admin', async () => {
      const payload = {
        firstName: 'Dev',
        lastName: 'Rathore',
        email: 'dev.rathore@gympilot.com',
        password: 'Password@123',
        phone: '+91-9811199999',
        specialization: 'Calisthenics & Mobility',
        experienceYears: 4,
        certification: 'ACE Certified Personal Trainer',
        bio: 'Calisthenics athlete and functional mobility coach.',
        monthlySalary: 38000,
      };

      const res = await request(app)
        .post('/api/trainers')
        .set('Authorization', adminToken)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.trainer).toHaveProperty('id');
      expect(res.body.data.trainer.role).toBe('trainer');
      expect(res.body.data.trainer.email).toBe('dev.rathore@gympilot.com');
      expect(res.body.data.trainer.profile.specialization).toBe('Calisthenics & Mobility');
      expect(res.body.data.trainer.profile.monthlySalary).toBe(38000);

      createdTrainerId = res.body.data.trainer.id;
    });

    it('should return 409 EMAIL_EXISTS when creating trainer with already registered email', async () => {
      const res = await request(app)
        .post('/api/trainers')
        .set('Authorization', adminToken)
        .send({
          firstName: 'Duplicate',
          lastName: 'Trainer',
          email: 'dev.rathore@gympilot.com',
          password: 'Password@123',
          phone: '+91-9800011111',
          specialization: 'Cardio',
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('EMAIL_EXISTS');
    });
  });

  describe('2. List Trainers (GET /api/trainers)', () => {
    it('public / member should view active trainers with monthlySalary hidden', async () => {
      const res = await request(app)
        .get('/api/trainers')
        .set('Authorization', memberToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);

      // Verify monthlySalary is scrubbed for non-admin
      for (const trainer of res.body.data) {
        expect(trainer.profile).not.toHaveProperty('monthlySalary');
      }
    });

    it('Admin should view trainers with monthlySalary visible', async () => {
      const res = await request(app)
        .get('/api/trainers')
        .set('Authorization', adminToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');

      // Verify Sarah Khan (id 3) has monthlySalary present
      const seededSarah = res.body.data.find((t) => t.id === 3);
      expect(seededSarah).toBeDefined();
      expect(seededSarah.profile.monthlySalary).toBe(38000);
    });

    it('should filter trainers by search keyword', async () => {
      const res = await request(app).get('/api/trainers?search=Sarah');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].firstName).toBe('Sarah');
    });
  });

  describe('3. Trainer Detail (GET /api/trainers/:id)', () => {
    it('should return 404 for non-existent trainer ID', async () => {
      const res = await request(app).get('/api/trainers/999999');
      expect(res.status).toBe(404);
      expect(res.body.code).toBe('TRAINER_NOT_FOUND');
    });

    it('Member should view trainer details without monthlySalary', async () => {
      const res = await request(app)
        .get('/api/trainers/3')
        .set('Authorization', memberToken);

      expect(res.status).toBe(200);
      expect(res.body.data.trainer.id).toBe(3);
      expect(res.body.data.trainer.profile.specialization).toBe('Hatha & Vinyasa Yoga');
      expect(res.body.data.trainer.profile).not.toHaveProperty('monthlySalary');
    });

    it('Trainer should view own profile with monthlySalary visible', async () => {
      const res = await request(app)
        .get('/api/trainers/3')
        .set('Authorization', trainerToken);

      expect(res.status).toBe(200);
      expect(res.body.data.trainer.id).toBe(3);
      expect(res.body.data.trainer.profile.monthlySalary).toBe(38000);
    });

    it('Admin should view trainer profile with monthlySalary visible', async () => {
      const res = await request(app)
        .get('/api/trainers/3')
        .set('Authorization', adminToken);

      expect(res.status).toBe(200);
      expect(res.body.data.trainer.profile.monthlySalary).toBe(38000);
    });
  });

  describe('4. Update Trainer (PATCH /api/trainers/:id)', () => {
    it('Trainer should successfully update their own bio and experience', async () => {
      const res = await request(app)
        .patch('/api/trainers/3')
        .set('Authorization', trainerToken)
        .send({
          bio: 'Updated bio: Experienced Hatha & Vinyasa Yoga Alliance master instructor.',
          experienceYears: 6,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.trainer.profile.bio).toBe('Updated bio: Experienced Hatha & Vinyasa Yoga Alliance master instructor.');
      expect(res.body.data.trainer.profile.experienceYears).toBe(6);
    });

    it('Trainer attempting to modify their own salary should receive 403 Forbidden', async () => {
      const res = await request(app)
        .patch('/api/trainers/3')
        .set('Authorization', trainerToken)
        .send({
          monthlySalary: 75000,
        });

      expect(res.status).toBe(403);
    });

    it('Admin can update trainer salary and profile details', async () => {
      const res = await request(app)
        .patch('/api/trainers/3')
        .set('Authorization', adminToken)
        .send({
          monthlySalary: 42000,
          phone: '+91-9876543219',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.trainer.profile.monthlySalary).toBe(42000);
      expect(res.body.data.trainer.phone).toBe('+91-9876543219');
    });
  });

  describe('5. Toggle Trainer Status (PATCH /api/trainers/:id/status)', () => {
    it('Admin should deactivate trainer account', async () => {
      const res = await request(app)
        .patch(`/api/trainers/${createdTrainerId}/status`)
        .set('Authorization', adminToken)
        .send({ isActive: false });

      expect(res.status).toBe(200);
      expect(res.body.data.trainer.isActive).toBe(false);
    });

    it('Deactivated trainer should not appear in public active trainer roster', async () => {
      const res = await request(app).get('/api/trainers');
      const found = res.body.data.find((t) => t.id === createdTrainerId);
      expect(found).toBeUndefined();
    });

    it('Admin should reactivate trainer account', async () => {
      const res = await request(app)
        .patch(`/api/trainers/${createdTrainerId}/status`)
        .set('Authorization', adminToken)
        .send({ isActive: true });

      expect(res.status).toBe(200);
      expect(res.body.data.trainer.isActive).toBe(true);
    });
  });
});
