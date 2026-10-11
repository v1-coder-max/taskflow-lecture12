// js/dashboard.js
// Route guard: no token → go to login
if (!Auth.isLoggedIn()) window.location.replace('/login.html');

const $ = (id) => document.getElementById(id);

const state = {
  page: 1,
  limit: 8,
  status: '',
  priority: '',
  search: '',
  sort: 'createdAt:desc',
};
const tasksById = new Map(); // tasks on the current page (used by the edit modal)
let editingId = null;

const STATUS_LABEL = { pending: 'Pending', in_progress: 'In progress', done: 'Done' };

// ---------- Helpers ----------
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// API returns "2026-10-05T00:00:00.000Z" → we only need "2026-10-05"
function dateOnly(iso) {
  return iso ? iso.slice(0, 10) : '';
}

function formatDate(yyyyMmDd) {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ---------- User ----------
function renderUser(user) {
  if (!user) return;
  $('user-name').textContent = user.name;
  $('user-email').textContent = user.email;
  $('user-avatar').textContent = user.name.charAt(0).toUpperCase();
  $('greeting').textContent = `Hi, ${user.name.split(' ')[0]} 👋`;
}

async function loadCurrentUser() {
  renderUser(Auth.getUser()); // show cached name instantly
  try {
    const res = await apiRequest('/auth/me'); // confirms the token is still valid
    Auth.save(Auth.getToken(), res.data.user);
    renderUser(res.data.user);
  } catch (err) {
    if (err.status !== 401) showToast(err.message, 'error');
  }
}

// ---------- Stats ----------
async function loadStats() {
  try {
    const { data } = await apiRequest('/tasks/stats');
    $('stat-total').textContent = data.total;
    $('stat-pending').textContent = data.pending;
    $('stat-progress').textContent = data.inProgress;
    $('stat-done').textContent = data.done;
    $('stat-overdue').textContent = data.overdue;
  } catch (err) {
    if (err.status !== 401) showToast(err.message, 'error');
  }
}

// ---------- Task list ----------
function buildQuery() {
  const [sortBy, order] = state.sort.split(':');
  const params = new URLSearchParams({ page: state.page, limit: state.limit, sortBy, order });
  if (state.status) params.set('status', state.status);
  if (state.priority) params.set('priority', state.priority);
  if (state.search) params.set('search', state.search);
  return params.toString();
}

async function loadTasks() {
  const list = $('task-list');
  try {
    const res = await apiRequest(`/tasks?${buildQuery()}`);

    // Deleted the last task on a page → go back one page
    if (res.data.length === 0 && state.page > 1) {
      state.page -= 1;
      return loadTasks();
    }

    tasksById.clear();
    res.data.forEach((t) => tasksById.set(t.id, t));

    if (res.data.length === 0) {
      const filtered = state.status || state.priority || state.search;
      list.innerHTML = `
        <div class="empty">
          <div class="icon">${filtered ? '🔍' : '📭'}</div>
          <p>${filtered ? 'No tasks match your filters.' : 'No tasks yet. Add your first task!'}</p>
        </div>`;
    } else {
      list.innerHTML = res.data.map(renderTask).join('');
    }
    renderPagination(res.meta);
  } catch (err) {
    if (err.status !== 401) {
      list.innerHTML = `<div class="empty"><div class="icon">⚠️</div><p>${escapeHtml(err.message)}</p></div>`;
    }
  }
}

function statusButtons(task) {
  if (task.status === 'pending') {
    return `<button class="btn btn-sm btn-soft-info" data-action="status" data-status="in_progress" data-id="${task.id}">▶ Start</button>
            <button class="btn btn-sm btn-soft-success" data-action="status" data-status="done" data-id="${task.id}">✓ Done</button>`;
  }
  if (task.status === 'in_progress') {
    return `<button class="btn btn-sm btn-soft-success" data-action="status" data-status="done" data-id="${task.id}">✓ Done</button>
            <button class="btn btn-sm btn-soft-warning" data-action="status" data-status="pending" data-id="${task.id}">↩ Pending</button>`;
  }
  return `<button class="btn btn-sm btn-soft-warning" data-action="status" data-status="pending" data-id="${task.id}">↩ Reopen</button>`;
}

function renderTask(task) {
  const due = dateOnly(task.dueDate);
  const overdue = due && task.status !== 'done' && due < todayStr();

  return `
    <article class="task ${task.status === 'done' ? 'is-done' : ''}">
      <div class="task-top">
        <div>
          <div class="task-title">${escapeHtml(task.title)}</div>
          ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ''}
        </div>
        <div class="task-actions">
          ${statusButtons(task)}
          <button class="btn btn-sm btn-soft-neutral" data-action="edit" data-id="${task.id}">Edit</button>
          <button class="btn btn-sm btn-soft-danger" data-action="delete" data-id="${task.id}">Delete</button>
        </div>
      </div>
      <div class="task-meta">
        <span class="badge ${task.status}">${STATUS_LABEL[task.status]}</span>
        <span class="badge ${task.priority}">${task.priority}</span>
        ${due ? `<span class="due ${overdue ? 'overdue' : ''}">📅 ${overdue ? 'Overdue · ' : 'Due '}${formatDate(due)}</span>` : ''}
      </div>
    </article>`;
}

function renderPagination(meta) {
  const box = $('pagination');
  if (meta.total === 0) {
    box.classList.add('hidden');
    return;
  }
  box.classList.remove('hidden');
  const from = (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);
  $('page-info').textContent = `Showing ${from}–${to} of ${meta.total}`;
  $('prev-btn').disabled = meta.page <= 1;
  $('next-btn').disabled = meta.page >= meta.totalPages;
}

function refresh() {
  return Promise.all([loadStats(), loadTasks()]);
}

// ---------- Create ----------
$('create-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const title = $('create-title').value.trim();
  const description = $('create-description').value.trim();
  const priority = $('create-priority').value;
  const dueDate = $('create-dueDate').value;

  if (!title) {
    showFieldErrors(form, [{ field: 'title', message: 'Title is required.' }]);
    return;
  }
  showFieldErrors(form, []);

  const body = { title, priority };
  if (description) body.description = description;
  if (dueDate) body.dueDate = dueDate;

  const btn = $('create-btn');
  btn.disabled = true;
  try {
    await apiRequest('/tasks', { method: 'POST', body });
    form.reset();
    $('create-priority').value = 'medium';
    state.page = 1;
    await refresh();
    showToast('Task added ✅');
  } catch (err) {
    showFieldErrors(form, err.errors);
    if (err.status !== 401) showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
});

// ---------- Task actions (event delegation) ----------
$('task-list').addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = Number(btn.dataset.id);

  if (btn.dataset.action === 'edit') {
    openEditModal(id);
    return;
  }

  if (btn.dataset.action === 'delete') {
    const task = tasksById.get(id);
    if (!window.confirm(`Delete "${task ? task.title : 'this task'}"?`)) return;
    btn.disabled = true;
    try {
      await apiRequest(`/tasks/${id}`, { method: 'DELETE' });
      await refresh();
      showToast('Task deleted', 'info');
    } catch (err) {
      btn.disabled = false;
      if (err.status !== 401) showToast(err.message, 'error');
    }
    return;
  }

  if (btn.dataset.action === 'status') {
    btn.disabled = true;
    try {
      await apiRequest(`/tasks/${id}`, { method: 'PATCH', body: { status: btn.dataset.status } });
      await refresh();
      showToast(`Marked as ${STATUS_LABEL[btn.dataset.status].toLowerCase()}`);
    } catch (err) {
      btn.disabled = false;
      if (err.status !== 401) showToast(err.message, 'error');
    }
  }
});

// ---------- Edit modal ----------
function openEditModal(id) {
  const task = tasksById.get(id);
  if (!task) return;
  editingId = id;
  const form = $('edit-form');
  showFieldErrors(form, []);
  $('edit-title').value = task.title;
  $('edit-description').value = task.description || '';
  $('edit-status').value = task.status;
  $('edit-priority').value = task.priority;
  $('edit-dueDate').value = dateOnly(task.dueDate);
  $('edit-modal').classList.remove('hidden');
  $('edit-title').focus();
}

function closeEditModal() {
  editingId = null;
  $('edit-modal').classList.add('hidden');
}

$('edit-cancel').addEventListener('click', closeEditModal);
$('edit-modal').addEventListener('click', (e) => {
  if (e.target.id === 'edit-modal') closeEditModal(); // click outside the box
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && editingId !== null) closeEditModal();
});

$('edit-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const title = $('edit-title').value.trim();
  if (!title) {
    showFieldErrors(form, [{ field: 'title', message: 'Title is required.' }]);
    return;
  }

  const body = {
    title,
    description: $('edit-description').value.trim() || null,
    status: $('edit-status').value,
    priority: $('edit-priority').value,
    dueDate: $('edit-dueDate').value || null,
  };

  const saveBtn = $('edit-save');
  saveBtn.disabled = true;
  try {
    await apiRequest(`/tasks/${editingId}`, { method: 'PATCH', body });
    closeEditModal();
    await refresh();
    showToast('Task updated ✅');
  } catch (err) {
    showFieldErrors(form, err.errors);
    if (err.status !== 401) showToast(err.message, 'error');
  } finally {
    saveBtn.disabled = false;
  }
});

// ---------- Filters, sorting, pagination ----------
let searchTimer;
$('filter-search').addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { // wait until the user stops typing
    state.search = e.target.value.trim();
    state.page = 1;
    loadTasks();
  }, 350);
});

[['filter-status', 'status'], ['filter-priority', 'priority'], ['filter-sort', 'sort']].forEach(([id, key]) => {
  $(id).addEventListener('change', (e) => {
    state[key] = e.target.value;
    state.page = 1;
    loadTasks();
  });
});

$('prev-btn').addEventListener('click', () => { state.page -= 1; loadTasks(); });
$('next-btn').addEventListener('click', () => { state.page += 1; loadTasks(); });

// ---------- Logout ----------
$('logout-btn').addEventListener('click', () => {
  Auth.clear();
  window.location.replace('/login.html');
});

// ---------- Start ----------
if (Auth.isLoggedIn()) {
  loadCurrentUser();
  refresh();
}
