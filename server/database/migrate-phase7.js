import mysql from 'mysql2/promise';
import { env } from '../src/config/env.js';

/**
 * Idempotent migration script for Phase 7 (Query Optimization & Performance Indexes).
 * Safe to run against both local MySQL and TiDB Cloud Serverless without dropping existing data.
 */
async function runMigration() {
  console.log(`\n======================================================`);
  console.log(`⚡  GymPilot Phase 7 Migration: Performance Indexes Optimization`);
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

    // Helper to check if index exists on table
    async function hasIndex(table, indexName) {
      const [rows] = await connection.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.statistics 
        WHERE table_schema = DATABASE() 
          AND table_name = ? 
          AND index_name = ?
      `, [table, indexName]);
      return Number(rows[0].count) > 0;
    }

    // 1. payments: idx_payments_status_date
    console.log(`\n1️⃣  Checking index 'idx_payments_status_date' on 'payments'...`);
    if (!(await hasIndex('payments', 'idx_payments_status_date'))) {
      await connection.query(`
        ALTER TABLE payments
          ADD INDEX idx_payments_status_date (payment_status, payment_date)
      `);
      console.log(`✅  Added index 'idx_payments_status_date' on 'payments'.`);
    } else {
      console.log(`ℹ️   Index 'idx_payments_status_date' already exists. Skipping.`);
    }

    // 2. payments: idx_payments_user_date
    console.log(`\n2️⃣  Checking index 'idx_payments_user_date' on 'payments'...`);
    if (!(await hasIndex('payments', 'idx_payments_user_date'))) {
      await connection.query(`
        ALTER TABLE payments
          ADD INDEX idx_payments_user_date (user_id, payment_date)
      `);
      console.log(`✅  Added index 'idx_payments_user_date' on 'payments'.`);
    } else {
      console.log(`ℹ️   Index 'idx_payments_user_date' already exists. Skipping.`);
    }

    // 3. trainer_member_assignments: idx_tma_trainer_status_created
    console.log(`\n3️⃣  Checking index 'idx_tma_trainer_status_created' on 'trainer_member_assignments'...`);
    if (!(await hasIndex('trainer_member_assignments', 'idx_tma_trainer_status_created'))) {
      await connection.query(`
        ALTER TABLE trainer_member_assignments
          ADD INDEX idx_tma_trainer_status_created (trainer_id, status, created_at)
      `);
      console.log(`✅  Added index 'idx_tma_trainer_status_created' on 'trainer_member_assignments'.`);
    } else {
      console.log(`ℹ️   Index 'idx_tma_trainer_status_created' already exists. Skipping.`);
    }

    console.log(`\n🎉  Phase 7 Performance Indexes Migration completed successfully!`);
    process.exit(0);
  } catch (err) {
    console.error(`\n❌  Migration Error:`, err);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

runMigration();
