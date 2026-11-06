import mysql from 'mysql2/promise';
import { env } from './env.js';

// Create a connection pool with promise support
export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: env.db.timezone, // '+05:30' (IST)
  dateStrings: true,         // Avoids UTC string conversion shifts
});

/**
 * Validates database connectivity and credentials.
 */
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.query('SELECT 1 + 1 AS health_check');
    connection.release();
    console.log(`✅  MySQL Pool connected to '${env.db.name}' on ${env.db.host}:${env.db.port}`);
    return true;
  } catch (err) {
    console.error(`❌  MySQL Connection Error for '${env.db.name}':`, err.message);
    throw err;
  }
}

/**
 * Higher-order ACID transaction runner.
 * Automatically acquires a connection, begins transaction, passes it to the callback,
 * commits on success, rolls back on error, and guarantees connection release in finally block.
 *
 * @param {Function} callback - Async function receiving the active transaction connection: (conn) => Promise<any>
 * @returns {Promise<any>} The result of the callback
 */
export async function withTransaction(callback) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export default pool;
