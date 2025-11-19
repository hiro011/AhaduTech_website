// js/shop-system.js
let cartSessionId = localStorage.getItem('cartSession') || crypto.randomUUID();
localStorage.setItem('cartSession', cartSessionId);

async function loadProducts() {
    const res = await fetch('/api/products');
    const products = await res.json();

    const isListPage = !!document.getElementById('product-list');
    const isDetailPage = window.location.pathname.includes('product_items.html');

    if (isListPage) {
        const list = document.getElementById('product-list');
        list.innerHTML = '';
        products.forEach(p => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
        <img src="${p.image}" alt="${p.name}" class="product-img" onclick="openLightbox('${p.image}')">
        <div class="product-info">
          <div class="product-title"><a href="product_items.html?id=${p.id}">${p.name}</a></div>
          <div class="product-price">${p.price} Birr</div>
          <div class="product-stock">Stock: ${p.stock}</div>
          <div class="product-phone">Phone: <a href="tel:${p.phone}">${p.phone.replace('+251', '')}</a></div>
          <button class="add-to-cart" onclick="addToCart(${p.id})" ${p.stock <= 0 ? 'disabled class="sold-out"' : ''}>
            ${p.stock > 0 ? 'Add to Cart' : 'Sold Out'}
          </button>
        </div>
      `;
            list.appendChild(card);
        });
    }

    if (isDetailPage) {
        const id = new URLSearchParams(location.search).get('id');
        const product = products.find(p => p.id == id);
        if (!product) return document.body.innerHTML = '<h1>Product Not Found</h1>';

        document.title = `${product.name} - AhaduTech`;
        document.getElementById('product-name').textContent = product.name;
        document.getElementById('product-price').textContent = `${product.price} Birr`;
        document.getElementById('product-stock').textContent = `Stock: ${product.stock}`;
        document.getElementById('product-phone').innerHTML = `Phone: <a href="tel:${product.phone}">${product.phone}</a>`;
        document.getElementById('product-img').src = product.image;
        document.getElementById('product-desc').textContent = product.description || 'No description';

        const btn = document.getElementById('add-to-cart');
        btn.onclick = () => addToCart(product.id);
        if (product.stock <= 0) {
            btn.textContent = 'Sold Out'; btn.disabled = true; btn.classList.add('sold-out');
        }
    }
}

async function addToCart(productId) {
    const user = getCurrentUser();
    await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            sessionId: cartSessionId,
            userId: user?.id,
            productId: parseInt(productId)
        })
    });
    showToast('Added to cart!');
    updateCartCount();
}

async function updateCartCount() {
    const res = await fetch('/api/cart?sessionId=' + cartSessionId);
    const items = await res.json();
    const total = items.reduce((sum, i) => sum + i.quantity, 0);
    const link = document.getElementById('cart-link');
    if (link) link.textContent = `Cart (${total})`;
}

// Toast
function showToast(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;top:20px;right:20px;background:#27ae60;color:white;padding:1rem 2rem;border-radius:8px;z-index:9999;animation:slideIn 0.4s';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    updateCartCount();
});