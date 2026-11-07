import request from 'supertest';
import app from '../src/app.js';
import { pool } from '../src/config/db.js';

describe('Authentication Module (Milestone 4.1)', () => {
  const testUser = {
    firstName: 'Arjun',
    lastName: 'Kapoor',
    email: 'arjun.test@gympilot.com',
    password: 'Password@123',
    phone: '+91-9988776655',
  };

  let memberAccessToken;
  let memberRefreshTokenCookie;

  afterAll(async () => {
    // Clean up created test user
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [testUser.email]);
    if (rows.length > 0) {
      await pool.query('DELETE FROM users WHERE id = ?', [rows[0].id]);
    }
  });

  describe('1. POST /api/auth/register', () => {
    it('should return 400 VALIDATION_ERROR on malformed registration payload', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ firstName: '', email: 'not-an-email', password: '123' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.errors.length).toBeGreaterThanOrEqual(3);
    });

    it('should successfully register a new member, create member_profiles atomically, and auto-login', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user.role).toBe('member');
      expect(res.body.data.user).not.toHaveProperty('password_hash');
      expect(res.body.data).toHaveProperty('accessToken');

      // Verify HttpOnly cookie was set
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.startsWith('refreshToken='))).toBe(true);
      expect(cookies.some((c) => c.includes('HttpOnly'))).toBe(true);

      memberAccessToken = res.body.data.accessToken;
      memberRefreshTokenCookie = cookies.find((c) => c.startsWith('refreshToken=')).split(';')[0];

      // Verify in MySQL that 1:1 member_profiles was created
      const [profileRows] = await pool.query(
        'SELECT * FROM member_profiles WHERE user_id = ?',
        [res.body.data.user.id]
      );
      expect(profileRows.length).toBe(1);
    });

    it('should return 409 EMAIL_EXISTS when registering with an existing email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('EMAIL_EXISTS');
    });
  });

  describe('2. POST /api/auth/login', () => {
    it('should return 401 INVALID_CREDENTIALS for wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'WrongPassword@999' });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 INVALID_CREDENTIALS for non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ghost.user@gympilot.com', password: 'Password@123' });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 403 ACCOUNT_DEACTIVATED when logging into a deactivated account', async () => {
      // karan.mehta@gmail.com is seeded with is_active = FALSE
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'karan.mehta@gmail.com', password: 'Password@123' });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('ACCOUNT_DEACTIVATED');
    });

    it('should successfully authenticate seeded Admin user and set refresh cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@gympilot.com', password: 'Password@123' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.role).toBe('admin');
      expect(res.body.data).toHaveProperty('accessToken');

      const cookies = res.headers['set-cookie'];
      expect(cookies.some((c) => c.startsWith('refreshToken='))).toBe(true);
    });
  });

  describe('3. POST /api/auth/refresh (Rotation & Reuse Detection)', () => {
    let initialRefreshTokenCookie;
    let rotatedRefreshTokenCookie;

    beforeAll(async () => {
      // Log in as test user to get a fresh refresh token
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      const cookies = res.headers['set-cookie'];
      initialRefreshTokenCookie = cookies.find((c) => c.startsWith('refreshToken=')).split(';')[0];
    });

    it('should return 401 NO_REFRESH_TOKEN if refresh cookie is missing', async () => {
      const res = await request(app).post('/api/auth/refresh');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('NO_REFRESH_TOKEN');
    });

    it('should rotate token, return new access token and set new cookie', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [initialRefreshTokenCookie]);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('accessToken');

      const cookies = res.headers['set-cookie'];
      expect(cookies.some((c) => c.startsWith('refreshToken='))).toBe(true);
      rotatedRefreshTokenCookie = cookies.find((c) => c.startsWith('refreshToken=')).split(';')[0];
      expect(rotatedRefreshTokenCookie).not.toBe(initialRefreshTokenCookie);
    });

    it('REUSE DETECTION: presenting the previous (now revoked) token should invalidate all sessions', async () => {
      // Re-using the initial token that was already rotated
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [initialRefreshTokenCookie]);

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('TOKEN_REUSE_DETECTED');

      // Verify in MySQL that all sessions for this user were revoked
      const [userRows] = await pool.query('SELECT id FROM users WHERE email = ?', [testUser.email]);
      const [sessionRows] = await pool.query(
        'SELECT * FROM refresh_tokens WHERE user_id = ? AND revoked_at IS NULL',
        [userRows[0].id]
      );
      expect(sessionRows.length).toBe(0);
    });
  });

  describe('4. GET /api/auth/me & POST /api/auth/logout', () => {
    let activeToken;
    let activeCookie;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      activeToken = res.body.data.accessToken;
      activeCookie = res.headers['set-cookie'].find((c) => c.startsWith('refreshToken=')).split(';')[0];
    });

    it('GET /api/auth/me should return current user and profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${activeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data).toHaveProperty('profile');
      expect(res.body.data).toHaveProperty('isProfileComplete', false); // newly created profile has null fields
    });

    it('POST /api/auth/logout should revoke session in MySQL and clear cookie', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [activeCookie]);

      expect(res.status).toBe(200);

      // Verify cookie cleared
      const cookies = res.headers['set-cookie'];
      expect(cookies.some((c) => c.startsWith('refreshToken=;'))).toBe(true);
    });
  });

  describe('5. PATCH /api/auth/change-password', () => {
    let authHeader;
    const newPassword = 'NewSecretPassword@2026';

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      authHeader = `Bearer ${res.body.data.accessToken}`;
    });

    it('should return 401 INVALID_CURRENT_PASSWORD if current password does not match', async () => {
      const res = await request(app)
        .patch('/api/auth/change-password')
        .set('Authorization', authHeader)
        .send({ currentPassword: 'IncorrectPassword', newPassword });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_CURRENT_PASSWORD');
    });

    it('should successfully update password and allow login with new password', async () => {
      const res = await request(app)
        .patch('/api/auth/change-password')
        .set('Authorization', authHeader)
        .send({ currentPassword: testUser.password, newPassword });

      expect(res.status).toBe(200);

      // Login with old password should fail
      const failedLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });
      expect(failedLogin.status).toBe(401);

      // Login with new password should succeed
      const successfulLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: newPassword });
      expect(successfulLogin.status).toBe(200);
      expect(successfulLogin.body.data.user.email).toBe(testUser.email);
    });
  });
});

