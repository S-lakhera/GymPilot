import { withTransaction } from '../config/db.js';
import { workoutRepository } from '../repositories/workoutRepository.js';
import { trainerAssignmentRepository } from '../repositories/trainerAssignmentRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { notificationService } from './notificationService.js';

const VALID_MUSCLE_GROUPS = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'full_body', 'cardio'];
const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

export const workoutService = {
  /**
   * Get exercise library movements.
   */
  async listExercises({ muscleGroup, search, trainerId } = {}) {
    return workoutRepository.findAllExercises({ muscleGroup, search, trainerId });
  },

  /**
   * Trainer creates a custom exercise movement.
   */
  async createCustomExercise({ name, muscleGroup, equipment, category, trainerId }) {
    if (!name || !name.trim()) {
      const err = new Error('Exercise name is required.');
      err.statusCode = 400;
      throw err;
    }

    if (!muscleGroup || !VALID_MUSCLE_GROUPS.includes(muscleGroup.toLowerCase())) {
      const err = new Error(`Invalid muscle group. Must be one of: ${VALID_MUSCLE_GROUPS.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    return workoutRepository.createCustomExercise({
      name: name.trim(),
      muscleGroup: muscleGroup.toLowerCase(),
      equipment,
      category,
      trainerId,
    });
  },

  /**
   * Member retrieves their own active workout plan.
   */
  async getMemberActivePlan(memberId) {
    return workoutRepository.findActivePlanByMemberId(memberId);
  },

  /**
   * Trainer retrieves all plans they have authored.
   */
  async getTrainerPlans(trainerId) {
    return workoutRepository.findPlansByTrainerId(trainerId);
  },

  /**
   * Trainer inspects workout plan of a specific assigned client.
   */
  async getClientPlanForTrainer(trainerId, memberId) {
    // Verify trainer is assigned to this member
    const assignment = await trainerAssignmentRepository.findActiveByMemberId(memberId);
    if (!assignment || Number(assignment.trainer_id) !== Number(trainerId)) {
      const err = new Error('You are not authorized to view this member’s workout plan.');
      err.statusCode = 403;
      throw err;
    }

    return workoutRepository.findActivePlanByMemberId(memberId);
  },

  /**
   * Trainer retrieves a specific workout plan by ID.
   */
  async getPlanByIdForTrainer(id, trainerId) {
    const plan = await workoutRepository.findPlanById(id);
    if (!plan) {
      const err = new Error('Workout plan not found.');
      err.statusCode = 404;
      throw err;
    }

    if (Number(plan.trainerId) !== Number(trainerId)) {
      const err = new Error('You do not have permission to view this workout plan.');
      err.statusCode = 403;
      throw err;
    }

    return plan;
  },

  /**
   * Trainer creates and assigns a workout plan to an athlete.
   */
  async createWorkoutPlan({
    trainerId,
    memberId,
    title,
    goal = null,
    difficulty = 'intermediate',
    notes = null,
    isActive = true,
    days = [],
  }) {
    if (!memberId) {
      const err = new Error('Target athlete memberId is required.');
      err.statusCode = 400;
      throw err;
    }

    if (!title || title.trim().length < 3) {
      const err = new Error('Workout plan title must be at least 3 characters.');
      err.statusCode = 400;
      throw err;
    }

    if (difficulty && !VALID_DIFFICULTIES.includes(difficulty.toLowerCase())) {
      const err = new Error(`Difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    // Validate days & exercises
    if (!Array.isArray(days) || days.length === 0) {
      const err = new Error('Workout plan must contain at least 1 day split.');
      err.statusCode = 400;
      throw err;
    }

    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      if (!day.dayName || !day.dayName.trim()) {
        const err = new Error(`Day ${i + 1} must have a name (e.g. 'Push Focus').`);
        err.statusCode = 400;
        throw err;
      }
      if (!Array.isArray(day.exercises) || day.exercises.length === 0) {
        const err = new Error(`Day '${day.dayName}' must contain at least 1 exercise.`);
        err.statusCode = 400;
        throw err;
      }
      for (let j = 0; j < day.exercises.length; j++) {
        const ex = day.exercises[j];
        if (!ex.exerciseId && (!ex.customName || !ex.customName.trim()) && (!ex.exerciseName || !ex.exerciseName.trim())) {
          const err = new Error(`Exercise ${j + 1} on Day '${day.dayName}' must have a valid exercise selected or a custom name.`);
          err.statusCode = 400;
          throw err;
        }
      }
    }

    // Verify trainer-client assignment
    const assignment = await trainerAssignmentRepository.findActiveByMemberId(memberId);
    if (!assignment || Number(assignment.trainer_id) !== Number(trainerId)) {
      const err = new Error('You can only create workout plans for athletes currently assigned to you.');
      err.statusCode = 403;
      throw err;
    }

    const normalizedIsActive = isActive === undefined ? true : Boolean(isActive);

    return withTransaction(async (conn) => {
      // 1. Single active plan guarantee: Archive previous active plans for this member if new plan is active
      if (normalizedIsActive) {
        await workoutRepository.archiveActivePlansForMember(memberId, conn);
      }

      // 2. Create plan header
      const planId = await workoutRepository.createPlanHeader(
        {
          trainerId,
          memberId,
          title: title.trim(),
          goal: goal ? goal.trim() : null,
          difficulty: difficulty.toLowerCase(),
          notes: notes ? notes.trim() : null,
          isActive: normalizedIsActive,
        },
        conn
      );

      // 3. Create days with nested exercises
      await workoutRepository.createPlanDaysWithExercises(planId, days, conn);

      // 4. Notify member if active
      if (normalizedIsActive) {
        let trainerName = null;
        try {
          const trainerUser = await userRepository.findById(trainerId, conn);
          if (trainerUser) {
            trainerName = `${trainerUser.first_name} ${trainerUser.last_name}`.trim();
          }
        } catch (_) {}

        await notificationService.notifyWorkoutPlanAssigned(
          {
            memberId,
            trainerId,
            planId,
            planTitle: title.trim(),
            trainerName,
          },
          conn
        );
      }

      // 5. Return populated plan hierarchy
      return workoutRepository.findPlanById(planId, conn);
    });
  },

  /**
   * Trainer updates an existing workout plan.
   */
  async updateWorkoutPlan(id, trainerId, { title, goal, difficulty, notes, isActive, days }) {
    const existing = await workoutRepository.findPlanById(id);
    if (!existing) {
      const err = new Error('Workout plan not found.');
      err.statusCode = 404;
      throw err;
    }

    if (Number(existing.trainerId) !== Number(trainerId)) {
      const err = new Error('You do not have permission to modify this workout plan.');
      err.statusCode = 403;
      throw err;
    }

    if (difficulty && !VALID_DIFFICULTIES.includes(difficulty.toLowerCase())) {
      const err = new Error(`Difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    if (days !== undefined) {
      if (!Array.isArray(days) || days.length === 0) {
        const err = new Error('Workout plan must contain at least 1 day split.');
        err.statusCode = 400;
        throw err;
      }
      for (let i = 0; i < days.length; i++) {
        const day = days[i];
        if (!day.dayName || !day.dayName.trim()) {
          const err = new Error(`Day ${i + 1} must have a name.`);
          err.statusCode = 400;
          throw err;
        }
        if (!Array.isArray(day.exercises) || day.exercises.length === 0) {
          const err = new Error(`Day '${day.dayName}' must contain at least 1 exercise.`);
          err.statusCode = 400;
          throw err;
        }
        for (let j = 0; j < day.exercises.length; j++) {
          const ex = day.exercises[j];
          if (!ex.exerciseId && (!ex.customName || !ex.customName.trim()) && (!ex.exerciseName || !ex.exerciseName.trim())) {
            const err = new Error(`Exercise ${j + 1} on Day '${day.dayName}' must have a valid exercise selected or a custom name.`);
            err.statusCode = 400;
            throw err;
          }
        }
      }
    }

    const normalizedIsActive = isActive !== undefined ? Boolean(isActive) : undefined;

    return withTransaction(async (conn) => {
      // Verify trainer-client assignment with row lock before any plan writes
      const assignment = await trainerAssignmentRepository.findActiveByMemberId(existing.memberId, conn, true);
      if (!assignment || Number(assignment.trainer_id) !== Number(trainerId)) {
        const err = new Error('You can only modify workout plans for athletes currently assigned to you.');
        err.statusCode = 403;
        throw err;
      }

      // If activating this plan, archive any other active plans for this member
      if (normalizedIsActive === true) {
        await workoutRepository.archiveActivePlansForMember(existing.memberId, conn);
      }

      await workoutRepository.updatePlanHeader(
        id,
        {
          title,
          goal,
          difficulty: difficulty ? difficulty.toLowerCase() : undefined,
          notes,
          isActive: normalizedIsActive,
        },
        conn
      );

      if (days !== undefined) {
        await workoutRepository.replacePlanDaysAndExercises(id, days, conn);
      }

      return workoutRepository.findPlanById(id, conn);
    });
  },

  /**
   * Trainer deletes a workout plan.
   */
  async deleteWorkoutPlan(id, trainerId) {
    const existing = await workoutRepository.findPlanById(id);
    if (!existing) {
      const err = new Error('Workout plan not found.');
      err.statusCode = 404;
      throw err;
    }

    if (Number(existing.trainerId) !== Number(trainerId)) {
      const err = new Error('You do not have permission to delete this workout plan.');
      err.statusCode = 403;
      throw err;
    }

    // Verify trainer-client assignment
    const assignment = await trainerAssignmentRepository.findActiveByMemberId(existing.memberId);
    if (!assignment || Number(assignment.trainer_id) !== Number(trainerId)) {
      const err = new Error('You can only delete workout plans for athletes currently assigned to you.');
      err.statusCode = 403;
      throw err;
    }

    await workoutRepository.deletePlan(id);
    return { id, deleted: true };
  },
};
