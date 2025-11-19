// Global user
let currentUser = null;

function openPopup() {
  document.getElementById('popup-overlay').style.display = 'block';
  document.getElementById('auth-popup').style.display = 'block';
}
function closePopup() {
  document.getElementById('popup-overlay').style.display = 'none';
  document.getElementById('auth-popup').style.display = 'none';
  document.getElementById('auth-message').innerHTML = '';
}
function showRegister() {
  openPopup();
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'block';
}
function showLogin() {
  openPopup();
  document.getElementById('register-form').style.display = 'none';
  document.getElementById('login-form').style.display = 'block';
}

function setCurrentUser(user) {
  currentUser = user;
  sessionStorage.setItem('currentUser', JSON.stringify(user));
  updateAuthButton();
  loadComments?.();
}
function getCurrentUser() {
  if (currentUser) return currentUser;
  const saved = sessionStorage.getItem('currentUser');
  if (saved) currentUser = JSON.parse(saved);
  return currentUser;
}
function updateAuthButton() {
  const container = document.getElementById('auth-container');
  if (currentUser) {
    container.innerHTML = `
      <div class="profile-avatar" onclick="openPopup()" title="${currentUser.name}">
        ${currentUser.name.charAt(0).toUpperCase()}
      </div>
    `;
  } else {
    container.innerHTML = `<button class="open-auth-btn" onclick="openPopup()">Login</button>`;
  }
}

// Register
async function register() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;

  if (pass !== confirm) return showMsg('Passwords do not match', 'red');
  if (pass.length < 6) return showMsg('Password too short', 'red');

  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'register', name, email, password: pass })
  });
  const data = await res.json();

  showMsg(data.error || 'Registered! Now login', data.success ? 'green' : 'red');
  if (data.success) setTimeout(() => { showLogin(); document.getElementById('login-email').value = email; }, 1500);
}

// Login
async function login() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-password').value;

  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', email, password: pass })
  });
  const data = await res.json();

  if (data.success) {
    setCurrentUser(data.user);
    showMsg('Login successful!', 'green');
    setTimeout(closePopup, 800);
  } else {
    showMsg(data.error || 'Login failed', 'red');
  }
}

function showMsg(text, color) {
  const el = document.getElementById('auth-message');
  el.style.color = color;
  el.textContent = text;
}

// On page load
document.addEventListener('DOMContentLoaded', () => {
  getCurrentUser();
  updateAuthButton();
});