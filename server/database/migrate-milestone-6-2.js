import mysql from 'mysql2/promise';
import { env } from '../src/config/env.js';

/**
 * Idempotent migration script for Milestone 6.2 (Attendance Management System).
 * Safe to run against both local MySQL and TiDB Cloud Serverless without dropping data.
 */
async function runMigration() {
  console.log(`\n======================================================`);
  console.log(`📦  GymPilot Milestone 6.2 Migration: Attendance Management`);
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

    // 1. Create `attendance_records` table if not exists
    console.log(`\n1️⃣  Checking 'attendance_records' table...`);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        member_id BIGINT UNSIGNED NOT NULL,
        subscription_id BIGINT UNSIGNED NULL DEFAULT NULL,
        check_in_time DATETIME NOT NULL,
        check_out_time DATETIME NULL DEFAULT NULL,
        duration_minutes INT UNSIGNED NULL DEFAULT NULL,
        recorded_by_id BIGINT UNSIGNED NOT NULL,
        status ENUM('CHECKED_IN', 'CHECKED_OUT') NOT NULL DEFAULT 'CHECKED_IN',
        pass_status_at_checkin ENUM('ACTIVE_PASS', 'EXPIRED_PASS', 'NO_PASS') NOT NULL DEFAULT 'ACTIVE_PASS',
        override_note TEXT NULL,
        notes TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_att_member
          FOREIGN KEY (member_id) REFERENCES users (id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        CONSTRAINT fk_att_subscription
          FOREIGN KEY (subscription_id) REFERENCES subscriptions (id)
          ON DELETE SET NULL
          ON UPDATE CASCADE,
        CONSTRAINT fk_att_recorded_by
          FOREIGN KEY (recorded_by_id) REFERENCES users (id)
          ON DELETE RESTRICT
          ON UPDATE CASCADE,
        INDEX idx_att_member_date (member_id, check_in_time),
        INDEX idx_att_status_checkin (status, check_in_time),
        INDEX idx_att_checkin_date (check_in_time)
      ) ENGINE=InnoDB;
    `);
    console.log(`    ✅ 'attendance_records' table verified/created.`);

    // 2. Optional demo seed (opt-in via --seed flag; canonical seed is in seeds.sql)
    const shouldSeed = process.argv.includes('--seed');
    const [attRows] = await connection.query(`SELECT COUNT(*) AS count FROM attendance_records`);
    if (shouldSeed && attRows[0].count === 0) {
      console.log(`\n2️⃣  Seeding initial demo attendance records...`);

      // Dynamically resolve existing subscription IDs to avoid FK violations across environments
      const [m5Subs] = await connection.query(`SELECT id FROM subscriptions WHERE user_id = 5 ORDER BY id ASC LIMIT 1`);
      const [m6Subs] = await connection.query(`SELECT id FROM subscriptions WHERE user_id = 6 ORDER BY id ASC LIMIT 1`);
      const [m7Subs] = await connection.query(`SELECT id FROM subscriptions WHERE user_id = 7 ORDER BY id ASC LIMIT 1`);
      const [m9Subs] = await connection.query(`SELECT id FROM subscriptions WHERE user_id = 9 ORDER BY id ASC LIMIT 1`);

      const sub5 = m5Subs[0]?.id || null;
      const sub6 = m6Subs[0]?.id || null;
      const sub7 = m7Subs[0]?.id || null;
      const sub9 = m9Subs[0]?.id || null;

      await connection.query(`
        INSERT INTO attendance_records 
          (id, member_id, subscription_id, check_in_time, check_out_time, duration_minutes, recorded_by_id, status, pass_status_at_checkin, override_note, notes)
        VALUES
          -- 6 Days Ago
          (1, 5, ?, DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 9 HOUR, DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 10 HOUR + INTERVAL 15 MINUTE, 75, 1, 'CHECKED_OUT', 'ACTIVE_PASS', NULL, 'Heavy leg workout'),
          (2, 6, ?, DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 17 HOUR, DATE_SUB(NOW(), INTERVAL 6 DAY) + INTERVAL 18 HOUR + INTERVAL 5 MINUTE, 65, 1, 'CHECKED_OUT', 'ACTIVE_PASS', NULL, 'Cardio and mobility'),

          -- 5 Days Ago
          (3, 5, ?, DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 8 HOUR + INTERVAL 30 MINUTE, DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 10 HOUR, 90, 1, 'CHECKED_OUT', 'ACTIVE_PASS', NULL, 'Push day progression'),
          (4, 9, ?, DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 18 HOUR, DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 19 HOUR + INTERVAL 10 MINUTE, 70, 1, 'CHECKED_OUT', 'ACTIVE_PASS', NULL, 'CrossFit session'),

          -- 4 Days Ago
          (5, 6, ?, DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 10 HOUR, DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 11 HOUR + INTERVAL 15 MINUTE, 75, 1, 'CHECKED_OUT', 'ACTIVE_PASS', NULL, 'Upper body resistance'),
          (6, 7, ?, DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 11 HOUR, DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 12 HOUR, 60, 1, 'CHECKED_OUT', 'EXPIRED_PASS', 'Trial session with coach permission', 'Guest visit with Sarah'),

          -- 3 Days Ago
          (7, 5, ?, DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 9 HOUR, DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 10 HOUR + INTERVAL 20 MINUTE, 80, 1, 'CHECKED_OUT', 'ACTIVE_PASS', NULL, 'Back and biceps'),
          (8, 9, ?, DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 17 HOUR + INTERVAL 30 MINUTE, DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 19 HOUR, 90, 1, 'CHECKED_OUT', 'ACTIVE_PASS', NULL, 'WOD and Olympic lifting'),

          -- 2 Days Ago
          (9, 5, ?, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 8 HOUR + INTERVAL 45 MINUTE, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 10 HOUR, 75, 1, 'CHECKED_OUT', 'ACTIVE_PASS', NULL, 'Shoulders and core'),
          (10, 6, ?, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 18 HOUR, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 19 HOUR + INTERVAL 15 MINUTE, 75, 1, 'CHECKED_OUT', 'ACTIVE_PASS', NULL, 'Functional conditioning'),

          -- Yesterday
          (11, 5, ?, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 9 HOUR, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 10 HOUR + INTERVAL 30 MINUTE, 90, 1, 'CHECKED_OUT', 'ACTIVE_PASS', NULL, 'Deadlifts and accessories'),
          (12, 9, ?, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 17 HOUR, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 18 HOUR + INTERVAL 20 MINUTE, 80, 1, 'CHECKED_OUT', 'ACTIVE_PASS', NULL, 'High intensity circuit'),

          -- Today: 1 completed session, 1 currently active session
          (13, 6, ?, NOW() - INTERVAL 3 HOUR, NOW() - INTERVAL 1 HOUR - INTERVAL 50 MINUTE, 70, 1, 'CHECKED_OUT', 'ACTIVE_PASS', NULL, 'Morning cardio check-in'),
          (14, 5, ?, NOW() - INTERVAL 45 MINUTE, NULL, NULL, 1, 'CHECKED_IN', 'ACTIVE_PASS', NULL, 'Currently training on main floor')
      `, [sub5, sub6, sub5, sub9, sub6, sub7, sub5, sub9, sub5, sub6, sub5, sub9, sub6, sub5]);
      console.log(`    ✅ Seeded 14 realistic demo attendance records across 7 days.`);
    } else {
      console.log(`    ℹ️  'attendance_records' already contains data (${attRows[0].count} records). Skipping seeding.`);
    }

    console.log(`\n🎉  Milestone 6.2 Database Migration completed successfully!\n`);
  } catch (error) {
    console.error(`\n❌  Migration failed:`, error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();
