import { userService } from "../services/userService.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const userController = {
  /**
   * Get own profile (Member or Trainer).
   */
  getProfile: asyncHandler(async (req, res) => {
    const result = await userService.getOwnProfile(req.user.id, req.user.role);
    return ApiResponse.success(res, result, "Profile retrieved successfully");
  }),

  /**
   * Update own profile (Role-aware).
   */
  updateProfile: asyncHandler(async (req, res) => {
    const result = await userService.updateOwnProfile(
      req.user.id,
      req.user.role,
      req.body,
    );
    return ApiResponse.success(res, result, "Profile updated successfully");
  }),

  /**
   * Admin: List members with pagination, search, and status filtering.
   */
  listMembers: asyncHandler(async (req, res) => {
    const { page, limit, search, status, sortBy, sortOrder } = req.query;
    const result = await userService.listMembers({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search: search || "",
      status: status || "all",
      sortBy: sortBy || "created_at",
      sortOrder: sortOrder || "DESC",
    });

    return res.status(200).json({
      status: "success",
      message: "Members retrieved successfully",
      data: result.members,
      pagination: result.pagination,
    });
  }),

  /**
   * Admin: Get member details by ID.
   */
  getMemberById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await userService.getMemberById(id);
    return ApiResponse.success(
      res,
      result,
      "Member details retrieved successfully",
    );
  }),

  /**
   * Admin: Activate or deactivate member account.
   */
  toggleMemberStatus: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;
    const result = await userService.setMemberStatus(id, isActive);
    return ApiResponse.success(res, result, result.message);
  }),
};

export default userController;
