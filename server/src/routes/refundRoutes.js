import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { refundController } from '../controllers/refundController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/roleMiddleware.js';
import { validateRequest } from '../middlewares/validateMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// All refund endpoints require active authentication
router.use(verifyToken);

/**
 * @openapi
 * /api/refunds:
 *   post:
 *     summary: Issue a payment refund (Admin only)
 *     description: Atomically processes a partial or full refund with row-level locking, enforces the refundable balance ceiling, updates the original payment status, and creates an immutable audit record.
 *     tags:
 *       - Refunds
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentId
 *               - amount
 *               - reason
 *             properties:
 *               paymentId:
 *                 type: integer
 *                 example: 10
 *               amount:
 *                 type: number
 *                 example: 300.00
 *               reason:
 *                 type: string
 *                 example: Member relocated to another city
 *               gatewayRefundReference:
 *                 type: string
 *                 example: rfnd_sim_776655
 *     responses:
 *       201:
 *         description: Refund successfully processed
 *       400:
 *         description: Refund amount exceeds remaining balance or invalid payment state
 *       403:
 *         description: Forbidden (Admin privileges required)
 *       404:
 *         description: Payment record not found
 */
router.post(
  '/',
  requireRoles('admin'),
  [
    body('paymentId')
      .notEmpty()
      .withMessage('Payment ID is required.')
      .isInt({ min: 1 })
      .withMessage('Payment ID must be a positive integer.'),
    body('amount')
      .notEmpty()
      .withMessage('Refund amount is required.')
      .isFloat({ min: 0.01 })
      .withMessage('Refund amount must be a positive number greater than 0.'),
    body('reason')
      .notEmpty()
      .withMessage('Refund reason is required.')
      .isString()
      .trim()
      .isLength({ min: 3 })
      .withMessage('Refund reason must be at least 3 characters long.'),
    body('gatewayRefundReference')
      .optional({ checkFalsy: true })
      .isString()
      .trim(),
    validateRequest,
  ],
  asyncHandler(refundController.processRefund)
);

/**
 * @openapi
 * /api/refunds:
 *   get:
 *     summary: List all refund audit records (Admin only)
 *     tags:
 *       - Refunds
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: paymentId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Refund records list retrieved successfully
 *       403:
 *         description: Forbidden (Admin privileges required)
 */
router.get(
  '/',
  requireRoles('admin'),
  [
    query('page')
      .optional()
      .isInt({ min: 1 }),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }),
    query('paymentId')
      .optional()
      .isInt({ min: 1 }),
    query('userId')
      .optional()
      .isInt({ min: 1 }),
    validateRequest,
  ],
  asyncHandler(refundController.listRefunds)
);

/**
 * @openapi
 * /api/refunds/payment/{paymentId}:
 *   get:
 *     summary: Get all refunds for a specific payment
 *     description: Administrators can view refunds for any payment; members can view only their own payment refunds.
 *     tags:
 *       - Refunds
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payment refunds retrieved successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Payment not found
 */
router.get(
  '/payment/:paymentId',
  [
    param('paymentId')
      .notEmpty()
      .isInt({ min: 1 })
      .withMessage('Payment ID must be a positive integer.'),
    validateRequest,
  ],
  asyncHandler(refundController.getRefundsByPaymentId)
);

/**
 * @openapi
 * /api/refunds/{id}:
 *   get:
 *     summary: Get single refund audit record by ID
 *     tags:
 *       - Refunds
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
 *         description: Refund details retrieved successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Refund record not found
 */
router.get(
  '/:id',
  [
    param('id')
      .notEmpty()
      .isInt({ min: 1 })
      .withMessage('Refund ID must be a positive integer.'),
    validateRequest,
  ],
  asyncHandler(refundController.getRefundById)
);

export default router;
