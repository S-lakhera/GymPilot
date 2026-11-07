import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { trainerController } from '../controllers/trainerController.js';
import { verifyToken, optionalAuth } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/roleMiddleware.js';
import { validateRequest } from '../middlewares/validateMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

/**
 * @openapi
 * /api/trainers:
 *   post:
 *     summary: Provision a new trainer account (Admin only)
 *     tags:
 *       - Trainers
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *               - phone
 *               - specialization
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               phone:
 *                 type: string
 *               specialization:
 *                 type: string
 *               experienceYears:
 *                 type: integer
 *               certification:
 *                 type: string
 *               bio:
 *                 type: string
 *               monthlySalary:
 *                 type: number
 *     responses:
 *       201:
 *         description: Trainer created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       409:
 *         description: Email already registered
 */
router.post(
  '/',
  verifyToken,
  requireRoles('admin'),
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').trim().isEmail().withMessage('A valid email address is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('specialization').trim().notEmpty().withMessage('Specialization is required'),
    body('experienceYears')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Experience years must be a non-negative integer'),
    body('certification').optional().trim(),
    body('bio').optional().trim(),
    body('monthlySalary')
      .optional({ nullable: true })
      .isFloat({ min: 0 })
      .withMessage('Monthly salary must be a positive number'),
    validateRequest,
  ],
  asyncHandler(trainerController.createTrainer)
);

/**
 * @openapi
 * /api/trainers:
 *   get:
 *     summary: List all trainers with pagination & search
 *     tags:
 *       - Trainers
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Paginated list of trainers
 */
router.get(
  '/',
  optionalAuth,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be an integer >= 1'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().trim(),
    query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    validateRequest,
  ],
  asyncHandler(trainerController.listTrainers)
);

/**
 * @openapi
 * /api/trainers/{id}:
 *   get:
 *     summary: Get trainer details by ID
 *     tags:
 *       - Trainers
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Trainer details
 *       404:
 *         description: Trainer not found
 */
router.get(
  '/:id',
  optionalAuth,
  [param('id').isInt({ min: 1 }).withMessage('Valid trainer ID is required'), validateRequest],
  asyncHandler(trainerController.getTrainerById)
);

/**
 * @openapi
 * /api/trainers/{id}:
 *   patch:
 *     summary: Update trainer profile (Admin or self)
 *     tags:
 *       - Trainers
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Trainer profile updated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Trainer not found
 */
router.patch(
  '/:id',
  verifyToken,
  requireRoles('admin', 'trainer'),
  [
    param('id').isInt({ min: 1 }).withMessage('Valid trainer ID is required'),
    body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
    body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty'),
    body('specialization').optional().trim().notEmpty().withMessage('Specialization cannot be empty'),
    body('experienceYears')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Experience years must be a non-negative integer'),
    body('certification').optional().trim(),
    body('bio').optional().trim(),
    body('monthlySalary')
      .optional({ nullable: true })
      .isFloat({ min: 0 })
      .withMessage('Monthly salary must be a positive number'),
    validateRequest,
  ],
  asyncHandler(trainerController.updateTrainer)
);

/**
 * @openapi
 * /api/trainers/{id}/status:
 *   patch:
 *     summary: Toggle trainer active status (Admin only)
 *     tags:
 *       - Trainers
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Trainer status updated
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Trainer not found
 */
router.patch(
  '/:id/status',
  verifyToken,
  requireRoles('admin'),
  [
    param('id').isInt({ min: 1 }).withMessage('Valid trainer ID is required'),
    body('isActive').isBoolean().withMessage('isActive must be a boolean value'),
    validateRequest,
  ],
  asyncHandler(trainerController.toggleTrainerStatus)
);

export default router;

