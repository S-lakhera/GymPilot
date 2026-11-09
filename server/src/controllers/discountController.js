import { discountService } from "../services/discountService.js";
import { ApiResponse } from "../utils/apiResponse.js";

export const discountController = {
  /**
   * Admin creates a new discount.
   */
  async createDiscount(req, res) {
    const discount = await discountService.createDiscount(req.body);
    return ApiResponse.created(
      res,
      { discount },
      "Discount created successfully.",
    );
  },

  /**
   * Admin lists all discounts with pagination and search.
   */
  async listDiscounts(req, res) {
    const { page, limit, search, isActive, sortBy, sortOrder } = req.query;

    const result = await discountService.listDiscounts({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      isActive: isActive !== undefined ? isActive === "true" : null,
      sortBy,
      sortOrder,
    });

    return res.status(200).json({
      status: "success",
      message: "Discounts retrieved successfully.",
      data: result.discounts,
      pagination: result.pagination,
    });
  },

  /**
   * Get discount details by ID.
   */
  async getDiscountById(req, res) {
    const discount = await discountService.getDiscountById(req.params.id);
    return ApiResponse.success(
      res,
      { discount },
      "Discount details retrieved successfully.",
    );
  },

  /**
   * Admin updates discount.
   */
  async updateDiscount(req, res) {
    const discount = await discountService.updateDiscount(
      req.params.id,
      req.body,
    );
    return ApiResponse.success(
      res,
      { discount },
      "Discount updated successfully.",
    );
  },

  /**
   * Admin toggles discount active status.
   */
  async toggleDiscountStatus(req, res) {
    const result = await discountService.setDiscountStatus(
      req.params.id,
      req.body.isActive,
    );
    return ApiResponse.success(
      res,
      { discount: result },
      "Discount status updated successfully.",
    );
  },
};
