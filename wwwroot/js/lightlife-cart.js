/**
 * ==========================================================================
 * LIGHT LIFE FASHION STUDIO - CART PAGE JAVASCRIPT (Thuần Vanilla ES6)
 * ==========================================================================
 * Chuẩn bị tích hợp ASP.NET Core MVC:
 * - Session giỏ hàng do ASP.NET Core quản lý qua Cookie định danh phiên.
 * - Khách chưa đăng nhập không cần userId vẫn đọc và chỉnh sửa giỏ bình thường.
 * - Frontend chỉ tính tạm hiển thị; Backend quyết định giá, tồn kho, thuế và quyền.
 * - Tương tác demo được ghi rõ minh bạch trong mã nguồn.
 * - Tuyệt đối KHÔNG ghi "Đã giữ hàng".
 * ==========================================================================
 */

// 1. CẤU HÌNH API VÀ DỮ LIỆU TẬP TRUNG
const CART_CONFIG = {
  endpoints: {  
    getCart: '/api/cart',                     // GET: Lấy danh sách sản phẩm trong giỏ
    updateQuantity: '/api/cart/update',       // POST: Cập nhật số lượng { itemId, quantity }
    removeItem: '/api/cart/remove',           // POST: Xóa sản phẩm { itemId }
    applyCoupon: '/api/coupon/apply',         // POST: Áp dụng mã ưu đãi { code }
    removeCoupon: '/api/coupon/remove',       // POST: Gỡ mã ưu đãi
    checkout: '/Checkout',                    // Trang thanh toán
    loginWithReturn: '/Account/Login?returnUrl=%2FCheckout' // Chuyển hướng đăng nhập giữ giỏ
  },

  // Danh sách mã ưu đãi demo (Backend sẽ thẩm định thật khi đặt hàng)
  demoCoupons: {
    'LIGHTLIFE10': { type: 'percent', value: 10, max: 100000, desc: 'Giảm 10% (tối đa 100.000 đ)' },
    'GIAM50K': { type: 'fixed', value: 50000, desc: 'Giảm 50.000 đ cho đơn hàng' }
  },

  // Dữ liệu mẫu demo khi API backend chưa khởi chạy
  mockData: [
    {
      id: 1,
      productId: 101,
      name: 'Áo Sơ Mi Linen Cổ Trụ Phom Rộng',
      color: 'Trắng Kem',
      colorHex: '#F8F6F0',
      size: 'M',
      unitPrice: 550000,
      quantity: 1,
      imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80',
      detailUrl: '/Products/Detail/1',
      outOfStock: false,
      priceChanged: false
    },
    {
      id: 2,
      productId: 104,
      name: 'Quần Tây Suông Xếp Ly',
      color: 'Đen Tinh Tế',
      colorHex: '#201C1A',
      size: 'L',
      unitPrice: 620000,
      quantity: 1,
      imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=400&q=80',
      detailUrl: '/Products/Detail/2',
      outOfStock: false,
      priceChanged: true, // Trạng thái demo: Giá vừa cập nhật từ hệ thống
      oldPrice: 590000
    },
    {
      id: 3,
      productId: 103,
      name: 'Đầm Lụa Dáng Dài Dự Tiệc Cao Cấp',
      color: 'Đỏ Rượu',
      colorHex: '#6F2438',
      size: 'S',
      unitPrice: 890000,
      quantity: 1,
      imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=400&q=80',
      detailUrl: '/Products/Detail/3',
      outOfStock: true, // Trạng thái demo: Hàng tạm hết để kiểm thử cảnh báo
      priceChanged: false
    }
  ]
};

// 2. TRẠNG THÁI GIỎ HÀNG CLIENT-SIDE (UI STATE)
const cartState = {
  items: [],
  coupon: null,         // Object mã ưu đãi đang áp dụng
  discountAmount: 0,    // Số tiền giảm giá tạm tính
  isLoading: false,
  pendingDeleteId: null // ID mặt hàng đang chờ xác nhận xóa
};

// 3. TIỆN ÍCH ĐỊNH DẠNG TIỀN TỆ VND
function formatVND(amount) {
  if (typeof amount !== 'number') amount = Number(amount) || 0;
  return amount.toLocaleString('vi-VN') + ' đ';
}

// 4. HIỂN THỊ THÔNG BÁO BANNER LỖI / CẢNH BÁO
function showCartAlert(message, isWarning = false) {
  const banner = document.getElementById('cartAlertBanner');
  const bannerText = document.getElementById('cartAlertText');
  if (!banner || !bannerText) return;

  bannerText.textContent = message;
  banner.classList.add('show');
  if (isWarning) {
    banner.style.backgroundColor = '#FEF0C7';
    banner.style.borderColor = '#FEDF89';
    banner.style.color = '#B54708';
  } else {
    banner.style.backgroundColor = '#FEF3F2';
    banner.style.borderColor = '#FECDCA';
    banner.style.color = 'var(--color-error, #B42318)';
  }

  // Tự cuộn lên thông báo nếu người dùng đang ở xa
  banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideCartAlert() {
  const banner = document.getElementById('cartAlertBanner');
  if (banner) banner.classList.remove('show');
}

// 5. TẢI DỮ LIỆU GIỎ HÀNG TỪ BACKEND SESSION
async function fetchCartData() {
  setLoadingState(true);
  hideCartAlert();

  try {
    // Gọi endpoint ASP.NET Core MVC / Web API
    const response = await fetch(CART_CONFIG.endpoints.getCart, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'same-origin' // Gửi cookie phiên Session
    });

    if (response.ok) {
      const data = await response.json();
      cartState.items = Array.isArray(data.items) ? data.items : [];
    } else {
      // Backend chưa có endpoint -> sử dụng dữ liệu demo để thiết kế & kiểm thử
      console.info('[LIGHT LIFE Cart] Đang hiển thị dữ liệu giỏ hàng mẫu cho môi trường phát triển.');
      cartState.items = JSON.parse(JSON.stringify(CART_CONFIG.mockData));
    }
  } catch (err) {
    console.warn('[LIGHT LIFE Cart] Không thể kết nối API giỏ hàng, tải dữ liệu demo:', err);
    cartState.items = JSON.parse(JSON.stringify(CART_CONFIG.mockData));
  } finally {
    setLoadingState(false);
    renderCart();
  }
}

// 6. QUẢN LÝ GIAO DIỆN LOADING
function setLoadingState(isLoading) {
  cartState.isLoading = isLoading;
  const loadingEl = document.getElementById('cartLoading');
  const layoutEl = document.getElementById('cartLayout');
  const emptyEl = document.getElementById('cartEmpty');

  if (isLoading) {
    if (loadingEl) loadingEl.classList.add('show');
    if (layoutEl) layoutEl.style.display = 'none';
    if (emptyEl) emptyEl.classList.remove('show');
  } else {
    if (loadingEl) loadingEl.classList.remove('show');
  }
}

// 7. RENDER GIAO DIỆN CHÍNH
function renderCart() {
  const layoutEl = document.getElementById('cartLayout');
  const emptyEl = document.getElementById('cartEmpty');
  const itemsContainer = document.getElementById('cartItemsList');
  const cartCountPill = document.getElementById('cartCountPill');

  if (!itemsContainer) return;

  // Kiểm tra giỏ hàng trống
  if (!cartState.items || cartState.items.length === 0) {
    if (layoutEl) layoutEl.style.display = 'none';
    if (emptyEl) emptyEl.classList.add('show');
    if (cartCountPill) cartCountPill.textContent = '0 sản phẩm';
    updateHeaderBadge(0);
    return;
  }

  // Có sản phẩm
  if (layoutEl) layoutEl.style.display = 'grid';
  if (emptyEl) emptyEl.classList.remove('show');

  // Tính tổng số lượng món để cập nhật badge
  const totalItemCount = cartState.items.reduce((sum, item) => sum + item.quantity, 0);
  if (cartCountPill) {
    cartCountPill.textContent = `${totalItemCount} sản phẩm`;
  }
  updateHeaderBadge(totalItemCount);

  // Render từng dòng sản phẩm
  itemsContainer.innerHTML = cartState.items.map(item => {
    const itemTotal = item.unitPrice * item.quantity;
    const isOut = item.outOfStock === true;
    const isPriceChanged = item.priceChanged === true;

    return `
      <article class="ll-cart-item ${isOut ? 'out-of-stock' : ''}" data-item-id="${item.id}">
        <!-- Cột 1: Ảnh đại diện tỷ lệ 4:5 -->
        <a href="${item.detailUrl}" class="ll-cart-item__thumb-link" title="${item.name}">
          <img src="${item.imageUrl}" alt="${item.name}" class="ll-cart-item__thumb" loading="lazy" />
        </a>

        <!-- Cột 2: Thông tin chi tiết -->
        <div class="ll-cart-item__details">
          <div class="ll-cart-item__top">
            <h3 class="ll-cart-item__title">
              <a href="${item.detailUrl}">${item.name}</a>
            </h3>

            <div class="ll-cart-item__variant">
              ${item.colorHex ? `<span class="ll-cart-item__variant-dot" style="background-color: ${item.colorHex};"></span>` : ''}
              <span>Màu: <strong>${item.color}</strong></span>
              <span>•</span>
              <span>Size: <strong>${item.size}</strong></span>
            </div>

            <div class="ll-cart-item__unit-price">
              Đơn giá: <strong>${formatVND(item.unitPrice)}</strong>
            </div>

            <!-- Cảnh báo trạng thái mặt hàng -->
            ${isOut ? `
              <div class="ll-cart-item__status-tag danger" role="alert">
                <i class="fa-solid fa-triangle-exclamation"></i> Tạm hết hàng - Vui lòng xóa hoặc chọn mẫu khác
              </div>
            ` : ''}

            ${isPriceChanged ? `
              <div class="ll-cart-item__status-tag warning" role="status">
                <i class="fa-solid fa-circle-info"></i> Giá đã được cập nhật từ hệ thống (Trước: ${formatVND(item.oldPrice)})
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Cột 3: Bộ tăng/giảm số lượng, Thành tiền & Xóa -->
        <div class="ll-cart-item__actions">
          <div class="ll-cart-item__total" title="Thành tiền">
            ${isOut ? '<span style="color: var(--color-error); font-size: 0.9375rem;">Không khả dụng</span>' : formatVND(itemTotal)}
          </div>

          <div class="ll-cart-item__controls">
            <!-- Stepper Số lượng (Chiều cao tối thiểu 44px) -->
            <div class="ll-stepper" aria-label="Thay đổi số lượng">
              <button type="button" 
                      class="ll-stepper__btn" 
                      onclick="handleQuantityChange(${item.id}, ${item.quantity - 1})"
                      aria-label="Giảm 1 sản phẩm"
                      ${isOut || item.quantity <= 1 ? 'disabled' : ''}>-</button>
              <input type="number" 
                     class="ll-stepper__input" 
                     value="${item.quantity}" 
                     min="1" 
                     max="10" 
                     readonly 
                     aria-label="Số lượng hiện tại" />
              <button type="button" 
                      class="ll-stepper__btn" 
                      onclick="handleQuantityChange(${item.id}, ${item.quantity + 1})"
                      aria-label="Tăng 1 sản phẩm"
                      ${isOut || item.quantity >= 10 ? 'disabled' : ''}>+</button>
            </div>

            <!-- Nút Xóa (Touch target tối thiểu 44px) -->
            <button type="button" 
                    class="ll-cart-item__delete-btn" 
                    onclick="promptRemoveItem(${item.id})"
                    title="Xóa sản phẩm này" 
                    aria-label="Xóa ${item.name} khỏi giỏ">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  // Cập nhật khung tóm tắt tiền bên phải
  calculateAndRenderSummary();
}

// 8. TÍNH TOÁN & CẬP NHẬT TÓM TẮT ĐƠN HÀNG
function calculateAndRenderSummary() {
  const subtotalEl = document.getElementById('summarySubtotal');
  const discountRowEl = document.getElementById('summaryDiscountRow');
  const discountValEl = document.getElementById('summaryDiscountValue');
  const totalValEl = document.getElementById('summaryTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');

  // Tính tiền các mặt hàng CÒN HÀNG (mặt hàng hết hàng không cộng vào tạm tính)
  let subtotal = 0;
  let hasOutOfStock = false;

  cartState.items.forEach(item => {
    if (item.outOfStock) {
      hasOutOfStock = true;
    } else {
      subtotal += item.unitPrice * item.quantity;
    }
  });

  // Tính giảm giá nếu có mã ưu đãi
  let discount = 0;
  if (cartState.coupon && subtotal > 0) {
    if (cartState.coupon.type === 'percent') {
      discount = Math.round((subtotal * cartState.coupon.value) / 100);
      if (cartState.coupon.max && discount > cartState.coupon.max) {
        discount = cartState.coupon.max;
      }
    } else if (cartState.coupon.type === 'fixed') {
      discount = cartState.coupon.value;
    }
    if (discount > subtotal) discount = subtotal;
  }
  cartState.discountAmount = discount;

  const finalTotal = Math.max(0, subtotal - discount);

  // Cập nhật lên UI
  if (subtotalEl) subtotalEl.textContent = formatVND(subtotal);

  if (discountRowEl && discountValEl) {
    if (discount > 0) {
      discountRowEl.style.display = 'flex';
      discountValEl.textContent = `-${formatVND(discount)}`;
    } else {
      discountRowEl.style.display = 'none';
    }
  }

  if (totalValEl) totalValEl.textContent = formatVND(finalTotal);

  // Kiểm soát nút Checkout nếu có sản phẩm hết hàng
  if (checkoutBtn) {
    if (hasOutOfStock) {
      checkoutBtn.disabled = true;
      checkoutBtn.title = 'Vui lòng xóa sản phẩm hết hàng để tiếp tục đặt hàng';
      showCartAlert('Giỏ hàng có sản phẩm tạm hết hàng. Vui lòng xóa sản phẩm hết hàng trước khi tiến hành thanh toán.', true);
    } else if (subtotal === 0) {
      checkoutBtn.disabled = true;
    } else {
      checkoutBtn.disabled = false;
      checkoutBtn.removeAttribute('title');
    }
  }
}

// 9. XỬ LÝ TĂNG / GIẢM SỐ LƯỢNG
async function handleQuantityChange(itemId, newQty) {
  if (newQty < 1 || newQty > 10) return;

  const targetItem = cartState.items.find(i => i.id === itemId);
  if (!targetItem || targetItem.outOfStock) return;

  const oldQty = targetItem.quantity;
  targetItem.quantity = newQty; // Cập nhật tạm thời trên UI

  // Render cập nhật tức thì
  renderCart();

  try {
    // Gọi API Backend ASP.NET Core để xác thực tồn kho & lưu Session
    const response = await fetch(CART_CONFIG.endpoints.updateQuantity, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ itemId: itemId, quantity: newQty })
    });

    if (!response.ok) {
      // Backend phản hồi lỗi -> rollback số lượng và hiện thông báo
      targetItem.quantity = oldQty;
      renderCart();
      showCartAlert('Không thể cập nhật số lượng do vượt quá tồn kho khả dụng hoặc lỗi kết nối.');
    }
  } catch (err) {
    // Trường hợp demo tĩnh không có backend
    console.info('[LIGHT LIFE Cart] Đã cập nhật số lượng nội bộ phiên:', { itemId, newQty });
  }
}

// 10. XỬ LÝ XÓA SẢN PHẨM KHỎI GIỎ
function promptRemoveItem(itemId) {
  const item = cartState.items.find(i => i.id === itemId);
  if (!item) return;

  cartState.pendingDeleteId = itemId;
  const modal = document.getElementById('deleteConfirmModal');
  const itemNameEl = document.getElementById('deleteConfirmItemName');

  if (itemNameEl) itemNameEl.textContent = `"${item.name}"`;
  if (modal) modal.classList.add('active');
}

function closeDeleteModal() {
  cartState.pendingDeleteId = null;
  const modal = document.getElementById('deleteConfirmModal');
  if (modal) modal.classList.remove('active');
}

async function confirmRemoveItem() {
  const itemId = cartState.pendingDeleteId;
  if (!itemId) return;

  closeDeleteModal();

  try {
    // Gọi API xóa phía Backend
    await fetch(CART_CONFIG.endpoints.removeItem, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ itemId: itemId })
    });
  } catch (err) {
    console.info('[LIGHT LIFE Cart] Xóa sản phẩm khỏi state nội bộ demo');
  }

  // Xóa khỏi state
  cartState.items = cartState.items.filter(i => i.id !== itemId);
  hideCartAlert();
  renderCart();
}

// 11. XỬ LÝ MÃ ƯU ĐÃI (COUPON)
function handleApplyCoupon(e) {
  if (e) e.preventDefault();

  const inputEl = document.getElementById('couponInput');
  const msgEl = document.getElementById('couponMsg');
  const chipEl = document.getElementById('couponChip');
  const chipTextEl = document.getElementById('couponChipText');

  if (!inputEl || !msgEl) return;

  const code = inputEl.value.trim().toUpperCase();
  if (!code) {
    msgEl.textContent = 'Vui lòng nhập mã ưu đãi.';
    msgEl.className = 'll-coupon-msg error';
    return;
  }

  // Kiểm tra mã trong bảng cấu hình demo (Backend sẽ thẩm định lại tại checkout)
  if (CART_CONFIG.demoCoupons[code]) {
    cartState.coupon = {
      code: code,
      ...CART_CONFIG.demoCoupons[code]
    };

    msgEl.textContent = `Áp dụng thành công mã "${code}": ${cartState.coupon.desc}`;
    msgEl.className = 'll-coupon-msg success';

    if (chipEl && chipTextEl) {
      chipTextEl.textContent = `${code} (${cartState.coupon.desc})`;
      chipEl.classList.add('show');
    }

    inputEl.value = '';
    calculateAndRenderSummary();
  } else {
    msgEl.textContent = 'Mã ưu đãi không hợp lệ hoặc đã hết hạn sử dụng.';
    msgEl.className = 'll-coupon-msg error';
  }
}

function handleRemoveCoupon() {
  cartState.coupon = null;
  cartState.discountAmount = 0;

  const msgEl = document.getElementById('couponMsg');
  const chipEl = document.getElementById('couponChip');

  if (msgEl) {
    msgEl.textContent = 'Đã hủy áp dụng mã ưu đãi.';
    msgEl.className = 'll-coupon-msg';
    msgEl.style.display = 'none';
  }

  if (chipEl) chipEl.classList.remove('show');
  calculateAndRenderSummary();
}

// 12. XỬ LÝ TIẾN HÀNH ĐẶT HÀNG (CHECKOUT FLOW THEO QUY ƯỚC NGHIỆP VỤ)
function handleProceedCheckout() {
  // 12.1. Kiểm tra nếu có sản phẩm hết hàng -> chặn
  const hasOutOfStock = cartState.items.some(i => i.outOfStock);
  if (hasOutOfStock) {
    showCartAlert('Giỏ hàng của bạn đang có sản phẩm tạm hết hàng. Vui lòng bấm xóa sản phẩm đó trước khi tiếp tục đặt hàng.');
    return;
  }

  if (cartState.items.length === 0) {
    showCartAlert('Giỏ hàng của bạn đang trống.');
    return;
  }

  // 12.2. Kiểm tra trạng thái đăng nhập qua body attribute hoặc window.LightLifeAuth
  // Quy ước:
  // - Đã đăng nhập -> chuyển sang /Checkout
  // - Chưa đăng nhập -> chuyển sang /Account/Login?returnUrl=%2FCheckout
  // Đăng nhập xong ASP.NET Core sẽ redirect lại /Checkout và giữ nguyên Session giỏ hàng.
  const isAuthenticated = document.body.getAttribute('data-authenticated') === 'true' 
                       || (window.LightLifeAuth && window.LightLifeAuth.isLoggedIn === true);

  if (isAuthenticated) {
    console.log('[LIGHT LIFE] Người dùng đã đăng nhập -> Chuyển hướng sang Checkout.');
    window.location.href = CART_CONFIG.endpoints.checkout;
  } else {
    console.log('[LIGHT LIFE] Khách chưa đăng nhập -> Chuyển hướng Đăng nhập kèm returnUrl=%2FCheckout để bảo toàn giỏ hàng.');
    window.location.href = CART_CONFIG.endpoints.loginWithReturn;
  }
}

// 13. TIỆN ÍCH ĐỒNG BỘ BADGE HEADER
function updateHeaderBadge(count) {
  const badge = document.getElementById('llCartBadge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

// 14. KHỞI TẠO SỰ KIỆN KHI DOM SẴN SÀNG
document.addEventListener('DOMContentLoaded', () => {
  // Lấy dữ liệu giỏ hàng ban đầu
  fetchCartData();

  // Đăng ký sự kiện Mã ưu đãi
  const couponForm = document.getElementById('couponForm');
  if (couponForm) {
    couponForm.addEventListener('submit', handleApplyCoupon);
  }

  const removeCouponBtn = document.getElementById('removeCouponBtn');
  if (removeCouponBtn) {
    removeCouponBtn.addEventListener('click', handleRemoveCoupon);
  }

  // Đăng ký sự kiện Nút Checkout
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', handleProceedCheckout);
  }

  // Đóng banner cảnh báo
  const closeAlertBtn = document.getElementById('closeCartAlertBtn');
  if (closeAlertBtn) {
    closeAlertBtn.addEventListener('click', hideCartAlert);
  }

  // Modal xác nhận xóa
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const deleteModal = document.getElementById('deleteConfirmModal');

  if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', confirmRemoveItem);
  if (deleteModal) {
    deleteModal.addEventListener('click', (e) => {
      if (e.target === deleteModal) closeDeleteModal();
    });
  }

  // Phím ESC đóng modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDeleteModal();
  });
});

// Xuất các hàm ra phạm vi toàn cục để dễ kiểm thử và gọi inline
window.handleQuantityChange = handleQuantityChange;
window.promptRemoveItem = promptRemoveItem;
window.handleProceedCheckout = handleProceedCheckout;

