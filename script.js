// ====================== SHARED PRODUCT DATA ======================
const products = [
  { id: 1, name: "Redmi Earpod", price: 2700, stock: 1, img: "images/redmi-earpod.jpg", description: "High-quality wireless earbuds with deep bass and long battery life.", phone: "+251941057332" },
  { id: 2, name: "Hair Trimmer Golden", price: 1100, stock: 1, img: "images/hair-trimmer gold.jpg", description: "Professional golden hair trimmer with sharp blades.", phone: "+251941057332" },
  { id: 3, name: "Hair Trimmer Black", price: 1100, stock: 1, img: "images/hair-trimmer black.jpg", description: "Sleek black hair trimmer for precise cutting.", phone: "+251941057332" },
  { id: 4, name: "USB-C Charger", price: 750, stock: 45, img: "images/image.png", description: "Fast charging USB-C adapter with 65W power delivery.", phone: "+251941057332" },
  { id: 5, name: "Wireless Mouse Adjustable DPI", price: 1200, stock: 1, img: "images/mouse-black.jpg", description: "Ergonomic wireless mouse with adjustable DPI settings.", phone: "+251941057332" },
  { id: 6, name: "Slim Wireless Mouse White", price: 1200, stock: 0, img: "images/mouse-white.jpg", description: "Ultra-slim and lightweight wireless mouse in white.", phone: "+251941057332" },
  { id: 7, name: "Hair Clipper", price: 2000, stock: 0, img: "images/Hair Clipper.jpg", description: "Professional cordless hair clipper with multiple guards.", phone: "+251941057332" },
  { id: 8, name: "Lenovo Thinkplus LivePods", price: 2999, stock: 0, img: "images/Lenovo LivePods.jpg", description: "Premium TWS earbuds with active noise cancellation.", phone: "+251941057332" },
  { id: 9, name: "USB Bluetooth 5.3/5.1/5.0 Adapter", price: 1000, stock: 0, img: "images/USB Bluetooth.jpg", description: "Add Bluetooth to any PC or laptop instantly.", phone: "+251941057332" },
  { id: 10, name: "WiFi 6 USB 3.0 Adapter", price: 2500, stock: 0, img: "images/WiFi-adapter.jpg", description: "Upgrade your PC to ultra-fast WiFi 6 speeds.", phone: "+251941057332" },
  { id: 11, name: "Air Pro 6 TWS Headset", price: 1500, stock: 0, img: "images/tws earpod.jpg", description: "Best-selling wireless earbuds with touch control and mic.", phone: "+251941057332" }
];

// ====================== CART SYSTEM ======================
const cartLink = document.getElementById('cart-link');
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  if (!cartLink) return;
  const total = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  cartLink.textContent = `Cart (${total})`;
}

// Toast Notification
function showToast(message) {
  const old = document.getElementById('toast');
  if (old) old.remove();

  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.textContent = message;
  toast.style.cssText = `
    position:fixed;top:20px;right:20px;background:#27ae60;color:white;
    padding:1rem 1.5rem;border-radius:8px;font-weight:600;z-index:9999;
    box-shadow:0 4px 12px rgba(0,0,0,0.3);cursor:pointer;
    animation:slideIn 0.4s;
  `;

  // Click to dismiss instantly
  toast.onclick = () => toast.remove();

  document.body.appendChild(toast);

  // Auto-remove after 3 seconds (if not clicked)
  setTimeout(() => {
    if (document.getElementById('toast') === toast) {
      toast.remove();
    }
  }, 3000);
}

// Add animations & styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn { from { transform:translateX(100%); opacity:0; } to { transform:translateX(0); opacity:1; } }
  @keyframes fadeOut { to { opacity:0; transform:translateY(-20px); } }
  .add-to-cart.sold-out { background:#95a5a6 !important; cursor:not-allowed; opacity:0.7; }
  .add-to-cart.sold-out:hover { background:#95a5a6 !important; }
  #lightbox.active { display:flex !important; }
`;
document.head.appendChild(style);

// ====================== AUTO DETECT PAGE & RUN ======================
document.addEventListener('DOMContentLoaded', () => {
  // Update cart count on all pages
  updateCartCount();

  // === 3. LIGHTBOX (works on both pages) ===
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');

  window.openLightbox = function (src) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.closeLightbox = function () {
    if (!lightbox) return;
    lightbox.classList.remove('active');
    lightboxImg.src = '';
    document.body.style.overflow = '';
  };

  if (lightbox) {
    lightbox.addEventListener('click', e => {
      if (e.target === lightbox || e.target.tagName === 'SPAN') closeLightbox();
    });
  }

  // Add to cart function (global)
  window.addToCart = function (id) {
    const product = products.find(p => p.id === id);
    if (!product || product.stock <= 0) return;

    const existing = cart.find(i => i.id === id);
    if (existing) existing.quantity += 1;
    else cart.push({ ...product, quantity: 1 });

    saveCart();
    showToast(`${product.name} added to cart!`);
  };
});