import mysql from 'mysql2/promise';
import { env } from '../src/config/env.js';

/**
 * Idempotent migration script for Milestone 6.3 (Workout Plan Management Subsystem).
 * Safe to run against both local MySQL and TiDB Cloud Serverless without dropping existing data.
 */
async function runMigration() {
  console.log(`\n======================================================`);
  console.log(`📦  GymPilot Milestone 6.3 Migration: Workout Plan Management`);
  console.log(`    Target Database: '${env.db.name}' on ${env.db.host}:${env.db.port}`);
  console.log(`======================================================\n`);

  let connection;
  try {
    connection = await mysql.createConnection({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.name,
      ssl: env.db.ssl,
      timezone: env.db.timezone,
    });

    console.log(`🔌  Connected to database successfully.`);

    // 1. Create `exercises` table if not exists
    console.log(`\n1️⃣  Checking 'exercises' table...`);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS exercises (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        name VARCHAR(150) NOT NULL,
        muscle_group ENUM('chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'full_body', 'cardio') NOT NULL,
        equipment VARCHAR(100) NULL DEFAULT NULL,
        category VARCHAR(100) NULL DEFAULT NULL,
        is_custom BOOLEAN NOT NULL DEFAULT FALSE,
        created_by_trainer_id BIGINT UNSIGNED NULL DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_exercise_trainer
          FOREIGN KEY (created_by_trainer_id) REFERENCES users (id)
          ON DELETE SET NULL
          ON UPDATE CASCADE,
        INDEX idx_exercise_muscle (muscle_group),
        INDEX idx_exercise_custom_trainer (is_custom, created_by_trainer_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log(`✅  'exercises' table ready.`);

    // 2. Create `workout_plans` table if not exists
    console.log(`\n2️⃣  Checking 'workout_plans' table...`);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS workout_plans (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        trainer_id BIGINT UNSIGNED NOT NULL,
        member_id BIGINT UNSIGNED NOT NULL,
        title VARCHAR(200) NOT NULL,
        goal VARCHAR(255) NULL DEFAULT NULL,
        difficulty ENUM('beginner', 'intermediate', 'advanced') NOT NULL DEFAULT 'intermediate',
        notes TEXT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_plan_trainer
          FOREIGN KEY (trainer_id) REFERENCES users (id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        CONSTRAINT fk_plan_member
          FOREIGN KEY (member_id) REFERENCES users (id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        INDEX idx_plan_member_active (member_id, is_active),
        INDEX idx_plan_trainer (trainer_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log(`✅  'workout_plans' table ready.`);

    // 3. Create `workout_plan_days` table if not exists
    console.log(`\n3️⃣  Checking 'workout_plan_days' table...`);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS workout_plan_days (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        plan_id BIGINT UNSIGNED NOT NULL,
        day_number INT UNSIGNED NOT NULL DEFAULT 1,
        day_name VARCHAR(150) NOT NULL,
        warmup_notes TEXT NULL,
        order_index INT UNSIGNED NOT NULL DEFAULT 0,
        PRIMARY KEY (id),
        CONSTRAINT fk_day_plan
          FOREIGN KEY (plan_id) REFERENCES workout_plans (id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        INDEX idx_day_plan_order (plan_id, order_index)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log(`✅  'workout_plan_days' table ready.`);

    // 4. Create `workout_plan_exercises` table if not exists
    console.log(`\n4️⃣  Checking 'workout_plan_exercises' table...`);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS workout_plan_exercises (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        day_id BIGINT UNSIGNED NOT NULL,
        exercise_id BIGINT UNSIGNED NULL DEFAULT NULL,
        custom_name VARCHAR(150) NULL DEFAULT NULL,
        sets INT UNSIGNED NOT NULL DEFAULT 3,
        reps VARCHAR(50) NOT NULL DEFAULT '10-12',
        rest_seconds INT UNSIGNED NOT NULL DEFAULT 60,
        notes VARCHAR(255) NULL DEFAULT NULL,
        order_index INT UNSIGNED NOT NULL DEFAULT 0,
        PRIMARY KEY (id),
        CONSTRAINT fk_wpe_day
          FOREIGN KEY (day_id) REFERENCES workout_plan_days (id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        CONSTRAINT fk_wpe_exercise
          FOREIGN KEY (exercise_id) REFERENCES exercises (id)
          ON DELETE SET NULL
          ON UPDATE CASCADE,
        INDEX idx_wpe_day_order (day_id, order_index)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log(`✅  'workout_plan_exercises' table ready.`);

    // 5. Populate standard exercises if empty (wrapped in transaction)
    const [existingExercises] = await connection.query(`SELECT COUNT(*) AS cnt FROM exercises WHERE is_custom = FALSE`);
    if (existingExercises[0].cnt === 0) {
      console.log(`\n🌱  Seeding 28 standard exercise movements...`);
      const standardExercises = [
        // Chest
        ['Barbell Bench Press', 'chest', 'Barbell', 'Free Weight'],
        ['Incline Dumbbell Press', 'chest', 'Dumbbells', 'Free Weight'],
        ['Cable Chest Flyes', 'chest', 'Cable Machine', 'Isolation'],
        ['Push-ups', 'chest', 'Bodyweight', 'Calisthenics'],
        ['Dips (Chest Focus)', 'chest', 'Dip Station', 'Bodyweight'],
        // Back
        ['Deadlift', 'back', 'Barbell', 'Compound'],
        ['Barbell Bent-Over Row', 'back', 'Barbell', 'Compound'],
        ['Lat Pulldown', 'back', 'Cable Machine', 'Machine'],
        ['Seated Cable Row', 'back', 'Cable Machine', 'Machine'],
        ['Pull-ups', 'back', 'Pull-up Bar', 'Bodyweight'],
        // Legs
        ['Barbell Back Squat', 'legs', 'Barbell', 'Compound'],
        ['Leg Press', 'legs', 'Machine', 'Compound'],
        ['Romanian Deadlift (RDL)', 'legs', 'Barbell/Dumbbells', 'Free Weight'],
        ['Bulgarian Split Squat', 'legs', 'Dumbbells', 'Unilateral'],
        ['Leg Extensions', 'legs', 'Machine', 'Isolation'],
        ['Lying Leg Curls', 'legs', 'Machine', 'Isolation'],
        ['Standing Calf Raises', 'legs', 'Machine', 'Isolation'],
        // Shoulders
        ['Overhead Barbell Shoulder Press', 'shoulders', 'Barbell', 'Compound'],
        ['Dumbbell Lateral Raises', 'shoulders', 'Dumbbells', 'Isolation'],
        ['Face Pulls', 'shoulders', 'Cable Machine', 'Isolation'],
        ['Rear Delt Flyes', 'shoulders', 'Dumbbells/Machine', 'Isolation'],
        // Arms
        ['Barbell Bicep Curls', 'arms', 'Barbell', 'Isolation'],
        ['Incline Dumbbell Curls', 'arms', 'Dumbbells', 'Isolation'],
        ['Tricep Rope Pushdown', 'arms', 'Cable Machine', 'Isolation'],
        ['Skull Crushers', 'arms', 'EZ Bar', 'Isolation'],
        ['Hammer Curls', 'arms', 'Dumbbells', 'Isolation'],
        // Core
        ['Hanging Leg Raises', 'core', 'Pull-up Bar', 'Calisthenics'],
        ['Plank', 'core', 'Bodyweight', 'Isometric'],
      ];

      await connection.beginTransaction();
      try {
        for (const [name, muscle, equip, cat] of standardExercises) {
          await connection.query(
            `INSERT INTO exercises (name, muscle_group, equipment, category, is_custom) VALUES (?, ?, ?, ?, FALSE)`,
            [name, muscle, equip, cat]
          );
        }
        await connection.commit();
        console.log(`✅  Successfully seeded 28 standard exercises.`);
      } catch (err) {
        await connection.rollback();
        console.error(`❌  Failed to seed standard exercises. Rolled back.`);
        throw err;
      }
    } else {
      console.log(`ℹ️  Standard exercises already present (${existingExercises[0].cnt} items). Skipping seed.`);
    }

    // Optional demo seed if `--seed` passed
    const shouldSeed = process.argv.includes('--seed');
    if (shouldSeed) {
      console.log(`\n🌱  Seed flag passed. Checking demo workout plans...`);
      const [existingPlans] = await connection.query(`SELECT COUNT(*) AS cnt FROM workout_plans`);
      if (existingPlans[0].cnt === 0) {
        // Find Trainer Alex (id: 2) and assigned Member Rahul (id: 5)
        const [trainerAlex] = await connection.query(`SELECT id FROM users WHERE email = 'trainer.alex@gympilot.com' LIMIT 1`);
        const [memberRahul] = await connection.query(`SELECT id FROM users WHERE email = 'rahul.sharma@gmail.com' LIMIT 1`);

        if (trainerAlex.length > 0 && memberRahul.length > 0) {
          const tId = trainerAlex[0].id;
          const mId = memberRahul[0].id;

          const [planRes] = await connection.query(
            `INSERT INTO workout_plans (trainer_id, member_id, title, goal, difficulty, notes, is_active)
             VALUES (?, ?, 'Hypertrophy 3-Day Push/Pull/Legs Split', 'Muscle Gain & Strength Foundation', 'intermediate', 'Focus on 2-second negative eccentric tempo on compound movements. Rest 90-120s between heavy sets.', TRUE)`,
            [tId, mId]
          );
          const planId = planRes.insertId;

          // Day 1 - Push
          const [d1] = await connection.query(
            `INSERT INTO workout_plan_days (plan_id, day_number, day_name, warmup_notes, order_index)
             VALUES (?, 1, 'Day 1 - Push Focus (Chest, Shoulders, Triceps)', '5 mins rowing machine + band pull-aparts & shoulder dislocates', 1)`,
            [planId]
          );
          // Day 2 - Pull
          const [d2] = await connection.query(
            `INSERT INTO workout_plan_days (plan_id, day_number, day_name, warmup_notes, order_index)
             VALUES (?, 2, 'Day 2 - Pull Focus (Back, Biceps, Rear Delts)', '5 mins jump rope + dead hangs & light scapular pulls', 2)`,
            [planId]
          );
          // Day 3 - Legs & Core
          const [d3] = await connection.query(
            `INSERT INTO workout_plan_days (plan_id, day_number, day_name, warmup_notes, order_index)
             VALUES (?, 3, 'Day 3 - Legs & Core (Squats & Posterior Chain)', '5 mins stationary bike + hip 90/90 mobility & bodyweight squats', 3)`,
            [planId]
          );

          // Get exercise IDs
          const [bench] = await connection.query(`SELECT id FROM exercises WHERE name = 'Barbell Bench Press' LIMIT 1`);
          const [incPress] = await connection.query(`SELECT id FROM exercises WHERE name = 'Incline Dumbbell Press' LIMIT 1`);
          const [latRaise] = await connection.query(`SELECT id FROM exercises WHERE name = 'Dumbbell Lateral Raises' LIMIT 1`);
          const [triPush] = await connection.query(`SELECT id FROM exercises WHERE name = 'Tricep Rope Pushdown' LIMIT 1`);

          const [deadlift] = await connection.query(`SELECT id FROM exercises WHERE name = 'Deadlift' LIMIT 1`);
          const [latPull] = await connection.query(`SELECT id FROM exercises WHERE name = 'Lat Pulldown' LIMIT 1`);
          const [bbRow] = await connection.query(`SELECT id FROM exercises WHERE name = 'Barbell Bent-Over Row' LIMIT 1`);
          const [bicep] = await connection.query(`SELECT id FROM exercises WHERE name = 'Barbell Bicep Curls' LIMIT 1`);

          const [squat] = await connection.query(`SELECT id FROM exercises WHERE name = 'Barbell Back Squat' LIMIT 1`);
          const [rdl] = await connection.query(`SELECT id FROM exercises WHERE name = 'Romanian Deadlift (RDL)' LIMIT 1`);
          const [plank] = await connection.query(`SELECT id FROM exercises WHERE name = 'Plank' LIMIT 1`);

          // Insert Day 1 exercises
          if (bench[0]) await connection.query(`INSERT INTO workout_plan_exercises (day_id, exercise_id, sets, reps, rest_seconds, notes, order_index) VALUES (?, ?, 4, '8-10', 90, 'Pyramid weight on sets 3 & 4', 1)`, [d1.insertId, bench[0].id]);
          if (incPress[0]) await connection.query(`INSERT INTO workout_plan_exercises (day_id, exercise_id, sets, reps, rest_seconds, notes, order_index) VALUES (?, ?, 3, '10-12', 60, 'Keep 30-degree bench incline', 2)`, [d1.insertId, incPress[0].id]);
          if (latRaise[0]) await connection.query(`INSERT INTO workout_plan_exercises (day_id, exercise_id, sets, reps, rest_seconds, notes, order_index) VALUES (?, ?, 4, '15', 45, 'Control the negative, do not swing', 3)`, [d1.insertId, latRaise[0].id]);
          if (triPush[0]) await connection.query(`INSERT INTO workout_plan_exercises (day_id, exercise_id, sets, reps, rest_seconds, notes, order_index) VALUES (?, ?, 3, '12-15', 45, 'Spread rope at contraction', 4)`, [d1.insertId, triPush[0].id]);

          // Insert Day 2 exercises
          if (deadlift[0]) await connection.query(`INSERT INTO workout_plan_exercises (day_id, exercise_id, sets, reps, rest_seconds, notes, order_index) VALUES (?, ?, 3, '5', 120, 'Conventional stance, brace core', 1)`, [d2.insertId, deadlift[0].id]);
          if (bbRow[0]) await connection.query(`INSERT INTO workout_plan_exercises (day_id, exercise_id, sets, reps, rest_seconds, notes, order_index) VALUES (?, ?, 4, '8-10', 75, 'Pull elbows toward hip pockets', 2)`, [d2.insertId, bbRow[0].id]);
          if (latPull[0]) await connection.query(`INSERT INTO workout_plan_exercises (day_id, exercise_id, sets, reps, rest_seconds, notes, order_index) VALUES (?, ?, 3, '10-12', 60, 'Squeeze lats at bottom', 3)`, [d2.insertId, latPull[0].id]);
          if (bicep[0]) await connection.query(`INSERT INTO workout_plan_exercises (day_id, exercise_id, sets, reps, rest_seconds, notes, order_index) VALUES (?, ?, 3, '10-12', 60, 'Strict form, no hip momentum', 4)`, [d2.insertId, bicep[0].id]);

          // Insert Day 3 exercises
          if (squat[0]) await connection.query(`INSERT INTO workout_plan_exercises (day_id, exercise_id, sets, reps, rest_seconds, notes, order_index) VALUES (?, ?, 4, '6-8', 120, 'Hit parallel depth with control', 1)`, [d3.insertId, squat[0].id]);
          if (rdl[0]) await connection.query(`INSERT INTO workout_plan_exercises (day_id, exercise_id, sets, reps, rest_seconds, notes, order_index) VALUES (?, ?, 3, '10', 90, 'Hinge at hips, soft knees', 2)`, [d3.insertId, rdl[0].id]);
          if (plank[0]) await connection.query(`INSERT INTO workout_plan_exercises (day_id, exercise_id, sets, reps, rest_seconds, notes, order_index) VALUES (?, ?, 3, '45-60s', 45, 'Glutes and core locked tight', 3)`, [d3.insertId, plank[0].id]);

          console.log(`✅  Seeded demo 3-day PPL workout plan for Rahul Sharma (assigned to Trainer Alex).`);
        }
      }
    }

    console.log(`\n🎉  Milestone 6.3 Workout Plan Migration completed successfully!`);
    process.exit(0);
  } catch (err) {
    console.error(`\n❌  Migration Error:`, err);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();
