/**
 * Standard JSend-style API Response Formatter
 */
export class ApiResponse {
  /**
   * Sends a standardized success response.
   *
   * @param {Object} res - Express response object
   * @param {any} data - Response payload
   * @param {string} message - Descriptive message
   * @param {number} statusCode - HTTP status code (default: 200)
   */
  static success(res, data = null, message = "Success", statusCode = 200) {
    const payload = {
      status: "success",
      message,
    };

    if (data !== null && data !== undefined) {
      payload.data = data;
    }

    return res.status(statusCode).json(payload);
  }

  /**
   * Sends a 201 Created success response.
   */
  static created(res, data = null, message = "Resource created successfully") {
    return this.success(res, data, message, 201);
  }

  /**
   * Sends a standardized error response envelope.
   */
  static error(
    res,
    message = "Error",
    statusCode = 500,
    errors = null,
    code = null,
  ) {
    const payload = {
      status: "error",
      message,
    };

    if (errors) {
      payload.errors = errors;
    }

    if (code) {
      payload.code = code;
    }

    return res.status(statusCode).json(payload);
  }
}

export default ApiResponse;
