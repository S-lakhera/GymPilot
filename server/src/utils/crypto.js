import crypto from "crypto";

/**
 * Computes a deterministic SHA-256 hash of a raw string/token.
 * Used to store and look up refresh tokens securely without persisting raw JWTs.
 *
 * @param {string} token - Raw token string
 * @returns {string} 64-character lowercase hex digest
 */
export function hashToken(token) {
  if (!token || typeof token !== "string") {
    throw new Error("hashToken requires a non-empty string argument");
  }
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Generates cryptographically secure random bytes as a hex string.
 *
 * @param {number} bytes - Number of bytes (default: 32)
 * @returns {string}
 */
export function generateRandomString(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}
