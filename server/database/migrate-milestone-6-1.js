import mysql from 'mysql2/promise';
import { env } from '../src/config/env.js';

/**
 * Idempotent migration script for Milestone 6.1 (Trainer-Member Assignment System).
 * Safe to run against both local MySQL and TiDB Cloud without dropping existing data.
 */
async function runMigration() {
  console.log(`\n======================================================`);
  console.log(`📦  GymPilot Milestone 6.1 Migration`);
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

    // 1. Check and add `max_clients` to `trainer_profiles`
    console.log(`\n1️⃣  Checking 'trainer_profiles.max_clients' column...`);
    const [columnCheck] = await connection.query(
      `SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'trainer_profiles' AND COLUMN_NAME = 'max_clients'`,
      [env.db.name]
    );

    if (columnCheck[0].count === 0) {
      await connection.query(
        `ALTER TABLE trainer_profiles
         ADD COLUMN max_clients INT UNSIGNED NOT NULL DEFAULT 10 AFTER monthly_salary`
      );
      console.log(`    ✅ Added 'max_clients' column with default value of 10.`);
    } else {
      console.log(`    ℹ️  'max_clients' column already exists. Skipping.`);
    }

    // 1b. Check and add `gender` to `trainer_profiles`
    console.log(`\n1️⃣b Checking 'trainer_profiles.gender' column...`);
    const [genderCheck] = await connection.query(
      `SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'trainer_profiles' AND COLUMN_NAME = 'gender'`,
      [env.db.name]
    );

    if (genderCheck[0].count === 0) {
      await connection.query(
        `ALTER TABLE trainer_profiles
         ADD COLUMN gender ENUM('male', 'female', 'other') NOT NULL DEFAULT 'male' AFTER user_id`
      );
      console.log(`    ✅ Added 'gender' column to trainer_profiles.`);
    } else {
      console.log(`    ℹ️  'gender' column already exists. Skipping.`);
    }

    // 2. Create `trainer_assignment_requests` table if not exists
    console.log(`\n2️⃣  Checking 'trainer_assignment_requests' table...`);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS trainer_assignment_requests (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        member_id BIGINT UNSIGNED NOT NULL,
        trainer_id BIGINT UNSIGNED NOT NULL,
        notes TEXT NULL,
        status ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
        requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        reviewed_by_id BIGINT UNSIGNED NULL,
        reviewed_at DATETIME NULL DEFAULT NULL,
        rejection_reason TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_tar_member
          FOREIGN KEY (member_id) REFERENCES users (id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        CONSTRAINT fk_tar_trainer
          FOREIGN KEY (trainer_id) REFERENCES users (id)
          ON DELETE RESTRICT
          ON UPDATE CASCADE,
        CONSTRAINT fk_tar_reviewer
          FOREIGN KEY (reviewed_by_id) REFERENCES users (id)
          ON DELETE SET NULL
          ON UPDATE CASCADE,
        INDEX idx_tar_member_status (member_id, status),
        INDEX idx_tar_trainer_status (trainer_id, status),
        INDEX idx_tar_status_created (status, created_at)
      ) ENGINE=InnoDB;
    `);
    console.log(`    ✅ 'trainer_assignment_requests' table verified/created.`);

    // 3. Create `trainer_member_assignments` table if not exists
    console.log(`\n3️⃣  Checking 'trainer_member_assignments' table...`);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS trainer_member_assignments (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        member_id BIGINT UNSIGNED NOT NULL,
        trainer_id BIGINT UNSIGNED NOT NULL,
        request_id BIGINT UNSIGNED NULL,
        assigned_by_id BIGINT UNSIGNED NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NULL DEFAULT NULL,
        status ENUM('ACTIVE', 'PAUSED', 'TERMINATED') NOT NULL DEFAULT 'ACTIVE',
        paused_at DATETIME NULL DEFAULT NULL,
        grace_period_ends_at DATETIME NULL DEFAULT NULL,
        terminated_at DATETIME NULL DEFAULT NULL,
        termination_reason ENUM('ADMIN_TERMINATED', 'GRACE_PERIOD_EXPIRED', 'MEMBER_REASSIGNED', 'MANUAL_RELEASE') NULL DEFAULT NULL,
        notes TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_tma_member
          FOREIGN KEY (member_id) REFERENCES users (id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        CONSTRAINT fk_tma_trainer
          FOREIGN KEY (trainer_id) REFERENCES users (id)
          ON DELETE RESTRICT
          ON UPDATE CASCADE,
        CONSTRAINT fk_tma_assigned_by
          FOREIGN KEY (assigned_by_id) REFERENCES users (id)
          ON DELETE RESTRICT
          ON UPDATE CASCADE,
        CONSTRAINT fk_tma_request
          FOREIGN KEY (request_id) REFERENCES trainer_assignment_requests (id)
          ON DELETE SET NULL
          ON UPDATE CASCADE,
        INDEX idx_tma_member_status (member_id, status),
        INDEX idx_tma_trainer_status (trainer_id, status),
        INDEX idx_tma_grace_period (status, grace_period_ends_at)
      ) ENGINE=InnoDB;
    `);
    console.log(`    ✅ 'trainer_member_assignments' table verified/created.`);

    console.log(`\n🎉  Milestone 6.1 Database Migration completed successfully!\n`);
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

