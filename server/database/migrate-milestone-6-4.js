import mysql from 'mysql2/promise';
import { env } from '../src/config/env.js';

/**
 * Idempotent migration script for Milestone 6.4 (Expired Membership Tracking & Automated Notifications).
 * Safe to run against both local MySQL and TiDB Cloud Serverless without dropping existing data.
 */
async function runMigration() {
  console.log(`\n======================================================`);
  console.log(`📦  GymPilot Milestone 6.4 Migration: Notifications & Expiration Engine`);
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

    // 1. Create `notifications` table if not exists
    console.log(`\n1️⃣  Checking 'notifications' table...`);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id BIGINT UNSIGNED NOT NULL,
        type ENUM(
          'PASS_EXPIRING_7D',
          'PASS_EXPIRING_3D',
          'PASS_EXPIRED',
          'PASS_RENEWED',
          'COACH_REQUEST_SUBMITTED',
          'COACH_REQUEST_APPROVED',
          'COACH_REQUEST_REJECTED',
          'COACH_GRACE_PERIOD',
          'WORKOUT_PLAN_ASSIGNED',
          'SYSTEM_ALERT'
        ) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        event_key VARCHAR(120) NULL UNIQUE,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        action_url VARCHAR(255) NULL,
        metadata JSON NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_notification_user
          FOREIGN KEY (user_id) REFERENCES users (id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        INDEX idx_notification_user_read (user_id, is_read),
        INDEX idx_notification_user_created (user_id, created_at),
        INDEX idx_notification_event_key (event_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log(`✅  'notifications' table ready.`);

    console.log(`\n🎉  Milestone 6.4 Notifications Migration completed successfully!`);
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
