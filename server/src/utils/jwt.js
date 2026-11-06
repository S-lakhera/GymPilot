import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { TokenType } from "../models/TokenType.js";
import { UnauthorizedError } from "./errors.js";

/**
 * Generates a short-lived JWT Access Token (60 min default).
 *
 * @param {Object} user - User payload { id, email, role }
 * @returns {string} Signed JWT Access Token
 */
export function generateAccessToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    type: TokenType.ACCESS,
  };

  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  });
}

/**
 * Generates a long-lived JWT Refresh Token (7 days default).
 *
 * @param {Object} user - User payload { id }
 * @param {string} tokenId - Unique identifier for the session
 * @returns {string} Signed JWT Refresh Token
 */
export function generateRefreshToken(user, tokenId) {
  const payload = {
    id: user.id,
    tokenId,
    type: TokenType.REFRESH,
  };

  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  });
}

/**
 * Verifies a JWT Access Token.
 *
 * @param {string} token - Bearer access token string
 * @returns {Object} Decoded token payload
 * @throws {UnauthorizedError} If invalid, expired, or wrong token type
 */
export function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, env.jwt.accessSecret);
    if (decoded.type !== TokenType.ACCESS) {
      throw new UnauthorizedError("Invalid token type: expected access token");
    }
    return decoded;
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    if (err.name === "TokenExpiredError") {
      throw new UnauthorizedError(
        "Access token has expired",
        null,
        "TOKEN_EXPIRED",
      );
    }
    if (err.name === "JsonWebTokenError") {
      throw new UnauthorizedError(
        "Invalid access token",
        null,
        "INVALID_TOKEN",
      );
    }
    throw new UnauthorizedError("Authentication failed");
  }
}

/**
 * Verifies a JWT Refresh Token.
 *
 * @param {string} token - Refresh token string from cookie
 * @returns {Object} Decoded token payload
 * @throws {UnauthorizedError} If invalid, expired, or wrong token type
 */
export function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, env.jwt.refreshSecret);
    if (decoded.type !== TokenType.REFRESH) {
      throw new UnauthorizedError("Invalid token type: expected refresh token");
    }
    return decoded;
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    if (err.name === "TokenExpiredError") {
      throw new UnauthorizedError(
        "Refresh token has expired, please log in again",
        null,
        "REFRESH_TOKEN_EXPIRED",
      );
    }
    if (err.name === "JsonWebTokenError") {
      throw new UnauthorizedError(
        "Invalid refresh token",
        null,
        "INVALID_REFRESH_TOKEN",
      );
    }
    throw new UnauthorizedError("Refresh authentication failed");
  }
}
