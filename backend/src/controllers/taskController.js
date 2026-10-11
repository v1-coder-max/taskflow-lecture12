// controllers/taskController.js
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const taskService = require('../services/taskService');

// Converts :id from the URL into a valid number
function parseTaskId(param) {
  const id = Number(param);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, 'Invalid task id.');
  }
  return id;
}

const listTasks = asyncHandler(async (req, res) => {
  const { tasks, meta } = await taskService.listTasks(req.user.id, req.validated);
  res.json({ success: true, data: tasks, meta });
});

const getStats = asyncHandler(async (req, res) => {
  const stats = await taskService.getStats(req.user.id);
  res.json({ success: true, data: stats });
});

const getTask = asyncHandler(async (req, res) => {
  const task = await taskService.getTask(req.user.id, parseTaskId(req.params.id));
  res.json({ success: true, data: task });
});

const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.user.id, req.validated);
  res.status(201).json({ success: true, message: 'Task created.', data: task });
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(req.user.id, parseTaskId(req.params.id), req.validated);
  res.json({ success: true, message: 'Task updated.', data: task });
});

const deleteTask = asyncHandler(async (req, res) => {
  await taskService.deleteTask(req.user.id, parseTaskId(req.params.id));
  res.json({ success: true, message: 'Task deleted.' });
});

module.exports = { listTasks, getStats, getTask, createTask, updateTask, deleteTask };
