  // ====================== GLOBALS ======================
  const cartLink = document.getElementById('cart-link');
  let currentUser = null;

  // Get logged-in user from your auth system
  function getCurrentUser() {
    const data = localStorage.getItem('ahaduUser');
    if (!data) return null;
    try {
      const parsed = JSON.parse(data);
      if (Date.now() > parsed.expiresAt) {
        localStorage.removeItem('ahaduUser');
        return null;
      }
      return parsed.user;
    } catch { return null; }
  }

  // Toast
  function showToast(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.cssText = `
      position:fixed;top:20px;right:20px;z-index:9999;padding:1rem 1.5rem;
      border-radius:12px;color:white;font-weight:600;box-shadow:0 8px 25px rgba(0,0,0,0.3);
      animation:slideIn 0.4s, fadeOut 0.4s 2.6s forwards;
      ${type === 'error' ? 'background:#e74c3c;' : 'background:#27ae60;'}
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn { from {transform:translateX(100%);opacity:0} to {transform:translateX(0);opacity:1} }
    @keyframes fadeOut { to {opacity:0;transform:translateY(-20px)} }
    .add-to-cart-btn:disabled, .add-to-cart.sold-out { background:#95a5a6 !important; cursor:not-allowed; opacity:0.7; }
  `;
  document.head.appendChild(style);

  // ====================== FETCH CART COUNT FROM DB ======================
  async function updateCartCount() {
    if (!currentUser || !cartLink) return;

    try {
      const res = await fetch(`/api/cart/count?user_id=${currentUser.id}`);
      const data = await res.json();
      const total = data.count || 0;
      cartLink.textContent = `Cart (${total})`;
    } catch (err) {
      cartLink.textContent = 'Cart (?)';
    }
  }

  // ====================== ADD TO CART (DB ONLY) ======================
  async function addToCart(product) {
    if (!currentUser) {
      showToast('Please login to add to cart', 'error');
      openPopup?.();
      return;
    }

    if (!product || product.stock <= 0) {
      showToast('Out of stock', 'error');
      return;
    }

    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          product_id: product.id
        })
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to add');
      }

      if (result.full) {
        showToast(`Stock full! Only ${product.stock} available`, 'error');
      } else {
        showToast(`${product.name} added to cart!`);
      }

      updateCartCount(); // Refresh count

    } catch (err) {
      console.error(err);
      showToast('Error: ' + err.message, 'error');
    }
  }

  // ====================== LOAD PRODUCT FROM DB ======================
  async function loadProductFromDB(productId) {
    try {
      const res = await fetch(`/api/products?id=${productId}`);
      if (!res.ok) return null;
      const products = await res.json();
      return products[0] || null;
    } catch { return null; }
  }

  // ====================== PAGE LOAD ======================
  document.addEventListener('DOMContentLoaded', async () => {
    currentUser = getCurrentUser();
    updateCartCount();

    const isDetailPage = window.location.pathname.includes('product_items.html');
    const isListPage = !!document.getElementById('product-list');

    // === PRODUCT DETAIL PAGE ===
    if (isDetailPage) {
      const urlParams = new URLSearchParams(window.location.search);
      const productId = parseInt(urlParams.get('id')) || 1;

      const product = await loadProductFromDB(productId);

      if (!product) {
        document.body.innerHTML = `<h1 style="text-align:center;margin:100px;color:#e74c3c;">Product Not Found</h1>`;
        return;
      }

      document.title = `${product.name} - AhaduTech`;
      document.getElementById('product-name').textContent = product.name;
      document.getElementById('product-price').textContent = `${product.price} Birr`;
      document.getElementById('product-stock').textContent = `In Stock: ${product.stock}`;
      document.getElementById('product-phone').innerHTML = `Call: <a href="tel:${product.phone}">${product.phone}</a>`;
      document.getElementById('product-img').src = product.image || 'images/placeholder.jpg';
      document.getElementById('product-desc').textContent = product.description || 'No description.';

      const btn = document.getElementById('add-to-cart');
      btn.onclick = () => addToCart(product);

      if (product.stock <= 0) {
        btn.textContent = 'Sold Out';
        btn.disabled = true;
        btn.classList.add('sold-out');
      }
    }

    // === PRODUCT LIST PAGE ===
    if (isListPage) {
      try {
        const res = await fetch('/api/products');
        const products = await res.json();

        const list = document.getElementById('product-list');
        list.innerHTML = '';

        products.forEach(p => {
          const card = document.createElement('div');
          card.className = 'product-card';

          const btnHTML = p.stock > 0
            ? `<button class="add-to-cart" onclick="addToCartDB(${p.id})">Add to Cart</button>`
            : `<button class="add-to-cart sold-out" disabled>Sold Out</button>`;

          card.innerHTML = `
            <img src="${p.image || 'images/placeholder.jpg'}" alt="${p.name}" class="product-img" onclick="openLightbox('${p.image}')">
            <div class="product-info">
              <div class="product-title"><a href="product_items.html?id=${p.id}">${p.name}</a></div>
              <div class="product-price">${p.price} Birr</div>
              <div class="product-stock">Stock: ${p.stock}</div>
              ${btnHTML}
            </div>
          `;
          list.appendChild(card);
        });
      } catch (err) {
        document.getElementById('product-list').innerHTML = '<p style="color:red;">Failed to load products</p>';
      }
    }

    // Global function for list page
    window.addToCartDB = async (id) => {
      const product = await loadProductFromDB(id);
      if (product) addToCart(product);
    };
  });

  // Lightbox
  window.openLightbox = (src) => {
    let lb = document.getElementById('lightbox');
    if (!lb) {
      lb = document.createElement('div');
      lb.id = 'lightbox';
      lb.innerHTML = `<img id="lightbox-img"><span onclick="closeLightbox()">X</span>`;
      document.body.appendChild(lb);
    }
    document.getElementById('lightbox-img').src = src;
    lb.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };
  window.closeLightbox = () => {
    const lb = document.getElementById('lightbox');
    if (lb) lb.style.display = 'none';
    document.body.style.overflow = '';
  };