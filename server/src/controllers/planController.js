import { planService } from "../services/planService.js";
import { ApiResponse } from "../utils/apiResponse.js";

export const planController = {
  /**
   * Admin creates a membership plan.
   */
  async createPlan(req, res) {
    const plan = await planService.createPlan(req.body);
    return ApiResponse.created(
      res,
      { plan },
      "Membership plan created successfully.",
    );
  },

  /**
   * List membership plans.
   */
  async listPlans(req, res) {
    const {
      categoryId,
      isActive,
      search,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder,
    } = req.query;

    const plans = await planService.listPlans(
      {
        categoryId: categoryId ? Number(categoryId) : null,
        isActive: isActive !== undefined ? isActive === "true" : null,
        search,
        minPrice,
        maxPrice,
        sortBy,
        sortOrder,
      },
      req.user,
    );

    return ApiResponse.success(
      res,
      { plans },
      "Membership plans retrieved successfully.",
    );
  },

  /**
   * Get plan details by ID.
   */
  async getPlanById(req, res) {
    const plan = await planService.getPlanById(req.params.id, req.user);
    return ApiResponse.success(
      res,
      { plan },
      "Membership plan retrieved successfully.",
    );
  },

  /**
   * Admin updates membership plan.
   */
  async updatePlan(req, res) {
    const plan = await planService.updatePlan(req.params.id, req.body);
    return ApiResponse.success(
      res,
      { plan },
      "Membership plan updated successfully.",
    );
  },

  /**
   * Admin toggles plan active status.
   */
  async togglePlanStatus(req, res) {
    const plan = await planService.setPlanStatus(
      req.params.id,
      req.body.isActive,
    );
    return ApiResponse.success(
      res,
      { plan },
      "Membership plan status updated successfully.",
    );
  },
};
