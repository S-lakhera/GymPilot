import { dashboardService } from '../services/dashboardService.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const dashboardController = {
  /**
   * Retrieve Admin dashboard aggregate metrics, distributions, and recent audit feeds.
   * Accessible only by administrators.
   */
  async getAdminDashboard(req, res) {
    const data = await dashboardService.getAdminDashboard();
    return ApiResponse.success(res, data, 'Admin dashboard metrics retrieved successfully.');
  },

  /**
   * Retrieve Trainer dashboard metrics, profile, and active member allocations.
   * Accessible only by trainers. Scoped strictly to authenticated trainer.
   */
  async getTrainerDashboard(req, res) {
    const data = await dashboardService.getTrainerDashboard(req.user.id);
    return ApiResponse.success(res, data, 'Trainer dashboard metrics retrieved successfully.');
  },

  /**
   * Retrieve Member dashboard metrics, active passes, renewals, and receipts.
   * Accessible only by members. Scoped strictly to authenticated member.
   */
  async getMemberDashboard(req, res) {
    const data = await dashboardService.getMemberDashboard(req.user.id);
    return ApiResponse.success(res, data, 'Member dashboard metrics retrieved successfully.');
  },
};

export default dashboardController;
