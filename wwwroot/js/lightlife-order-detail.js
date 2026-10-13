/**
 * ==========================================================================
 * LIGHT LIFE FASHION STUDIO - ORDER DETAIL & RETURN REQUEST JAVASCRIPT
 * ==========================================================================
 * Nghiệp vụ quản lý Chi tiết đơn hàng và Đổi trả:
 * - Dữ liệu chi tiết đơn hàng (lấy từ backend hoặc mock fallback).
 * - Timeline quy trình 5 bước: Chờ xác nhận -> Đã xác nhận -> Chuẩn bị -> Giao hàng -> Hoàn tất.
 * - Quyền hủy đơn do backend trả về (allowCancellation).
 * - Quyền đổi trả do backend trả về (allowReturn).
 * - Form yêu cầu đổi trả có chọn món, số lượng, lý do, ảnh bằng chứng.
 * - Trạng thái đổi trả: "Chờ cửa hàng kiểm tra", mốc nhận hàng, hoàn tiền;
 *   tuyệt đối KHÔNG cho khách tự duyệt hoặc tự ghi "Đã hoàn tiền".
 * ==========================================================================
 */

// 1. CẤU HÌNH HỆ THỐNG & DỮ LIỆU TẬP TRUNG
const ORDER_DETAIL_CONFIG = {
  endpoints: {
    getDetail: '/api/customer/orders/', // GET /api/customer/orders/{id}
    cancelOrder: '/api/customer/orders/{id}/cancel', // POST
    requestReturn: '/api/customer/orders/{id}/return' // POST
  },

  support: {
    hotline: '1900 8924',
    email: 'support@lightlife.vn',
    workingHours: '08:30 - 21:30 (Thứ 2 - Chủ Nhật)'
  },

  // Danh mục dữ liệu demo phong phú
  mockOrders: {
    'LL-893124': {
      orderId: 'LL-893124',
      createdAt: '10/10/2026 23:45',
      status: 'pending',
      statusLabel: 'Chờ xác nhận',
      statusClass: 'll-badge--pending',
      paymentMethod: 'Chuyển khoản Ngân hàng (VietQR)',
      paymentStatus: 'Chờ xác nhận thanh toán',
      paymentClass: 'll-badge-payment--waiting',
      allowCancellation: true,
      allowReturn: false,
      shippingProvider: 'Giao hàng tiêu chuẩn',
      trackingCode: 'Chưa khởi tạo',
      recipient: {
        name: 'Nguyễn Thu Trang',
        phone: '0908 123 456',
        address: 'Phòng 1204, Tòa Park 3, Vinhomes Central Park, 208 Nguyễn Hữu Cảnh, Phường 22, Quận Bình Thạnh, TP. Hồ Chí Minh',
        notes: 'Giao giờ hành chính, gọi điện thoại trước 15 phút khi đến.'
      },
      items: [
        {
          id: 1,
          productId: 101,
          name: 'Áo Sơ Mi Linen Cổ Trụ Phom Rộng',
          color: 'Trắng Kem',
          size: 'M',
          quantity: 1,
          unitPrice: 550000,
          imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80'
        },
        {
          id: 2,
          productId: 104,
          name: 'Quần Tây Suông Xếp Ly',
          color: 'Đen Tinh Tế',
          size: 'L',
          quantity: 1,
          unitPrice: 620000,
          imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=400&q=80'
        }
      ],
      subtotal: 1170000,
      discount: 50000,
      shippingFee: 30000,
      total: 1150000,
      timeline: [
        { step: 1, title: 'Đặt hàng thành công', time: '10/10/2026 23:45', completed: true },
        { step: 2, title: 'Đã xác nhận', time: 'Đang xử lý', completed: false, active: true },
        { step: 3, title: 'Chuẩn bị hàng', time: '', completed: false },
        { step: 4, title: 'Đang giao hàng', time: '', completed: false },
        { step: 5, title: 'Hoàn tất', time: '', completed: false }
      ],
      auditLogs: [
        { time: '10/10/2026 23:45', title: 'Đơn hàng được tạo thành công trên hệ thống.' },
        { time: '10/10/2026 23:46', title: 'Chờ khách hàng chuyển khoản & nhân viên đối soát hóa đơn.' }
      ],
      returnRequest: null
    },

    'LL-742195': {
      orderId: 'LL-742195',
      createdAt: '05/10/2026 14:20',
      status: 'shipping',
      statusLabel: 'Đang giao hàng',
      statusClass: 'll-badge--shipping',
      paymentMethod: 'Thanh toán khi nhận hàng (COD)',
      paymentStatus: 'Thanh toán khi nhận hàng',
      paymentClass: 'll-badge-payment--unpaid',
      allowCancellation: false, // Đã giao vận, không cho hủy trực tiếp, chuyển sang hỗ trợ
      allowReturn: false,
      shippingProvider: 'Giao Hàng Tiết Kiệm (GHTK)',
      trackingCode: 'GHTK893240LL',
      recipient: {
        name: 'Nguyễn Thu Trang',
        phone: '0908 123 456',
        address: 'Phòng 1204, Tòa Park 3, Vinhomes Central Park, TP. Hồ Chí Minh',
        notes: ''
      },
      items: [
        {
          id: 3,
          productId: 102,
          name: 'Áo Blazer Nữ Cổ Điển Dáng Suông',
          color: 'Nâu Cà Phê',
          size: 'S',
          quantity: 1,
          unitPrice: 650000,
          imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=400&auto=format&fit=crop'
        }
      ],
      subtotal: 650000,
      discount: 0,
      shippingFee: 30000,
      total: 680000,
      timeline: [
        { step: 1, title: 'Đặt hàng thành công', time: '05/10/2026 14:20', completed: true },
        { step: 2, title: 'Đã xác nhận', time: '05/10/2026 15:00', completed: true },
        { step: 3, title: 'Chuẩn bị hàng', time: '06/10/2026 09:30', completed: true },
        { step: 4, title: 'Đang giao hàng', time: '07/10/2026 08:15', completed: false, active: true },
        { step: 5, title: 'Hoàn tất', time: 'Dự kiến 08/10/2026', completed: false }
      ],
      auditLogs: [
        { time: '05/10/2026 14:20', title: 'Đơn hàng được khởi tạo.' },
        { time: '05/10/2026 15:00', title: 'Nhân viên LIGHT LIFE gọi điện xác nhận đơn.' },
        { time: '06/10/2026 09:30', title: 'Đơn hàng được đóng gói và bàn giao cho GHTK.' },
        { time: '07/10/2026 08:15', title: 'Bưu tá GHTK đang đi phát kiện hàng.' }
      ],
      returnRequest: null
    },

    'LL-619280': {
      orderId: 'LL-619280',
      createdAt: '28/09/2026 09:15',
      status: 'completed',
      statusLabel: 'Hoàn thành',
      statusClass: 'll-badge--completed',
      paymentMethod: 'Chuyển khoản Ngân hàng (VietQR)',
      paymentStatus: 'Đã thanh toán',
      paymentClass: 'll-badge-payment--paid',
      allowCancellation: false,
      allowReturn: true, // Đơn đã giao xong trong vòng 7 ngày, cho phép đổi trả
      shippingProvider: 'VNPost Nhanh',
      trackingCode: 'VN889211LL',
      recipient: {
        name: 'Nguyễn Thu Trang',
        phone: '0908 123 456',
        address: 'Tầng 8, Tòa nhà Bitexco Financial, 2 Hải Triều, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
        notes: ''
      },
      items: [
        {
          id: 4,
          productId: 103,
          name: 'Đầm Lụa Dáng Dài Dự Tiệc Cao Cấp',
          color: 'Đỏ Rượu',
          size: 'S',
          quantity: 1,
          unitPrice: 890000,
          imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=400&q=80'
        }
      ],
      subtotal: 890000,
      discount: 0,
      shippingFee: 30000,
      total: 920000,
      timeline: [
        { step: 1, title: 'Đặt hàng thành công', time: '28/09/2026 09:15', completed: true },
        { step: 2, title: 'Đã xác nhận', time: '28/09/2026 09:40', completed: true },
        { step: 3, title: 'Chuẩn bị hàng', time: '28/09/2026 14:00', completed: true },
        { step: 4, title: 'Đang giao hàng', time: '29/09/2026 10:30', completed: true },
        { step: 5, title: 'Hoàn tất', time: '30/09/2026 15:45', completed: true }
      ],
      auditLogs: [
        { time: '28/09/2026 09:15', title: 'Đơn hàng được khởi tạo.' },
        { time: '28/09/2026 10:00', title: 'Thanh toán chuyển khoản đã khớp thành công.' },
        { time: '30/09/2026 15:45', title: 'Giao hàng thành công cho khách hàng.' }
      ],
      returnRequest: null
    },

    'LL-501832': {
      orderId: 'LL-501832',
      createdAt: '15/09/2026 16:30',
      status: 'cancelled',
      statusLabel: 'Đã hủy',
      statusClass: 'll-badge--cancelled',
      paymentMethod: 'Thanh toán khi nhận hàng (COD)',
      paymentStatus: 'Đã hủy đơn',
      paymentClass: 'll-badge-payment--unpaid',
      allowCancellation: false,
      allowReturn: false,
      shippingProvider: 'Không áp dụng',
      trackingCode: '---',
      cancelReason: 'Khách hàng thay đổi ý định, muốn đổi sang sản phẩm khác.',
      cancelledAt: '15/09/2026 17:15',
      recipient: {
        name: 'Nguyễn Thu Trang',
        phone: '0908 123 456',
        address: 'Phòng 1204, Tòa Park 3, Vinhomes Central Park, TP. Hồ Chí Minh',
        notes: ''
      },
      items: [
        {
          id: 5,
          productId: 201,
          name: 'Áo Polo Nam Dệt Kim Cao Cấp',
          color: 'Xanh Navy',
          size: 'L',
          quantity: 1,
          unitPrice: 380000,
          imageUrl: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?q=80&w=400&auto=format&fit=crop'
        }
      ],
      subtotal: 380000,
      discount: 0,
      shippingFee: 30000,
      total: 410000,
      timeline: [],
      auditLogs: [
        { time: '15/09/2026 16:30', title: 'Đơn hàng được khởi tạo.' },
        { time: '15/09/2026 17:15', title: 'Đơn hàng được hủy theo yêu cầu của khách hàng.' }
      ],
      returnRequest: null
    }
  }
};

// 2. BIẾN TRẠNG THÁI TRANG HIỆN TẠI
let currentOrderDetail = null;

// 3. TIỆN ÍCH ĐỊNH DẠNG TIỀN TỆ VND
function formatVND(amount) {
  if (typeof amount !== 'number') amount = Number(amount) || 0;
  return amount.toLocaleString('vi-VN') + ' đ';
}

// 4. KHỞI TẠO VÀ TẢI DỮ LIỆU ĐƠN HÀNG
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('id') || urlParams.get('orderId') || 'LL-893124';
  const errorParam = urlParams.get('error');
  const returnStatusParam = urlParams.get('return_status'); // 'rejected', 'approved', 'pending'

  if (errorParam === '404' || errorParam === '403') {
    showErrorState();
    return;
  }

  loadOrderDetailData(orderId, returnStatusParam);
  setupModalEvents();
});

// Tải dữ liệu từ backend hoặc fallback demo
async function loadOrderDetailData(orderId, returnStatusParam) {
  try {
    const res = await fetch(`${ORDER_DETAIL_CONFIG.endpoints.getDetail}${encodeURIComponent(orderId)}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'same-origin'
    });

    if (res.ok) {
      currentOrderDetail = await res.json();
    } else {
      currentOrderDetail = ORDER_DETAIL_CONFIG.mockOrders[orderId] || ORDER_DETAIL_CONFIG.mockOrders['LL-893124'];
    }
  } catch (e) {
    currentOrderDetail = ORDER_DETAIL_CONFIG.mockOrders[orderId] || ORDER_DETAIL_CONFIG.mockOrders['LL-893124'];
  }

  // Tùy chọn test trạng thái đổi trả qua query param
  if (returnStatusParam) {
    currentOrderDetail.allowReturn = false;
    currentOrderDetail.returnRequest = {
      requestCode: 'RT-' + currentOrderDetail.orderId.replace('LL-', ''),
      type: 'Trả hàng & Hoàn tiền',
      reason: 'Sản phẩm lỗi đường may / không vừa kích cỡ',
      status: returnStatusParam, // 'pending', 'approved', 'rejected'
      statusLabel: returnStatusParam === 'rejected' ? 'Yêu cầu bị từ chối' : (returnStatusParam === 'approved' ? 'Cửa hàng đã duyệt' : 'Chờ cửa hàng kiểm tra'),
      createdAt: '11/10/2026 08:30',
      rejectedReason: returnStatusParam === 'rejected' ? 'Sản phẩm đã quá thời hạn 7 ngày đổi trả hoặc tem mác bị tháo rời theo điều khoản chính sách.' : null,
      items: currentOrderDetail.items
    };
  }

  renderOrderDetail(currentOrderDetail);
}

// 5. RENDER NỘI DUNG CHI TIẾT ĐƠN HÀNG
function renderOrderDetail(order) {
  // 5.1. Breadcrumb & Header Title
  const breadcrumbCode = document.getElementById('breadcrumbOrderCode');
  if (breadcrumbCode) breadcrumbCode.textContent = order.orderId;

  const titleCode = document.getElementById('detailOrderCode');
  if (titleCode) titleCode.textContent = order.orderId;

  const metaDate = document.getElementById('detailOrderDate');
  if (metaDate) metaDate.innerHTML = `<i class="fa-regular fa-clock me-1"></i> Ngày đặt: ${order.createdAt}`;

  // 5.2. Badges Trạng thái Đơn & Thanh toán tách biệt
  const statusBadge = document.getElementById('detailOrderStatusBadge');
  if (statusBadge) {
    statusBadge.className = `ll-badge ${order.statusClass}`;
    statusBadge.textContent = order.statusLabel;
  }

  const paymentBadge = document.getElementById('detailPaymentStatusBadge');
  if (paymentBadge) {
    paymentBadge.className = `ll-badge-payment ${order.paymentClass}`;
    paymentBadge.textContent = order.paymentStatus;
  }

  // 5.3. Nút Hành Động (Hủy đơn & Đổi trả & Hỗ trợ)
  renderActionButtons(order);

  // 5.4. Timeline 5 Bước / Banner Hủy
  renderOrderTimeline(order);

  // 5.5. Khung Theo Dõi Đổi Trả (Nếu có yêu cầu)
  renderReturnTracker(order);

  // 5.6. Danh sách sản phẩm 4:5
  renderProductsList(order.items);

  // 5.7. Thông tin người nhận, vận chuyển & bảng tài chính
  renderInfoGrid(order);

  // 5.8. Lịch sử sự kiện (Audit Log)
  renderAuditLogs(order.auditLogs);
}

// Render các nút hành động
function renderActionButtons(order) {
  const container = document.getElementById('detailActionButtons');
  if (!container) return;

  let html = '';

  // Nút Hủy đơn (Chỉ hiện khi backend cho phép - ví dụ pending)
  if (order.allowCancellation && order.status === 'pending') {
    html += `
      <button type="button" class="ll-btn-cancel-order" onclick="openCancelModal()">
        <i class="fa-regular fa-circle-xmark"></i> Hủy đơn hàng
      </button>
    `;
  }

  // Nút Yêu cầu đổi trả (Chỉ hiện khi backend cho phép - ví dụ completed & chưa có return request)
  if (order.allowReturn && !order.returnRequest) {
    html += `
      <button type="button" class="ll-btn-return-request" onclick="openReturnModal()">
        <i class="fa-solid fa-arrow-rotate-left"></i> Yêu cầu đổi trả
      </button>
    `;
  }

  // Nút Liên hệ hỗ trợ (Luôn có để khách được giải đáp nhanh)
  html += `
    <a href="tel:${ORDER_DETAIL_CONFIG.support.hotline}" class="ll-btn-support-contact" title="Gọi tổng đài hỗ trợ">
      <i class="fa-solid fa-headset"></i> Hỗ trợ: ${ORDER_DETAIL_CONFIG.support.hotline}
    </a>
  `;

  container.innerHTML = html;
}

// Render Timeline 5 Bước
function renderOrderTimeline(order) {
  const timelineCard = document.getElementById('orderTimelineCard');
  if (!timelineCard) return;

  // Nếu đơn đã hủy: hiển thị banner cảnh báo
  if (order.status === 'cancelled') {
    timelineCard.innerHTML = `
      <div class="ll-timeline-header">
        <i class="fa-solid fa-timeline" style="color: var(--color-brand);"></i>
        Tiến trình đơn hàng
      </div>
      <div class="ll-order-cancelled-banner">
        <i class="fa-solid fa-circle-exclamation"></i>
        <div>
          <h4>Đơn hàng đã được hủy vào lúc ${order.cancelledAt || order.createdAt}</h4>
          <p>Lý do: <strong>${order.cancelReason || 'Theo yêu cầu của khách hàng'}</strong>.</p>
          <p style="margin-top: 0.35rem; font-size: 0.8125rem;">
            * Nếu bạn đã thanh toán chuyển khoản trước, bộ phận Chăm sóc khách hàng sẽ liên hệ hoàn tiền theo quy trình đối soát ngân hàng trong vòng 24 - 48h làm việc.
          </p>
        </div>
      </div>
    `;
    return;
  }

  // Ngược lại, render stepper 5 mốc
  const steps = order.timeline || [
    { step: 1, title: 'Đặt hàng thành công', time: order.createdAt, completed: true },
    { step: 2, title: 'Đã xác nhận', time: '', completed: false, active: true },
    { step: 3, title: 'Chuẩn bị hàng', time: '', completed: false },
    { step: 4, title: 'Đang giao hàng', time: '', completed: false },
    { step: 5, title: 'Hoàn tất', time: '', completed: false }
  ];

  let completedCount = steps.filter(s => s.completed).length;
  let progressPct = ((completedCount - 1) / (steps.length - 1)) * 100;
  if (progressPct < 0) progressPct = 0;

  timelineCard.innerHTML = `
    <div class="ll-timeline-header">
      <i class="fa-solid fa-timeline" style="color: var(--color-brand);"></i>
      Tiến trình xử lý đơn hàng
    </div>
    <div class="ll-stepper-track">
      <div class="ll-stepper-progress-fill" style="width: calc(${progressPct}% - 40px);"></div>
      ${steps.map(s => {
        let cls = '';
        if (s.completed) cls = 'completed';
        else if (s.active) cls = 'active';

        return `
          <div class="ll-step-item ${cls}">
            <div class="ll-step-dot">
              ${s.completed ? '<i class="fa-solid fa-check"></i>' : s.step}
            </div>
            <span class="ll-step-title">${s.title}</span>
            <span class="ll-step-time">${s.time || ''}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// Render Khung Theo Dõi Yêu Cầu Đổi Trả (Nếu có)
function renderReturnTracker(order) {
  const returnTrackerContainer = document.getElementById('orderReturnTrackerContainer');
  if (!returnTrackerContainer) return;

  if (!order.returnRequest) {
    returnTrackerContainer.innerHTML = '';
    returnTrackerContainer.style.display = 'none';
    return;
  }

  returnTrackerContainer.style.display = 'block';
  const req = order.returnRequest;

  let badgeClass = 'll-return-status--pending';
  let badgeIcon = 'fa-clock';
  if (req.status === 'approved') {
    badgeClass = 'll-return-status--approved';
    badgeIcon = 'fa-check';
  } else if (req.status === 'rejected') {
    badgeClass = 'll-return-status--rejected';
    badgeIcon = 'fa-circle-xmark';
  } else if (req.status === 'completed') {
    badgeClass = 'll-return-status--completed';
    badgeIcon = 'fa-badge-check';
  }

  returnTrackerContainer.innerHTML = `
    <div class="ll-detail-card ll-return-tracking-card">
      <div class="ll-return-header">
        <h3 class="ll-return-title">
          <i class="fa-solid fa-arrow-rotate-left" style="color: var(--color-gold);"></i>
          Theo dõi yêu cầu Đổi / Trả hàng: <strong>${req.requestCode}</strong>
        </h3>
        <span class="ll-return-status-badge ${badgeClass}">
          <i class="fa-solid ${badgeIcon}"></i> ${req.statusLabel}
        </span>
      </div>

      <div class="ll-return-info-grid">
        <div class="ll-return-info-item">
          <label>Hình thức yêu cầu:</label>
          <strong>${req.type}</strong>
        </div>
        <div class="ll-return-info-item">
          <label>Thời gian gửi:</label>
          <strong>${req.createdAt}</strong>
        </div>
        <div class="ll-return-info-item">
          <label>Lý do đổi trả:</label>
          <strong>${req.reason}</strong>
        </div>
      </div>

      ${req.status === 'rejected' ? `
        <div class="ll-order-cancelled-banner" style="margin-top: 0;">
          <i class="fa-solid fa-circle-exclamation"></i>
          <div>
            <h4>Yêu cầu đổi trả bị từ chối</h4>
            <p>Phản hồi từ bộ phận CSKH: <strong>${req.rejectedReason}</strong></p>
            <p style="margin-top: 0.35rem; font-size: 0.8125rem;">
              Nếu bạn có thắc mắc thêm, vui lòng liên hệ hotline <a href="tel:${ORDER_DETAIL_CONFIG.support.hotline}"><strong>${ORDER_DETAIL_CONFIG.support.hotline}</strong></a> để được hỗ trợ giải quyết trực tiếp.
            </p>
          </div>
        </div>
      ` : `
        <!-- Quy trình các mốc nhận hàng & hoàn tiền -->
        <div style="background: #FFFFFF; border: 1px solid var(--color-border); border-radius: 6px; padding: 1rem; margin-top: 0.75rem;">
          <div style="font-size: 0.8125rem; font-weight: 700; color: var(--color-text-main); margin-bottom: 0.65rem;">
            Các mốc xử lý yêu cầu đổi trả:
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.8125rem; color: var(--color-text-sub);">
            <div><i class="fa-solid fa-circle-check" style="color: var(--color-success); margin-right: 6px;"></i> 1. Gửi yêu cầu thành công (${req.createdAt})</div>
            <div>
              <i class="fa-solid ${req.status === 'approved' ? 'fa-circle-check text-success' : 'fa-clock text-warning'}" style="margin-right: 6px; color: ${req.status === 'approved' ? 'var(--color-success)' : 'var(--color-gold)'};"></i>
              2. Cửa hàng kiểm tra & duyệt yêu cầu (${req.status === 'approved' ? 'Đã duyệt' : 'Đang xử lý trong vòng 24h'})
            </div>
            <div><i class="fa-regular fa-circle" style="margin-right: 6px;"></i> 3. Quý khách gửi kiện hàng về kho LIGHT LIFE</div>
            <div><i class="fa-regular fa-circle" style="margin-right: 6px;"></i> 4. Bộ phận kỹ thuật nhận hàng & thẩm định chất lượng</div>
            <div><i class="fa-regular fa-circle" style="margin-right: 6px;"></i> 5. Tiến hành đổi hàng mới hoặc hoàn tiền theo quy định (Chỉ ghi nhận khi cửa hàng thực hoàn)</div>
          </div>
        </div>
      `}
    </div>
  `;
}

// Render Danh Sách Sản Phẩm (Tỷ lệ 4:5)
function renderProductsList(items) {
  const container = document.getElementById('detailProductsContainer');
  if (!container) return;

  container.innerHTML = items.map(item => `
    <div class="ll-detail-item-row">
      <div class="ll-detail-item-thumb">
        <img src="${item.imageUrl}" alt="${item.name}" loading="lazy" />
      </div>
      <div class="ll-detail-item-info">
        <span class="ll-detail-item-name">${item.name}</span>
        <span class="ll-detail-item-variant">Màu: <strong>${item.color}</strong> | Size: <strong>${item.size}</strong></span>
        <span style="font-size: 0.8125rem; color: var(--color-text-sub);">Đơn giá: ${formatVND(item.unitPrice)}</span>
      </div>
      <div class="ll-detail-item-qty">
        Số lượng: <strong>x${item.quantity}</strong>
      </div>
      <div class="ll-detail-item-price">
        ${formatVND(item.unitPrice * item.quantity)}
      </div>
    </div>
  `).join('');
}

// Render Lưới Thông Tin Giao Nhận & Thanh Toán
function renderInfoGrid(order) {
  // Người nhận
  const recipientBlock = document.getElementById('recipientInfoBlock');
  if (recipientBlock) {
    recipientBlock.innerHTML = `
      <p><strong>${order.recipient.name}</strong></p>
      <p><i class="fa-solid fa-phone me-1"></i> ${order.recipient.phone}</p>
      <p><i class="fa-solid fa-location-dot me-1"></i> ${order.recipient.address}</p>
      ${order.recipient.notes ? `<p style="font-style: italic; background:#FAF8F5; padding:0.4rem 0.6rem; border-radius:4px; border:1px dashed var(--color-border);">Ghi chú: ${order.recipient.notes}</p>` : ''}
    `;
  }

  // Vận chuyển & Thanh toán
  const shippingBlock = document.getElementById('shippingPaymentInfoBlock');
  if (shippingBlock) {
    shippingBlock.innerHTML = `
      <p>Đơn vị vận chuyển: <strong>${order.shippingProvider}</strong></p>
      <p>Mã vận đơn: <strong style="color: var(--color-brand);">${order.trackingCode}</strong></p>
      <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px dashed var(--color-border);">
        <p>Hình thức: <strong>${order.paymentMethod}</strong></p>
        <p>Trạng thái: <span class="ll-badge-payment ${order.paymentClass}">${order.paymentStatus}</span></p>
      </div>
    `;
  }

  // Bảng tài chính
  const financialBlock = document.getElementById('financialRowsBlock');
  if (financialBlock) {
    financialBlock.innerHTML = `
      <div class="ll-financial-line">
        <span>Tiền hàng tạm tính:</span>
        <strong>${formatVND(order.subtotal)}</strong>
      </div>
      <div class="ll-financial-line">
        <span>Giảm giá ưu đãi:</span>
        <strong style="color: var(--color-success);">${order.discount > 0 ? '-' + formatVND(order.discount) : '0 đ'}</strong>
      </div>
      <div class="ll-financial-line">
        <span>Phí giao hàng:</span>
        <strong>${formatVND(order.shippingFee)}</strong>
      </div>
      <div class="ll-financial-line total">
        <span>Tổng thanh toán:</span>
        <span class="ll-financial-total-val">${formatVND(order.total)}</span>
      </div>
    `;
  }
}

// Render Lịch Sử Sự Kiện
function renderAuditLogs(logs) {
  const container = document.getElementById('auditLogsContainer');
  if (!container) return;

  if (!logs || logs.length === 0) {
    container.innerHTML = '<li style="color: var(--color-text-sub); font-size: 0.875rem;">Chưa có cập nhật mới.</li>';
    return;
  }

  container.innerHTML = logs.map(l => `
    <li class="ll-audit-item">
      <div class="ll-audit-bullet"></div>
      <div class="ll-audit-item-time">${l.time}</div>
      <div class="ll-audit-item-title">${l.title}</div>
    </li>
  `).join('');
}

// 6. XỬ LÝ MODAL HỦY ĐƠN HÀNG
function openCancelModal() {
  const modal = document.getElementById('cancelOrderModal');
  if (modal) {
    const modalOrderCode = document.getElementById('cancelModalOrderCode');
    if (modalOrderCode && currentOrderDetail) {
      modalOrderCode.textContent = currentOrderDetail.orderId;
    }
    modal.classList.add('show');
  }
}

function closeCancelModal() {
  const modal = document.getElementById('cancelOrderModal');
  if (modal) modal.classList.remove('show');
}

// Xác nhận hủy đơn
async function handleConfirmCancel() {
  const reasonSelect = document.getElementById('cancelReasonSelect');
  const noteInput = document.getElementById('cancelNoteInput');
  const reason = reasonSelect ? reasonSelect.value : 'Khách hàng thay đổi ý định';
  const note = noteInput ? noteInput.value.trim() : '';

  if (!currentOrderDetail) return;

  try {
    const res = await fetch(ORDER_DETAIL_CONFIG.endpoints.cancelOrder.replace('{id}', currentOrderDetail.orderId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, note }),
      credentials: 'same-origin'
    });
  } catch (e) {
    console.info('[LIGHT LIFE] Giả lập phản hồi hủy đơn thành công trên giao diện demo.');
  }

  // Cập nhật trạng thái hiển thị
  currentOrderDetail.status = 'cancelled';
  currentOrderDetail.statusLabel = 'Đã hủy';
  currentOrderDetail.statusClass = 'll-badge--cancelled';
  currentOrderDetail.paymentStatus = 'Đã hủy đơn';
  currentOrderDetail.allowCancellation = false;
  currentOrderDetail.cancelReason = reason + (note ? ` (${note})` : '');
  const now = new Date();
  currentOrderDetail.cancelledAt = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1()).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  currentOrderDetail.auditLogs.unshift({
    time: currentOrderDetail.cancelledAt,
    title: `Đơn hàng đã được hủy bởi khách hàng. Lý do: ${currentOrderDetail.cancelReason}`
  });

  closeCancelModal();
  renderOrderDetail(currentOrderDetail);
  alert('Đơn hàng ' + currentOrderDetail.orderId + ' đã được hủy thành công. Nếu bạn đã thanh toán chuyển khoản trước, bộ phận CSKH sẽ liên hệ hoàn tiền.');
}

// 7. XỬ LÝ MODAL YÊU CẦU ĐỔI TRẢ
function openReturnModal() {
  const modal = document.getElementById('returnOrderModal');
  if (!modal || !currentOrderDetail) return;

  const codeSpan = document.getElementById('returnModalOrderCode');
  if (codeSpan) codeSpan.textContent = currentOrderDetail.orderId;

  // Render danh sách sản phẩm trong đơn để khách tick chọn
  const listContainer = document.getElementById('returnItemsSelectList');
  if (listContainer) {
    listContainer.innerHTML = currentOrderDetail.items.map(item => `
      <div class="ll-return-select-row">
        <label class="ll-return-item-check">
          <input type="checkbox" name="return_item" value="${item.id}" checked />
          <span>${item.name} (${item.color} - ${item.size})</span>
        </label>
        <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem;">
          <span>SL đổi/trả:</span>
          <select class="ll-return-qty-select" id="qty_return_${item.id}">
            ${Array.from({ length: item.quantity }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('')}
          </select>
        </div>
      </div>
    `).join('');
  }

  modal.classList.add('show');
}

function closeReturnModal() {
  const modal = document.getElementById('returnOrderModal');
  if (modal) modal.classList.remove('show');
}

// Xử lý gửi yêu cầu đổi trả
async function handleConfirmReturn() {
  const checkboxes = document.querySelectorAll('input[name="return_item"]:checked');
  if (checkboxes.length === 0) {
    alert('Vui lòng chọn ít nhất một sản phẩm cần đổi hoặc trả!');
    return;
  }

  const returnTypeEl = document.querySelector('input[name="return_type"]:checked');
  const returnType = returnTypeEl ? returnTypeEl.value : 'Đổi size / màu khác';
  const reasonSelect = document.getElementById('returnReasonSelect');
  const reason = reasonSelect ? reasonSelect.value : 'Sản phẩm mặc không vừa';
  const noteInput = document.getElementById('returnNoteInput');
  const note = noteInput ? noteInput.value.trim() : '';

  const selectedItems = Array.from(checkboxes).map(cb => {
    const itemId = parseInt(cb.value, 10);
    const item = currentOrderDetail.items.find(i => i.id === itemId);
    const qtySelect = document.getElementById(`qty_return_${itemId}`);
    return {
      ...item,
      returnQuantity: qtySelect ? parseInt(qtySelect.value, 10) : 1
    };
  });

  try {
    const res = await fetch(ORDER_DETAIL_CONFIG.endpoints.requestReturn.replace('{id}', currentOrderDetail.orderId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnType, reason, note, items: selectedItems }),
      credentials: 'same-origin'
    });
  } catch (e) {
    console.info('[LIGHT LIFE] Giả lập phản hồi yêu cầu đổi trả thành công trên demo.');
  }

  // Khởi tạo trạng thái Đổi trả: "Chờ cửa hàng kiểm tra" (KHÔNG tự duyệt / KHÔNG tự hoàn tiền)
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1()).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  currentOrderDetail.allowReturn = false;
  currentOrderDetail.returnRequest = {
    requestCode: 'RT-' + currentOrderDetail.orderId.replace('LL-', ''),
    type: returnType === 'EXCHANGE' ? 'Đổi size / màu khác' : 'Trả hàng & Hoàn tiền',
    reason: reason + (note ? ` - ${note}` : ''),
    status: 'pending',
    statusLabel: 'Chờ cửa hàng kiểm tra',
    createdAt: dateStr,
    items: selectedItems
  };

  currentOrderDetail.auditLogs.unshift({
    time: dateStr,
    title: `Khách hàng gửi yêu cầu ${currentOrderDetail.returnRequest.type}. Trạng thái: Chờ cửa hàng kiểm tra.`
  });

  closeReturnModal();
  renderOrderDetail(currentOrderDetail);
  alert('Yêu cầu đổi/trả đã được gửi thành công. Trạng thái hiện tại: "Chờ cửa hàng kiểm tra". Nhân viên LIGHT LIFE sẽ xem xét và phản hồi trong vòng 24h làm việc.');
}

// Sự kiện đóng modal khi click ra ngoài
function setupModalEvents() {
  window.addEventListener('click', (e) => {
    const cancelModal = document.getElementById('cancelOrderModal');
    if (cancelModal && e.target === cancelModal) closeCancelModal();

    const returnModal = document.getElementById('returnOrderModal');
    if (returnModal && e.target === returnModal) closeReturnModal();
  });

  // Preview ảnh bằng chứng khi upload
  const fileInput = document.getElementById('returnEvidenceFiles');
  if (fileInput) {
    fileInput.addEventListener('change', function () {
      const previewContainer = document.getElementById('returnEvidencePreviewContainer');
      if (!previewContainer) return;
      previewContainer.innerHTML = '';

      Array.from(this.files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = function (e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'll-return-evidence-thumb';
            previewContainer.appendChild(img);
          };
          reader.readAsDataURL(file);
        }
      });
    });
  }
}

// Trạng thái Lỗi 404 / 403
function showErrorState() {
  const main = document.querySelector('.ll-order-detail-main');
  if (main) {
    main.innerHTML = `
      <div class="ll-detail-card" style="text-align: center; padding: 4rem 1.5rem;">
        <div style="width: 70px; height: 70px; border-radius: 50%; background: #FEF3F2; color: #B42318; display: inline-flex; align-items: center; justify-content: center; font-size: 2rem; margin-bottom: 1.25rem;">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>
        <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--color-text-main); margin-bottom: 0.5rem;">Không tìm thấy thông tin đơn hàng</h2>
        <p style="color: var(--color-text-sub); max-width: 500px; margin: 0 auto 1.5rem auto; font-size: 0.9375rem;">
          Đơn hàng bạn yêu cầu không tồn tại hoặc bạn không có quyền truy cập vào thông tin này. Nhằm bảo vệ quyền riêng tư, bạn chỉ có thể xem các đơn hàng thuộc tài khoản của chính mình.
        </p>
        <a href="/Account/Orders" class="ll-btn ll-btn-primary" style="display: inline-flex; align-items: center; gap: 0.5rem; min-height: 44px; padding: 0 1.5rem;">
          <i class="fa-solid fa-arrow-left"></i> Về danh sách đơn hàng của tôi
        </a>
      </div>
    `;
  }
}

