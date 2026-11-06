import { Router } from "express";
import { body } from "express-validator";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from "../utils/errors.js";
import { validateRequest } from "../middlewares/validateMiddleware.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { requireRoles } from "../middlewares/roleMiddleware.js";
import { withTransaction, pool } from "../config/db.js";

const router = Router();

/**
 * @openapi
 * /api/test/success:
 *   get:
 *     summary: Verify standardized success response envelope
 *     tags: [Foundation Tests]
 *     responses:
 *       200:
 *         description: Success JSend envelope
 */
router.get(
  "/success",
  asyncHandler(async (req, res) => {
    return ApiResponse.success(
      res,
      { architecture: "5-Layer Modular", status: "Online" },
      "Foundation is healthy",
    );
  }),
);

/**
 * @openapi
 * /api/test/error-bad-request:
 *   get:
 *     summary: Verify 400 BadRequestError handling
 *     tags: [Foundation Tests]
 *     responses:
 *       400:
 *         description: Bad request error response
 */
router.get(
  "/error-bad-request",
  asyncHandler(async () => {
    throw new BadRequestError("Invalid input parameter supplied");
  }),
);

/**
 * @openapi
 * /api/test/error-unauthorized:
 *   get:
 *     summary: Verify 401 UnauthorizedError handling
 *     tags: [Foundation Tests]
 *     responses:
 *       401:
 *         description: Unauthorized error response
 */
router.get(
  "/error-unauthorized",
  asyncHandler(async () => {
    throw new UnauthorizedError("Token is expired or invalid");
  }),
);

/**
 * @openapi
 * /api/test/error-forbidden:
 *   get:
 *     summary: Verify 403 ForbiddenError handling
 *     tags: [Foundation Tests]
 *     responses:
 *       403:
 *         description: Forbidden error response
 */
router.get(
  "/error-forbidden",
  asyncHandler(async () => {
    throw new ForbiddenError(
      "You do not have permission to perform this action",
    );
  }),
);

/**
 * @openapi
 * /api/test/error-not-found:
 *   get:
 *     summary: Verify 404 NotFoundError handling
 *     tags: [Foundation Tests]
 *     responses:
 *       404:
 *         description: Not found error response
 */
router.get(
  "/error-not-found",
  asyncHandler(async () => {
    throw new NotFoundError("User record does not exist");
  }),
);

/**
 * @openapi
 * /api/test/error-conflict:
 *   get:
 *     summary: Verify 409 ConflictError handling
 *     tags: [Foundation Tests]
 *     responses:
 *       409:
 *         description: Conflict error response
 */
router.get(
  "/error-conflict",
  asyncHandler(async () => {
    throw new ConflictError("A category with this name already exists");
  }),
);

/**
 * @openapi
 * /api/test/mysql-duplicate:
 *   get:
 *     summary: Trigger real MySQL unique constraint violation (1062) to verify 409 mapping
 *     tags: [Foundation Tests]
 *     responses:
 *       409:
 *         description: Handled MySQL duplicate error
 */
router.get(
  "/mysql-duplicate",
  asyncHandler(async (req, res) => {
    // Attempting to insert already existing category 'Strength Training'
    await pool.query("INSERT INTO plan_categories (name) VALUES (?)", [
      "Strength Training",
    ]);
    return ApiResponse.success(res, null, "Inserted");
  }),
);

/**
 * @openapi
 * /api/test/validate:
 *   post:
 *     summary: Verify express-validator middleware gate
 *     tags: [Foundation Tests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, age]
 *             properties:
 *               email:
 *                 type: string
 *               age:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Valid payload
 *       400:
 *         description: Validation failed with field errors
 */
router.post(
  "/validate",
  [
    body("email").isEmail().withMessage("A valid email address is required"),
    body("age")
      .isInt({ min: 18 })
      .withMessage("Age must be an integer of at least 18"),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    return ApiResponse.success(res, req.body, "Validation passed successfully");
  }),
);

/**
 * @openapi
 * /api/test/protected:
 *   get:
 *     summary: Verify Bearer JWT authentication middleware
 *     tags: [Foundation Tests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Decoded user info
 *       401:
 *         description: Missing or invalid token
 */
router.get(
  "/protected",
  verifyToken,
  asyncHandler(async (req, res) => {
    return ApiResponse.success(
      res,
      { user: req.user },
      "Protected endpoint accessed successfully",
    );
  }),
);

/**
 * @openapi
 * /api/test/admin-only:
 *   get:
 *     summary: Verify Admin RBAC authorization middleware
 *     tags: [Foundation Tests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin access granted
 *       403:
 *         description: Forbidden if role is not admin
 */
router.get(
  "/admin-only",
  verifyToken,
  requireRoles("admin"),
  asyncHandler(async (req, res) => {
    return ApiResponse.success(
      res,
      { user: req.user },
      "Admin access confirmed",
    );
  }),
);

/**
 * @openapi
 * /api/test/trainer-only:
 *   get:
 *     summary: Verify Trainer RBAC authorization middleware
 *     tags: [Foundation Tests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trainer access granted
 *       403:
 *         description: Forbidden if role is not trainer
 */
router.get(
  "/trainer-only",
  verifyToken,
  requireRoles("trainer"),
  asyncHandler(async (req, res) => {
    return ApiResponse.success(
      res,
      { user: req.user },
      "Trainer access confirmed",
    );
  }),
);

/**
 * @openapi
 * /api/test/transaction-rollback:
 *   post:
 *     summary: Verify withTransaction automatic rollback on error
 *     tags: [Foundation Tests]
 *     responses:
 *       500:
 *         description: Error triggered and changes rolled back
 */
router.post(
  "/transaction-rollback",
  asyncHandler(async () => {
    await withTransaction(async (conn) => {
      // 1. Insert temporary category
      await conn.query(
        "INSERT INTO plan_categories (name, description) VALUES (?, ?)",
        ["Rollback Category", "Should not exist in database"],
      );
      // 2. Intentionally throw error to trigger rollback
      throw new Error("Simulated failure during multi-step transaction");
    });
  }),
);

/**
 * @openapi
 * /api/test/transaction-commit:
 *   post:
 *     summary: Verify withTransaction automatic commit on success
 *     tags: [Foundation Tests]
 *     responses:
 *       200:
 *         description: Transaction committed
 */
router.post(
  "/transaction-commit",
  asyncHandler(async (req, res) => {
    const result = await withTransaction(async (conn) => {
      const [insertResult] = await conn.query(
        "INSERT INTO plan_categories (name, description) VALUES (?, ?)",
        ["Committed Category", "Successfully persisted"],
      );
      return insertResult.insertId;
    });

    // Clean up test entry after verifying
    await pool.query("DELETE FROM plan_categories WHERE name = ?", [
      "Committed Category",
    ]);

    return ApiResponse.success(
      res,
      { insertId: result },
      "Transaction committed and cleaned up",
    );
  }),
);

export default router;
