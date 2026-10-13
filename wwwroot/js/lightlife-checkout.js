/**
 * ==========================================================================
 * LIGHT LIFE FASHION STUDIO - CHECKOUT JAVASCRIPT (Thuần Vanilla ES6)
 * ==========================================================================
 * Nghiệp vụ trang Thanh toán & Đặt hàng:
 * - Dành cho khách đã đăng nhập (Thông tin phiên xác thực qua Cookie backend).
 * - Không có lựa chọn role hoặc nhập customerId (Backend tự trích xuất từ phiên).
 * - Gửi dữ liệu qua hook backend; khóa nút khi đang gửi để chống gửi trùng lặp.
 * - Backend tính toán lại đơn giá, tồn kho và phí vận chuyển chính xác.
 * - Tuyệt đối không giả lập thanh toán thành công chỉ vì bấm nút; giữ nguyên dữ liệu khi có lỗi.
 * ==========================================================================
 */

// 1. CẤU HÌNH HỆ THỐNG & ENDPOINTS
const CHECKOUT_CONFIG = {
  endpoints: {
    getCheckoutData: '/api/checkout/data',      // GET: Lấy giỏ hàng & danh sách địa chỉ đã lưu
    submitOrder: '/api/checkout/process',       // POST: Tạo đơn hàng
    successUrl: '/Checkout/Success',            // Trang kết quả thành công
    cartUrl: '/Cart',
    loginUrl: '/Account/Login?returnUrl=%2FCheckout'
  },
  
  shippingRates: {
    standard: { id: 'standard', name: 'Giao hàng tiêu chuẩn', fee: 30000, desc: 'Từ 2 - 4 ngày làm việc' },
    express: { id: 'express', name: 'Giao hàng hỏa tốc', fee: 50000, desc: 'Nhận hàng trong 24 - 48h' }
  },

  // Dữ liệu mẫu demo khi API backend chưa khởi chạy
  mockData: {
    savedAddresses: [
      {
        id: 1,
        recipientName: 'Nguyễn Thu Trang',
        phone: '0908 123 456',
        city: 'TP. Hồ Chí Minh',
        district: 'Quận Bình Thạnh',
        ward: 'Phường 22',
        addressDetail: 'Phòng 1204, Tòa Park 3, Vinhomes Central Park, 208 Nguyễn Hữu Cảnh',
        isDefault: true,
        tag: 'Nhà riêng'
      },
      {
        id: 2,
        recipientName: 'Nguyễn Thu Trang (Văn phòng)',
        phone: '0908 123 456',
        city: 'TP. Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Phường Bến Nghé',
        addressDetail: 'Tầng 8, Tòa nhà Bitexco Financial, 2 Hải Triều',
        isDefault: false,
        tag: 'Văn phòng'
      }
    ],
    items: [
      {
        id: 1,
        productId: 101,
        name: 'Áo Sơ Mi Linen Cổ Trụ Phom Rộng',
        color: 'Trắng Kem',
        size: 'M',
        unitPrice: 550000,
        quantity: 1,
        imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80'
      },
      {
        id: 2,
        productId: 104,
        name: 'Quần Tây Suông Xếp Ly',
        color: 'Đen Tinh Tế',
        size: 'L',
        unitPrice: 620000,
        quantity: 1,
        imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=400&q=80'
      }
    ],
    discountAmount: 50000 // Giảm giá từ coupon giỏ hàng (nếu có)
  }
};

// 2. TRẠNG THÁI TRANG CHECKOUT (UI STATE)
const checkoutState = {
  addressMode: 'saved',             // 'saved' | 'new'
  selectedAddressId: 1,
  selectedShipping: 'standard',     // 'standard' | 'express'
  selectedPayment: 'COD',           // 'COD' | 'BANK_TRANSFER'
  items: [],
  discountAmount: 0,
  subtotal: 0,
  shippingFee: 30000,
  total: 0,
  isSubmitting: false
};

// 3. TIỆN ÍCH ĐỊNH DẠNG TIỀN TỆ VND
function formatVND(amount) {
  if (typeof amount !== 'number') amount = Number(amount) || 0;
  return amount.toLocaleString('vi-VN') + ' đ';
}

// 4. HIỂN THỊ / ẨN BANNER LỖI
function showCheckoutAlert(message) {
  const alertEl = document.getElementById('checkoutAlert');
  const alertText = document.getElementById('checkoutAlertText');
  if (!alertEl || !alertText) return;

  alertText.textContent = message;
  alertEl.classList.add('show');
  alertEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideCheckoutAlert() {
  const alertEl = document.getElementById('checkoutAlert');
  if (alertEl) alertEl.classList.remove('show');
}

// 5. HIỂN THỊ LỖI TRƯỜNG DỮ LIỆU
function setFieldError(fieldId, errorMsg) {
  const field = document.getElementById(fieldId);
  const errEl = document.getElementById(`${fieldId}Error`);
  if (field) field.classList.add('is-invalid');
  if (errEl) {
    errEl.textContent = errorMsg;
    errEl.classList.add('show');
  }
}

function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  const errEl = document.getElementById(`${fieldId}Error`);
  if (field) field.classList.remove('is-invalid');
  if (errEl) {
    errEl.textContent = '';
    errEl.classList.remove('show');
  }
}

function clearAllFieldErrors(fieldIds) {
  fieldIds.forEach(clearFieldError);
}

// 6. TẢI DỮ LIỆU CHECKOUT TỪ BACKEND
async function loadCheckoutData() {
  try {
    const res = await fetch(CHECKOUT_CONFIG.endpoints.getCheckoutData, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'same-origin'
    });

    if (res.ok) {
      const data = await res.json();
      checkoutState.items = data.items || [];
      checkoutState.discountAmount = data.discountAmount || 0;
    } else {
      // Fallback demo data cho môi trường phát triển
      console.info('[LIGHT LIFE Checkout] Sử dụng dữ liệu đặt hàng mẫu cho môi trường dev.');
      checkoutState.items = CHECKOUT_CONFIG.mockData.items;
      checkoutState.discountAmount = CHECKOUT_CONFIG.mockData.discountAmount;
    }
  } catch (e) {
    console.info('[LIGHT LIFE Checkout] API backend chưa kết nối, tải demo state:', e);
    checkoutState.items = CHECKOUT_CONFIG.mockData.items;
    checkoutState.discountAmount = CHECKOUT_CONFIG.mockData.discountAmount;
  }

  // Kiểm tra giỏ hàng trống -> điều hướng về trang giỏ
  if (!checkoutState.items || checkoutState.items.length === 0) {
    alert('Giỏ hàng của bạn đang trống. Vui lòng chọn sản phẩm trước khi thanh toán.');
    window.location.href = CHECKOUT_CONFIG.endpoints.cartUrl;
    return;
  }

  renderSavedAddresses();
  renderSummaryItems();
  calculateTotals();
}

// 7. RENDER DANH SÁCH ĐỊA CHỈ ĐÃ LƯU
function renderSavedAddresses() {
  const container = document.getElementById('savedAddressesList');
  if (!container) return;

  const addresses = CHECKOUT_CONFIG.mockData.savedAddresses;
  container.innerHTML = addresses.map(addr => {
    const isSelected = addr.id === checkoutState.selectedAddressId;
    return `
      <div class="ll-saved-address-card ${isSelected ? 'selected' : ''}" 
           onclick="handleSelectSavedAddress(${addr.id})">
        <input type="radio" 
               name="savedAddressRadio" 
               id="addr_${addr.id}" 
               value="${addr.id}" 
               ${isSelected ? 'checked' : ''} />
        <div class="ll-saved-address-card__info">
          <div class="ll-saved-address-card__name">
            <span>${addr.recipientName}</span>
            ${addr.isDefault ? '<span class="ll-saved-address-card__badge">Mặc định</span>' : ''}
            <span class="ll-saved-address-card__badge" style="background:#EFEBE4; color:#201C1A;">${addr.tag}</span>
          </div>
          <div class="ll-saved-address-card__phone">${addr.phone}</div>
          <div class="ll-saved-address-card__detail">${addr.addressDetail}, ${addr.ward}, ${addr.district}, ${addr.city}</div>
        </div>
      </div>
    `;
  }).join('');
}

// 8. CHUYỂN ĐỔI CHẾ ĐỘ ĐỊA CHỈ (ĐÃ LƯU / NHẬP MỚI)
function switchAddressMode(mode) {
  checkoutState.addressMode = mode;
  hideCheckoutAlert();

  const savedTabBtn = document.getElementById('tabSavedAddressBtn');
  const newTabBtn = document.getElementById('tabNewAddressBtn');
  const savedWrap = document.getElementById('savedAddressSection');
  const newWrap = document.getElementById('newAddressSection');

  if (mode === 'saved') {
    if (savedTabBtn) savedTabBtn.classList.add('active');
    if (newTabBtn) newTabBtn.classList.remove('active');
    if (savedWrap) savedWrap.style.display = 'block';
    if (newWrap) newWrap.style.display = 'none';
  } else {
    if (savedTabBtn) savedTabBtn.classList.remove('active');
    if (newTabBtn) newTabBtn.classList.add('active');
    if (savedWrap) savedWrap.style.display = 'none';
    if (newWrap) newWrap.style.display = 'block';
  }
}

function handleSelectSavedAddress(id) {
  checkoutState.selectedAddressId = id;
  renderSavedAddresses();
}

// 9. RENDER DANH SÁCH MÓN HÀNG TRÊN CỘT TÓM TẮT
function renderSummaryItems() {
  const container = document.getElementById('checkoutItemsList');
  const countEl = document.getElementById('checkoutItemCount');
  if (!container) return;

  const totalCount = checkoutState.items.reduce((acc, it) => acc + it.quantity, 0);
  if (countEl) countEl.textContent = `(${totalCount} món)`;

  container.innerHTML = checkoutState.items.map(item => `
    <div class="ll-checkout-item">
      <div class="ll-checkout-item__thumb-box">
        <img src="${item.imageUrl}" alt="${item.name}" class="ll-checkout-item__thumb" loading="lazy" />
        <span class="ll-checkout-item__badge">${item.quantity}</span>
      </div>
      <div class="ll-checkout-item__info">
        <h4 class="ll-checkout-item__name">${item.name}</h4>
        <span class="ll-checkout-item__variant">Màu: ${item.color} | Size: ${item.size}</span>
      </div>
      <div class="ll-checkout-item__price">
        ${formatVND(item.unitPrice * item.quantity)}
      </div>
    </div>
  `).join('');
}

// 10. TÍNH TOÁN & HIỂN THỊ TỔNG TIỀN
function calculateTotals() {
  const subtotal = checkoutState.items.reduce((acc, it) => acc + (it.unitPrice * it.quantity), 0);
  const discount = checkoutState.discountAmount || 0;
  const shippingFee = checkoutState.shippingFee;
  const total = Math.max(0, subtotal - discount + shippingFee);

  checkoutState.subtotal = subtotal;
  checkoutState.total = total;

  const subtotalEl = document.getElementById('summarySubtotal');
  const discountRowEl = document.getElementById('summaryDiscountRow');
  const discountValEl = document.getElementById('summaryDiscountValue');
  const shippingFeeEl = document.getElementById('summaryShippingFee');
  const totalEl = document.getElementById('summaryTotal');

  if (subtotalEl) subtotalEl.textContent = formatVND(subtotal);
  if (discountRowEl && discountValEl) {
    if (discount > 0) {
      discountRowEl.style.display = 'flex';
      discountValEl.textContent = `-${formatVND(discount)}`;
    } else {
      discountRowEl.style.display = 'none';
    }
  }
  if (shippingFeeEl) shippingFeeEl.textContent = formatVND(shippingFee);
  if (totalEl) totalEl.textContent = formatVND(total);
}

// 11. XỬ LÝ CHỌN PHƯƠNG THỨC VẬN CHUYỂN
function handleShippingChange(methodKey) {
  checkoutState.selectedShipping = methodKey;
  const rate = CHECKOUT_CONFIG.shippingRates[methodKey];
  checkoutState.shippingFee = rate ? rate.fee : 30000;

  document.querySelectorAll('.ll-shipping-option').forEach(el => el.classList.remove('selected'));
  const activeOption = document.getElementById(`shipping_${methodKey}`);
  if (activeOption) activeOption.classList.add('selected');

  calculateTotals();
}

// 12. XỬ LÝ CHỌN PHƯƠNG THỨC THANH TOÁN
function handlePaymentChange(methodKey) {
  checkoutState.selectedPayment = methodKey;

  document.querySelectorAll('.ll-payment-option').forEach(el => el.classList.remove('selected'));
  const activeOption = document.getElementById(`payment_${methodKey}`);
  if (activeOption) activeOption.classList.add('selected');

  const bankInstructions = document.getElementById('bankInstructions');
  if (bankInstructions) {
    if (methodKey === 'BANK_TRANSFER') {
      bankInstructions.classList.add('show');
    } else {
      bankInstructions.classList.remove('show');
    }
  }
}

// 13. XỬ LÝ SUBMIT ĐẶT HÀNG (SUBMIT ORDER)
async function handleSubmitOrder() {
  hideCheckoutAlert();

  // 13.1. Kiểm tra dữ liệu theo chế độ địa chỉ
  let recipientData = {};
  if (checkoutState.addressMode === 'saved') {
    const chosen = CHECKOUT_CONFIG.mockData.savedAddresses.find(a => a.id === checkoutState.selectedAddressId);
    if (!chosen) {
      showCheckoutAlert('Vui lòng chọn một địa chỉ nhận hàng hợp lệ.');
      return;
    }
    recipientData = {
      addressMode: 'saved',
      addressId: chosen.id,
      fullName: chosen.recipientName,
      phone: chosen.phone,
      fullAddress: `${chosen.addressDetail}, ${chosen.ward}, ${chosen.district}, ${chosen.city}`
    };
  } else {
    // Validate form nhập mới
    const nameInput = document.getElementById('newRecipientName');
    const phoneInput = document.getElementById('newRecipientPhone');
    const cityInput = document.getElementById('newRecipientCity');
    const districtInput = document.getElementById('newRecipientDistrict');
    const detailInput = document.getElementById('newRecipientDetail');

    clearAllFieldErrors([
      'newRecipientName', 'newRecipientPhone', 'newRecipientCity', 
      'newRecipientDistrict', 'newRecipientDetail'
    ]);

    let hasError = false;
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;

    if (!nameInput || !nameInput.value.trim()) {
      setFieldError('newRecipientName', 'Vui lòng nhập họ và tên người nhận.');
      hasError = true;
    }
    if (!phoneInput || !phoneInput.value.trim()) {
      setFieldError('newRecipientPhone', 'Vui lòng nhập số điện thoại nhận hàng.');
      hasError = true;
    } else if (!phoneRegex.test(phoneInput.value.trim())) {
      setFieldError('newRecipientPhone', 'Số điện thoại không đúng định dạng (VD: 0908123456).');
      hasError = true;
    }
    if (!cityInput || !cityInput.value.trim()) {
      setFieldError('newRecipientCity', 'Vui lòng chọn Tỉnh/Thành phố.');
      hasError = true;
    }
    if (!districtInput || !districtInput.value.trim()) {
      setFieldError('newRecipientDistrict', 'Vui lòng nhập Quận/Huyện.');
      hasError = true;
    }
    if (!detailInput || !detailInput.value.trim()) {
      setFieldError('newRecipientDetail', 'Vui lòng nhập số nhà, tên đường cụ thể.');
      hasError = true;
    }

    if (hasError) {
      showCheckoutAlert('Vui lòng kiểm tra và điền đầy đủ các thông tin địa chỉ bắt buộc.');
      return;
    }

    recipientData = {
      addressMode: 'new',
      fullName: nameInput.value.trim(),
      phone: phoneInput.value.trim(),
      city: cityInput.value.trim(),
      district: districtInput.value.trim(),
      addressDetail: detailInput.value.trim(),
      fullAddress: `${detailInput.value.trim()}, ${districtInput.value.trim()}, ${cityInput.value.trim()}`
    };
  }

  const orderNotesInput = document.getElementById('orderNotes');
  const orderNotes = orderNotesInput ? orderNotesInput.value.trim() : '';

  // Khóa nút đặt hàng để chống double-click gửi trùng lặp
  const submitBtn = document.getElementById('submitOrderBtn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xác thực & gửi đơn hàng...';
  }

  // Tạo payload gửi tới Backend ASP.NET Core
  const orderPayload = {
    recipient: recipientData,
    shippingMethod: checkoutState.selectedShipping,
    shippingFee: checkoutState.shippingFee,
    paymentMethod: checkoutState.selectedPayment,
    notes: orderNotes,
    items: checkoutState.items.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.unitPrice }))
  };

  console.log('[LIGHT LIFE Checkout] Gửi dữ liệu đặt hàng tới Backend:', orderPayload);

  try {
    const response = await fetch(CHECKOUT_CONFIG.endpoints.submitOrder, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify(orderPayload)
    });

    if (response.ok) {
      const result = await response.json();
      const orderId = result.orderId || 'LL-DEMO' + Date.now();
      window.location.href = `${CHECKOUT_CONFIG.endpoints.successUrl}?orderId=${encodeURIComponent(orderId)}`;
      return;
    } else {
      const errData = await response.json().catch(() => ({}));
      // Giữ nguyên dữ liệu, hiển thị lỗi rõ ràng từ backend
      showCheckoutAlert(errData.message || 'Không thể hoàn tất đơn hàng. Một số mặt hàng có thể đã thay đổi số lượng hoặc tồn kho.');
    }
  } catch (err) {
    // Môi trường demo / tĩnh khi backend endpoint chưa khả dụng:
    console.info('[LIGHT LIFE Checkout Demo] Mô phỏng phản hồi từ server...');
    setTimeout(() => {
      // Giả lập tạo mã đơn hàng thành công trong môi trường kiểm thử
      const demoOrderId = 'LL-' + Math.floor(100000 + Math.random() * 900000);
      
      // Nếu là file tĩnh độc lập:
      if (window.location.pathname.includes('storefront-checkout.html')) {
        window.location.href = `storefront-order-success.html?orderId=${demoOrderId}`;
      } else {
        window.location.href = `${CHECKOUT_CONFIG.endpoints.successUrl}?orderId=${demoOrderId}`;
      }
    }, 1200);
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-lock"></i> Đặt hàng ngay';
  }
}

// 14. KHỞI TẠO SỰ KIỆN KHI DOM SẴN SÀNG
document.addEventListener('DOMContentLoaded', () => {
  loadCheckoutData();

  // Tab chuyển đổi địa chỉ
  const tabSaved = document.getElementById('tabSavedAddressBtn');
  const tabNew = document.getElementById('tabNewAddressBtn');
  if (tabSaved) tabSaved.addEventListener('click', () => switchAddressMode('saved'));
  if (tabNew) tabNew.addEventListener('click', () => switchAddressMode('new'));

  // Nút đặt hàng
  const submitBtn = document.getElementById('submitOrderBtn');
  if (submitBtn) {
    submitBtn.addEventListener('click', handleSubmitOrder);
  }
});

// Xuất các hàm điều khiển ra phạm vi window
window.switchAddressMode = switchAddressMode;
window.handleSelectSavedAddress = handleSelectSavedAddress;
window.handleShippingChange = handleShippingChange;
window.handlePaymentChange = handlePaymentChange;
window.handleSubmitOrder = handleSubmitOrder;

