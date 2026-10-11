// services/taskService.js
// ⭐ RULE: every single query includes `userId`.
// That one rule is what guarantees a user can only ever see/change their own tasks.
const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');

// Fields returned to the client
const TASK_SELECT = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
};

async function listTasks(userId, { status, priority, search, page, limit, sortBy, order }) {
  const where = { userId };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  }

  // Run both queries at the same time
  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: [{ [sortBy]: order }, { id: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
      select: TASK_SELECT,
    }),
    prisma.task.count({ where }),
  ]);

  return {
    tasks,
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

async function getStats(userId) {
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  const [total, pending, inProgress, done, overdue] = await Promise.all([
    prisma.task.count({ where: { userId } }),
    prisma.task.count({ where: { userId, status: 'pending' } }),
    prisma.task.count({ where: { userId, status: 'in_progress' } }),
    prisma.task.count({ where: { userId, status: 'done' } }),
    prisma.task.count({ where: { userId, status: { not: 'done' }, dueDate: { lt: startOfToday } } }),
  ]);

  return { total, pending, inProgress, done, overdue };
}

// Finds a task ONLY if it belongs to this user.
// Another user's task → 404 (we don't even reveal that it exists).
async function getTask(userId, taskId) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
    select: TASK_SELECT,
  });
  if (!task) {
    throw new AppError(404, 'Task not found.');
  }
  return task;
}

async function createTask(userId, data) {
  return prisma.task.create({
    data: { ...data, userId }, // userId comes from the TOKEN, never from the request body
    select: TASK_SELECT,
  });
}

async function updateTask(userId, taskId, data) {
  await getTask(userId, taskId); // ownership check first
  return prisma.task.update({
    where: { id: taskId },
    data,
    select: TASK_SELECT,
  });
}

async function deleteTask(userId, taskId) {
  await getTask(userId, taskId); // ownership check first
  await prisma.task.delete({ where: { id: taskId } });
}

module.exports = { listTasks, getStats, getTask, createTask, updateTask, deleteTask };
