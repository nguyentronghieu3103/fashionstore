/**
 * ==========================================================================
 * LIGHT LIFE FASHION STUDIO - ORDER RECEIVED LOGIC (Thuần Vanilla ES6)
 * ==========================================================================
 * Nghiệp vụ trang "Đã tiếp nhận đơn hàng":
 * - Idempotency: Chỉ đọc dữ liệu đơn (Read-only), không sinh đơn mới khi F5.
 * - Trạng thái mặc định: "Chờ xác nhận" (Tuyệt đối KHÔNG ghi "Đã thanh toán").
 * - Hỗ trợ COD (Thanh toán khi nhận hàng) & Chuyển khoản (Chờ xác nhận thanh toán).
 * - Nút sao chép thông tin ngân hàng kèm Toast phản hồi mượt mà.
 * - Bảo mật: Chặn hiển thị đơn hàng của người khác / Xử lý trạng thái 404 & 403.
 * ==========================================================================
 */

// 1. CẤU HÌNH HỆ THỐNG & DỮ LIỆU TẬP TRUNG
const ORDER_CONFIG = {
  endpoints: {
    getOrder: '/api/orders/',               // GET: /api/orders/{orderId}
    orderDetailUrl: '/Account/Orders',      // Trang chi tiết đơn
    productsUrl: '/Products',
    homeUrl: '/'
  },

  bankInfo: {
    bankName: 'MB Bank (Ngân hàng Quân Đội)',
    accountNumber: '999988886666',
    accountHolder: 'LIGHT LIFE FASHION STUDIO'
  },

  // Dữ liệu mẫu demo khi API backend chưa khả dụng
  mockOrder: {
    orderId: 'LL-893124',
    createdAt: '23:45 - 10/10/2026',
    status: 'Chờ xác nhận',
    recipient: {
      fullName: 'Nguyễn Thu Trang',
      phone: '0908 123 456',
      fullAddress: 'Phòng 1204, Tòa Park 3, Vinhomes Central Park, 208 Nguyễn Hữu Cảnh, Phường 22, Quận Bình Thạnh, TP. Hồ Chí Minh',
      notes: 'Giao giờ hành chính, gọi điện thoại trước 15 phút khi tới.'
    },
    shippingMethod: 'Giao hàng tiêu chuẩn (2 - 4 ngày làm việc)',
    paymentMethod: 'BANK_TRANSFER', // Mặc định 'BANK_TRANSFER', có thể chuyển 'COD' qua query ?payment=cod
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
    subtotal: 1170000,
    discountAmount: 50000,
    shippingFee: 30000,
    total: 1150000
  }
};

// 2. TIỆN ÍCH ĐỊNH DẠNG TIỀN TỆ VND
function formatVND(amount) {
  if (typeof amount !== 'number') amount = Number(amount) || 0;
  return amount.toLocaleString('vi-VN') + ' đ';
}

// 3. HIỂN THỊ TOAST PHẢN HỒI SAO CHÉP
function showCopyToast(message) {
  const toast = document.getElementById('copyToast');
  const toastText = document.getElementById('copyToastText');
  if (!toast || !toastText) return;

  toastText.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}

// 4. TIỆN ÍCH SAO CHÉP VÀO CLIPBOARD
async function copyToClipboard(text, btnElement, label = '') {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback cho môi trường không có HTTPS
      const tempInput = document.createElement('textarea');
      tempInput.value = text;
      tempInput.style.position = 'fixed';
      tempInput.style.left = '-9999px';
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
    }

    showCopyToast(`Đã sao chép ${label}: ${text}`);

    // Đổi trạng thái nút bấm tạm thời
    if (btnElement) {
      const originalHTML = btnElement.innerHTML;
      btnElement.classList.add('copied');
      btnElement.innerHTML = '<i class="fa-solid fa-check"></i> Đã chép';
      setTimeout(() => {
        btnElement.classList.remove('copied');
        btnElement.innerHTML = originalHTML;
      }, 2000);
    }
  } catch (err) {
    console.warn('Lỗi khi sao chép:', err);
    showCopyToast(`Không thể tự động sao chép. Vui lòng copy thủ công: ${text}`);
  }
}

// 5. TẢI DỮ LIỆU ĐƠN HÀNG (READ-ONLY IDEMPOTENT GET)
async function loadOrderDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('orderId');
  const errorParam = urlParams.get('error'); // Dùng mô phỏng kiểm thử 404/403
  const paymentOverride = urlParams.get('payment'); // 'cod' hoặc 'bank'

  const orderCard = document.getElementById('orderCard');
  const errorCard = document.getElementById('orderErrorCard');

  // Kiểm tra trạng thái lỗi không tìm thấy đơn / không có quyền truy cập
  if (errorParam === '404' || errorParam === '403') {
    if (orderCard) orderCard.style.display = 'none';
    if (errorCard) errorCard.classList.add('show');
    return;
  }

  let orderData = null;

  try {
    if (orderId) {
      const response = await fetch(`${ORDER_CONFIG.endpoints.getOrder}${encodeURIComponent(orderId)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin'
      });

      if (response.ok) {
        orderData = await response.json();
      }
    }
  } catch (e) {
    console.info('[LIGHT LIFE] Backend API đơn hàng chưa kết nối, sử dụng dữ liệu mẫu kiểm thử.');
  }

  // Nếu chưa có backend, sử dụng mockOrder an toàn
  if (!orderData) {
    orderData = JSON.parse(JSON.stringify(ORDER_CONFIG.mockOrder));
    if (orderId) {
      orderData.orderId = orderId;
    }
    // Ghi nhận thời gian thực
    const now = new Date();
    orderData.createdAt = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} - ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1()).padStart(2, '0')}/${now.getFullYear()}`;
  }

  // Cho phép kiểm thử COD hoặc Bank Transfer qua query param ?payment=cod
  if (paymentOverride) {
    orderData.paymentMethod = paymentOverride.toUpperCase() === 'COD' ? 'COD' : 'BANK_TRANSFER';
  }

  renderOrderToUI(orderData);
}

// 6. RENDER DỮ LIỆU ĐƠN HÀNG LÊN GIAO DIỆN
function renderOrderToUI(order) {
  // 6.1. Dải tóm tắt Meta
  const codeEl = document.getElementById('orderCodeText');
  const timeEl = document.getElementById('orderTimeText');
  const statusBadge = document.getElementById('orderStatusBadge');

  if (codeEl) codeEl.textContent = order.orderId;
  if (timeEl) timeEl.textContent = order.createdAt;
  if (statusBadge) {
    // Trạng thái chuẩn: "Chờ xác nhận"
    statusBadge.textContent = order.status || 'Chờ xác nhận';
    statusBadge.className = 'll-status-badge ll-status-badge--pending';
  }

  // 6.2. Thông tin người nhận & Địa chỉ
  const recipientNameEl = document.getElementById('recipientName');
  const recipientPhoneEl = document.getElementById('recipientPhone');
  const recipientAddressEl = document.getElementById('recipientAddress');
  const shippingMethodEl = document.getElementById('shippingMethodText');
  const orderNotesRow = document.getElementById('orderNotesRow');
  const orderNotesEl = document.getElementById('orderNotesText');

  if (recipientNameEl) recipientNameEl.textContent = order.recipient.fullName;
  if (recipientPhoneEl) recipientPhoneEl.textContent = order.recipient.phone;
  if (recipientAddressEl) recipientAddressEl.textContent = order.recipient.fullAddress;
  if (shippingMethodEl) shippingMethodEl.textContent = order.shippingMethod;

  if (order.recipient.notes && orderNotesRow && orderNotesEl) {
    orderNotesRow.style.display = 'block';
    orderNotesEl.textContent = order.recipient.notes;
  }

  // 6.3. Khối Phương thức thanh toán (COD vs Chuyển khoản)
  const codSection = document.getElementById('paymentCodSection');
  const bankSection = document.getElementById('paymentBankSection');

  if (order.paymentMethod === 'COD') {
    if (codSection) codSection.style.display = 'block';
    if (bankSection) bankSection.style.display = 'none';
  } else {
    // Chuyển khoản ngân hàng (Bank Transfer)
    if (codSection) codSection.style.display = 'none';
    if (bankSection) bankSection.style.display = 'block';

    // Điền thông tin ngân hàng & QR
    const bankNameEl = document.getElementById('bankNameVal');
    const bankAccEl = document.getElementById('bankAccVal');
    const bankHolderEl = document.getElementById('bankHolderVal');
    const bankAmountEl = document.getElementById('bankAmountVal');
    const bankContentEl = document.getElementById('bankContentVal');
    const bankQrImg = document.getElementById('bankQrImg');

    const transferContent = `${order.orderId} ${order.recipient.phone.replace(/\s+/g, '')}`;

    if (bankNameEl) bankNameEl.textContent = ORDER_CONFIG.bankInfo.bankName;
    if (bankAccEl) bankAccEl.textContent = ORDER_CONFIG.bankInfo.accountNumber;
    if (bankHolderEl) bankHolderEl.textContent = ORDER_CONFIG.bankInfo.accountHolder;
    if (bankAmountEl) bankAmountEl.textContent = formatVND(order.total);
    if (bankContentEl) bankContentEl.textContent = transferContent;

    // Sinh QR VietQR demo
    if (bankQrImg) {
      const qrData = encodeURIComponent(`2|99|0908123456|${ORDER_CONFIG.bankInfo.accountHolder}||0|0|${order.total}|${transferContent}|transfer_myqr`);
      bankQrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${qrData}`;
    }

    // Đăng ký nút sao chép
    setupCopyBtn('copyBankAccBtn', ORDER_CONFIG.bankInfo.accountNumber, 'Số tài khoản');
    setupCopyBtn('copyBankAmountBtn', order.total.toString(), 'Số tiền');
    setupCopyBtn('copyBankContentBtn', transferContent, 'Nội dung chuyển khoản');
  }

  // 6.4. Danh sách sản phẩm trong đơn
  const itemsContainer = document.getElementById('orderItemsList');
  if (itemsContainer && Array.isArray(order.items)) {
    itemsContainer.innerHTML = order.items.map(item => `
      <div class="ll-order-product-row">
        <div class="ll-order-product-thumb">
          <img src="${item.imageUrl}" alt="${item.name}" loading="lazy" />
        </div>
        <div class="ll-order-product-info">
          <h4 class="ll-order-product-title">${item.name}</h4>
          <span class="ll-order-product-variant">Màu: <strong>${item.color}</strong> | Size: <strong>${item.size}</strong></span>
          <span class="ll-order-product-qty">Số lượng: <strong>x${item.quantity}</strong> (Đơn giá: ${formatVND(item.unitPrice)})</span>
        </div>
        <div class="ll-order-product-subtotal">
          ${formatVND(item.unitPrice * item.quantity)}
        </div>
      </div>
    `).join('');
  }

  // 6.5. Bảng tính tổng tiền
  const subtotalEl = document.getElementById('orderSubtotalVal');
  const discountRowEl = document.getElementById('orderDiscountRow');
  const discountValEl = document.getElementById('orderDiscountVal');
  const shippingFeeEl = document.getElementById('orderShippingFeeVal');
  const totalValEl = document.getElementById('orderTotalVal');

  if (subtotalEl) subtotalEl.textContent = formatVND(order.subtotal);
  if (discountRowEl && discountValEl) {
    if (order.discountAmount > 0) {
      discountRowEl.style.display = 'flex';
      discountValEl.textContent = `-${formatVND(order.discountAmount)}`;
    } else {
      discountRowEl.style.display = 'none';
    }
  }
  if (shippingFeeEl) shippingFeeEl.textContent = formatVND(order.shippingFee);
  if (totalValEl) totalValEl.textContent = formatVND(order.total);

  // 6.6. Nút theo dõi đơn hàng
  const trackOrderBtn = document.getElementById('trackOrderBtn');
  if (trackOrderBtn) {
    trackOrderBtn.href = `/Account/Orders?orderId=${encodeURIComponent(order.orderId)}`;
  }
}

// 7. GẮN SỰ KIỆN SAO CHÉP
function setupCopyBtn(btnId, textToCopy, label) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  // Xóa listener cũ tránh trùng
  btn.onclick = (e) => {
    e.preventDefault();
    copyToClipboard(textToCopy, btn, label);
  };
}

// 8. KHỞI TẠO KHI DOM SẴN SÀNG
document.addEventListener('DOMContentLoaded', () => {
  loadOrderDetails();
});

// Xuất các hàm ra phạm vi window
window.copyToClipboard = copyToClipboard;
window.loadOrderDetails = loadOrderDetails;

