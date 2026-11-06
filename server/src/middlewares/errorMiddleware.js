import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";

/**
 * Maps known MySQL database errors to user-friendly semantic AppErrors.
 */
function handleDatabaseErrors(err) {
  // MySQL 1062: Duplicate entry for key (Unique constraint violation)
  if (err.errno === 1062 || err.code === "ER_DUP_ENTRY") {
    const match = err.sqlMessage?.match(
      /Duplicate entry '(.*)' for key '(.*)'/,
    );
    const detail = match
      ? `Value '${match[1]}' already exists for unique field '${match[2]}'`
      : "Duplicate record entry";
    return {
      statusCode: 409,
      message: detail,
      code: "DUPLICATE_ENTRY",
    };
  }

  // MySQL 1452: Cannot add or update a child row: a foreign key constraint fails
  if (err.errno === 1452 || err.code === "ER_NO_REFERENCED_ROW_2") {
    return {
      statusCode: 400,
      message:
        "Foreign key constraint failed: referenced entity does not exist",
      code: "FOREIGN_KEY_VIOLATION",
    };
  }

  // MySQL 1451: Cannot delete or update a parent row: a foreign key constraint fails
  if (err.errno === 1451 || err.code === "ER_ROW_IS_REFERENCED_2") {
    return {
      statusCode: 409,
      message: "Cannot delete record because dependent business records exist",
      code: "REFERENCED_ROW_CONFLICT",
    };
  }

  // Database connection failure
  if (err.code === "ECONNREFUSED" || err.code === "PROTOCOL_CONNECTION_LOST") {
    return {
      statusCode: 503,
      message: "Database service temporarily unavailable",
      code: "DATABASE_UNAVAILABLE",
    };
  }

  return null;
}

/**
 * Global Centralized Error Handling Middleware
 */
export function errorHandler(err, req, res, next) {
  // Log unexpected errors in non-test environments
  if (
    process.env.NODE_ENV !== "test" &&
    (!err.isOperational || err.statusCode >= 500)
  ) {
    console.error("[Unhandled Error]", err);
  }

  // Check for MySQL database errors
  const dbError = handleDatabaseErrors(err);
  if (dbError) {
    return res.status(dbError.statusCode).json({
      status: "error",
      message: dbError.message,
      code: dbError.code,
    });
  }

  // Handle known AppError subclasses
  if (err instanceof AppError) {
    const payload = {
      status: "error",
      message: err.message,
    };

    if (err.errors) {
      payload.errors = err.errors;
    }

    if (err.code) {
      payload.code = err.code;
    }

    return res.status(err.statusCode).json(payload);
  }

  // Handle express JSON body parsing errors
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      status: "error",
      message: "Malformed JSON payload in request body",
      code: "MALFORMED_JSON",
    });
  }

  // Default fallback for unhandled 500 internal errors
  const statusCode = err.statusCode || 500;
  const message =
    env.nodeEnv === "production" && statusCode === 500
      ? "An unexpected internal error occurred"
      : err.message || "Internal Server Error";

  const response = {
    status: "error",
    message,
    code: err.code || "INTERNAL_SERVER_ERROR",
  };

  if (env.nodeEnv === "development" && err.stack) {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
}

export default errorHandler;
