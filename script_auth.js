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

// Run when page loads + when another tab updates login state
function initAuth() {
  currentUser = getCurrentUser();
  renderAuthButton();
}

// First load
document.addEventListener('DOMContentLoaded', initAuth);

// Listen for login/logout from other tabs
window.addEventListener('storage', (e) => {
  if (e.key === SESSION_KEY) {
    initAuth();
    closePopup();
  }
});

// Also re-render if user logs in/out on same page
const originalSet = setCurrentUser;
setCurrentUser = function (user) {
  originalSet(user);
  loadComments?.(); // if on product page
};

const originalLogout = logout;
logout = function () {
  originalLogout();
  loadComments?.();
};
function setCurrentUser(user) {
  currentUser = user;
  const sessionData = {
    user: user,
    expiresAt: Date.now() + ONE_WEEK
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  renderAuthButton();

  // ONLY call loadComments if it actually exists (safe on all pages)
  if (typeof loadComments === 'function') {
    loadComments();
  }

  closePopup();
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
        <div class="profile-btns">
          <div class="changePass-btn" onclick="changePass()">Change Password</div>
          <div class="logout-btn" onclick="logout()">Logout</div>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `<button class="open-auth-btn" onclick="showLogin()">Login</button>`;
  }
}

// Popup controls
function closePopup() {
  document.getElementById('popup-overlay').style.display = 'none';
  document.getElementById('popup-overlay').classList.remove('active');
  document.getElementById('auth-popup').style.display = 'none';
  document.getElementById('auth-message').innerHTML = '';
  document.getElementById('changePassModal').classList.remove('show');
  document.getElementById('cpMsg').textContent = '';
  closeForgotPassword();
}
function showRegister() {
  closeForgotPassword();
  document.getElementById('popup-overlay').style.display = 'block';
  document.getElementById('auth-popup').style.display = 'block';
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'flex';
  document.getElementById('auth-message').innerHTML = '';
}
function showLogin() {
  closeForgotPassword();
  document.getElementById('popup-overlay').style.display = 'block';
  document.getElementById('auth-popup').style.display = 'block';
  document.getElementById('register-form').style.display = 'none';
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('auth-message').innerHTML = '';
}

// Open / Close Popup
function changePass() {
  document.getElementById('popup-overlay').style.display = 'block';
  document.getElementById('changePassModal').classList.add('show');
}

// Submit Change Password
document.getElementById('changePassForm').onsubmit = async (e) => {
  e.preventDefault();
  const current = document.getElementById('cp-current').value;
  const newP = document.getElementById('cp-new').value;
  const confirm = document.getElementById('cp-confirm').value;
  const msg = document.getElementById('cpMsg');

  if (newP !== confirm) return msg.textContent = 'New passwords do not match!', msg.style.color = 'red';
  if (newP.length < 6) return msg.textContent = 'Password too short!', msg.style.color = 'red';

  msg.textContent = 'Updating...';
  msg.style.color = '#f59e0b';

  const res = await fetch('/api/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      currentPassword: current,
      newPassword: newP,
      email: currentUser.email                     // ← ADD THIS LINE
    })
  });

  const data = await res.json();
  if (data.success) {
    msg.textContent = 'Password changed successfully!';
    msg.style.color = 'green';
    // setTimeout(closePopup(), 600);
    closePopup();
  } else {
    msg.textContent = data.error || 'Wrong current password';
    msg.style.color = 'red';
  }
};

// Register
async function register() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim().toLowerCase();
  const pass = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;
  const q1 = document.getElementById('reg-q1').value;
  const a1 = document.getElementById('reg-a1').value.trim();
  const q2 = document.getElementById('reg-q2').value;
  const a2 = document.getElementById('reg-a2').value.trim();

  // === Validation with clear messages ===
  if (!name || name.length < 3) return showMsg('Name must be at least 3 characters', 'red');
  if (name.length > 30) return showMsg('Name too long (max 30 characters)', 'red');

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return showMsg('Please enter a valid email', 'red');

  if (!pass || pass.length < 6) return showMsg('Password too short (minimum 6 characters)', 'red');
  if (pass.length > 12) return showMsg('Password too long (maximum 12 characters)', 'red');
  if (pass !== confirm) return showMsg('Passwords do not match', 'red');

  if (!q1 || !q2) return showMsg('Please select both security questions', 'red');
  if (q1 === q2) return showMsg('Please choose two different questions', 'red');

  if (!a1 || a1.length < 2) return showMsg('Answer 1 too short', 'red');
  if (a1.length > 50) return showMsg('Answer 1 too long (max 50)', 'red');
  if (!a2 || a2.length < 2) return showMsg('Answer 2 too short', 'red');
  if (a2.length > 50) return showMsg('Answer 2 too long (max 50)', 'red');

  // If all good → send to server
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'register',
      name, email, password: pass,
      security_question_1: q1,
      security_answer_1: a1.toLowerCase(),
      security_question_2: q2,
      security_answer_2: a2.toLowerCase()
    })
  });

  const data = await res.json();
  showMsg(data.error || 'Account created! Please login', data.success ? 'green' : 'red');

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

  if (!email || !pass) {
    showMsg('Please enter email and password', 'red');
    return;
  }

  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', email, password: pass })
  });

  const data = await res.json();

  if (data.success) {
    setCurrentUser(data.user);
    showMsg('Login successful!', 'green');

    // Clear fields
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';

    // THIS IS THE FIX – force close everything
    document.getElementById('auth-popup').style.display = 'none';
    document.getElementById('popup-overlay').classList.remove('active');
    // If you're using .active class for overlay, otherwise use: .style.display = 'none'

    // Optional: tiny delay so user sees "Login successful!" message
    // setTimeout(() => {
    //   document.getElementById('auth-message').textContent = '';
    //   closePopup();
    // }, 1500);
  } else {
    showMsg(data.error || 'Invalid email or password', 'red');
  }
}

let forgotEmail = '';

function openForgotPassword() {
  document.getElementById('auth-popup').style.display = 'none';
  document.getElementById('popup-overlay').classList.add('active');
  document.getElementById('forgotPassModal').style.display = 'block';
  document.getElementById('forgotPassModal').classList.add('active');
  document.getElementById('forgot-step-1').style.display = 'block';
  document.getElementById('forgot-step-2').style.display = 'none';
  document.getElementById('fp-msg').textContent = '';
}

function closeForgotPassword() {
  document.getElementById('popup-overlay').style.display = 'none';
  document.getElementById('popup-overlay').classList.remove('active');
  document.getElementById('forgotPassModal').classList.remove('active');
  document.getElementById('forgotPassModal').style.display = 'none';
}

async function verifySecurityAnswers() {
  const email = document.getElementById('fp-email').value.trim().toLowerCase();
  const a1 = document.getElementById('fp-a1').value.trim().toLowerCase();
  const a2 = document.getElementById('fp-a2').value.trim().toLowerCase();

  if (!email || !a1 || !a2) return showFpMsg('All fields required', 'red');

  const res = await fetch('/api/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'verify', email, answer1: a1, answer2: a2 })
  });

  const data = await res.json();

  if (data.success) {
    forgotEmail = email;
    document.getElementById('forgot-step-1').style.display = 'none';
    document.getElementById('forgot-step-2').style.display = 'block';
    showFpMsg('Answers correct! Set new password.', 'green');
  } else {
    showFpMsg(data.error || 'Incorrect answers or email not found', 'red');
  }
}

async function resetPassword() {
  const newpass = document.getElementById('fp-newpass').value;
  const confirm = document.getElementById('fp-confirm').value;

  if (newpass !== confirm) return showFpMsg2('Passwords do not match', 'red');
  if (newpass.length < 6) return showFpMsg2('Password too short', 'red');

  const res = await fetch('/api/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'reset', email: forgotEmail, newPassword: newpass })
  });

  const data = await res.json();

  if (data.success) {
    showFpMsg2('Password updated! You can now login.', 'green');
    setTimeout(() => {
      closeForgotPassword();
      showLogin();
      document.getElementById('login-email').value = forgotEmail;
    }, 2000);
  } else {
    showFpMsg2(data.error || 'Something went wrong', 'red');
  }
}

function showFpMsg(text, color) {
  const el = document.getElementById('fp-msg');
  el.textContent = text;
  el.style.color = color;
}
function showFpMsg2(text, color) {
  const el = document.getElementById('fp-msg2');
  el.textContent = text;
  el.style.color = color;
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