// utils/AppError.js
// A custom error that carries an HTTP status code.
// Services throw it; the central error handler turns it into a JSON response.
class AppError extends Error {
  constructor(statusCode, message, errors) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;       // optional list of field errors
    this.isOperational = true;  // "expected" error (bad input, not found...) vs a real bug
  }
}

module.exports = AppError;
