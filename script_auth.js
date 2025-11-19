// Global current user
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

// Save logged-in user
function setCurrentUser(user) {
    currentUser = user;
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    updateLoginUI();
    loadComments?.(); // refresh reviews if function exists
}

function getCurrentUser() {
    if (currentUser) return currentUser;
    const saved = sessionStorage.getItem('currentUser');
    if (saved) {
        currentUser = JSON.parse(saved);
        updateLoginUI();
    }
    return currentUser;
}

// Update login button & review form
function updateLoginUI() {
    const btn = document.querySelector('.open-auth-btn');
    const container = document.getElementById('review-form-container');
    const msg = document.getElementById('logged-in-message');

    if (currentUser) {
        btn.textContent = `Hi, ${currentUser.name.split(' ')[0]}`;
        if (container) container.style.display = 'block';
        if (msg) msg.textContent = `Logged in as ${currentUser.name}`;
    } else {
        btn.textContent = 'Login / Register';
        if (container) container.style.display = 'none';
        if (msg) msg.textContent = '';
    }
}

// Register
async function register() {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pass = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;

    if (pass !== confirm) return showMessage('Passwords do not match', 'red');
    if (pass.length < 6) return showMessage('Password too short', 'red');

    const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', name, email, password: pass })
    });
    const data = await res.json();

    showMessage(data.error || 'Registered! Now login', data.success ? 'green' : 'red');
    if (data.success) {
        setTimeout(() => {
            showLogin();
            document.getElementById('login-email').value = email;
        }, 1500);
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
        showMessage(`Welcome, ${data.user.name}!`, 'green');
        setTimeout(closePopup, 800);
    } else {
        showMessage(data.error || 'Login failed', 'red');
    }
}

function showMessage(text, color) {
    const el = document.getElementById('auth-message');
    el.style.color = color;
    el.textContent = text;
}

// Load user on page start
document.addEventListener('DOMContentLoaded', () => {
    getCurrentUser();
});
