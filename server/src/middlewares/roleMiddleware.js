import { ForbiddenError, UnauthorizedError } from "../utils/errors.js";

/**
 * Role-Based Access Control (RBAC) Middleware Factory
 * Restricts endpoint access to users possessing one of the allowed roles.
 *
 * @param {...string} allowedRoles - List of permitted roles (e.g. 'admin', 'trainer')
 * @returns {Function} Express middleware function
 */
export function requireRoles(...allowedRoles) {
  // Normalize roles array in case an array was passed directly
  const roles = allowedRoles.flat();

  return (req, res, next) => {
    if (!req.user) {
      throw new UnauthorizedError(
        "Authentication required before checking roles",
        null,
        "UNAUTHENTICATED",
      );
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Access denied. Requires one of the following role(s): [${roles.join(", ")}]. Current role: '${req.user.role}'`,
        null,
        "INSUFFICIENT_PERMISSIONS",
      );
    }

    next();
  };
}

export default requireRoles;
