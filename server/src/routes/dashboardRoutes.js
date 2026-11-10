import { Router } from "express";
import { dashboardController } from "../controllers/dashboardController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { requireRoles } from "../middlewares/roleMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

// All dashboard endpoints require active JWT authentication
router.use(verifyToken);

/**
 * @openapi
 * /api/dashboard/admin:
 *   get:
 *     summary: Retrieve Admin dashboard overview metrics and audit feeds
 *     description: Provides gym-wide membership statistics, active and expiring subscription health counts, gross revenue vs net revenue financial metrics, category distribution aggregates, and recent activity feeds.
 *     tags:
 *       - Dashboard
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Admin dashboard metrics retrieved successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     membership:
 *                       type: object
 *                       properties:
 *                         totalMembers:
 *                           type: integer
 *                           example: 5
 *                         activeMembers:
 *                           type: integer
 *                           example: 4
 *                         activeTrainers:
 *                           type: integer
 *                           example: 3
 *                     subscriptions:
 *                       type: object
 *                       properties:
 *                         activeSubscriptions:
 *                           type: integer
 *                           example: 4
 *                         queuedSubscriptions:
 *                           type: integer
 *                           example: 1
 *                         expiringSoon:
 *                           type: integer
 *                           example: 1
 *                         expiredSubscriptions:
 *                           type: integer
 *                           example: 2
 *                     financials:
 *                       type: object
 *                       properties:
 *                         grossRevenue:
 *                           type: number
 *                           example: 9544.00
 *                         grossRevenueMtd:
 *                           type: number
 *                           example: 5447.00
 *                         grossRevenueToday:
 *                           type: number
 *                           example: 0.00
 *                         totalRefunded:
 *                           type: number
 *                           example: 0.00
 *                         refundedMtd:
 *                           type: number
 *                           example: 0.00
 *                         refundedToday:
 *                           type: number
 *                           example: 0.00
 *                         netRevenue:
 *                           type: number
 *                           example: 9544.00
 *                         netRevenueMtd:
 *                           type: number
 *                           example: 5447.00
 *                         netRevenueToday:
 *                           type: number
 *                           example: 0.00
 *                         pendingPayments:
 *                           type: integer
 *                           example: 0
 *                     categoryDistribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           categoryId:
 *                             type: integer
 *                           categoryName:
 *                             type: string
 *                           activeCount:
 *                             type: integer
 *                     recentTransactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                     recentMembers:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - requires admin role
 */
router.get(
  "/admin",
  requireRoles("admin"),
  asyncHandler(dashboardController.getAdminDashboard),
);

/**
 * @openapi
 * /api/dashboard/trainer:
 *   get:
 *     summary: Retrieve Trainer dashboard profile and session allocations
 *     description: Provides trainer profile details, certification status, and Phase 6 placeholder structures for assigned members and upcoming training sessions. Identity is strictly derived from req.user.id.
 *     tags:
 *       - Dashboard
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Trainer dashboard metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Trainer dashboard metrics retrieved successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile:
 *                       type: object
 *                     totalAssignedMembers:
 *                       type: integer
 *                       example: 0
 *                     assignedMembers:
 *                       type: array
 *                       items:
 *                         type: object
 *                     upcomingSessions:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - requires trainer role
 */
router.get(
  "/trainer",
  requireRoles("trainer"),
  asyncHandler(dashboardController.getTrainerDashboard),
);

/**
 * @openapi
 * /api/dashboard/member:
 *   get:
 *     summary: Retrieve Member dashboard passes, renewal status, and receipts
 *     description: Provides member active gym passes with remaining validity days, queued renewals, nearest expiration reminder, recent payment receipts, and profile completeness score. Identity is strictly derived from req.user.id.
 *     tags:
 *       - Dashboard
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Member dashboard metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Member dashboard metrics retrieved successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     activePasses:
 *                       type: array
 *                       items:
 *                         type: object
 *                     queuedRenewals:
 *                       type: array
 *                       items:
 *                         type: object
 *                     nearestExpiration:
 *                       type: object
 *                       nullable: true
 *                     recentPayments:
 *                       type: array
 *                       items:
 *                         type: object
 *                     profileCompleteness:
 *                       type: object
 *                       properties:
 *                         completedFields:
 *                           type: integer
 *                         totalFields:
 *                           type: integer
 *                         percentage:
 *                           type: integer
 *                         fields:
 *                           type: object
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - requires member role
 */
router.get(
  "/member",
  requireRoles("member"),
  asyncHandler(dashboardController.getMemberDashboard),
);

export default router;
