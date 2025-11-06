const products = [
  { id: 1, name: "Redmi Earpod", price: 2700, stock: 1, img: "images/redmi-earpod.jpg" },
  { id: 2, name: "Hair Trimmer Golden", price: 1100, stock: 1, img: "images/hair-trimmer gold.jpg" },
  { id: 3, name: "Hair Trimmer Black", price: 1100, stock: 1, img: "images/hair-trimmer black.jpg" },
  { id: 4, name: "USB-C Charger", price: 29.99, stock: 45, img: "images/image.png" },
  { id: 5, name: "Wireless Mouse Adjustable DPI", price: 1200 , stock: 1, img: "images/mouse-black.jpg" },
  { id: 6, name: "Slim Wireless Mouse White", price: 1200, stock: 0, img: "images/mouse-white.jpg" },
  { id: 7, name: "Hair Clipper", price: 2000, stock: 0, img: "images/Hair Clipper.jpg" },
  { id: 8, name: "Lenovo Thinkplus LivePods", price: 2999, stock: 0, img: "images/Lenovo LivePods.jpg" },
  { id: 9, name: "USB Bluetooth 5.3/5.1/5.0 Adapter", price: 1000, stock: 0, img: "images/USB Bluetooth.jpg" },
  { id: 10, name: "WiFi 6 USB 3.0 Adapter", price: 2500, stock: 0, img: "images/WiFi-adapter.jpg" },
  { id: 11, name: "Air Pro 6 TWS Headset", price: 1500, stock: 0, img: "images/tws earpod.jpg" },
];

const productList = document.getElementById('product-list');
const cartLink = document.getElementById('cart-link');

// Load cart from localStorage
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Function to save cart
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

// Function to update cart count
function updateCartCount() {
  if (!cartLink) return; // Safety check

  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  cartLink.textContent = `Cart (${totalItems})`;
}

// Run on page load
document.addEventListener('DOMContentLoaded', updateCartCount);

// Function to show toast notification
function showToast(message) {
  // Remove existing toast
  const existing = document.getElementById('toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.textContent = message;
  toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #27ae60;
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 1000;
      animation: slideIn 0.4s ease, fadeOut 0.4s 2.6s ease forwards;
      min-width: 200px;
      text-align: center;
    `;

  document.body.appendChild(toast);

  toast.onclick = () => toast.remove();
  // Auto remove after animation
  setTimeout(() => toast.remove(), 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes fadeOut {
      to { opacity: 0; transform: translateY(-20px); }
    }
    .add-to-cart.sold-out {
      background-color: #95a5a6 !important;
      cursor: not-allowed;
      opacity: 0.7;
    }
    .add-to-cart.sold-out:hover {
      background-color: #95a5a6 !important;
    }
  `;
document.head.appendChild(style);

// Render Products
products.forEach(product => {
  const card = document.createElement('div');
  card.className = 'product-card';

  const buttonHTML = product.stock > 0
    ? `<button class="add-to-cart" onclick="addToCart(${product.id})">
           Add to Cart
         </button>`
    : `<button class="add-to-cart sold-out" disabled>
           Sold Out
         </button>`;

  card.innerHTML = `
      <img src="${product.img}" alt="${product.name}" class="product-img" onclick="openLightbox('${product.img}')">
      <div class="product-info">
        <div class="product-title">${product.name}</div>
        <div class="product-price">$${product.price} birr</div>
        <div class="product-stock">Available: ${product.stock} units</div>
        <div class="product-phone">Phone: <a href="tel:+251941057332">0941057332</a></div>
        ${buttonHTML}
      </div>
    `;

  productList.appendChild(card);
});

// Add to Cart Function
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product || product.stock <= 0) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  saveCart();
  showToast(`${product.name} added to cart!`);
}

// Initialize cart count on load
updateCartCount();

/* ---------- Light‑box functions ---------- */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
function openLightbox(src) {
  lightboxImg.src = src;
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';   // prevent background scroll
}
function closeLightbox() {
  lightbox.classList.remove('active');
  lightboxImg.src = '';
  document.body.style.overflow = '';
}
// Close when clicking the overlay (anywhere except the image)
lightbox.addEventListener('click', e => {
  if (e.target === lightbox) closeLightbox();
});