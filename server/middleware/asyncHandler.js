/**
 * Async Handler Middleware
 * 
 * Wraps async route handlers to automatically catch errors
 * and pass them to Express error handling middleware.
 * 
 * Usage:
 * const asyncHandler = require('../middleware/asyncHandler');
 * 
 * router.get('/route', asyncHandler(async (req, res, next) => {
 *   // Your async code here
 *   // Any errors will be automatically caught and passed to next()
 * }));
 */

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
