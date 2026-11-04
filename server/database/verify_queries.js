import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import { env } from "../src/config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyQueries() {
  console.log(`\n==============================================`);
  console.log(`🔍  Executing & Verifying Test Queries in queries.sql...`);
  console.log(`==============================================`);

  let connection;
  try {
    connection = await mysql.createConnection({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.name,
      timezone: env.db.timezone,
    });

    const queriesPath = path.join(__dirname, "queries.sql");
    const content = fs.readFileSync(queriesPath, "utf-8");

    // Split queries by semicolon, ignoring USE gympilot_db
    const rawQueries = content
      .split(";")
      .map((q) => q.trim())
      .filter((q) => q.length > 0 && !q.toUpperCase().startsWith("USE"));

    console.log(`Found ${rawQueries.length} verification queries.\n`);

    for (let i = 0; i < rawQueries.length; i++) {
      const sql = rawQueries[i];
      // Extract comment title if present
      const lines = sql.split("\n");
      const commentLines = lines.filter((l) => l.trim().startsWith("--"));
      const title =
        commentLines.length > 0
          ? commentLines[0].replace(/--\s*/, "")
          : `Query ${i + 1}`;

      const [rows] = await connection.query(sql);
      const count = Array.isArray(rows) ? rows.length : 1;
      console.log(
        `✅  [${i + 1}/${rawQueries.length}] ${title} → (${count} rows returned)`,
      );

      // Print first row of results for visual verification
      if (Array.isArray(rows) && rows.length > 0) {
        console.log(
          `     Sample:`,
          JSON.stringify(rows[0]).substring(0, 120) +
            (JSON.stringify(rows[0]).length > 120 ? "..." : ""),
        );
      }
    }

    console.log(
      `\n🎉  All ${rawQueries.length} verification queries executed with zero errors!\n`,
    );
  } catch (error) {
    console.error(`\n❌  Query verification failed:`, error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verifyQueries();
