// utils/asyncHandler.js
// Wraps an async route handler so any thrown error goes to next(err)
// automatically. This removes the need for try/catch in every controller.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
