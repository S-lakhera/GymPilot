import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { trainerAssignmentController } from '../controllers/trainerAssignmentController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/roleMiddleware.js';
import { validateRequest } from '../middlewares/validateMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// All coaching endpoints require authentication
router.use(verifyToken);

// ==============================================================================
// 1. Shared Routes
// ==============================================================================

/**
 * @openapi
 * /api/coaching/trainers:
 *   get:
 *     summary: List all active trainers with capacity metrics
 *     tags:
 *       - Coaching
 *     security:
 *       - BearerAuth: []
 */
router.get(
  '/trainers',
  requireRoles(['admin', 'trainer', 'member']),
  asyncHandler(trainerAssignmentController.getTrainersWithCapacity)
);

// ==============================================================================
// 2. Member Coaching Routes
// ==============================================================================

/**
 * @openapi
 * /api/coaching/status:
 *   get:
 *     summary: Get member coaching status, active assignment, and pending requests
 *     tags:
 *       - Coaching
 *     security:
 *       - BearerAuth: []
 */
router.get(
  '/status',
  requireRoles(['member']),
  asyncHandler(trainerAssignmentController.getMemberStatus)
);

/**
 * @openapi
 * /api/coaching/requests:
 *   post:
 *     summary: Member submits a new coach assignment request
 *     tags:
 *       - Coaching
 *     security:
 *       - BearerAuth: []
 */
router.post(
  '/requests',
  requireRoles(['member']),
  [
    body('trainerId')
      .notEmpty()
      .withMessage('Trainer ID is required.')
      .isInt({ min: 1 })
      .withMessage('Trainer ID must be a valid positive integer.'),
    body('notes')
      .optional({ checkFalsy: true })
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters.'),
    validateRequest,
  ],
  asyncHandler(trainerAssignmentController.requestTrainer)
);

/**
 * @openapi
 * /api/coaching/requests/{id}:
 *   delete:
 *     summary: Member cancels their own pending coach request
 *     tags:
 *       - Coaching
 *     security:
 *       - BearerAuth: []
 */
router.delete(
  '/requests/:id',
  requireRoles(['member']),
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Request ID must be a valid positive integer.'),
    validateRequest,
  ],
  asyncHandler(trainerAssignmentController.cancelRequest)
);

// ==============================================================================
// 3. Trainer Coaching Routes
// ==============================================================================

/**
 * @openapi
 * /api/coaching/roster:
 *   get:
 *     summary: Trainer views their assigned client roster
 *     tags:
 *       - Coaching
 *     security:
 *       - BearerAuth: []
 */
router.get(
  '/roster',
  requireRoles(['trainer']),
  [
    query('status')
      .optional({ checkFalsy: true })
      .isIn(['ACTIVE', 'PAUSED', 'TERMINATED'])
      .withMessage('Status must be ACTIVE, PAUSED, or TERMINATED.'),
    query('page')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer.'),
    query('limit')
      .optional({ checkFalsy: true })
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100.'),
    validateRequest,
  ],
  asyncHandler(trainerAssignmentController.getTrainerRoster)
);

// ==============================================================================
// 4. Admin Coaching Management Routes
// ==============================================================================

/**
 * @openapi
 * /api/coaching/admin/overview:
 *   get:
 *     summary: Admin coaching overview (trainers, pending queue, and assignments ledger)
 *     tags:
 *       - Coaching
 *     security:
 *       - BearerAuth: []
 */
router.get(
  '/admin/overview',
  requireRoles(['admin']),
  [
    query('status')
      .optional({ checkFalsy: true })
      .isIn(['ACTIVE', 'PAUSED', 'TERMINATED'])
      .withMessage('Status must be ACTIVE, PAUSED, or TERMINATED.'),
    query('trainerId')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 })
      .withMessage('Trainer ID must be a positive integer.'),
    query('memberId')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 })
      .withMessage('Member ID must be a positive integer.'),
    query('search')
      .optional({ checkFalsy: true })
      .isString()
      .trim(),
    query('page')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer.'),
    query('limit')
      .optional({ checkFalsy: true })
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100.'),
    validateRequest,
  ],
  asyncHandler(trainerAssignmentController.getAdminOverview)
);

/**
 * @openapi
 * /api/coaching/admin/requests/{id}/review:
 *   post:
 *     summary: Admin reviews (approves or rejects) a member request
 *     tags:
 *       - Coaching
 *     security:
 *       - BearerAuth: []
 */
router.post(
  '/admin/requests/:id/review',
  requireRoles(['admin']),
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Request ID must be a positive integer.'),
    body('action')
      .notEmpty()
      .withMessage('Action is required.')
      .isIn(['APPROVE', 'REJECT'])
      .withMessage("Action must be either 'APPROVE' or 'REJECT'."),
    body('rejectionReason')
      .optional({ checkFalsy: true })
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Rejection reason cannot exceed 500 characters.'),
    body('overrideCapacity')
      .optional()
      .isBoolean()
      .withMessage('overrideCapacity must be a boolean.'),
    validateRequest,
  ],
  asyncHandler(trainerAssignmentController.reviewRequest)
);

/**
 * @openapi
 * /api/coaching/admin/assign:
 *   post:
 *     summary: Admin directly assigns or reassigns a trainer to a member
 *     tags:
 *       - Coaching
 *     security:
 *       - BearerAuth: []
 */
router.post(
  '/admin/assign',
  requireRoles(['admin']),
  [
    body('memberId')
      .notEmpty()
      .withMessage('Member ID is required.')
      .isInt({ min: 1 })
      .withMessage('Member ID must be a positive integer.'),
    body('trainerId')
      .notEmpty()
      .withMessage('Trainer ID is required.')
      .isInt({ min: 1 })
      .withMessage('Trainer ID must be a positive integer.'),
    body('notes')
      .optional({ checkFalsy: true })
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters.'),
    body('overrideCapacity')
      .optional()
      .isBoolean()
      .withMessage('overrideCapacity must be a boolean.'),
    validateRequest,
  ],
  asyncHandler(trainerAssignmentController.assignTrainerDirectly)
);

/**
 * @openapi
 * /api/coaching/admin/assignments/{id}/terminate:
 *   post:
 *     summary: Admin terminates an active or paused trainer assignment
 *     tags:
 *       - Coaching
 *     security:
 *       - BearerAuth: []
 */
router.post(
  '/admin/assignments/:id/terminate',
  requireRoles(['admin']),
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Assignment ID must be a positive integer.'),
    body('reason')
      .optional({ checkFalsy: true })
      .isIn(['ADMIN_TERMINATED', 'MEMBER_REASSIGNED', 'MANUAL_RELEASE'])
      .withMessage('Valid termination reason required.'),
    body('notes')
      .optional({ checkFalsy: true })
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters.'),
    validateRequest,
  ],
  asyncHandler(trainerAssignmentController.terminateAssignment)
);

/**
 * @openapi
 * /api/coaching/admin/sync:
 *   post:
 *     summary: Admin triggers lifecycle reconciliation for 10-day grace periods and pass pauses
 *     tags:
 *       - Coaching
 *     security:
 *       - BearerAuth: []
 */
router.post(
  '/admin/sync',
  requireRoles(['admin']),
  asyncHandler(trainerAssignmentController.syncGracePeriods)
);

export default router;
