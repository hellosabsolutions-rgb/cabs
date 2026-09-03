/**
 * Wrapper for async route handlers to eliminate try/catch blocks
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
