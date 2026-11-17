import { Router } from 'express';
import { workoutController } from '../controllers/workoutController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/roleMiddleware.js';

const router = Router();

// All workout endpoints require authentication
router.use(verifyToken);

/**
 * Exercise Library Endpoints
 */
// List exercises (trainers and members can browse exercises)
router.get(
  '/exercises',
  requireRoles(['trainer', 'member', 'admin']),
  workoutController.getExercises
);

// Create custom exercise (trainer only)
router.post(
  '/exercises',
  requireRoles(['trainer', 'admin']),
  workoutController.createCustomExercise
);

/**
 * Member Workout Endpoints
 */
// Member retrieves their active assigned workout plan
router.get(
  '/my-plan',
  requireRoles(['member']),
  workoutController.getMyWorkoutPlan
);

/**
 * Trainer Workout Endpoints
 */
// Trainer retrieves all workout plans they authored
router.get(
  '/trainer/plans',
  requireRoles(['trainer']),
  workoutController.getTrainerPlans
);

// Trainer retrieves a specific assigned client's plan
router.get(
  '/client/:memberId',
  requireRoles(['trainer']),
  workoutController.getClientWorkoutPlan
);

// Trainer creates and assigns a workout plan to an athlete
router.post(
  '/',
  requireRoles(['trainer']),
  workoutController.createWorkoutPlan
);

// Trainer updates an existing workout plan
router.put(
  '/:id',
  requireRoles(['trainer']),
  workoutController.updateWorkoutPlan
);

// Trainer deletes a workout plan
router.delete(
  '/:id',
  requireRoles(['trainer']),
  workoutController.deleteWorkoutPlan
);

export default router;
