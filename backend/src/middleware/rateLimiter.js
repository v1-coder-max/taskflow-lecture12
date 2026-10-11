// middleware/rateLimiter.js
// Blocks brute-force attacks on login/register.
// Only FAILED requests are counted, so normal users are never affected.
const { rateLimit } = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,                // 20 failed attempts per IP per window
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many failed attempts. Please try again after 15 minutes.',
  },
});

module.exports = { authLimiter };
