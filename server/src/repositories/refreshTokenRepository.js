import { pool } from "../config/db.js";

export const refreshTokenRepository = {
  /**
   * Persist a hashed refresh token session in MySQL.
   */
  async create({ userId, tokenHash, expiresAt }, connection = pool) {
    const [result] = await connection.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES (?, ?, ?)`,
      [userId, tokenHash, expiresAt],
    );
    return result.insertId;
  },

  /**
   * Find a session by its cryptographic SHA-256 token hash.
   */
  async findByTokenHash(tokenHash, connection = pool) {
    const [rows] = await connection.query(
      `SELECT id, user_id, token_hash, expires_at, revoked_at, replaced_by_hash, created_at
       FROM refresh_tokens
       WHERE token_hash = ?`,
      [tokenHash],
    );
    return rows[0] || null;
  },

  /**
   * Revoke a single refresh token session and record what replaced it (for rotation/reuse detection).
   */
  async revoke(tokenHash, replacedByHash = null, connection = pool) {
    const [result] = await connection.query(
      `UPDATE refresh_tokens
       SET revoked_at = NOW(), replaced_by_hash = ?
       WHERE token_hash = ? AND revoked_at IS NULL`,
      [replacedByHash, tokenHash],
    );
    return result.affectedRows > 0;
  },

  /**
   * Revoke ALL active sessions for a user (triggered on token reuse breach or password change).
   */
  async revokeAllForUser(userId, connection = pool) {
    const [result] = await connection.query(
      `UPDATE refresh_tokens
       SET revoked_at = NOW()
       WHERE user_id = ? AND revoked_at IS NULL`,
      [userId],
    );
    return result.affectedRows;
  },

  /**
   * Clean up old expired sessions.
   */
  async deleteExpired(connection = pool) {
    const [result] = await connection.query(
      `DELETE FROM refresh_tokens WHERE expires_at < NOW()`,
    );
    return result.affectedRows;
  },
};

export default refreshTokenRepository;
