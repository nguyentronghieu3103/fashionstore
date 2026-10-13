// UI interactions for Lighlife
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Format currency
  const formatVND = (num) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  // Render mock data if container exists
  const productsContainer = document.getElementById('new-arrivals-grid');
  if (productsContainer && window.MockData) {
    const products = window.MockData.getNewArrivals();
    productsContainer.innerHTML = products.map(p => `
      <div class="card">
        <a href="#" class="card-img-wrapper">
          <img src="${p.img}" alt="${p.name}">
        </a>
        <div class="card-body">
          <h3 class="card-title">${p.name}</h3>
          <div class="card-price">${formatVND(p.price)}</div>
        </div>
      </div>
    `).join('');
  }

  // Demo button behavior
  document.querySelectorAll('a[href="#"], button[type="button"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Prevent jumping for dummy links
      e.preventDefault();
      
      // If it's a "Mua ngay" / "Thêm giỏ hàng" demo
      if (btn.classList.contains('btn-primary') && (btn.textContent.includes('Mua') || btn.textContent.includes('Khám phá'))) {
        const originalText = btn.textContent;
        btn.textContent = 'Đang xử lý...';
        btn.style.opacity = '0.7';
        
        setTimeout(() => {
          btn.textContent = 'Thành công';
          btn.style.backgroundColor = 'var(--success)';
          btn.style.opacity = '1';
          
          setTimeout(() => {
            btn.textContent = originalText;
            btn.style.backgroundColor = '';
          }, 2000);
        }, 800);
      }
    });
  });
});

  // Mobile Menu Toggle
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const mobileNav = document.getElementById('mobile-nav');
  if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
    });
  }

