// js/register.js
if (Auth.isLoggedIn()) window.location.replace('/dashboard.html');

const form = document.getElementById('register-form');
const alertBox = document.getElementById('form-alert');
const submitBtn = document.getElementById('submit-btn');
setupPasswordToggles();

function showAlert(message) {
  alertBox.textContent = message;
  alertBox.className = 'alert alert-error';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  alertBox.className = 'alert hidden';

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  const errors = [];
  if (name.length < 2) errors.push({ field: 'name', message: 'Name must be at least 2 characters.' });
  if (!email) errors.push({ field: 'email', message: 'Email is required.' });
  if (password.length < 8) errors.push({ field: 'password', message: 'Password must be at least 8 characters.' });
  if (password !== confirmPassword) errors.push({ field: 'confirmPassword', message: 'Passwords do not match.' });
  showFieldErrors(form, errors);
  if (errors.length) return;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating account...';
  try {
    // confirmPassword is only checked in the browser — the API doesn't need it
    const res = await apiRequest('/auth/register', { method: 'POST', body: { name, email, password }, auth: false });
    Auth.save(res.data.token, res.data.user);
    window.location.replace('/dashboard.html');
  } catch (err) {
    showFieldErrors(form, err.errors);
    showAlert(err.message);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create account';
  }
});
