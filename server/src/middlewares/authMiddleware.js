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

export default verifyToken;
