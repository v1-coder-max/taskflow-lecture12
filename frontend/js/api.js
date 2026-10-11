// js/api.js — shared by every page
// 1. Stores/reads the JWT   2. Sends requests with the token   3. Handles 401 globally
const API_BASE = '/api';
const TOKEN_KEY = 'tm_token';
const USER_KEY = 'tm_user';

const Auth = {
  getToken() { return localStorage.getItem(TOKEN_KEY); },
  getUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  },
  save(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  isLoggedIn() { return Boolean(localStorage.getItem(TOKEN_KEY)); },
};

class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.status = status;
    this.errors = errors || [];
  }
}

// auth: true  → attach token, and on 401 log the user out
// auth: false → used by login/register (a 401 there just means wrong password)
async function apiRequest(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && Auth.getToken()) headers.Authorization = `Bearer ${Auth.getToken()}`;

  let res;
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Is it running?', 0);
  }

  let data = null;
  try { data = await res.json(); } catch { data = null; }

  if (res.status === 401 && auth) {
    Auth.clear();
    window.location.replace('/login.html?expired=1');
    throw new ApiError('Session expired', 401);
  }

  if (!res.ok) {
    throw new ApiError((data && data.message) || `Request failed (${res.status})`, res.status, data && data.errors);
  }
  return data;
}

// Prevents XSS: user text is always escaped before being put into HTML
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

let toastTimer;
function showToast(message, type = 'success') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.className = `show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = ''; }, 2800);
}

// Shows field errors returned by the API under the matching inputs
function showFieldErrors(form, errors) {
  form.querySelectorAll('.field-error').forEach((el) => { el.textContent = ''; });
  form.querySelectorAll('.invalid').forEach((el) => el.classList.remove('invalid'));
  errors.forEach(({ field, message }) => {
    if (!field) return;
    const input = form.querySelector(`[name="${field}"]`);
    const slot = form.querySelector(`[data-error-for="${field}"]`);
    if (input) input.classList.add('invalid');
    if (slot) slot.textContent = message;
  });
}

function setupPasswordToggles() {
  document.querySelectorAll('.pw-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.textContent = show ? 'Hide' : 'Show';
    });
  });
}
