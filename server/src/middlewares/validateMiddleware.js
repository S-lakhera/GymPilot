import { validationResult } from "express-validator";
import { BadRequestError } from "../utils/errors.js";

/**
 * Middleware gate that inspects express-validator results.
 * If validation errors exist, formats field diagnostics and throws a BadRequestError.
 * Keeps controllers 100% clean of validation logic.
 */
export function validateRequest(req, res, next) {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    const formattedErrors = result.array().map((err) => ({
      field: err.path || err.param || "unknown",
      message: err.msg,
      value: err.value,
    }));

    throw new BadRequestError(
      "Validation failed",
      formattedErrors,
      "VALIDATION_ERROR",
    );
  }

  next();
}

export default validateRequest;
