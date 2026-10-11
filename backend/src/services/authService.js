// services/authService.js
// Business logic for authentication. Knows nothing about req/res.
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const { signToken } = require('../utils/jwt');

// Used when the email does not exist, so login takes the same time either way.
// (Otherwise an attacker could detect registered emails by measuring response time.)
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 10);

// Shape of a user that is safe to send to the client (NO password)
function toPublicUser(user) {
  return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
}

async function register({ name, email, password }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, 'An account with this email already exists.');
  }

  const hashedPassword = await bcrypt.hash(password, env.bcryptSaltRounds);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  return { user: toPublicUser(user), token: signToken(user.id) };
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Always run bcrypt.compare — even when the user does not exist
  const passwordOk = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);

  // Same message for "no such email" and "wrong password"
  if (!user || !passwordOk) {
    throw new AppError(401, 'Invalid email or password.');
  }

  return { user: toPublicUser(user), token: signToken(user.id) };
}

module.exports = { register, login };
