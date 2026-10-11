// validators/taskValidator.js
const STATUSES = ['pending', 'in_progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];
const SORT_FIELDS = ['createdAt', 'dueDate', 'priority', 'title'];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Accepts "YYYY-MM-DD", "" or null. Returns { ok, date }
function parseDueDate(v) {
  if (v === null || v === '') return { ok: true, date: null };
  if (typeof v !== 'string' || !DATE_REGEX.test(v)) return { ok: false };
  const date = new Date(`${v}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== v) return { ok: false };
  return { ok: true, date };
}

// Shared checks for create + update. `partial` = fields are optional (update)
function checkTaskFields(body, partial) {
  const errors = [];
  const value = {};

  if (body.title !== undefined || !partial) {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title || title.length > 200) {
      errors.push({ field: 'title', message: 'Title is required and must be at most 200 characters.' });
    } else {
      value.title = title;
    }
  }

  if (body.description !== undefined) {
    if (body.description === null || body.description === '') {
      value.description = null;
    } else if (typeof body.description !== 'string' || body.description.length > 2000) {
      errors.push({ field: 'description', message: 'Description must be text of at most 2000 characters.' });
    } else {
      value.description = body.description.trim() || null;
    }
  }

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) {
      errors.push({ field: 'status', message: `Status must be one of: ${STATUSES.join(', ')}.` });
    } else {
      value.status = body.status;
    }
  }

  if (body.priority !== undefined) {
    if (!PRIORITIES.includes(body.priority)) {
      errors.push({ field: 'priority', message: `Priority must be one of: ${PRIORITIES.join(', ')}.` });
    } else {
      value.priority = body.priority;
    }
  }

  if (body.dueDate !== undefined) {
    const { ok, date } = parseDueDate(body.dueDate);
    if (!ok) {
      errors.push({ field: 'dueDate', message: 'Due date must be in YYYY-MM-DD format.' });
    } else {
      value.dueDate = date;
    }
  }

  return { errors, value };
}

function createTaskSchema(body) {
  return checkTaskFields(body, false);
}

function updateTaskSchema(body) {
  const result = checkTaskFields(body, true);
  if (result.errors.length === 0 && Object.keys(result.value).length === 0) {
    result.errors.push({ field: null, message: 'Provide at least one field to update.' });
  }
  return result;
}

// Query string for GET /api/tasks  (?status=&priority=&search=&page=&limit=&sortBy=&order=)
function listQuerySchema(query) {
  const errors = [];
  const value = {};

  if (query.status) {
    if (!STATUSES.includes(query.status)) errors.push({ field: 'status', message: 'Invalid status filter.' });
    else value.status = query.status;
  }
  if (query.priority) {
    if (!PRIORITIES.includes(query.priority)) errors.push({ field: 'priority', message: 'Invalid priority filter.' });
    else value.priority = query.priority;
  }

  const search = typeof query.search === 'string' ? query.search.trim() : '';
  if (search) value.search = search.slice(0, 100);

  const page = parseInt(query.page, 10);
  const limit = parseInt(query.limit, 10);
  value.page = Number.isInteger(page) && page > 0 ? page : 1;
  value.limit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 50) : 10;

  value.sortBy = SORT_FIELDS.includes(query.sortBy) ? query.sortBy : 'createdAt';
  value.order = query.order === 'asc' ? 'asc' : 'desc';

  return { errors, value };
}

module.exports = { createTaskSchema, updateTaskSchema, listQuerySchema };
