// middleware/validate.js
// Runs a validation schema on req.body (or req.query).
// Invalid → 400 with field errors. Valid → cleaned data stored in req.validated.
const AppError = require('../utils/AppError');

const validate = (schema, source = 'body') => (req, res, next) => {
  const { errors, value } = schema(req[source] || {});

  if (errors.length > 0) {
    return next(new AppError(400, errors[0].message, errors));
  }

  req.validated = value;
  next();
};

module.exports = validate;
