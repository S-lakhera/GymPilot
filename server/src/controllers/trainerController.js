import { trainerService } from '../services/trainerService.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const trainerController = {
  /**
   * Admin provisions a new trainer.
   */
  async createTrainer(req, res) {
    const trainer = await trainerService.createTrainer(req.body);
    return ApiResponse.created(res, { trainer }, 'Trainer account created successfully.');
  },

  /**
   * List all trainers with pagination & search.
   */
  async listTrainers(req, res) {
    const { page, limit, search, isActive, sortBy, sortOrder } = req.query;

    const result = await trainerService.listTrainers(
      {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        search,
        isActive: isActive !== undefined ? isActive === 'true' : null,
        sortBy,
        sortOrder,
      },
      req.user
    );

    return res.status(200).json({
      status: 'success',
      message: 'Trainers retrieved successfully.',
      data: result.trainers,
      pagination: result.pagination,
    });
  },

  /**
   * Get trainer details by ID.
   */
  async getTrainerById(req, res) {
    const trainer = await trainerService.getTrainerById(req.params.id, req.user);
    return ApiResponse.success(res, { trainer }, 'Trainer details retrieved successfully.');
  },

  /**
   * Update trainer profile / account details.
   */
  async updateTrainer(req, res) {
    const trainer = await trainerService.updateTrainer(req.params.id, req.body, req.user);
    return ApiResponse.success(res, { trainer }, 'Trainer profile updated successfully.');
  },

  /**
   * Admin toggles trainer active/inactive status.
   */
  async toggleTrainerStatus(req, res) {
    const result = await trainerService.setTrainerStatus(req.params.id, req.body.isActive);
    return ApiResponse.success(res, { trainer: result }, 'Trainer status updated successfully.');
  },
};
