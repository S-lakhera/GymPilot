/**
 * Maps backend normalized API errors to React Hook Form field errors.
 * Backend error format: { message, code, errors: Array<{ field, message, path, msg }>|null }
 *
 * @param {Object} apiError - Error object returned by normalizeApiError
 * @param {Function} setError - React Hook Form setError function
 * @param {string} [defaultField='root.server'] - Default field to attach error if no field is identified
 */
export function mapServerErrorsToForm(apiError, setError, defaultField = 'root.server') {
  if (!apiError) return;

  if (Array.isArray(apiError.errors) && apiError.errors.length > 0) {
    let mappedAny = false;
    apiError.errors.forEach((err) => {
      const fieldName = err.path || err.field || err.param;
      const message = err.msg || err.message;
      if (fieldName && message) {
        setError(fieldName, {
          type: 'server',
          message,
        });
        mappedAny = true;
      }
    });

    if (mappedAny) return;
  }

  // Fallback to top-level message on root
  setError(defaultField, {
    type: 'server',
    message: apiError.message || 'An unexpected error occurred. Please try again.',
  });
}
