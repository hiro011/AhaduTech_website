// ====================== AUTO DETECT PAGE & RUN ======================
document.addEventListener('DOMContentLoaded', () => {
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
});