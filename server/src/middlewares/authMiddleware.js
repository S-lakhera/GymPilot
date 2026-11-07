import { verifyAccessToken } from "../utils/jwt.js";
import { UnauthorizedError } from "../utils/errors.js";

/**
 * Authentication Middleware
 * Extracts and validates the Bearer JWT access token from the Authorization header.
 * Attaches decoded user payload ({ id, email, role }) to req.user.
 */
export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new UnauthorizedError(
      "Authorization header missing. Expected: Bearer <token>",
      null,
      "NO_AUTH_HEADER",
    );
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    throw new UnauthorizedError(
      "Invalid authorization format. Expected: Bearer <token>",
      null,
      "MALFORMED_AUTH_HEADER",
    );
  }

  const token = parts[1];
  const decoded = verifyAccessToken(token);

  req.user = decoded;
  next();
}

/**
 * Optional Authentication Middleware
 * If Authorization header is provided, attempts to verify and attach req.user.
 * If absent or invalid, silently sets req.user to null and allows request to proceed.
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    req.user = null;
    return next();
  }

  const parts = authHeader.split(" ");
  if (parts.length === 2 && parts[0] === "Bearer") {
    try {
      req.user = verifyAccessToken(parts[1]);
    } catch {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}

export default verifyToken;
