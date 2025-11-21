// script_cart.js – 
(() => {
    if (window.cartReady) return;
    window.cartReady = true;

    // Session ID for guests
    let sessionId = localStorage.getItem('cartSession');
    if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem('cartSession', sessionId);
    }

    // Get logged-in user safely (no conflict with auth.js)
    let currentUser = null;
    const getUser = () => {
        try {
            const data = localStorage.getItem('userSession') || localStorage.getItem('SESSION_KEY');
            if (data) {
                const parsed = JSON.parse(data);
                return parsed.user || parsed || null;
            }
        } catch (e) { }
        return null;
    };
    currentUser = getUser();

    // Listen for login/logout from other scripts
    window.addEventListener('storage', () => {
        currentUser = getUser();
        loadCart();
    });

    let cart = [];

    // API CALL
    const api = async (action, payload = {}) => {
        const res = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action,
                sessionId,
                userId: currentUser?.id || null,
                ...payload
            })
        });
        return res.json();
    };

    // GLOBAL FUNCTIONS – these fix "addToCart is not defined"
    window.addToCart = async (id, qty = 1) => {
        const data = await api('add', { productId: id, quantity: qty });
        if (data.success) {
            cart = data.cart;
            renderCart();
            updateCount();
        } else {
            alert(data.error || 'Failed');
        }
    };

    window.removeFromCart = async (id) => {
        const data = await api('remove', { productId: id });
        if (data.success) { cart = data.cart; renderCart(); updateCount(); }
    };

    window.updateQuantity = async (id, qty) => {
        const data = await api('update', { productId: id, quantity: qty });
        if (data.success) { cart = data.cart; renderCart(); updateCount(); }
        else { alert(data.error); loadCart(); }
    };

    window.loadCart = async () => {
        const data = await api('get');
        if (data.success) {
            cart = data.cart || [];
            renderCart();
            updateCount();
        }
    };

    function renderCart() {
        const container = document.getElementById('cart-container');
        const itemsEl = document.getElementById('total-items');
        const priceEl = document.getElementById('total-price');
        if (!container) return;

        if (cart.length === 0) {
            container.innerHTML = '<div class="empty-cart"><p>Your cart is empty. <a href="index.html">Shop now!</a></p></div>';
            if (itemsEl) itemsEl.textContent = '0';
            if (priceEl) priceEl.textContent = '0.00 Birr';
            return;
        }

        let totalQty = 0, totalPrice = 0;
        container.innerHTML = '<div class="cart-items">';

        cart.forEach(item => {
            totalQty += item.quantity;
            totalPrice += item.price * item.quantity;

            container.innerHTML += `
        <div class="cart-card">
          <img src="../images/${item.img}" class="cart-img" onclick="openLightbox('../images/${item.img}')">
          <div class="cart-info">
            <div class="cart-title">${item.name}</div>
            <div class="cart-price">${item.price} Birr</div>
            <div class="cart-quantity">
              <button class="qty-btn minus" onclick="updateQuantity(${item.product_id}, ${item.quantity - 1})">-</button>
              <span>${item.quantity}</span>
              <button class="qty-btn plus" onclick="updateQuantity(${item.product_id}, ${item.quantity + 1})">+</button>
            </div>
            <button class="remove-btn" onclick="removeFromCart(${item.product_id})">Remove</button>
          </div>
        </div>`;
        });
        container.innerHTML += '</div>';
        if (itemsEl) itemsEl.textContent = totalQty;
        if (priceEl) priceEl.textContent = totalPrice.toFixed(2) + ' Birr';
    }

    function updateCount() {
        const count = cart.reduce((s, i) => s + i.quantity, 0);
        const link = document.getElementById('cart-link');
        if (link) link.textContent = `Cart (${count})`;
    }

    // Auto load when page is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadCart);
    } else {
        loadCart();
    }
})();