import { Router } from "express";
import { body, param, query } from "express-validator";
import { categoryController } from "../controllers/categoryController.js";
import { verifyToken, optionalAuth } from "../middlewares/authMiddleware.js";
import { requireRoles } from "../middlewares/roleMiddleware.js";
import { validateRequest } from "../middlewares/validateMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

/**
 * @openapi
 * /api/categories:
 *   post:
 *     summary: Create a plan category (Admin only)
 *     tags:
 *       - Plan Categories
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin only)
 *       409:
 *         description: Category name already exists
 */
router.post(
  "/",
  verifyToken,
  requireRoles("admin"),
  [
    body("name").trim().notEmpty().withMessage("Category name is required"),
    body("description").optional().trim(),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean"),
    validateRequest,
  ],
  asyncHandler(categoryController.createCategory),
);

/**
 * @openapi
 * /api/categories:
 *   get:
 *     summary: List all plan categories
 *     tags:
 *       - Plan Categories
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of plan categories
 */
router.get(
  "/",
  optionalAuth,
  [
    query("includeInactive")
      .optional()
      .isBoolean()
      .withMessage("includeInactive must be boolean"),
    query("search").optional().trim(),
    validateRequest,
  ],
  asyncHandler(categoryController.listCategories),
);

/**
 * @openapi
 * /api/categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags:
 *       - Plan Categories
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Category details
 *       404:
 *         description: Category not found
 */
router.get(
  "/:id",
  [
    param("id").isInt({ min: 1 }).withMessage("Valid category ID is required"),
    validateRequest,
  ],
  asyncHandler(categoryController.getCategoryById),
);

/**
 * @openapi
 * /api/categories/{id}:
 *   patch:
 *     summary: Update category (Admin only)
 *     tags:
 *       - Plan Categories
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Category not found
 *       409:
 *         description: Duplicate category name
 */
router.patch(
  "/:id",
  verifyToken,
  requireRoles("admin"),
  [
    param("id").isInt({ min: 1 }).withMessage("Valid category ID is required"),
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Category name cannot be empty"),
    body("description").optional().trim(),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean"),
    validateRequest,
  ],
  asyncHandler(categoryController.updateCategory),
);

/**
 * @openapi
 * /api/categories/{id}/status:
 *   patch:
 *     summary: Toggle category active status (Admin only)
 *     tags:
 *       - Plan Categories
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
 *         description: Category status updated
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Category not found
 */
router.patch(
  "/:id/status",
  verifyToken,
  requireRoles("admin"),
  [
    param("id").isInt({ min: 1 }).withMessage("Valid category ID is required"),
    body("isActive")
      .isBoolean()
      .withMessage("isActive must be a boolean value"),
    validateRequest,
  ],
  asyncHandler(categoryController.toggleCategoryStatus),
);

export default router;
