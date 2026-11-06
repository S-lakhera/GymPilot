/**
 * Wraps an async controller/middleware function to automatically forward errors to next().
 * Eliminates repetitive try/catch boilerplate across controllers.
 *
 * @param {Function} fn - Async controller function (req, res, next)
 * @returns {Function} Express middleware function
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
