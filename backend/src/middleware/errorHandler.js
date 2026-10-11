// middleware/errorHandler.js
// ONE place that converts every error into a consistent JSON response:
//   { success: false, message: "...", errors?: [...] }
const AppError = require('../utils/AppError');
const env = require('../config/env');

// For unknown /api/* URLs
const notFound = (req, res, next) => {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = 'Something went wrong. Please try again later.';
  let errors;

  if (err.isOperational) {
    // Errors we threw on purpose with AppError
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please log in again.';
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Request body contains invalid JSON.';
  } else if (err.code === 'P2002') {
    statusCode = 409;
    message = 'A record with this value already exists.';
  } else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Record not found.';
  } else if (err.expose && err.status) {
    // Other express/body-parser errors (e.g. body too large)
    statusCode = err.status;
    message = err.message;
  }

  // Log real bugs on the server — never leak internal details to the client
  if (statusCode >= 500) {
    console.error('💥 Unexpected error:', err);
  }

  const body = { success: false, message };
  if (errors) body.errors = errors;
  if (env.nodeEnv === 'development' && statusCode >= 500) body.stack = err.stack;

  res.status(statusCode).json(body);
};

module.exports = { notFound, errorHandler };
