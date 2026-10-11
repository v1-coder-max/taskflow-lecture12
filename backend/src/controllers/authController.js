// controllers/authController.js
// Controllers are thin: read the request → call the service → send the response.
const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');

const register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.register(req.validated);
  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    data: { user, token },
  });
});

const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.validated);
  res.json({
    success: true,
    message: 'Logged in successfully.',
    data: { user, token },
  });
});

// req.user was set by the protect middleware
const me = (req, res) => {
  res.json({ success: true, data: { user: req.user } });
};

module.exports = { register, login, me };
