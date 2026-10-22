/**
 * LIGHT LIFE FASHION STUDIO - ORDER DETAIL & RETURN REQUEST JAVASCRIPT
 * Đã kết nối API Database SQL Server thật, hỗ trợ Timeline, Hủy đơn & Đổi trả
 */

// 1. CẤU HÌNH HỆ THỐNG
const ORDER_DETAIL_CONFIG = {
    endpoints: {
        getDetail: '/api/customer/orders/',              // GET /api/customer/orders/{id}
        cancelOrder: '/api/customer/orders/{id}/cancel',  // POST
        requestReturn: '/api/customer/orders/{id}/return' // POST
    },

    support: {
        hotline: '1900 8924',
        email: 'support@lightlife.vn',
        workingHours: '08:30 - 21:30 (Thứ 2 - Chủ Nhật)'
    },

    // ĐÃ XÓA MOCK ORDERS: Để rỗng để không hiện dữ liệu giả
    mockOrders: {}
};

// 2. BIẾN TRẠNG THÁI TRANG HIỆN TẠI
let currentOrderDetail = null;
let currentOrderId = null;

// 3. TIỆN ÍCH ĐỊNH DẠNG TIỀN TỆ VND
function formatVND(amount) {
    if (typeof amount !== 'number') amount = Number(amount) || 0;
    return amount.toLocaleString('vi-VN') + ' đ';
}

// 4. KHỞI TẠO VÀ TẢI DỮ LIỆU ĐƠN HÀNG
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    // Lấy ID từ tham số ?id=... hoặc ?orderId=...
    currentOrderId = urlParams.get('id') || urlParams.get('orderId');

    // Nếu không có ID trên URL -> Báo lỗi không tìm thấy
    if (!currentOrderId) {
        showErrorState();
        return;
    }

    loadOrderDetailData(currentOrderId);
    setupModalEvents();
});

// Tải dữ liệu thật từ Backend SQL Server
async function loadOrderDetailData(orderId) {
    try {
        const res = await fetch(`${ORDER_DETAIL_CONFIG.endpoints.getDetail}${encodeURIComponent(orderId)}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            credentials: 'same-origin'
        });

        if (res.ok) {
            currentOrderDetail = await res.json();
            renderOrderDetail(currentOrderDetail);
        } else {
            showErrorState();
        }
    } catch (e) {
        console.error('Lỗi kết nối máy chủ:', e);
        showErrorState();
    }
}

// 5. RENDER NỘI DUNG CHI TIẾT ĐƠN HÀNG
function renderOrderDetail(order) {
    if (!order) return;

    // 5.1. Breadcrumb & Header Title
    const breadcrumbCode = document.getElementById('breadcrumbOrderCode');
    if (breadcrumbCode) breadcrumbCode.textContent = order.orderId || order.orderCode;

    const titleCode = document.getElementById('detailOrderCode');
    if (titleCode) titleCode.textContent = order.orderId || order.orderCode;

    const metaDate = document.getElementById('detailOrderDate');
    if (metaDate) metaDate.innerHTML = `<i class="fa-regular fa-clock me-1"></i> Ngày đặt: ${order.createdAt}`;

    // 5.2. Badges Trạng thái Đơn & Thanh toán
    const statusBadge = document.getElementById('detailOrderStatusBadge');
    if (statusBadge) {
        statusBadge.className = `ll-badge ${order.statusClass || order.statusBadgeClass}`;
        statusBadge.textContent = order.statusLabel || order.statusText;
    }

    const paymentBadge = document.getElementById('detailPaymentStatusBadge');
    if (paymentBadge) {
        paymentBadge.className = `ll-badge-payment ${order.paymentClass || 'll-badge-payment--pending'}`;
        paymentBadge.textContent = order.paymentStatus;
    }

    // 5.3. Nút Hành Động (Hủy đơn & Đổi trả & Hỗ trợ)
    renderActionButtons(order);

    // 5.4. Timeline Tiến trình / Banner Hủy
    renderOrderTimeline(order);

    // 5.5. Khung Theo Dõi Đổi Trả (Nếu có yêu cầu)
    renderReturnTracker(order);

    // 5.6. Danh sách sản phẩm
    renderProductsList(order.items || []);

    // 5.7. Thông tin người nhận, vận chuyển & bảng tài chính
    renderInfoGrid(order);

    // 5.8. Lịch sử sự kiện
    renderAuditLogs(order.auditLogs || []);
}

// Render các nút hành động
function renderActionButtons(order) {
    const container = document.getElementById('detailActionButtons');
    if (!container) return;

    let html = '';

    // Nút Hủy đơn (Chỉ hiện khi backend cho phép canCancel = true)
    if (order.allowCancellation || order.canCancel) {
        html += `
      <button type="button" class="ll-btn-cancel-order" onclick="openCancelModal()">
        <i class="fa-regular fa-circle-xmark"></i> Hủy đơn hàng
      </button>
    `;
    }

    // Nút Yêu cầu đổi trả (Chỉ hiện khi backend cho phép canReturn = true)
    if (order.allowReturn || order.canReturn) {
        html += `
      <button type="button" class="ll-btn-return-request" onclick="openReturnModal()">
        <i class="fa-solid fa-arrow-rotate-left"></i> Yêu cầu đổi trả
      </button>
    `;
    }

    // Nút Liên hệ hỗ trợ
    html += `
    <a href="tel:${ORDER_DETAIL_CONFIG.support.hotline}" class="ll-btn-support-contact" title="Gọi tổng đài hỗ trợ">
      <i class="fa-solid fa-headset"></i> Hỗ trợ: ${ORDER_DETAIL_CONFIG.support.hotline}
    </a>
  `;

    container.innerHTML = html;
}

// Render Timeline Tiến trình đơn hàng
function renderOrderTimeline(order) {
    const timelineCard = document.getElementById('orderTimelineCard');
    if (!timelineCard) return;

    // Nếu đơn đã hủy
    if (order.status === 'cancelled' || order.status === '5') {
        timelineCard.innerHTML = `
      <div class="ll-timeline-header">
        <i class="fa-solid fa-timeline" style="color: var(--color-brand);"></i>
        Tiến trình đơn hàng
      </div>
      <div class="ll-order-cancelled-banner">
        <i class="fa-solid fa-circle-exclamation"></i>
        <div>
          <h4>Đơn hàng đã được hủy vào lúc ${order.completedAt || order.createdAt}</h4>
          <p>Lý do: <strong>${order.cancelReason || 'Theo yêu cầu của khách hàng'}</strong>.</p>
          <p style="margin-top: 0.35rem; font-size: 0.8125rem;">
            * Nếu bạn đã thanh toán chuyển khoản trước, bộ phận Chăm sóc khách hàng sẽ liên hệ hoàn tiền theo quy trình đối soát ngân hàng trong vòng 24 - 48h làm việc.
          </p>
        </div>
      </div>
    `;
        return;
    }

    // Mặc định render danh sách timeline từ C#
    const steps = order.timeline || [];
    let completedCount = steps.filter(s => s.isCompleted || s.completed).length;
    let progressPct = steps.length > 1 ? ((completedCount - 1) / (steps.length - 1)) * 100 : 0;
    if (progressPct < 0) progressPct = 0;

    timelineCard.innerHTML = `
    <div class="ll-timeline-header">
      <i class="fa-solid fa-timeline" style="color: var(--color-brand);"></i>
      Tiến trình xử lý đơn hàng
    </div>
    <div class="ll-stepper-track">
      <div class="ll-stepper-progress-fill" style="width: calc(${progressPct}% - 40px);"></div>
      ${steps.map((s, index) => {
        let cls = '';
        if (s.isCompleted || s.completed) cls = 'completed';
        else if (s.isCurrent || s.active) cls = 'active';

        return `
          <div class="ll-step-item ${cls}">
            <div class="ll-step-dot">
              ${(s.isCompleted || s.completed) ? '<i class="fa-solid fa-check"></i>' : (index + 1)}
            </div>
            <span class="ll-step-title">${s.title}</span>
            <span class="ll-step-time">${s.time || ''}</span>
          </div>
        `;
    }).join('')}
    </div>
  `;
}

// Render Khung Theo Dõi Yêu Cầu Đổi Trả
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

    returnTrackerContainer.innerHTML = `
    <div class="ll-detail-card ll-return-tracking-card">
      <div class="ll-return-header">
        <h3 class="ll-return-title">
          <i class="fa-solid fa-arrow-rotate-left" style="color: var(--color-gold);"></i>
          Theo dõi yêu cầu Đổi / Trả hàng: <strong>${req.requestCode || 'Đang xử lý'}</strong>
        </h3>
        <span class="ll-return-status-badge ll-return-status--pending">
          <i class="fa-solid fa-clock"></i> ${req.statusLabel || 'Chờ cửa hàng kiểm tra'}
        </span>
      </div>

      <div class="ll-return-info-grid">
        <div class="ll-return-info-item">
          <label>Hình thức yêu cầu:</label>
          <strong>${req.type || 'Đổi trả hàng'}</strong>
        </div>
        <div class="ll-return-info-item">
          <label>Lý do đổi trả:</label>
          <strong>${req.reason || 'Sản phẩm không vừa ý'}</strong>
        </div>
      </div>
    </div>
  `;
}

// Render Danh Sách Sản Phẩm
function renderProductsList(items) {
    const container = document.getElementById('detailProductsContainer');
    if (!container) return;

    container.innerHTML = items.map(item => `
    <div class="ll-detail-item-row">
      <div class="ll-detail-item-thumb">
        <img src="${item.imageUrl || item.thumbnailUrl}" alt="${item.name || item.productName}" loading="lazy" />
      </div>
      <div class="ll-detail-item-info">
        <span class="ll-detail-item-name">${item.name || item.productName}</span>
        <span class="ll-detail-item-variant">Màu: <strong>${item.color || 'Tiêu chuẩn'}</strong> | Size: <strong>${item.size || 'F'}</strong></span>
        <span style="font-size: 0.8125rem; color: var(--color-text-sub);">Đơn giá: ${formatVND(item.unitPrice)}</span>
      </div>
      <div class="ll-detail-item-qty">
        Số lượng: <strong>x${item.quantity}</strong>
      </div>
      <div class="ll-detail-item-price">
        ${formatVND(item.lineTotal || (item.unitPrice * item.quantity))}
      </div>
    </div>
  `).join('');
}

// Render Lưới Thông Tin Giao Nhận & Thanh Toán
function renderInfoGrid(order) {
    const recipientBlock = document.getElementById('recipientInfoBlock');
    if (recipientBlock) {
        const recName = order.recipient?.name || order.receiverName;
        const recPhone = order.recipient?.phone || order.receiverPhone;
        const recAddress = order.recipient?.address || order.shippingAddress;

        recipientBlock.innerHTML = `
      <p><strong>${recName}</strong></p>
      <p><i class="fa-solid fa-phone me-1"></i> ${recPhone}</p>
      <p><i class="fa-solid fa-location-dot me-1"></i> ${recAddress}</p>
      ${order.note ? `<p style="font-style: italic; background:#FAF8F5; padding:0.4rem 0.6rem; border-radius:4px; border:1px dashed var(--color-border);">Ghi chú: ${order.note}</p>` : ''}
    `;
    }

    const shippingBlock = document.getElementById('shippingPaymentInfoBlock');
    if (shippingBlock) {
        shippingBlock.innerHTML = `
      <p>Đơn vị vận chuyển: <strong>Giao hàng tiêu chuẩn</strong></p>
      <p>Mã vận đơn: <strong style="color: var(--color-brand);">${order.orderId || order.orderCode}</strong></p>
      <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px dashed var(--color-border);">
        <p>Hình thức: <strong>${order.paymentMethod}</strong></p>
        <p>Trạng thái: <span class="ll-badge-payment ${order.paymentClass || 'll-badge-payment--pending'}">${order.paymentStatus}</span></p>
      </div>
    `;
    }

    const financialBlock = document.getElementById('financialRowsBlock');
    if (financialBlock) {
        const discountVal = order.discountAmount || order.discount || 0;
        const totalVal = order.total || order.totalAmount || 0;

        financialBlock.innerHTML = `
      <div class="ll-financial-line">
        <span>Tiền hàng tạm tính:</span>
        <strong>${formatVND(order.subtotal)}</strong>
      </div>
      <div class="ll-financial-line">
        <span>Giảm giá ưu đãi:</span>
        <strong style="color: var(--color-success);">${discountVal > 0 ? '-' + formatVND(discountVal) : '0 đ'}</strong>
      </div>
      <div class="ll-financial-line">
        <span>Phí giao hàng:</span>
        <strong>${formatVND(order.shippingFee)}</strong>
      </div>
      <div class="ll-financial-line total">
        <span>Tổng thanh toán:</span>
        <span class="ll-financial-total-val">${formatVND(totalVal)}</span>
      </div>
    `;
    }
}

// Render Lịch Sử Sự Kiện
function renderAuditLogs(logs) {
    const container = document.getElementById('auditLogsContainer');
    if (!container) return;

    if (!logs || logs.length === 0) {
        container.innerHTML = '<li style="color: var(--color-text-sub); font-size: 0.875rem;">Đơn hàng đang trong tiến trình xử lý.</li>';
        return;
    }

    container.innerHTML = logs.map(l => `
    <li class="ll-audit-item">
      <div class="ll-audit-bullet"></div>
      <div class="ll-audit-item-time">${l.time || ''}</div>
      <div class="ll-audit-item-title">${l.title || l.reason}</div>
    </li>
  `).join('');
}

// 6. XỬ LÝ HỦY ĐƠN HÀNG (GỌI API C# THẬT)
function openCancelModal() {
    const modal = document.getElementById('cancelOrderModal');
    if (modal && currentOrderDetail) {
        const modalOrderCode = document.getElementById('cancelModalOrderCode');
        if (modalOrderCode) modalOrderCode.textContent = currentOrderDetail.orderId || currentOrderDetail.orderCode;
        modal.classList.add('show');
    }
}

function closeCancelModal() {
    const modal = document.getElementById('cancelOrderModal');
    if (modal) modal.classList.remove('show');
}

async function handleConfirmCancel() {
    const reasonSelect = document.getElementById('cancelReasonSelect');
    const noteInput = document.getElementById('cancelNoteInput');
    const reason = reasonSelect ? reasonSelect.value : 'Khách hàng thay đổi ý định';
    const note = noteInput ? noteInput.value.trim() : '';

    if (!currentOrderDetail) return;

    try {
        const res = await fetch(`/api/customer/orders/${currentOrderDetail.id}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason, note }),
            credentials: 'same-origin'
        });

        const result = await res.json();
        if (!res.ok) {
            throw new Error(result.message || 'Hủy đơn hàng thất bại.');
        }

        alert(result.message || 'Đã hủy đơn hàng thành công!');
        closeCancelModal();
        // Tải lại dữ liệu mới nhất từ SQL Server
        await loadOrderDetailData(currentOrderId);
    } catch (err) {
        alert(err.message || 'Có lỗi xảy ra khi hủy đơn.');
    }
}

// 7. XỬ LÝ YÊU CẦU ĐỔI TRẢ (GỌI API C# THẬT)
function openReturnModal() {
    const modal = document.getElementById('returnOrderModal');
    if (!modal || !currentOrderDetail) return;

    const codeSpan = document.getElementById('returnModalOrderCode');
    if (codeSpan) codeSpan.textContent = currentOrderDetail.orderId || currentOrderDetail.orderCode;

    modal.classList.add('show');
}

function closeReturnModal() {
    const modal = document.getElementById('returnOrderModal');
    if (modal) modal.classList.remove('show');
}

async function handleConfirmReturn() {
    const reasonSelect = document.getElementById('returnReasonSelect');
    const noteInput = document.getElementById('returnNoteInput');
    const reason = reasonSelect ? reasonSelect.value : 'Sản phẩm mặc không vừa';
    const note = noteInput ? noteInput.value.trim() : '';

    if (!currentOrderDetail) return;

    try {
        const res = await fetch(`/api/customer/orders/${currentOrderDetail.id}/return`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason, note }),
            credentials: 'same-origin'
        });

        const result = await res.json();
        if (!res.ok) {
            throw new Error(result.message || 'Gửi yêu cầu thất bại.');
        }

        alert(result.message || 'Yêu cầu đổi/trả đã được gửi thành công!');
        closeReturnModal();
        await loadOrderDetailData(currentOrderId);
    } catch (err) {
        alert(err.message || 'Có lỗi xảy ra khi gửi yêu cầu đổi trả.');
    }
}

// Thiết lập sự kiện đóng Modal
function setupModalEvents() {
    window.addEventListener('click', (e) => {
        const cancelModal = document.getElementById('cancelOrderModal');
        if (cancelModal && e.target === cancelModal) closeCancelModal();

        const returnModal = document.getElementById('returnOrderModal');
        if (returnModal && e.target === returnModal) closeReturnModal();
    });
}

// Hiển thị giao diện khi đơn không tồn tại (404)
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
        <a href="/Account/Orders" class="ll-btn ll-btn-primary" style="display: inline-flex; align-items: center; gap: 0.5rem; min-height: 44px; padding: 0 1.5rem; background: #5c1d24; color: #fff; text-decoration: none; border-radius: 6px;">
          <i class="fa-solid fa-arrow-left"></i> Về danh sách đơn hàng của tôi
        </a>
      </div>
    `;
    }
}