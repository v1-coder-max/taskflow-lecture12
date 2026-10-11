// utils/jwt.js
// All JWT logic lives in one place.
const jwt = require('jsonwebtoken');
const env = require('../config/env');

// Create a token. We store ONLY the user id — never passwords or private data.
function signToken(userId) {
  return jwt.sign({ id: userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

// Verify a token. Throws JsonWebTokenError / TokenExpiredError if invalid.
function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

module.exports = { signToken, verifyToken };
