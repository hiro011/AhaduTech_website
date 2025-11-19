// js/auth.js
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

async function register() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;

  if (pass !== confirm) return showMessage('Passwords do not match!', 'red');
  if (!name || !email || !pass) return showMessage('Fill all fields!', 'red');

  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'register', name, email, password: pass })
  });
  const data = await res.json();

  showMessage(data.message || (data.success ? 'Success!' : 'Error'), data.success ? 'green' : 'red');
  if (data.success) {
    setTimeout(() => {
      showLogin();
      document.getElementById('login-email').value = email;
      showMessage('Account created! Now login.', 'green');
    }, 1200);
  }
}

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
    showMessage(`Welcome, ${data.user.name}!`, 'green');
    setTimeout(() => {
      closePopup();
      alert(`Logged in as ${data.user.name}`);
    }, 800);
  } else {
    showMessage(data.message || 'Login failed', 'red');
  }
}

function showMessage(text, color) {
  const msg = document.getElementById('auth-message');
  msg.style.color = color;
  msg.textContent = text;
}