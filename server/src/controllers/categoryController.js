import { categoryService } from "../services/categoryService.js";
import { ApiResponse } from "../utils/apiResponse.js";

export const categoryController = {
  /**
   * Admin creates a plan category.
   */
  async createCategory(req, res) {
    const category = await categoryService.createCategory(req.body);
    return ApiResponse.created(
      res,
      { category },
      "Plan category created successfully.",
    );
  },

  /**
   * List plan categories.
   */
  async listCategories(req, res) {
    const { includeInactive, search } = req.query;
    const isAdmin = req.user?.role === "admin";

    const categories = await categoryService.listCategories({
      includeInactive: isAdmin && includeInactive === "true",
      search,
    });

    return ApiResponse.success(
      res,
      { categories },
      "Plan categories retrieved successfully.",
    );
  },

  /**
   * Get category by ID.
   */
  async getCategoryById(req, res) {
    const category = await categoryService.getCategoryById(req.params.id);
    return ApiResponse.success(
      res,
      { category },
      "Plan category retrieved successfully.",
    );
  },

  /**
   * Admin updates category.
   */
  async updateCategory(req, res) {
    const category = await categoryService.updateCategory(
      req.params.id,
      req.body,
    );
    return ApiResponse.success(
      res,
      { category },
      "Plan category updated successfully.",
    );
  },

  /**
   * Admin toggles category active status.
   */
  async toggleCategoryStatus(req, res) {
    const category = await categoryService.setCategoryStatus(
      req.params.id,
      req.body.isActive,
    );
    return ApiResponse.success(
      res,
      { category },
      "Plan category status updated successfully.",
    );
  },
};
