// server.js — entry point: connect to DB, then start listening
const env = require('./config/env'); // loads .env first
const app = require('./app');
const prisma = require('./config/prisma');

async function start() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch (err) {
    console.error('❌ Could not connect to the database.');
    console.error('   Check DATABASE_URL in .env and that MySQL is running.');
    console.error('  ', err.message);
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    console.log(`🚀 Server running:  http://localhost:${env.port}`);
    console.log(`🔗 API base URL:    http://localhost:${env.port}/api`);
  });

  // Graceful shutdown — finish open requests and close DB connections
  const shutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();
