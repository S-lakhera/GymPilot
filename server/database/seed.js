import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { env } from '../src/config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedDatabase() {
  console.log(`\n==============================================`);
  console.log(`🌱  Seeding GymPilot Database with Sample Data...`);
  console.log(`==============================================`);

  let connection;
  try {
    // 1. Connect to gympilot_db
    connection = await mysql.createConnection({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.name,
      ssl: env.db.ssl,
      multipleStatements: true,
      timezone: env.db.timezone,
    });

    console.log(`🔌  Connected to '${env.db.name}'`);

    // 2. Read seeds.sql
    const seedPath = path.join(__dirname, 'seeds.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf-8');

    // 3. Execute seeds
    console.log(`🚀  Applying seeds.sql...`);
    await connection.query(seedSql);
    console.log(`✅  Sample data seeded successfully!`);

    // 4. Summarize seeded records
    const tables = [
      'users',
      'trainer_profiles',
      'member_profiles',
      'plan_categories',
      'plans',
      'subscriptions',
      'payments',
      'refresh_tokens',
    ];

    console.log(`\n📊  Seeded Records Summary:`);
    for (const table of tables) {
      const [rows] = await connection.query(`SELECT COUNT(*) AS total FROM ${table}`);
      console.log(`    • ${table.padEnd(20)}: ${rows[0].total} rows`);
    }

    console.log(`\n🔑  Default Test Password for all users: Password@123`);
    console.log(`🎉  Database seeding completed successfully!\n`);
  } catch (error) {
    console.error(`\n❌  Database seeding failed:`, error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedDatabase();

