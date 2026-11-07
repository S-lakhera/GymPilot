import { Router } from "express";
import { body, query, param } from "express-validator";
import { userController } from "../controllers/userController.js";
import { validateRequest } from "../middlewares/validateMiddleware.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { requireRoles } from "../middlewares/roleMiddleware.js";
import { UserRoles } from "../models/UserRoles.js";

const router = Router();

/**
 * @openapi
 * /api/users/profile:
 *   get:
 *     summary: Get own profile
 *     description: Retrieves profile information for the authenticated user (member or trainer).
 *     tags: [Users & Members]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data
 *       401:
 *         description: Unauthorized
 */
router.get("/profile", verifyToken, userController.getProfile);

/**
 * @openapi
 * /api/users/profile:
 *   patch:
 *     summary: Update own member profile
 *     description: Updates contact information and member health/emergency fields (non-blocking).
 *     tags: [Users & Members]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: '1995-04-12'
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               emergencyContactName:
 *                 type: string
 *               emergencyContactPhone:
 *                 type: string
 *               healthConditions:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.patch(
  "/profile",
  verifyToken,
  [
    body("firstName")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("First name cannot be empty"),
    body("lastName")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Last name cannot be empty"),
    body("phone").optional({ checkFalsy: true }).trim().isLength({ max: 20 }),
    body("dateOfBirth")
      .optional({ checkFalsy: true })
      .isISO8601()
      .withMessage("Date of birth must be a valid date (YYYY-MM-DD)"),
    body("gender")
      .optional({ checkFalsy: true })
      .isIn(["male", "female", "other"])
      .withMessage("Gender must be male, female, or other"),
    body("emergencyContactName")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 100 }),
    body("emergencyContactPhone")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 20 }),
    body("healthConditions").optional({ checkFalsy: true }).trim(),
  ],
  validateRequest,
  userController.updateProfile,
);

/**
 * @openapi
 * /api/users/members:
 *   get:
 *     summary: Admin list all members
 *     description: Retrieves paginated member accounts with search, active/inactive filter, and sorting.
 *     tags: [Users & Members]
 *     security:
 *       - bearerAuth: []
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
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or phone
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, active, inactive]
 *           default: all
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: created_at
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Paginated member list
 *       403:
 *         description: Forbidden (Admin only)
 */
router.get(
  "/members",
  verifyToken,
  requireRoles(UserRoles.ADMIN),
  userController.listMembers,
);

/**
 * @openapi
 * /api/users/members/{id}:
 *   get:
 *     summary: Admin get member by ID
 *     description: Retrieves full member account and profile details.
 *     tags: [Users & Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Member details
 *       404:
 *         description: Member not found
 */
router.get(
  "/members/:id",
  verifyToken,
  requireRoles(UserRoles.ADMIN),
  [param("id").isInt({ min: 1 }).withMessage("Valid member ID is required")],
  validateRequest,
  userController.getMemberById,
);

/**
 * @openapi
 * /api/users/members/{id}/status:
 *   patch:
 *     summary: Admin activate or deactivate member
 *     description: Soft-deactivates or reactivates a member account. Deactivation revokes active refresh sessions.
 *     tags: [Users & Members]
 *     security:
 *       - bearerAuth: []
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
 *             required: [isActive]
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Status updated
 *       404:
 *         description: Member not found
 */
router.patch(
  "/members/:id/status",
  verifyToken,
  requireRoles(UserRoles.ADMIN),
  [
    param("id").isInt({ min: 1 }).withMessage("Valid member ID is required"),
    body("isActive")
      .isBoolean()
      .withMessage("isActive must be a boolean (true or false)"),
  ],
  validateRequest,
  userController.toggleMemberStatus,
);

export default router;
