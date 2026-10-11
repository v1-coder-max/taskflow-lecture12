// validators/authValidator.js
// Each schema returns { errors: [...], value: {...cleaned data} }
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const asString = (v) => (typeof v === 'string' ? v : '');

function registerSchema(body) {
  const errors = [];
  const name = asString(body.name).trim();
  const email = asString(body.email).trim().toLowerCase();
  const password = asString(body.password);

  if (name.length < 2 || name.length > 100) {
    errors.push({ field: 'name', message: 'Name must be between 2 and 100 characters.' });
  }
  if (!EMAIL_REGEX.test(email) || email.length > 150) {
    errors.push({ field: 'email', message: 'Please enter a valid email address.' });
  }
  if (password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters.' });
  } else if (password.length > 72) {
    // bcrypt only uses the first 72 bytes of a password
    errors.push({ field: 'password', message: 'Password must be at most 72 characters.' });
  } else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one letter and one number.' });
  }

  return { errors, value: { name, email, password } };
}

function loginSchema(body) {
  const errors = [];
  const email = asString(body.email).trim().toLowerCase();
  const password = asString(body.password);

  if (!email) errors.push({ field: 'email', message: 'Email is required.' });
  if (!password) errors.push({ field: 'password', message: 'Password is required.' });

  return { errors, value: { email, password } };
}

module.exports = { registerSchema, loginSchema };
