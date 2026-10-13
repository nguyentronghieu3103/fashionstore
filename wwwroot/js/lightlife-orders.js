/**
 * ==========================================================================
 * LIGHT LIFE FASHION STUDIO - MY ORDERS JAVASCRIPT (Thuần Vanilla ES6)
 * ==========================================================================
 * Nghiệp vụ quản lý Đơn hàng của tôi:
 * - Dành riêng cho khách hàng đã đăng nhập (lấy qua API backend xác thực phiên).
 * - Không có dashboard bắt buộc, không hiển thị dữ liệu doanh thu hay quyền quản trị.
 * - Lọc theo trạng thái, tìm kiếm theo mã đơn hàng, phân trang và xem chi tiết đơn.
 * ==========================================================================
 */

// 1. CẤU HÌNH HỆ THỐNG & DỮ LIỆU TẬP TRUNG
const ORDERS_CONFIG = {
  endpoints: {
    getOrders: '/api/customer/orders', // GET: /api/customer/orders?status=...&search=...
    getOrderDetail: '/api/customer/orders/' // GET: /api/customer/orders/{id}
  },

  // Danh sách đơn hàng mẫu phong phú phục vụ kiểm thử giao diện khách hàng
  demoOrders: [
    {
      orderId: 'LL-893124',
      createdAt: '10/10/2026 23:45',
      status: 'pending',
      statusLabel: 'Chờ xác nhận',
      statusClass: 'll-badge--pending',
      paymentMethod: 'Chuyển khoản Ngân hàng',
      paymentStatus: 'Chờ xác nhận thanh toán',
      paymentClass: 'll-badge-payment--waiting',
      shippingFee: 30000,
      total: 1150000,
      recipient: {
        name: 'Nguyễn Thu Trang',
        phone: '0908 123 456',
        address: 'Phòng 1204, Tòa Park 3, Vinhomes Central Park, 208 Nguyễn Hữu Cảnh, Phường 22, Quận Bình Thạnh, TP. Hồ Chí Minh'
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
      ]
    },
    {
      orderId: 'LL-742195',
      createdAt: '05/10/2026 14:20',
      status: 'shipping',
      statusLabel: 'Đang giao hàng',
      statusClass: 'll-badge--shipping',
      paymentMethod: 'Thanh toán khi nhận hàng (COD)',
      paymentStatus: 'Thanh toán khi nhận hàng',
      paymentClass: 'll-badge-payment--unpaid',
      shippingFee: 30000,
      total: 680000,
      recipient: {
        name: 'Nguyễn Thu Trang',
        phone: '0908 123 456',
        address: 'Phòng 1204, Tòa Park 3, Vinhomes Central Park, 208 Nguyễn Hữu Cảnh, Phường 22, Quận Bình Thạnh, TP. Hồ Chí Minh'
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
      ]
    },
    {
      orderId: 'LL-619280',
      createdAt: '28/09/2026 09:15',
      status: 'completed',
      statusLabel: 'Hoàn thành',
      statusClass: 'll-badge--completed',
      paymentMethod: 'Chuyển khoản Ngân hàng',
      paymentStatus: 'Đã thanh toán',
      paymentClass: 'll-badge-payment--paid',
      shippingFee: 30000,
      total: 920000,
      recipient: {
        name: 'Nguyễn Thu Trang',
        phone: '0908 123 456',
        address: 'Tầng 8, Tòa nhà Bitexco Financial, 2 Hải Triều, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh'
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
      ]
    },
    {
      orderId: 'LL-501832',
      createdAt: '15/09/2026 16:30',
      status: 'cancelled',
      statusLabel: 'Đã hủy',
      statusClass: 'll-badge--cancelled',
      paymentMethod: 'Thanh toán khi nhận hàng (COD)',
      paymentStatus: 'Đã hủy đơn',
      paymentClass: 'll-badge-payment--unpaid',
      shippingFee: 30000,
      total: 410000,
      recipient: {
        name: 'Nguyễn Thu Trang',
        phone: '0908 123 456',
        address: 'Phòng 1204, Tòa Park 3, Vinhomes Central Park, TP. Hồ Chí Minh'
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
      ]
    }
  ]
};

// 2. TRẠNG THÁI CLIENT-SIDE
const ordersState = {
  activeStatus: 'all',
  searchQuery: '',
  currentPage: 1,
  pageSize: 3,
  allOrders: []
};

// 3. TIỆN ÍCH ĐỊNH DẠNG TIỀN TỆ VND
function formatVND(amount) {
  if (typeof amount !== 'number') amount = Number(amount) || 0;
  return amount.toLocaleString('vi-VN') + ' đ';
}

// 4. TẢI DANH SÁCH ĐƠN HÀNG CỦA KHÁCH TỪ BACKEND
async function fetchCustomerOrders() {
  try {
    const res = await fetch(ORDERS_CONFIG.endpoints.getOrders, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'same-origin'
    });

    if (res.ok) {
      const data = await res.json();
      ordersState.allOrders = Array.isArray(data) ? data : [];
    } else {
      // Fallback demo
      ordersState.allOrders = JSON.parse(JSON.stringify(ORDERS_CONFIG.demoOrders));
    }
  } catch (err) {
    ordersState.allOrders = JSON.parse(JSON.stringify(ORDERS_CONFIG.demoOrders));
  }

  // Đọc tham số URL ban đầu nếu có
  const urlParams = new URLSearchParams(window.location.search);
  const statusParam = urlParams.get('status');
  const searchParam = urlParams.get('search');

  if (statusParam) ordersState.activeStatus = statusParam;
  if (searchParam) {
    ordersState.searchQuery = searchParam;
    const searchInput = document.getElementById('orderSearchInput');
    if (searchInput) searchInput.value = searchParam;
  }

  updateTabCounters();
  applyFiltersAndRender();
}

// 5. CẬP NHẬT BỘ ĐẾM SỐ LƯỢNG TRÊN CÁC TAB
function updateTabCounters() {
  const counts = {
    all: ordersState.allOrders.length,
    pending: 0,
    shipping: 0,
    completed: 0,
    cancelled: 0
  };

  ordersState.allOrders.forEach(o => {
    if (counts[o.status] !== undefined) {
      counts[o.status]++;
    }
  });

  Object.keys(counts).forEach(key => {
    const el = document.getElementById(`counter_${key}`);
    if (el) el.textContent = counts[key];
  });

  const totalBadge = document.getElementById('totalOrdersCountBadge');
  if (totalBadge) totalBadge.textContent = `${ordersState.allOrders.length} đơn hàng`;
}

// 6. LỌC ĐƠN HÀNG VÀ PHÂN TRANG
function applyFiltersAndRender() {
  let filtered = [...ordersState.allOrders];

  // Lọc theo trạng thái
  if (ordersState.activeStatus !== 'all') {
    filtered = filtered.filter(o => o.status === ordersState.activeStatus);
  }

  // Lọc theo từ khóa tìm kiếm (mã đơn)
  if (ordersState.searchQuery.trim()) {
    const q = ordersState.searchQuery.trim().toLowerCase();
    filtered = filtered.filter(o => 
      o.orderId.toLowerCase().includes(q) ||
      o.items.some(i => i.name.toLowerCase().includes(q))
    );
  }

  // Render danh sách
  renderOrdersList(filtered);
}

// 7. RENDER DANH SÁCH THẺ ĐƠN HÀNG
function renderOrdersList(orders) {
  const container = document.getElementById('ordersListContainer');
  const emptyEl = document.getElementById('ordersEmptyState');
  const paginationEl = document.getElementById('ordersPagination');

  if (!container) return;

  if (orders.length === 0) {
    container.innerHTML = '';
    if (emptyEl) emptyEl.classList.add('show');
    if (paginationEl) paginationEl.style.display = 'none';
    return;
  }

  if (emptyEl) emptyEl.classList.remove('show');

  // Tính phân trang
  const totalItems = orders.length;
  const totalPages = Math.ceil(totalItems / ordersState.pageSize);
  if (ordersState.currentPage > totalPages) ordersState.currentPage = 1;

  const startIndex = (ordersState.currentPage - 1) * ordersState.pageSize;
  const pagedOrders = orders.slice(startIndex, startIndex + ordersState.pageSize);

  container.innerHTML = pagedOrders.map(order => {
    const detailUrl = window.location.pathname.includes('storefront-')
      ? `storefront-order-detail.html?id=${encodeURIComponent(order.orderId)}`
      : `/Account/OrderDetail?id=${encodeURIComponent(order.orderId)}`;

    return `
    <article class="ll-order-card" data-order-id="${order.orderId}">
      <!-- Header Thẻ Đơn Hàng -->
      <div class="ll-order-card__header">
        <div class="ll-order-card__meta-left">
          <a href="${detailUrl}" class="ll-order-card__code">
            ${order.orderId}
          </a>
          <span class="ll-order-card__date">
            <i class="fa-regular fa-calendar me-1"></i> ${order.createdAt}
          </span>
        </div>
        <div class="ll-order-card__badges">
          <span class="ll-badge ${order.statusClass}">
            ${order.statusLabel}
          </span>
          <span class="ll-badge-payment ${order.paymentClass}">
            ${order.paymentStatus}
          </span>
        </div>
      </div>

      <!-- Thân Thẻ: Danh Sách Món Hàng Thu Nhỏ (4:5) -->
      <div class="ll-order-card__body">
        ${order.items.map(item => `
          <div class="ll-order-item-row">
            <div class="ll-order-item-thumb">
              <img src="${item.imageUrl}" alt="${item.name}" loading="lazy" />
            </div>
            <div class="ll-order-item-info">
              <h4 class="ll-order-item-title">
                <a href="${detailUrl}">${item.name}</a>
              </h4>
              <span class="ll-order-item-variant">Màu: <strong>${item.color}</strong> | Size: <strong>${item.size}</strong></span>
              <span class="ll-order-item-qty">Số lượng: <strong>x${item.quantity}</strong></span>
            </div>
            <div class="ll-order-item-price">
              ${formatVND(item.unitPrice * item.quantity)}
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Chân Thẻ Đơn Hàng: Tổng Tiền & Nút Xem Chi Tiết -->
      <div class="ll-order-card__footer">
        <div class="ll-order-card__total-wrap">
          <span class="ll-order-card__total-label">Tổng thanh toán:</span>
          <span class="ll-order-card__total-val">${formatVND(order.total)}</span>
        </div>
        <div class="ll-order-card__actions">
          <a href="${detailUrl}" class="ll-btn-order-detail" style="text-decoration:none;">
            <i class="fa-solid fa-file-invoice"></i> Xem chi tiết
          </a>
        </div>
      </div>
    </article>
    `;
  }).join('');

  // Render thanh phân trang
  renderPagination(totalPages);
}

// 8. RENDER THANH PHÂN TRANG
function renderPagination(totalPages) {
  const paginationEl = document.getElementById('ordersPagination');
  if (!paginationEl) return;

  if (totalPages <= 1) {
    paginationEl.style.display = 'none';
    return;
  }

  paginationEl.style.display = 'flex';
  let html = `
    <button type="button" class="ll-page-btn" ${ordersState.currentPage === 1 ? 'disabled' : ''} onclick="changePage(${ordersState.currentPage - 1})">
      <i class="fa-solid fa-chevron-left"></i>
    </button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    html += `
      <button type="button" class="ll-page-btn ${i === ordersState.currentPage ? 'active' : ''}" onclick="changePage(${i})">
        ${i}
      </button>
    `;
  }

  html += `
    <button type="button" class="ll-page-btn" ${ordersState.currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${ordersState.currentPage + 1})">
      <i class="fa-solid fa-chevron-right"></i>
    </button>
  `;

  paginationEl.innerHTML = html;
}

function changePage(page) {
  ordersState.currentPage = page;
  applyFiltersAndRender();
  window.scrollTo({ top: 120, behavior: 'smooth' });
}

// 9. XỬ LÝ CHỌN TAB LỌC TRẠNG THÁI
function handleFilterTabClick(statusKey) {
  ordersState.activeStatus = statusKey;
  ordersState.currentPage = 1;

  document.querySelectorAll('.ll-order-tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  const activeBtn = document.getElementById(`tab_${statusKey}`);
  if (activeBtn) activeBtn.classList.add('active');

  applyFiltersAndRender();
}

// 10. XỬ LÝ TÌM KIẾM MÃ ĐƠN HÀNG
function handleOrderSearch(e) {
  e.preventDefault();
  const searchInput = document.getElementById('orderSearchInput');
  if (!searchInput) return;

  ordersState.searchQuery = searchInput.value.trim();
  ordersState.currentPage = 1;
  applyFiltersAndRender();
}

// 11. MODAL XEM CHI TIẾT NHANH ĐƠN HÀNG
function openOrderDetailModal(orderId) {
  const order = ordersState.allOrders.find(o => o.orderId === orderId);
  if (!order) return;

  const modal = document.getElementById('quickOrderDetailModal');
  const modalCode = document.getElementById('modalOrderCode');
  const modalDate = document.getElementById('modalOrderDate');
  const modalStatus = document.getElementById('modalOrderStatus');
  const modalPayment = document.getElementById('modalOrderPayment');
  const modalRecipient = document.getElementById('modalOrderRecipient');
  const modalAddress = document.getElementById('modalOrderAddress');
  const modalItems = document.getElementById('modalOrderItems');
  const modalTotal = document.getElementById('modalOrderTotal');

  if (modalCode) modalCode.textContent = order.orderId;
  if (modalDate) modalDate.textContent = order.createdAt;
  if (modalStatus) {
    modalStatus.textContent = order.statusLabel;
    modalStatus.className = `ll-badge ${order.statusClass}`;
  }
  if (modalPayment) modalPayment.textContent = `${order.paymentMethod} (${order.paymentStatus})`;
  if (modalRecipient) modalRecipient.textContent = `${order.recipient.name} - ${order.recipient.phone}`;
  if (modalAddress) modalAddress.textContent = order.recipient.address;

  if (modalItems) {
    modalItems.innerHTML = order.items.map(it => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:0.6rem 0; border-bottom:1px solid var(--color-border);">
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <img src="${it.imageUrl}" alt="${it.name}" style="width:44px; aspect-ratio:4/5; object-fit:cover; border-radius:4px;" />
          <div>
            <div style="font-weight:700; font-size:0.875rem;">${it.name}</div>
            <div style="font-size:0.75rem; color:var(--color-text-sub);">Màu: ${it.color} | Size: ${it.size} | x${it.quantity}</div>
          </div>
        </div>
        <strong style="font-size:0.9375rem;">${formatVND(it.unitPrice * it.quantity)}</strong>
      </div>
    `).join('');
  }

  if (modalTotal) modalTotal.textContent = formatVND(order.total);
  if (modal) modal.classList.add('active');
}

function closeOrderDetailModal() {
  const modal = document.getElementById('quickOrderDetailModal');
  if (modal) modal.classList.remove('active');
}

// 12. KHỞI TẠO KHI DOM SẴN SÀNG
document.addEventListener('DOMContentLoaded', () => {
  fetchCustomerOrders();

  const searchForm = document.getElementById('orderSearchForm');
  if (searchForm) {
    searchForm.addEventListener('submit', handleOrderSearch);
  }

  // Đóng modal khi bấm ngoài hoặc nút đóng
  const modal = document.getElementById('quickOrderDetailModal');
  const closeBtn = document.getElementById('closeOrderModalBtn');
  if (closeBtn) closeBtn.addEventListener('click', closeOrderDetailModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeOrderDetailModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeOrderDetailModal();
  });
});

// Xuất các hàm ra phạm vi window
window.handleFilterTabClick = handleFilterTabClick;
window.handleOrderSearch = handleOrderSearch;
window.changePage = changePage;
window.openOrderDetailModal = openOrderDetailModal;
window.closeOrderDetailModal = closeOrderDetailModal;

