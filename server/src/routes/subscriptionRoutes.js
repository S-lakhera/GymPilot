import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { subscriptionController } from '../controllers/subscriptionController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/roleMiddleware.js';
import { validateRequest } from '../middlewares/validateMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// All subscription operations require active authentication
router.use(verifyToken);

/**
 * @openapi
 * /api/subscriptions/quote:
 *   post:
 *     summary: Calculate a real-time pricing quote preview
 *     description: Computes final price, applies verified promotional discounts, and previews payable amount without modifying database state.
 *     tags:
 *       - Subscriptions
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *             properties:
 *               planId:
 *                 type: integer
 *                 example: 1
 *               discountCode:
 *                 type: string
 *                 example: WELCOME10
 *     responses:
 *       200:
 *         description: Pricing quote preview generated successfully
 *       400:
 *         description: Validation error or plan unavailable
 *       404:
 *         description: Plan not found
 */
router.post(
  '/quote',
  [
    body('planId')
      .notEmpty()
      .withMessage('Plan ID is required.')
      .isInt({ min: 1 })
      .withMessage('Plan ID must be a positive integer.'),
    body('discountCode')
      .optional({ checkFalsy: true })
      .isString()
      .trim()
      .withMessage('Discount code must be a string.'),
    validateRequest,
  ],
  asyncHandler(subscriptionController.getQuote)
);

/**
 * @openapi
 * /api/subscriptions/checkout:
 *   post:
 *     summary: Initiate or process subscription checkout
 *     description: Serializes concurrent member checkouts using row-level locking, enforces category renewal queuing, validates discount coupons, and initializes two-phase payment.
 *     tags:
 *       - Subscriptions
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *               - paymentMethod
 *             properties:
 *               planId:
 *                 type: integer
 *                 example: 1
 *               paymentMethod:
 *                 type: string
 *                 enum: [CASH, CARD, UPI, NET_BANKING]
 *                 example: CARD
 *               discountCode:
 *                 type: string
 *                 example: WELCOME10
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: 2026-11-09
 *               memberId:
 *                 type: integer
 *                 description: Target member ID (Admin only)
 *                 example: 2
 *               gatewayReference:
 *                 type: string
 *                 description: External gateway payment intent or order reference
 *     responses:
 *       201:
 *         description: Subscription checkout initiated successfully
 *       400:
 *         description: Invalid input, plan inactive, or renewal queue limit exceeded
 *       403:
 *         description: Unauthorized payment method (e.g. CASH by non-admin)
 */
router.post(
  '/checkout',
  [
    body('planId')
      .notEmpty()
      .withMessage('Plan ID is required.')
      .isInt({ min: 1 })
      .withMessage('Plan ID must be a positive integer.'),
    body('paymentMethod')
      .notEmpty()
      .withMessage('Payment method is required.')
      .isIn(['CASH', 'CARD', 'UPI', 'NET_BANKING'])
      .withMessage('Payment method must be one of: CASH, CARD, UPI, NET_BANKING.'),
    body('discountCode')
      .optional({ checkFalsy: true })
      .isString()
      .trim()
      .withMessage('Discount code must be a string.'),
    body('startDate')
      .optional({ checkFalsy: true })
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('Start date must be formatted as YYYY-MM-DD.'),
    body('memberId')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 })
      .withMessage('Member ID must be a positive integer.'),
    body('gatewayReference')
      .optional({ checkFalsy: true })
      .isString()
      .trim()
      .withMessage('Gateway reference must be a string.'),
    validateRequest,
  ],
  asyncHandler(subscriptionController.checkout)
);

// RESTful POST alias
router.post(
  '/',
  [
    body('planId')
      .notEmpty()
      .withMessage('Plan ID is required.')
      .isInt({ min: 1 })
      .withMessage('Plan ID must be a positive integer.'),
    body('paymentMethod')
      .notEmpty()
      .withMessage('Payment method is required.')
      .isIn(['CASH', 'CARD', 'UPI', 'NET_BANKING'])
      .withMessage('Payment method must be one of: CASH, CARD, UPI, NET_BANKING.'),
    body('discountCode')
      .optional({ checkFalsy: true })
      .isString()
      .trim(),
    body('startDate')
      .optional({ checkFalsy: true })
      .matches(/^\d{4}-\d{2}-\d{2}$/),
    body('memberId')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 }),
    body('gatewayReference')
      .optional({ checkFalsy: true })
      .isString()
      .trim(),
    validateRequest,
  ],
  asyncHandler(subscriptionController.checkout)
);

/**
 * @openapi
 * /api/subscriptions:
 *   get:
 *     summary: List subscriptions
 *     description: Lists subscriptions with pagination. Administrators can view all members or filter by member/category; members view only their own subscriptions.
 *     tags:
 *       - Subscriptions
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending_payment, queued, active, expired, cancelled]
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *           description: Filter by member ID (Admin only)
 *     responses:
 *       200:
 *         description: Subscriptions list retrieved successfully
 */
router.get(
  '/',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer.'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100.'),
    query('userId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('User ID must be a positive integer.'),
    query('categoryId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Category ID must be a positive integer.'),
    query('status')
      .optional()
      .isIn(['pending_payment', 'queued', 'active', 'expired', 'cancelled'])
      .withMessage('Invalid subscription status filter.'),
    validateRequest,
  ],
  asyncHandler(subscriptionController.listSubscriptions)
);

/**
 * @openapi
 * /api/subscriptions/{id}:
 *   get:
 *     summary: Get subscription details by ID
 *     description: Retrieves detailed subscription and associated plan/discount data. Members can only inspect their own subscriptions.
 *     tags:
 *       - Subscriptions
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
 *         description: Subscription retrieved successfully
 *       403:
 *         description: Forbidden (attempting to view another member's subscription)
 *       404:
 *         description: Subscription not found
 */
router.get(
  '/:id',
  [
    param('id')
      .notEmpty()
      .isInt({ min: 1 })
      .withMessage('Subscription ID must be a positive integer.'),
    validateRequest,
  ],
  asyncHandler(subscriptionController.getSubscriptionById)
);

/**
 * @openapi
 * /api/subscriptions/sync-statuses:
 *   post:
 *     summary: System status synchronization maintenance job (Admin only)
 *     description: Automatically expires past memberships, promotes queued subscriptions whose start date has arrived, and purges stale pending checkouts.
 *     tags:
 *       - Subscriptions
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Statuses synchronized successfully
 *       403:
 *         description: Forbidden (Admin privileges required)
 */
router.post(
  '/sync-statuses',
  requireRoles('admin'),
  asyncHandler(subscriptionController.syncStatuses)
);

/**
 * @openapi
 * /api/subscriptions/{id}/cancel:
 *   patch:
 *     summary: Cancel a subscription with optional renewal governance and refund
 *     description: Transitions subscription status to cancelled, optionally promotes or cancels queued renewals in the category, and enables admin-managed partial or full refunds.
 *     tags:
 *       - Subscriptions
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refundAmount:
 *                 type: number
 *                 description: Amount to refund (Admin only)
 *               refundReason:
 *                 type: string
 *               promoteQueued:
 *                 type: boolean
 *                 description: Whether to immediately activate queued renewal
 *               cancelQueued:
 *                 type: boolean
 *                 description: Whether to cancel queued renewal as well
 *     responses:
 *       200:
 *         description: Subscription cancelled successfully
 *       400:
 *         description: Subscription already cancelled or expired
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Subscription not found
 */
router.patch(
  '/:id/cancel',
  [
    param('id')
      .notEmpty()
      .isInt({ min: 1 })
      .withMessage('Subscription ID must be a positive integer.'),
    body('refundAmount')
      .optional({ checkFalsy: true })
      .isFloat({ min: 0.01 })
      .withMessage('Refund amount must be a positive number.'),
    body('refundReason')
      .optional({ checkFalsy: true })
      .isString()
      .trim(),
    body('promoteQueued')
      .optional()
      .isBoolean(),
    body('cancelQueued')
      .optional()
      .isBoolean(),
    validateRequest,
  ],
  asyncHandler(subscriptionController.cancelSubscription)
);

export default router;
