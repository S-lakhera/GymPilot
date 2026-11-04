import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import { env } from "../src/config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function resetDatabase() {
  console.log(`\n==============================================`);
  console.log(`⚠️   Resetting GymPilot Database...`);
  console.log(`==============================================`);

  let connection;
  try {
    // 1. Connect without database selected to drop and recreate
    connection = await mysql.createConnection({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      multipleStatements: true,
      timezone: env.db.timezone,
    });

    console.log(`🗑️   Dropping existing database '${env.db.name}'...`);
    await connection.query(`DROP DATABASE IF EXISTS \`${env.db.name}\`;`);
    console.log(`✅  Database dropped.`);

    // 2. Apply schema.sql
    console.log(`📦  Re-applying schema.sql...`);
    const schemaSql = fs.readFileSync(
      path.join(__dirname, "schema.sql"),
      "utf-8",
    );
    await connection.query(schemaSql);
    console.log(`✅  Schema recreated successfully.`);

    // 3. Apply seeds.sql
    console.log(`🌱  Re-applying seeds.sql...`);
    await connection.changeUser({ database: env.db.name });
    const seedSql = fs.readFileSync(path.join(__dirname, "seeds.sql"), "utf-8");
    await connection.query(seedSql);
    console.log(`✅  Sample data re-seeded.`);

    // 4. Summarize seeded records
    const tables = [
      "users",
      "trainer_profiles",
      "member_profiles",
      "plan_categories",
      "plans",
      "subscriptions",
      "payments",
    ];

    console.log(`\n📊  Current Records Summary:`);
    for (const table of tables) {
      const [rows] = await connection.query(
        `SELECT COUNT(*) AS total FROM ${table}`,
      );
      console.log(`    • ${table.padEnd(20)}: ${rows[0].total} rows`);
    }

    console.log(`\n🎉  Database reset and re-seed completed successfully!\n`);
  } catch (error) {
    console.error(`\n❌  Database reset failed:`, error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

resetDatabase();
