import { pool } from '../config/db.js';

export const workoutRepository = {
  /**
   * List all available exercises.
   * Returns standard catalog (is_custom = FALSE) plus any custom exercises created by this trainer.
   */
  async findAllExercises({ muscleGroup = null, search = null, trainerId = null } = {}, connection = pool) {
    let sql = `
      SELECT 
        e.id,
        e.name,
        e.muscle_group AS muscleGroup,
        e.equipment,
        e.category,
        e.is_custom AS isCustom,
        e.created_by_trainer_id AS createdByTrainerId,
        e.created_at AS createdAt
      FROM exercises e
      WHERE (e.is_custom = FALSE OR e.created_by_trainer_id = ?)
    `;
    const params = [trainerId || 0];

    if (muscleGroup && muscleGroup !== 'all') {
      sql += ` AND e.muscle_group = ?`;
      params.push(muscleGroup);
    }

    if (search && search.trim()) {
      sql += ` AND e.name LIKE ?`;
      params.push(`%${search.trim()}%`);
    }

    sql += ` ORDER BY e.is_custom ASC, e.muscle_group ASC, e.name ASC`;

    const [rows] = await connection.query(sql, params);
    return rows;
  },

  /**
   * Create a custom exercise by a trainer.
   */
  async createCustomExercise({ name, muscleGroup, equipment = null, category = null, trainerId }, connection = pool) {
    const [res] = await connection.query(
      `INSERT INTO exercises (name, muscle_group, equipment, category, is_custom, created_by_trainer_id)
       VALUES (?, ?, ?, ?, TRUE, ?)`,
      [name.trim(), muscleGroup, equipment ? equipment.trim() : null, category ? category.trim() : null, trainerId]
    );

    const [created] = await connection.query(
      `SELECT id, name, muscle_group AS muscleGroup, equipment, category, is_custom AS isCustom,
              created_by_trainer_id AS createdByTrainerId, created_at AS createdAt
       FROM exercises WHERE id = ?`,
      [res.insertId]
    );
    return created[0];
  },

  /**
   * Find a single workout plan by ID, assembling days and exercises into a structured hierarchy.
   */
  async findPlanById(id, connection = pool) {
    const [planRows] = await connection.query(
      `SELECT 
        wp.id,
        wp.trainer_id AS trainerId,
        wp.member_id AS memberId,
        wp.title,
        wp.goal,
        wp.difficulty,
        wp.notes,
        wp.is_active AS isActive,
        wp.created_at AS createdAt,
        wp.updated_at AS updatedAt,
        CONCAT(u_trainer.first_name, ' ', u_trainer.last_name) AS trainerName,
        u_trainer.email AS trainerEmail,
        CONCAT(u_member.first_name, ' ', u_member.last_name) AS memberName,
        u_member.email AS memberEmail
      FROM workout_plans wp
      JOIN users u_trainer ON wp.trainer_id = u_trainer.id
      JOIN users u_member ON wp.member_id = u_member.id
      WHERE wp.id = ?`,
      [id]
    );

    if (planRows.length === 0) return null;
    const plan = planRows[0];

    // Fetch days
    const [dayRows] = await connection.query(
      `SELECT 
        id,
        plan_id AS planId,
        day_number AS dayNumber,
        day_name AS dayName,
        warmup_notes AS warmupNotes,
        order_index AS orderIndex
      FROM workout_plan_days
      WHERE plan_id = ?
      ORDER BY order_index ASC, day_number ASC`,
      [id]
    );

    if (dayRows.length === 0) {
      plan.days = [];
      return plan;
    }

    const dayIds = dayRows.map((d) => d.id);
    const [exerciseRows] = await connection.query(
      `SELECT 
        wpe.id,
        wpe.day_id AS dayId,
        wpe.exercise_id AS exerciseId,
        COALESCE(wpe.custom_name, e.name) AS exerciseName,
        e.muscle_group AS muscleGroup,
        e.equipment,
        wpe.sets,
        wpe.reps,
        wpe.rest_seconds AS restSeconds,
        wpe.notes,
        wpe.order_index AS orderIndex
      FROM workout_plan_exercises wpe
      LEFT JOIN exercises e ON wpe.exercise_id = e.id
      WHERE wpe.day_id IN (?)
      ORDER BY wpe.day_id ASC, wpe.order_index ASC, wpe.id ASC`,
      [dayIds]
    );

    const exercisesByDay = new Map();
    for (const ex of exerciseRows) {
      if (!exercisesByDay.has(ex.dayId)) {
        exercisesByDay.set(ex.dayId, []);
      }
      exercisesByDay.get(ex.dayId).push(ex);
    }

    plan.days = dayRows.map((day) => ({
      ...day,
      exercises: exercisesByDay.get(day.id) || [],
    }));

    return plan;
  },

  /**
   * Find the currently active workout plan for a member.
   */
  async findActivePlanByMemberId(memberId, connection = pool) {
    const [rows] = await connection.query(
      `SELECT id FROM workout_plans
       WHERE member_id = ? AND is_active = TRUE
       ORDER BY updated_at DESC, id DESC
       LIMIT 1`,
      [memberId]
    );

    if (rows.length === 0) return null;
    return this.findPlanById(rows[0].id, connection);
  },

  /**
   * Find all workout plans created by a trainer.
   */
  async findPlansByTrainerId(trainerId, connection = pool) {
    const [rows] = await connection.query(
      `SELECT 
        wp.id,
        wp.trainer_id AS trainerId,
        wp.member_id AS memberId,
        wp.title,
        wp.goal,
        wp.difficulty,
        wp.notes,
        wp.is_active AS isActive,
        wp.created_at AS createdAt,
        wp.updated_at AS updatedAt,
        CONCAT(u.first_name, ' ', u.last_name) AS memberName,
        u.email AS memberEmail,
        COUNT(DISTINCT wpd.id) AS daysCount,
        COUNT(wpe.id) AS totalExercisesCount
      FROM workout_plans wp
      JOIN users u ON wp.member_id = u.id
      LEFT JOIN workout_plan_days wpd ON wp.id = wpd.plan_id
      LEFT JOIN workout_plan_exercises wpe ON wpd.id = wpe.day_id
      WHERE wp.trainer_id = ?
      GROUP BY wp.id, u.id
      ORDER BY wp.is_active DESC, wp.updated_at DESC`,
      [trainerId]
    );

    return rows;
  },

  /**
   * Archive existing active plans for a member (sets is_active = FALSE).
   */
  async archiveActivePlansForMember(memberId, connection = pool) {
    await connection.query(
      `UPDATE workout_plans SET is_active = FALSE WHERE member_id = ? AND is_active = TRUE`,
      [memberId]
    );
  },

  /**
   * Insert new workout plan header.
   */
  async createPlanHeader({ trainerId, memberId, title, goal = null, difficulty = 'intermediate', notes = null, isActive = true }, connection = pool) {
    const [res] = await connection.query(
      `INSERT INTO workout_plans (trainer_id, member_id, title, goal, difficulty, notes, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [trainerId, memberId, title.trim(), goal ? goal.trim() : null, difficulty, notes ? notes.trim() : null, Boolean(isActive)]
    );
    return res.insertId;
  },

  /**
   * Bulk insert days and nested exercises.
   */
  async createPlanDaysWithExercises(planId, days = [], connection = pool) {
    for (let dIdx = 0; dIdx < days.length; dIdx++) {
      const day = days[dIdx];
      const dayNumber = day.dayNumber || dIdx + 1;
      const dayName = day.dayName || `Day ${dayNumber}`;
      const warmupNotes = day.warmupNotes || null;
      const orderIndex = day.orderIndex !== undefined ? day.orderIndex : dIdx + 1;

      const [dayRes] = await connection.query(
        `INSERT INTO workout_plan_days (plan_id, day_number, day_name, warmup_notes, order_index)
         VALUES (?, ?, ?, ?, ?)`,
        [planId, dayNumber, dayName.trim(), warmupNotes ? warmupNotes.trim() : null, orderIndex]
      );
      const dayId = dayRes.insertId;

      const exercises = Array.isArray(day.exercises) ? day.exercises : [];
      for (let eIdx = 0; eIdx < exercises.length; eIdx++) {
        const ex = exercises[eIdx];
        const exerciseId = ex.exerciseId || null;
        const customName = ex.customName || (!exerciseId && ex.exerciseName ? ex.exerciseName : null);
        const parsedSets = parseInt(ex.sets, 10);
        const sets = !isNaN(parsedSets) ? Math.max(1, parsedSets) : 3;
        const reps = ex.reps ? String(ex.reps).trim() : '10-12';
        const parsedRest = parseInt(ex.restSeconds, 10);
        const restSeconds = !isNaN(parsedRest) ? Math.max(0, parsedRest) : 60;
        const exNotes = ex.notes ? ex.notes.trim() : null;
        const exOrder = ex.orderIndex !== undefined ? ex.orderIndex : eIdx + 1;

        await connection.query(
          `INSERT INTO workout_plan_exercises (day_id, exercise_id, custom_name, sets, reps, rest_seconds, notes, order_index)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [dayId, exerciseId, customName, sets, reps, restSeconds, exNotes, exOrder]
        );
      }
    }
  },

  /**
   * Update plan header details.
   */
  async updatePlanHeader(id, { title, goal, difficulty, notes, isActive }, connection = pool) {
    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title.trim());
    }
    if (goal !== undefined) {
      updates.push('goal = ?');
      params.push(goal ? goal.trim() : null);
    }
    if (difficulty !== undefined) {
      updates.push('difficulty = ?');
      params.push(difficulty);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes ? notes.trim() : null);
    }
    if (isActive !== undefined) {
      updates.push('is_active = ?');
      params.push(Boolean(isActive));
    }

    if (updates.length > 0) {
      params.push(id);
      await connection.query(`UPDATE workout_plans SET ${updates.join(', ')} WHERE id = ?`, params);
    }
  },

  /**
   * Replace all days and exercises for a workout plan.
   */
  async replacePlanDaysAndExercises(planId, days = [], connection = pool) {
    // Delete existing days (cascades to exercises)
    await connection.query(`DELETE FROM workout_plan_days WHERE plan_id = ?`, [planId]);
    // Re-insert new days & exercises
    await this.createPlanDaysWithExercises(planId, days, connection);
  },

  /**
   * Delete a plan.
   */
  async deletePlan(id, connection = pool) {
    const [res] = await connection.query(`DELETE FROM workout_plans WHERE id = ?`, [id]);
    return res.affectedRows > 0;
  },
};
