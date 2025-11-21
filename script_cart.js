
// Unique session ID (keeps cart when not logged in)
let sessionId = localStorage.getItem('cartSession') || crypto.randomUUID();
if (!localStorage.getItem('cartSession')) {
    localStorage.setItem('cartSession', sessionId);
}

// Get current user (from your auth system)
let currentUser = null;
try {
    const session = JSON.parse(localStorage.getItem('userSession') || '{}');
    currentUser = session.user || null;
} catch (e) { }

const cartContainer = document.getElementById('cart-container');
const totalItemsEl = document.getElementById('total-items');
const totalPriceEl = document.getElementById('total-price');
const cartLink = document.getElementById('cart-link');

let cart = [];

// Call API
async function cartAPI(action, data = {}) {
    const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action,
            sessionId,
            userId: currentUser?.id || null,
            ...data
        })
    });
    return await res.json();
}

// Load cart on page load
async function loadCart() {
    const data = await cartAPI('get');
    if (data.success) {
        cart = data.cart;
        renderCart();
        updateCartCount();
    }
}

// Add to cart
async function addToCart(productId, qty = 1) {
    const data = await cartAPI('add', { productId, quantity: qty });
    if (data.success) {
        cart = data.cart;
        renderCart();
        updateCartCount();
    } else {
        alert(data.error);
    }
}

// Remove from cart
async function removeFromCart(productId) {
    const data = await cartAPI('remove', { productId });
    if (data.success) {
        cart = data.cart;
        renderCart();
        updateCartCount();
    }
}

// Update quantity
async function updateQuantity(productId, quantity) {
    const data = await cartAPI('update', { productId, quantity });
    if (data.success) {
        cart = data.cart;
        renderCart();
        updateCartCount();
    } else {
        alert(data.error);
        loadCart(); // refresh if error
    }
}

// Render cart
function renderCart() {
    cartContainer.innerHTML = '';

    if (cart.length === 0) {
        cartContainer.innerHTML = `<div class="empty-cart"><p>Your cart is empty. <a href="index.html">Shop now!</a></p></div>`;
        totalItemsEl.textContent = '0';
        totalPriceEl.textContent = '$0.00';
        return;
    }

    let totalItems = 0;
    let totalPrice = 0;

    const grid = document.createElement('div');
    grid.className = 'cart-items';

    cart.forEach(item => {
        totalItems += item.quantity;
        totalPrice += item.price * item.quantity;

        const card = document.createElement('div');
        card.className = 'cart-card';
        card.innerHTML = `
      <img src="../images/${item.img}" alt="${item.name}" class="cart-img" onclick="openLightbox('../images/${item.img}')">
      <div class="cart-info">
        <div class="cart-title">${item.name}</div>
        <div class="cart-price">$${item.price.toFixed(2)}</div>
        <div class="cart-quantity">Qty: 
          <button class="qty-btn minus" data-id="${item.product_id}">-</button>
          <span class="qty-number">${item.quantity}</span>
          <button class="qty-btn plus" data-id="${item.product_id}">+</button>
          ${item.quantity >= item.stock ? '<small style="color:red; margin-left:8px;">(Max stock)</small>' : ''}
        </div>
        <button class="remove-btn" onclick="removeFromCart(${item.product_id})">Remove</button>
      </div>
    `;
        grid.appendChild(card);
    });

    cartContainer.appendChild(grid);
    totalItemsEl.textContent = totalItems;
    totalPriceEl.textContent = `$${totalPrice.toFixed(2)}`;

    // + / - buttons
    document.querySelectorAll('.qty-btn').forEach(btn => {
        btn.onclick = () => {
            const id = parseInt(btn.dataset.id);
            const change = btn.classList.contains('plus') ? 1 : -1;
            updateQuantity(id, cart.find(i => i.product_id === id).quantity + change);
        };
    });
}

// Update cart count in navbar
function updateCartCount() {
    const count = cart.reduce((sum, i) => sum + i.quantity, 0);
    cartLink.textContent = `Cart (${count})`;
}

// Lightbox (keep your existing one)
function openLightbox(src) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    lightboxImg.src = src;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    document.getElementById('lightbox').classList.remove('active');
    document.getElementById('lightbox-img').src = '';
    document.body.style.overflow = '';
}

// Start
loadCart();
