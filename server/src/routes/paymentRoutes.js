import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { paymentController } from '../controllers/paymentController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/roleMiddleware.js';
import { validateRequest } from '../middlewares/validateMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

/**
 * @openapi
 * /api/payments/confirm:
 *   post:
 *     summary: Confirm two-phase payment and promote pending subscription
 *     description: Idempotently verifies payment completion, transitions payment status from PENDING to COMPLETED, activates or queues the subscription, and applies promotional discount counters.
 *     tags:
 *       - Payments
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactionReference
 *             properties:
 *               transactionReference:
 *                 type: string
 *                 example: TXN-1762674938-ABC1234
 *               gatewayReference:
 *                 type: string
 *                 example: pay_test_998877
 *               simulatedStatus:
 *                 type: string
 *                 enum: [SUCCESS, FAILED]
 *                 default: SUCCESS
 *     responses:
 *       200:
 *         description: Payment confirmed or already completed
 *       400:
 *         description: Invalid state transition
 *       404:
 *         description: Payment record not found
 */
router.post(
  '/confirm',
  verifyToken,
  [
    body('transactionReference')
      .notEmpty()
      .withMessage('Transaction reference is required.')
      .isString()
      .trim(),
    body('gatewayReference')
      .optional({ checkFalsy: true })
      .isString()
      .trim(),
    body('simulatedStatus')
      .optional()
      .isIn(['SUCCESS', 'FAILED'])
      .withMessage('Simulated status must be SUCCESS or FAILED.'),
    validateRequest,
  ],
  asyncHandler(paymentController.confirmPayment)
);

/**
 * @openapi
 * /api/payments/webhook:
 *   post:
 *     summary: Inbound payment gateway webhook handler
 *     description: Asynchronously receives external gateway events (e.g. Razorpay, Stripe), verifies event data, and idempotently triggers payment confirmation.
 *     tags:
 *       - Payments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *               transactionReference:
 *                 type: string
 *               gatewayReference:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Webhook event processed successfully
 *       400:
 *         description: Invalid webhook payload
 */
router.post(
  '/webhook',
  asyncHandler(paymentController.handleWebhook)
);

/**
 * @openapi
 * /api/payments/my:
 *   get:
 *     summary: Get member own payment history and receipts
 *     tags:
 *       - Payments
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
 *     responses:
 *       200:
 *         description: Payment receipts retrieved successfully
 */
router.get(
  '/my',
  verifyToken,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer.'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100.'),
    validateRequest,
  ],
  asyncHandler(paymentController.getMyPayments)
);

/**
 * @openapi
 * /api/payments:
 *   get:
 *     summary: List payments audit log (Admin only)
 *     description: Comprehensive financial audit log with filters by user, payment status, method, and date ranges.
 *     tags:
 *       - Payments
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
 *         name: userId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [PENDING, COMPLETED, PARTIALLY_REFUNDED, REFUNDED, FAILED]
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *           enum: [CASH, CARD, UPI, NET_BANKING]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Financial audit list retrieved successfully
 *       403:
 *         description: Forbidden (Admin privileges required)
 */
router.get(
  '/',
  verifyToken,
  requireRoles('admin'),
  [
    query('page')
      .optional()
      .isInt({ min: 1 }),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }),
    query('userId')
      .optional()
      .isInt({ min: 1 }),
    query('paymentStatus')
      .optional()
      .isIn(['PENDING', 'COMPLETED', 'PARTIALLY_REFUNDED', 'REFUNDED', 'FAILED']),
    query('paymentMethod')
      .optional()
      .isIn(['CASH', 'CARD', 'UPI', 'NET_BANKING']),
    validateRequest,
  ],
  asyncHandler(paymentController.listPayments)
);

/**
 * @openapi
 * /api/payments/{id}:
 *   get:
 *     summary: Retrieve single payment receipt by ID
 *     description: Administrators can access any payment; members can access only their own receipts.
 *     tags:
 *       - Payments
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
 *         description: Payment receipt retrieved successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Payment not found
 */
router.get(
  '/:id',
  verifyToken,
  [
    param('id')
      .notEmpty()
      .isInt({ min: 1 })
      .withMessage('Payment ID must be a positive integer.'),
    validateRequest,
  ],
  asyncHandler(paymentController.getPaymentById)
);

export default router;

