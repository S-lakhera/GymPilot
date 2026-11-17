import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { attendanceController } from '../controllers/attendanceController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/roleMiddleware.js';
import { validateRequest } from '../middlewares/validateMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// All attendance endpoints require active authentication
router.use(verifyToken);

// ==============================================================================
// 1. Admin Attendance Endpoints
// ==============================================================================

/**
 * @openapi
 * /api/attendance/check-in:
 *   post:
 *     summary: Record member check-in (mark present)
 *     tags:
 *       - Attendance
 *     security:
 *       - BearerAuth: []
 */
router.post(
  '/check-in',
  requireRoles(['admin']),
  [
    body('memberId')
      .notEmpty()
      .withMessage('Member ID is required.')
      .isInt({ min: 1 })
      .withMessage('Member ID must be a positive integer.')
      .toInt(),
    body('checkInTime')
      .optional({ checkFalsy: true })
      .isISO8601()
      .withMessage('Check-in time must be a valid ISO 8601 datetime string.'),
    body('notes')
      .optional({ checkFalsy: true })
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes must not exceed 500 characters.'),
    body('overrideConfirmed')
      .optional()
      .toBoolean(),
    body('overrideNote')
      .optional({ checkFalsy: true })
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Override note must not exceed 500 characters.'),
    validateRequest,
  ],
  asyncHandler(attendanceController.recordCheckIn)
);

/**
 * @openapi
 * /api/attendance/{id}/check-out:
 *   put:
 *     summary: Record member check-out
 *     tags:
 *       - Attendance
 *     security:
 *       - BearerAuth: []
 */
router.put(
  '/:id/check-out',
  requireRoles(['admin']),
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Attendance record ID must be a positive integer.')
      .toInt(),
    body('checkOutTime')
      .optional({ checkFalsy: true })
      .isISO8601()
      .withMessage('Check-out time must be a valid ISO 8601 datetime string.'),
    body('notes')
      .optional({ checkFalsy: true })
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes must not exceed 500 characters.'),
    validateRequest,
  ],
  asyncHandler(attendanceController.recordCheckOut)
);

/**
 * @openapi
 * /api/attendance/{id}:
 *   put:
 *     summary: Correct an attendance record (Admin only)
 *     tags:
 *       - Attendance
 *     security:
 *       - BearerAuth: []
 */
router.put(
  '/:id',
  requireRoles(['admin']),
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Attendance record ID must be a positive integer.')
      .toInt(),
    body('checkInTime')
      .optional({ checkFalsy: true })
      .isISO8601()
      .withMessage('Check-in time must be a valid ISO 8601 datetime string.'),
    body('checkOutTime')
      .optional({ nullable: true })
      .custom((val) => {
        if (val === null || val === '') return true;
        if (!isNaN(Date.parse(val))) return true;
        throw new Error('Check-out time must be a valid datetime string or null.');
      }),
    body('notes')
      .optional({ nullable: true })
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes must not exceed 500 characters.'),
    body('status')
      .optional()
      .isIn(['CHECKED_IN', 'CHECKED_OUT'])
      .withMessage("Status must be either 'CHECKED_IN' or 'CHECKED_OUT'."),
    validateRequest,
  ],
  asyncHandler(attendanceController.updateAttendanceRecord)
);

/**
 * @openapi
 * /api/attendance/{id}:
 *   delete:
 *     summary: Delete an accidental attendance record (Admin only)
 *     tags:
 *       - Attendance
 *     security:
 *       - BearerAuth: []
 */
router.delete(
  '/:id',
  requireRoles(['admin']),
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Attendance record ID must be a positive integer.')
      .toInt(),
    validateRequest,
  ],
  asyncHandler(attendanceController.deleteAttendanceRecord)
);

/**
 * @openapi
 * /api/attendance/admin/overview:
 *   get:
 *     summary: Get gym attendance overview, stats, trend, and paginated logs
 *     tags:
 *       - Attendance
 *     security:
 *       - BearerAuth: []
 */
router.get(
  '/admin/overview',
  requireRoles(['admin']),
  [
    query('date')
      .optional({ checkFalsy: true })
      .isISO8601()
      .withMessage('Date must be in YYYY-MM-DD format.'),
    query('startDate')
      .optional({ checkFalsy: true })
      .isISO8601()
      .withMessage('Start date must be in YYYY-MM-DD format.'),
    query('endDate')
      .optional({ checkFalsy: true })
      .isISO8601()
      .withMessage('End date must be in YYYY-MM-DD format.'),
    query('status')
      .optional({ checkFalsy: true })
      .isIn(['CHECKED_IN', 'CHECKED_OUT'])
      .withMessage("Status filter must be 'CHECKED_IN' or 'CHECKED_OUT'."),
    query('search')
      .optional({ checkFalsy: true })
      .isString()
      .trim(),
    query('page')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer.')
      .toInt(),
    query('limit')
      .optional({ checkFalsy: true })
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100.')
      .toInt(),
    validateRequest,
  ],
  asyncHandler(attendanceController.getAdminOverview)
);

/**
 * @openapi
 * /api/attendance/admin/members/search:
 *   get:
 *     summary: Search members for quick check-in suggestions
 *     tags:
 *       - Attendance
 *     security:
 *       - BearerAuth: []
 */
router.get(
  '/admin/members/search',
  requireRoles(['admin']),
  [
    query('q')
      .optional()
      .isString()
      .trim(),
    validateRequest,
  ],
  asyncHandler(attendanceController.searchMembers)
);

// ==============================================================================
// 2. Member Personal Attendance Endpoints
// ==============================================================================

/**
 * @openapi
 * /api/attendance/my-history:
 *   get:
 *     summary: Get authenticated member's personal attendance history, streak, and heatmap
 *     tags:
 *       - Attendance
 *     security:
 *       - BearerAuth: []
 */
router.get(
  '/my-history',
  requireRoles(['member']),
  [
    query('page')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 })
      .toInt(),
    query('limit')
      .optional({ checkFalsy: true })
      .isInt({ min: 1, max: 100 })
      .toInt(),
    query('days')
      .optional({ checkFalsy: true })
      .isInt({ min: 14, max: 365 })
      .toInt(),
    validateRequest,
  ],
  asyncHandler(attendanceController.getMemberHistory)
);

// ==============================================================================
// 3. Trainer Client Attendance Endpoints
// ==============================================================================

/**
 * @openapi
 * /api/attendance/trainer/overview:
 *   get:
 *     summary: Get overview of all assigned clients and their attendance metrics (Trainer only)
 *     tags:
 *       - Attendance
 *     security:
 *       - BearerAuth: []
 */
router.get(
  '/trainer/overview',
  requireRoles(['trainer']),
  asyncHandler(attendanceController.getTrainerOverview)
);

/**
 * @openapi
 * /api/attendance/clients/{memberId}:
 *   get:
 *     summary: Get assigned client's attendance history (Trainer only)
 *     tags:
 *       - Attendance
 *     security:
 *       - BearerAuth: []
 */
router.get(
  '/clients/:memberId',
  requireRoles(['trainer']),
  [
    param('memberId')
      .isInt({ min: 1 })
      .withMessage('Member ID must be a positive integer.')
      .toInt(),
    query('page')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 })
      .toInt(),
    query('limit')
      .optional({ checkFalsy: true })
      .isInt({ min: 1, max: 100 })
      .toInt(),
    validateRequest,
  ],
  asyncHandler(attendanceController.getClientAttendanceForTrainer)
);

export default router;
