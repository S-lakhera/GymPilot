import { Router } from "express";
import { body, param, query } from "express-validator";
import { discountController } from "../controllers/discountController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { requireRoles } from "../middlewares/roleMiddleware.js";
import { validateRequest } from "../middlewares/validateMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ALL_DISCOUNT_TYPES } from "../models/DiscountType.js";

const router = Router();

// All discount management routes require Admin privileges
router.use(verifyToken, requireRoles("admin"));

/**
 * @openapi
 * /api/discounts:
 *   post:
 *     summary: Create a promotional discount or coupon (Admin only)
 *     tags:
 *       - Discounts
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - discountType
 *               - discountValue
 *               - startDate
 *               - endDate
 *             properties:
 *               code:
 *                 type: string
 *                 example: WELCOME20
 *               name:
 *                 type: string
 *                 example: Welcome New Member Offer
 *               description:
 *                 type: string
 *               discountType:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED]
 *               discountValue:
 *                 type: number
 *                 example: 20
 *               maxDiscountAmount:
 *                 type: number
 *                 example: 200
 *               minPurchaseAmount:
 *                 type: number
 *                 example: 500
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-01-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-12-31"
 *               usageLimit:
 *                 type: integer
 *               perUserLimit:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *               eligiblePlanIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       201:
 *         description: Discount created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Discount code already exists
 */
router.post(
  "/",
  [
    body("code").trim().notEmpty().withMessage("Discount code is required"),
    body("name").trim().notEmpty().withMessage("Discount name is required"),
    body("description").optional().trim(),
    body("discountType")
      .isIn(ALL_DISCOUNT_TYPES)
      .withMessage(
        `discountType must be one of: ${ALL_DISCOUNT_TYPES.join(", ")}`,
      ),
    body("discountValue")
      .isFloat({ min: 0.01 })
      .withMessage("discountValue must be a positive number"),
    body("maxDiscountAmount")
      .optional({ nullable: true })
      .isFloat({ min: 0 })
      .withMessage("maxDiscountAmount must be a non-negative number"),
    body("minPurchaseAmount")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("minPurchaseAmount must be a non-negative number"),
    body("startDate")
      .isISO8601()
      .withMessage("startDate must be a valid date (YYYY-MM-DD)"),
    body("endDate")
      .isISO8601()
      .withMessage("endDate must be a valid date (YYYY-MM-DD)"),
    body("usageLimit")
      .optional({ nullable: true })
      .isInt({ min: 1 })
      .withMessage("usageLimit must be an integer >= 1"),
    body("perUserLimit")
      .optional()
      .isInt({ min: 1 })
      .withMessage("perUserLimit must be an integer >= 1"),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean"),
    body("eligiblePlanIds")
      .optional()
      .isArray()
      .withMessage("eligiblePlanIds must be an array of plan IDs"),
    validateRequest,
  ],
  asyncHandler(discountController.createDiscount),
);

/**
 * @openapi
 * /api/discounts:
 *   get:
 *     summary: List all discounts (Admin only)
 *     tags:
 *       - Discounts
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of discounts
 */
router.get(
  "/",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be an integer >= 1"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("search").optional().trim(),
    query("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean"),
    validateRequest,
  ],
  asyncHandler(discountController.listDiscounts),
);

/**
 * @openapi
 * /api/discounts/{id}:
 *   get:
 *     summary: Get discount by ID (Admin only)
 *     tags:
 *       - Discounts
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
 *         description: Discount details
 *       404:
 *         description: Discount not found
 */
router.get(
  "/:id",
  [
    param("id").isInt({ min: 1 }).withMessage("Valid discount ID is required"),
    validateRequest,
  ],
  asyncHandler(discountController.getDiscountById),
);

/**
 * @openapi
 * /api/discounts/{id}:
 *   patch:
 *     summary: Update discount details (Admin only)
 *     tags:
 *       - Discounts
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
 *         description: Discount updated successfully
 *       404:
 *         description: Discount not found
 */
router.patch(
  "/:id",
  [
    param("id").isInt({ min: 1 }).withMessage("Valid discount ID is required"),
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Name cannot be empty"),
    body("discountType")
      .optional()
      .isIn(ALL_DISCOUNT_TYPES)
      .withMessage(
        `discountType must be one of: ${ALL_DISCOUNT_TYPES.join(", ")}`,
      ),
    body("discountValue")
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage("discountValue must be a positive number"),
    body("maxDiscountAmount").optional({ nullable: true }).isFloat({ min: 0 }),
    body("minPurchaseAmount").optional().isFloat({ min: 0 }),
    body("startDate").optional().isISO8601(),
    body("endDate").optional().isISO8601(),
    body("usageLimit").optional({ nullable: true }).isInt({ min: 1 }),
    body("perUserLimit").optional().isInt({ min: 1 }),
    body("isActive").optional().isBoolean(),
    body("eligiblePlanIds").optional().isArray(),
    validateRequest,
  ],
  asyncHandler(discountController.updateDiscount),
);

/**
 * @openapi
 * /api/discounts/{id}/status:
 *   patch:
 *     summary: Toggle discount active status (Admin only)
 *     tags:
 *       - Discounts
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
 *         description: Discount status updated
 *       404:
 *         description: Discount not found
 */
router.patch(
  "/:id/status",
  [
    param("id").isInt({ min: 1 }).withMessage("Valid discount ID is required"),
    body("isActive").isBoolean().withMessage("isActive must be a boolean"),
    validateRequest,
  ],
  asyncHandler(discountController.toggleDiscountStatus),
);

export default router;
