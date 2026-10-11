// config/prisma.js
// ONE shared Prisma client for the whole app (creating many clients wastes DB connections)
const { PrismaClient } = require('@prisma/client');
const env = require('./env');

const prisma = new PrismaClient({
  log: env.nodeEnv === 'development' ? ['warn', 'error'] : ['error'],
});

module.exports = prisma;
