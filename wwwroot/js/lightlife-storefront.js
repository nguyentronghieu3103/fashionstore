/**
 * ==========================================================================
 * LIGHT LIFE FASHION STUDIO - STOREFRONT JAVASCRIPT (Thuần ES6)
 * ==========================================================================
 * Quy ước kiến trúc:
 * - Dữ liệu demo và URL backend tập trung ở STORE_CONFIG để dễ thay đổi.
 * - Giỏ hàng thật do ASP.NET Core quản lý qua Session/Cookie (gọi endpoint hook).
 * - Không dùng localStorage làm cơ chế bảo mật đăng nhập; không lưu mật khẩu hoặc quyền.
 * - Mọi tương tác giao diện demo ghi rõ "tính tạm hiển thị", backend quyết định giá & tồn kho.
 */

// 1. CẤU HÌNH HỆ THỐNG & URL ENDPOINTS
const STORE_CONFIG = {
  // Endpoints API kết nối backend ASP.NET Core MVC / Web API
  api: {
    cartCount: '/api/cart/count',       // GET: Lấy số lượng giỏ hàng theo Session
    cartAdd: '/api/cart/add',           // POST: Thêm sản phẩm vào giỏ
    authStatus: '/api/auth/status',     // GET: Kiểm tra phiên đăng nhập từ cookie/session
    authLogout: '/Account/Logout'       // POST/GET: Đăng xuất phiên
  },
  
  // Đường dẫn các trang chức năng
  routes: {
    home: '/',
    products: '/Products',
    productsNew: '/Products?sort=newest',
    productsBestSeller: '/Products?filter=bestseller',
    categoryPrefix: '/Products?category=',
    productDetailPrefix: '/Products/Detail/',
    cart: '/Cart',
    login: '/Account/Login',
    myAccount: '/Account/Profile',
    myOrders: '/Account/Orders'
  },

  // Dữ liệu sản phẩm demo trên trang Home
  demoData: {
    newArrivals: [
      {
        id: 101,
        name: "Áo Blazer Nữ Cổ Điển Dáng Suông",
        category: "Thời Trang Nữ",
        categorySlug: "nu",
        price: 650000,
        tag: "Mới Về",
        rating: 4.9,
        reviewsCount: 38,
        imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=800&auto=format&fit=crop"
      },
      {
        id: 102,
        name: "Áo Sơ Mi Nam Oxford Trắng Thanh Lịch",
        category: "Thời Trang Nam",
        categorySlug: "nam",
        price: 420000,
        tag: "Mới Về",
        rating: 4.8,
        reviewsCount: 52,
        imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=800&auto=format&fit=crop"
      },
      {
        id: 103,
        name: "Đầm Lụa Dáng Dài Dự Tiệc Cao Cấp",
        category: "Thời Trang Nữ",
        categorySlug: "nu",
        price: 890000,
        tag: "Mới Về",
        rating: 5.0,
        reviewsCount: 29,
        imageUrl: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=800&auto=format&fit=crop"
      },
      {
        id: 104,
        name: "Quần Tây Nam Dáng Suông Tinh Tế",
        category: "Thời Trang Nam",
        categorySlug: "nam",
        price: 520000,
        tag: "Mới Về",
        rating: 4.7,
        reviewsCount: 44,
        imageUrl: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=800&auto=format&fit=crop"
      }
    ],

    bestSellers: [
      {
        id: 201,
        name: "Áo Polo Nam Dệt Kim Cao Cấp",
        category: "Thời Trang Nam",
        categorySlug: "nam",
        price: 380000,
        tag: "Bán Chạy",
        rating: 4.9,
        reviewsCount: 168,
        imageUrl: "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?q=80&w=800&auto=format&fit=crop"
      },
      {
        id: 202,
        name: "Set Váy Dạ Tweed Thu Đông Sang Trọng",
        category: "Thời Trang Nữ",
        categorySlug: "nu",
        price: 950000,
        tag: "Bán Chạy",
        rating: 5.0,
        reviewsCount: 210,
        imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop"
      },
      {
        id: 203,
        name: "Quần Jean Nữ Ống Đứng Vintage",
        category: "Thời Trang Nữ",
        categorySlug: "nu",
        price: 450000,
        tag: "Bán Chạy",
        rating: 4.8,
        reviewsCount: 195,
        imageUrl: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=800&auto=format&fit=crop"
      },
      {
        id: 204,
        name: "Túi Xách Da Minimalist Cao Cấp",
        category: "Phụ Kiện",
        categorySlug: "phukien",
        price: 680000,
        tag: "Bán Chạy",
        rating: 4.9,
        reviewsCount: 142,
        imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop"
      }
    ]
  }
};

// 2. ĐỊNH DẠNG TIỀN TỆ VND
function formatCurrencyVND(amount) {
  if (typeof amount !== 'number') return '0 đ';
  return amount.toLocaleString('vi-VN') + ' đ';
}

// 3. QUẢN LÝ GIỎ HÀNG QUA HOOK BACKEND (SESSION / COOKIE)
const LightLifeCart = {
  // Lấy số lượng giỏ hàng hiện tại qua hook backend
  async syncCartCount() {
    const badgeEl = document.getElementById('llCartBadge');
    if (!badgeEl) return;

    try {
      // Thử gọi endpoint backend ASP.NET Core MVC session
      const response = await fetch(STORE_CONFIG.api.cartCount, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        badgeEl.textContent = data.count || 0;
        badgeEl.style.display = (data.count > 0) ? 'flex' : 'none';
        return;
      }
    } catch (err) {
      // Backend chưa có endpoint -> fallback an toàn cho môi trường tĩnh / dev
      console.info('[LightLife] Backend cart API endpoint chưa khả dụng, sử dụng hiển thị mẫu phiên.');
    }

    // Hiển thị số lượng mẫu demo an toàn
    const demoCount = 2; // Ví dụ khách đã có sẵn 2 món trong phiên
    badgeEl.textContent = demoCount;
    badgeEl.style.display = 'flex';
  },

  // Thêm nhanh vào giỏ (Tương tác demo hiển thị)
  async addItem(productId, productName) {
    try {
      // Gửi request tới backend ASP.NET Core
      const response = await fetch(STORE_CONFIG.api.cartAdd, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: productId, quantity: 1 })
      });

      if (response.ok) {
        await this.syncCartCount();
      }
    } catch (e) {
      // Backend chưa nối -> cập nhật badge tạm thời
      const badgeEl = document.getElementById('llCartBadge');
      if (badgeEl) {
        const current = parseInt(badgeEl.textContent || '0', 10);
        badgeEl.textContent = current + 1;
        badgeEl.style.display = 'flex';
      }
    }

    // Thông báo phản hồi giao diện minh bạch
    showToast(`Đã thêm tạm "${productName}" vào giỏ hàng. Giá và tồn kho do Backend xác nhận.`);
  }
};

// 4. QUẢN LÝ XÁC THỰC PHIÊN TÀI KHOẢN (AUTH STATUS HOOK)
const LightLifeAuth = {
  // Kiểm tra trạng thái đăng nhập từ cookie / session endpoint backend
  async checkSession() {
    const loginBtn = document.getElementById('llLoginBtn');
    const userWrapper = document.getElementById('llUserWrapper');
    const userNameEl = document.getElementById('llUserName');
    const userAvatarEl = document.getElementById('llUserAvatar');

    if (!loginBtn || !userWrapper) return;

    let user = null;

    try {
      const response = await fetch(STORE_CONFIG.api.authStatus, {
        method: 'GET',
        credentials: 'same-origin'
      });
      if (response.ok) {
        user = await response.json();
      }
    } catch (e) {
      // Kiểm tra tham số URL (?auth=logged_in) hoặc cookie phiên mô phỏng
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('demo_user') === 'true' || urlParams.get('auth') === 'logged_in') {
        user = {
          fullName: 'Nguyễn Thu Trang',
          email: 'thutrang@lightlife.vn'
        };
      }
    }

    // Render giao diện theo trạng thái đăng nhập
    if (user && user.fullName) {
      // ĐÃ ĐĂNG NHẬP: ẩn nút đăng nhập, hiện avatar/tên và menu
      loginBtn.style.display = 'none';
      userWrapper.style.display = 'block';
      if (userNameEl) userNameEl.textContent = user.fullName;
      if (userAvatarEl) userAvatarEl.textContent = user.fullName.charAt(0).toUpperCase();
    } else {
      // CHƯA ĐĂNG NHẬP: hiện nút đăng nhập, ẩn dropdown user
      loginBtn.style.display = 'inline-flex';
      userWrapper.style.display = 'none';
    }
  },

  // Toggle hiển thị dropdown menu tài khoản
  toggleDropdown() {
    const dropdown = document.getElementById('llUserDropdownMenu');
    if (dropdown) {
      dropdown.classList.toggle('show');
    }
  },

  // Đóng dropdown khi click bên ngoài
  closeDropdown() {
    const dropdown = document.getElementById('llUserDropdownMenu');
    if (dropdown && dropdown.classList.contains('show')) {
      dropdown.classList.remove('show');
    }
  },

  // Đăng xuất phiên
  logout() {
    // Chuyển hướng tới endpoint đăng xuất của backend hoặc làm mới trang
    showToast('Đang đăng xuất phiên làm việc...');
    setTimeout(() => {
      window.location.href = STORE_CONFIG.api.authLogout;
    }, 500);
  }
};

// 5. TOAST NOTIFICATION PHẢN HỒI GIAO DIỆN
function showToast(message) {
  let toast = document.getElementById('llToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'llToast';
    toast.className = 'll-toast';
    toast.innerHTML = `
      <i class="fa-solid fa-circle-check ll-toast-icon"></i>
      <span id="llToastMessage">${message}</span>
    `;
    document.body.appendChild(toast);
  } else {
    document.getElementById('llToastMessage').textContent = message;
  }

  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

// 6. RENDER CARD SẢN PHẨM TRÊN TRANG HOME
function renderProductCards(containerId, products) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = products.map(product => `
    <article class="ll-product-card" data-product-id="${product.id}">
      <a href="${STORE_CONFIG.routes.productDetailPrefix}${product.id}" class="ll-product-img-box" title="${product.name}">
        <img src="${product.imageUrl}" alt="${product.name}" class="ll-product-img" loading="lazy" />
        ${product.tag ? `<span class="ll-product-tag">${product.tag}</span>` : ''}
      </a>
      <div class="ll-product-body">
        <span class="ll-product-category">${product.category}</span>
        <h3 class="ll-product-title">
          <a href="${STORE_CONFIG.routes.productDetailPrefix}${product.id}" title="${product.name}">${product.name}</a>
        </h3>
        <div class="ll-product-footer">
          <span class="ll-product-price">${formatCurrencyVND(product.price)}</span>
          <div class="ll-product-rating">
            <i class="fa-solid fa-star"></i>
            <span>${product.rating} (${product.reviewsCount})</span>
          </div>
        </div>
        <div class="ll-card-action-bar">
          <button type="button" class="ll-btn ll-btn-secondary" style="width: 100%; min-height: 44px;" 
                  onclick="LightLifeCart.addItem(${product.id}, '${product.name.replace(/'/g, "\\'")}')">
            <i class="fa-solid fa-bag-shopping"></i> Thêm vào giỏ
          </button>
        </div>
      </div>
    </article>
  `).join('');
}

// 7. XỬ LÝ TÌM KIẾM
function handleSearchSubmit(event) {
  event.preventDefault();
  const searchInput = document.getElementById('llSearchInput');
  if (!searchInput) return;
  const keyword = searchInput.value.trim();
  if (keyword) {
    window.location.href = `${STORE_CONFIG.routes.products}?search=${encodeURIComponent(keyword)}`;
  } else {
    window.location.href = STORE_CONFIG.routes.products;
  }
}

// 8. KHỞI TẠO TOÀN TRANG KHI DOM SẴN SÀNG
document.addEventListener('DOMContentLoaded', () => {
  // 8.1. Đồng bộ số lượng giỏ hàng & phiên người dùng
  LightLifeCart.syncCartCount();
  LightLifeAuth.checkSession();

  // 8.2. Render danh sách Hàng Mới Về & Sản Phẩm Bán Chạy nếu có container
  renderProductCards('llNewArrivalsGrid', STORE_CONFIG.demoData.newArrivals);
  renderProductCards('llBestSellersGrid', STORE_CONFIG.demoData.bestSellers);

  // 8.3. Sự kiện mở/đóng mobile menu
  const mobileToggle = document.getElementById('llMobileToggle');
  const mobileNav = document.getElementById('llMobileNav');
  if (mobileToggle && mobileNav) {
    mobileToggle.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
    });
  }

  // 8.4. Sự kiện click ngoài dropdown user để đóng lại
  document.addEventListener('click', (e) => {
    const userWrapper = document.getElementById('llUserWrapper');
    if (userWrapper && !userWrapper.contains(e.target)) {
      LightLifeAuth.closeDropdown();
    }
  });

  // 8.5. Form tìm kiếm
  const searchForm = document.getElementById('llSearchForm');
  if (searchForm) {
    searchForm.addEventListener('submit', handleSearchSubmit);
  }
});

// Xuất các đối tượng vào window để tiện gọi từ inline handler hoặc ASP.NET scripts
window.LightLifeCart = LightLifeCart;
window.LightLifeAuth = LightLifeAuth;
window.STORE_CONFIG = STORE_CONFIG;

