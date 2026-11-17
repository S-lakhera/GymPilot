import { workoutService } from '../services/workoutService.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const workoutController = {
  /**
   * GET /api/workouts/exercises
   */
  async getExercises(req, res, next) {
    try {
      const { muscleGroup, search } = req.query;
      const trainerId = req.user.role === 'trainer' ? req.user.id : null;
      const exercises = await workoutService.listExercises({ muscleGroup, search, trainerId });
      return ApiResponse.success(res, exercises, 'Exercises retrieved successfully.');
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/workouts/exercises
   */
  async createCustomExercise(req, res, next) {
    try {
      const { name, muscleGroup, equipment, category } = req.body;
      const trainerId = req.user.id;
      const created = await workoutService.createCustomExercise({
        name,
        muscleGroup,
        equipment,
        category,
        trainerId,
      });
      return ApiResponse.created(res, created, 'Custom exercise created successfully.');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/workouts/my-plan
   */
  async getMyWorkoutPlan(req, res, next) {
    try {
      const memberId = req.user.id;
      const plan = await workoutService.getMemberActivePlan(memberId);
      return ApiResponse.success(res, plan, 'Active workout plan retrieved successfully.');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/workouts/trainer/plans
   */
  async getTrainerPlans(req, res, next) {
    try {
      const trainerId = req.user.id;
      const plans = await workoutService.getTrainerPlans(trainerId);
      return ApiResponse.success(res, plans, 'Trainer workout plans retrieved successfully.');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/workouts/client/:memberId
   */
  async getClientWorkoutPlan(req, res, next) {
    try {
      const trainerId = req.user.id;
      const memberId = parseInt(req.params.memberId, 10);
      const plan = await workoutService.getClientPlanForTrainer(trainerId, memberId);
      return ApiResponse.success(res, plan, 'Client workout plan retrieved successfully.');
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/workouts
   */
  async createWorkoutPlan(req, res, next) {
    try {
      const trainerId = req.user.id;
      const { memberId, title, goal, difficulty, notes, isActive, days } = req.body;
      const plan = await workoutService.createWorkoutPlan({
        trainerId,
        memberId,
        title,
        goal,
        difficulty,
        notes,
        isActive,
        days,
      });
      return ApiResponse.created(res, plan, 'Workout plan created and assigned successfully.');
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/workouts/:id
   */
  async updateWorkoutPlan(req, res, next) {
    try {
      const trainerId = req.user.id;
      const planId = parseInt(req.params.id, 10);
      const { title, goal, difficulty, notes, isActive, days } = req.body;
      const updated = await workoutService.updateWorkoutPlan(planId, trainerId, {
        title,
        goal,
        difficulty,
        notes,
        isActive,
        days,
      });
      return ApiResponse.success(res, updated, 'Workout plan updated successfully.');
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/workouts/:id
   */
  async deleteWorkoutPlan(req, res, next) {
    try {
      const trainerId = req.user.id;
      const planId = parseInt(req.params.id, 10);
      const result = await workoutService.deleteWorkoutPlan(planId, trainerId);
      return ApiResponse.success(res, result, 'Workout plan deleted successfully.');
    } catch (err) {
      next(err);
    }
  },
};
