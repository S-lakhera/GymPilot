import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import { env } from '../src/config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  console.log(`\n==============================================`);
  console.log(`📦  Initializing GymPilot Database Schema...`);
  console.log(`==============================================`);

  let connection;
  try {
    // 1. Connect to MySQL / TiDB server (without database selected so schema.sql can create it if missing)
    connection = await mysql.createConnection({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      ssl: env.db.ssl,
      multipleStatements: true,
      timezone: env.db.timezone,
    });

    console.log(`🔌  Connected to MySQL server at ${env.db.host}:${env.db.port}`);

    // 2. Read schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    // 3. Execute schema DDL statements
    console.log(`🚀  Applying schema.sql...`);
    await connection.query(schemaSql);
    console.log(`✅  Schema applied successfully!`);

    // 4. Verify created tables
    await connection.changeUser({ database: env.db.name });
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map((row) => Object.values(row)[0]);

    console.log(`\n📋  Created Tables in '${env.db.name}':`);
    tableNames.forEach((name, index) => {
      console.log(`    ${index + 1}. ${name}`);
    });

    console.log(`\n🎉  Database initialization completed successfully!\n`);
  } catch (error) {
    console.error(`\n❌  Database initialization failed:`, error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();

