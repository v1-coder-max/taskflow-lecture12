// middleware/auth.js
// "protect" — the gatekeeper for every private route.
// 1. Reads the token from the Authorization header
// 2. Verifies it
// 3. Loads the user from the DB and attaches it to req.user
const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyToken } = require('../utils/jwt');

const protect = asyncHandler(async (req, res, next) => {
  // Expected header →  Authorization: Bearer <token>
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new AppError(401, 'Authentication required. Please log in.');
  }

  // Throws if the token is fake, tampered or expired → handled by errorHandler
  const decoded = verifyToken(token);

  if (!Number.isInteger(decoded.id)) {
    throw new AppError(401, 'Invalid token. Please log in again.');
  }

  // The user may have been deleted after the token was issued
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { id: true, name: true, email: true, createdAt: true }, // never select password
  });

  if (!user) {
    throw new AppError(401, 'User no longer exists. Please log in again.');
  }

  req.user = user; // every handler after this knows WHO is making the request
  next();
});

module.exports = { protect };
