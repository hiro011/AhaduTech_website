let currentUser = null;

const SESSION_KEY = 'ahaduUser';
const ONE_WEEK = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

function getCurrentUser() {
  if (currentUser) return currentUser;

  const data = localStorage.getItem(SESSION_KEY);
  if (!data) return null;

  try {
    const parsed = JSON.parse(data);
    // Check if expired
    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    currentUser = parsed.user;
    return currentUser;
  } catch (e) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function setCurrentUser(user) {
  currentUser = user;
  const sessionData = {
    user: user,
    expiresAt: Date.now() + ONE_WEEK
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  renderAuthButton();
  loadComments?.();
}

function logout() {
  currentUser = null;
  localStorage.removeItem(SESSION_KEY);
  renderAuthButton();
  loadComments?.();
  if (typeof showToast === 'function') showToast('Logged out');
}

function renderAuthButton() {
  const container = document.getElementById('auth-container');
  if (!container) return;

  if (currentUser) {
    container.innerHTML = `
      <div class="profile-wrapper" title="${currentUser.name}">
        <div class="profile-avatar">
          ${currentUser.name.charAt(0).toUpperCase()}
        </div>
        <div class="logout-btn" onclick="logout()">Logout</div>
      </div>
    `;
  } else {
    container.innerHTML = `<button class="open-auth-btn" onclick="openPopup()">Login</button>`;
  }
}

// Popup controls
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
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'block';
}
function showLogin() {
  document.getElementById('register-form').style.display = 'none';
  document.getElementById('login-form').style.display = 'block';
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
  if (data.success) {
    setTimeout(() => {
      showLogin();
      document.getElementById('login-email').value = email;
    }, 1200);
  }
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
    showMsg('Welcome back!', 'green');
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

// Run when page loads
document.addEventListener('DOMContentLoaded', () => {
  getCurrentUser();
  renderAuthButton();
});