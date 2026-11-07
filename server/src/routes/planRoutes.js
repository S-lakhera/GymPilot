import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { planController } from '../controllers/planController.js';
import { verifyToken, optionalAuth } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/roleMiddleware.js';
import { validateRequest } from '../middlewares/validateMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

/**
 * @openapi
 * /api/plans:
 *   post:
 *     summary: Create a membership plan (Admin only)
 *     tags:
 *       - Membership Plans
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryId
 *               - name
 *               - durationDays
 *               - price
 *             properties:
 *               categoryId:
 *                 type: integer
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               durationDays:
 *                 type: integer
 *               price:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Membership plan created successfully
 *       400:
 *         description: Validation error or inactive category
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Category not found
 */
router.post(
  '/',
  verifyToken,
  requireRoles('admin'),
  [
    body('categoryId').isInt({ min: 1 }).withMessage('Valid categoryId is required'),
    body('name').trim().notEmpty().withMessage('Plan name is required'),
    body('description').optional().trim(),
    body('durationDays').isInt({ min: 1 }).withMessage('Duration days must be at least 1'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    validateRequest,
  ],
  asyncHandler(planController.createPlan)
);

/**
 * @openapi
 * /api/plans:
 *   get:
 *     summary: List all membership plans
 *     tags:
 *       - Membership Plans
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of membership plans
 */
router.get(
  '/',
  optionalAuth,
  [
    query('categoryId').optional().isInt({ min: 1 }).withMessage('categoryId must be an integer >= 1'),
    query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    query('search').optional().trim(),
    query('minPrice').optional().isFloat({ min: 0 }).withMessage('minPrice must be non-negative'),
    query('maxPrice').optional().isFloat({ min: 0 }).withMessage('maxPrice must be non-negative'),
    validateRequest,
  ],
  asyncHandler(planController.listPlans)
);

/**
 * @openapi
 * /api/plans/{id}:
 *   get:
 *     summary: Get membership plan by ID
 *     tags:
 *       - Membership Plans
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Plan details
 *       404:
 *         description: Plan not found
 */
router.get(
  '/:id',
  optionalAuth,
  [param('id').isInt({ min: 1 }).withMessage('Valid plan ID is required'), validateRequest],
  asyncHandler(planController.getPlanById)
);

/**
 * @openapi
 * /api/plans/{id}:
 *   patch:
 *     summary: Update membership plan (Admin only)
 *     tags:
 *       - Membership Plans
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
 *             properties:
 *               categoryId:
 *                 type: integer
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               durationDays:
 *                 type: integer
 *               price:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Plan updated successfully
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Plan or category not found
 */
router.patch(
  '/:id',
  verifyToken,
  requireRoles('admin'),
  [
    param('id').isInt({ min: 1 }).withMessage('Valid plan ID is required'),
    body('categoryId').optional().isInt({ min: 1 }).withMessage('Valid categoryId is required'),
    body('name').optional().trim().notEmpty().withMessage('Plan name cannot be empty'),
    body('description').optional().trim(),
    body('durationDays').optional().isInt({ min: 1 }).withMessage('Duration days must be at least 1'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
    validateRequest,
  ],
  asyncHandler(planController.updatePlan)
);

/**
 * @openapi
 * /api/plans/{id}/status:
 *   patch:
 *     summary: Toggle plan active status (Admin only)
 *     tags:
 *       - Membership Plans
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
 *         description: Plan status updated
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Plan not found
 */
router.patch(
  '/:id/status',
  verifyToken,
  requireRoles('admin'),
  [
    param('id').isInt({ min: 1 }).withMessage('Valid plan ID is required'),
    body('isActive').isBoolean().withMessage('isActive must be a boolean value'),
    validateRequest,
  ],
  asyncHandler(planController.togglePlanStatus)
);

export default router;

