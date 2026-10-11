// js/login.js
if (Auth.isLoggedIn()) window.location.replace('/dashboard.html');

const form = document.getElementById('login-form');
const alertBox = document.getElementById('form-alert');
const submitBtn = document.getElementById('submit-btn');
setupPasswordToggles();

function showAlert(message, type = 'error') {
  alertBox.textContent = message;
  alertBox.className = `alert alert-${type}`;
}

if (new URLSearchParams(window.location.search).get('expired')) {
  showAlert('Your session has expired. Please sign in again.', 'info');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  alertBox.className = 'alert hidden';

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  // Quick checks in the browser (the server validates again — never trust the client)
  const errors = [];
  if (!email) errors.push({ field: 'email', message: 'Email is required.' });
  if (!password) errors.push({ field: 'password', message: 'Password is required.' });
  showFieldErrors(form, errors);
  if (errors.length) return;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing in...';
  try {
    const res = await apiRequest('/auth/login', { method: 'POST', body: { email, password }, auth: false });
    Auth.save(res.data.token, res.data.user);
    window.location.replace('/dashboard.html');
  } catch (err) {
    showFieldErrors(form, err.errors);
    showAlert(err.message);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign in';
  }
});
