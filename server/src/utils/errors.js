export class AppError extends Error {
  constructor(message, statusCode = 500, errors = null, code = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad Request", errors = null, code = "BAD_REQUEST") {
    super(message, 400, errors, code);
  }
}

export class UnauthorizedError extends AppError {
  constructor(
    message = "Authentication required",
    errors = null,
    code = "UNAUTHORIZED",
  ) {
    super(message, 401, errors, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message = "Access denied: insufficient permissions",
    errors = null,
    code = "FORBIDDEN",
  ) {
    super(message, 403, errors, code);
  }
}

export class NotFoundError extends AppError {
  constructor(
    message = "Resource not found",
    errors = null,
    code = "NOT_FOUND",
  ) {
    super(message, 404, errors, code);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict", errors = null, code = "CONFLICT") {
    super(message, 409, errors, code);
  }
}

export class InternalServerError extends AppError {
  constructor(
    message = "Internal server error",
    errors = null,
    code = "INTERNAL_ERROR",
  ) {
    super(message, 500, errors, code);
  }
}
