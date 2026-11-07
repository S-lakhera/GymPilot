import { Router } from 'express';
import { body } from 'express-validator';
import { authController } from '../controllers/authController.js';
import { validateRequest } from '../middlewares/validateMiddleware.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Public member registration
 *     description: Registers a new member account, creates blank profile, and automatically logs in returning an access token and HttpOnly refresh cookie.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password]
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Vikram
 *               lastName:
 *                 type: string
 *                 example: Malhotra
 *               email:
 *                 type: string
 *                 format: email
 *                 example: vikram.m@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass@123
 *               phone:
 *                 type: string
 *                 example: '+91-9876543210'
 *     responses:
 *       201:
 *         description: Member registered and logged in successfully
 *       400:
 *         description: Validation failed
 *       409:
 *         description: Email already registered
 */
router.post(
  '/register',
  [
    body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ max: 60 }),
    body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ max: 60 }),
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('phone').optional({ checkFalsy: true }).trim().isLength({ max: 20 }),
  ],
  validateRequest,
  authController.register
);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticates user credentials and returns an access token in the body and sets an HttpOnly refresh token cookie.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@gympilot.com
 *               password:
 *                 type: string
 *                 example: Password@123
 *     responses:
 *       200:
 *         description: Successfully authenticated
 *       401:
 *         description: Invalid email or password
 *       403:
 *         description: Account is deactivated
 */
router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  authController.login
);

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Uses the HttpOnly refresh token cookie to issue a new access token and rotate the refresh token session in MySQL.
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: New access token issued
 *       401:
 *         description: Refresh token invalid, expired, or reuse detected
 */
router.post('/refresh', authController.refreshToken);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: User logout
 *     description: Revokes the active refresh token session in MySQL and clears the refresh cookie.
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Successfully logged out
 */
router.post('/logout', authController.logout);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     description: Retrieves profile details and role info for the currently authenticated user.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *       401:
 *         description: Unauthenticated
 */
router.get('/me', verifyToken, authController.getMe);

/**
 * @openapi
 * /api/auth/change-password:
 *   patch:
 *     summary: Change user password
 *     description: Validates current password, updates to new password, and invalidates all existing sessions across devices.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: Password@123
 *               newPassword:
 *                 type: string
 *                 example: NewSecretPass@2026
 *     responses:
 *       200:
 *         description: Password successfully changed
 *       401:
 *         description: Current password incorrect
 */
router.patch(
  '/change-password',
  verifyToken,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
  ],
  validateRequest,
  authController.changePassword
);

export default router;

