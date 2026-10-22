/**
 * ==========================================================================
 * LIGHT LIFE FASHION STUDIO - PRODUCTS CATALOG JAVASCRIPT (Thuần ES6)
 * ==========================================================================
 * Tính năng:
 * - Lưu và khôi phục trạng thái bộ lọc qua URL query params.
 * - Lọc đa chiều: Danh mục, Khoảng giá, Màu sắc, Kích cỡ, Chỉ còn hàng.
 * - Sắp xếp: Mới nhất, Giá tăng dần, Giá giảm dần, Bán chạy nhất.
 * - Chip bộ lọc đang áp dụng & nút "Xóa tất cả".
 * - Lưới 3-4 cột Desktop, 2 cột Mobile; ảnh chuẩn 4:5; swatches màu sắc.
 * - Mobile Filter Drawer có nút "Áp dụng" và "Đặt lại".
 * - Phân trang, trạng thái Loading, Empty và Error.
 * - Khách chưa đăng nhập truy cập và tương tác bình thường.
 */

// 1. DỮ LIỆU DEMO SẢN PHẨM TẬP TRUNG (Giá VND, không giá vốn hay tồn nội bộ)
const PRODUCTS_DATABASE = [
  {
    id: 101,
    name: "Áo Blazer Nữ Cổ Điển Dáng Suông",
    category: "nu",
    categoryName: "Thời Trang Nữ",
    price: 650000,
    colors: [
      { name: "Đen", slug: "den", hex: "#201C1A" },
      { name: "Be", slug: "be", hex: "#D6C3B1" }
    ],
    sizes: ["S", "M", "L"],
    inStock: true,
    tag: "Mới Về",
    rating: 4.9,
    reviews: 38,
    isNew: true,
    sales: 120,
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 102,
    name: "Áo Sơ Mi Nam Oxford Trắng Thanh Lịch",
    category: "nam",
    categoryName: "Thời Trang Nam",
    price: 420000,
    colors: [
      { name: "Trắng", slug: "trang", hex: "#FFFFFF" },
      { name: "Xanh", slug: "xanh", hex: "#4A6B82" }
    ],
    sizes: ["M", "L", "XL"],
    inStock: true,
    tag: "Mới Về",
    rating: 4.8,
    reviews: 52,
    isNew: true,
    sales: 190,
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 103,
    name: "Đầm Lụa Dáng Dài Dự Tiệc Cao Cấp",
    category: "nu",
    categoryName: "Thời Trang Nữ",
    price: 890000,
    colors: [
      { name: "Đỏ mận", slug: "do", hex: "#6F2438" },
      { name: "Đen", slug: "den", hex: "#201C1A" }
    ],
    sizes: ["S", "M"],
    inStock: true,
    tag: "Mới Về",
    rating: 5.0,
    reviews: 29,
    isNew: true,
    sales: 95,
    image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 104,
    name: "Quần Tây Nam Dáng Suông Tinh Tế",
    category: "nam",
    categoryName: "Thời Trang Nam",
    price: 520000,
    colors: [
      { name: "Đen", slug: "den", hex: "#201C1A" },
      { name: "Be", slug: "be", hex: "#B8A99A" }
    ],
    sizes: ["M", "L", "XL"],
    inStock: true,
    tag: "Mới Về",
    rating: 4.7,
    reviews: 44,
    isNew: true,
    sales: 140,
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 201,
    name: "Áo Polo Nam Dệt Kim Cao Cấp",
    category: "nam",
    categoryName: "Thời Trang Nam",
    price: 380000,
    colors: [
      { name: "Trắng", slug: "trang", hex: "#FFFFFF" },
      { name: "Đen", slug: "den", hex: "#201C1A" },
      { name: "Be", slug: "be", hex: "#D6C3B1" }
    ],
    sizes: ["S", "M", "L", "XL"],
    inStock: true,
    tag: "Bán Chạy",
    rating: 4.9,
    reviews: 168,
    isNew: false,
    sales: 450,
    image: "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 202,
    name: "Set Váy Dạ Tweed Thu Đông Sang Trọng",
    category: "nu",
    categoryName: "Thời Trang Nữ",
    price: 950000,
    colors: [
      { name: "Trắng", slug: "trang", hex: "#F3EDE5" },
      { name: "Đen", slug: "den", hex: "#201C1A" }
    ],
    sizes: ["S", "M"],
    inStock: true,
    tag: "Bán Chạy",
    rating: 5.0,
    reviews: 210,
    isNew: false,
    sales: 380,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 203,
    name: "Quần Jean Nữ Ống Đứng Vintage",
    category: "nu",
    categoryName: "Thời Trang Nữ",
    price: 450000,
    colors: [
      { name: "Xanh", slug: "xanh", hex: "#527392" }
    ],
    sizes: ["S", "M", "L"],
    inStock: true,
    tag: "Bán Chạy",
    rating: 4.8,
    reviews: 195,
    isNew: false,
    sales: 320,
    image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 204,
    name: "Túi Xách Da Minimalist Cao Cấp",
    category: "phukien",
    categoryName: "Phụ Kiện",
    price: 680000,
    colors: [
      { name: "Đen", slug: "den", hex: "#201C1A" },
      { name: "Be", slug: "be", hex: "#C7A685" }
    ],
    sizes: ["Freesize"],
    inStock: true,
    tag: "Bán Chạy",
    rating: 4.9,
    reviews: 142,
    isNew: false,
    sales: 290,
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 301,
    name: "Áo Thun Cotton Compact Form Rộng",
    category: "nam",
    categoryName: "Thời Trang Nam",
    price: 260000,
    colors: [
      { name: "Trắng", slug: "trang", hex: "#FFFFFF" },
      { name: "Đen", slug: "den", hex: "#201C1A" }
    ],
    sizes: ["M", "L", "XL"],
    inStock: true,
    tag: "",
    rating: 4.7,
    reviews: 86,
    isNew: false,
    sales: 210,
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 302,
    name: "Áo Khoác Da Biker Nữ Cá Tính",
    category: "nu",
    categoryName: "Thời Trang Nữ",
    price: 1150000,
    colors: [
      { name: "Đen", slug: "den", hex: "#201C1A" }
    ],
    sizes: ["S", "M"],
    inStock: true,
    tag: "",
    rating: 4.9,
    reviews: 64,
    isNew: true,
    sales: 115,
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 303,
    name: "Thắt Lưng Da Bò Khóa Kim Loại Tinh Xảo",
    category: "phukien",
    categoryName: "Phụ Kiện",
    price: 290000,
    colors: [
      { name: "Đen", slug: "den", hex: "#201C1A" },
      { name: "Nâu", slug: "be", hex: "#6E4D36" }
    ],
    sizes: ["Freesize"],
    inStock: true,
    tag: "",
    rating: 4.8,
    reviews: 98,
    isNew: false,
    sales: 180,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: 304,
    name: "Khăn Lụa Vuông Họa Tiết Cổ Điển",
    category: "phukien",
    categoryName: "Phụ Kiện",
    price: 220000,
    colors: [
      { name: "Đỏ", slug: "do", hex: "#8A2B43" },
      { name: "Be", slug: "be", hex: "#D6C3B1" }
    ],
    sizes: ["Freesize"],
    inStock: false, // Demo sản phẩm hết hàng
    tag: "Tạm Hết",
    rating: 4.6,
    reviews: 42,
    isNew: false,
    sales: 80,
    image: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?q=80&w=800&auto=format&fit=crop"
  }
];

// 2. TRẠNG THÁI BỘ LỌC TOÀN TRANG (Current State)
const CatalogState = {
  category: "all",
  search: "",
  price: "all",
  color: "all",
  size: "all",
  inStock: false,
  sort: "newest",
  page: 1,
  pageSize: 6
};

// 3. ĐỌC VÀ ĐỒNG BỘ TRẠNG THÁI VỚI URL QUERY
function loadStateFromURL() {
  const params = new URLSearchParams(window.location.search);
  CatalogState.category = params.get('category') || 'all';
  CatalogState.search = params.get('search') || '';
  CatalogState.price = params.get('price') || 'all';
  CatalogState.color = params.get('color') || 'all';
  CatalogState.size = params.get('size') || 'all';
  CatalogState.inStock = params.get('inStock') === 'true';
  CatalogState.sort = params.get('sort') || 'newest';
  CatalogState.page = parseInt(params.get('page') || '1', 10);
  if (isNaN(CatalogState.page) || CatalogState.page < 1) CatalogState.page = 1;
}

function syncStateToURL(pushHistory = true) {
  const params = new URLSearchParams();
  if (CatalogState.category && CatalogState.category !== 'all') params.set('category', CatalogState.category);
  if (CatalogState.search) params.set('search', CatalogState.search);
  if (CatalogState.price && CatalogState.price !== 'all') params.set('price', CatalogState.price);
  if (CatalogState.color && CatalogState.color !== 'all') params.set('color', CatalogState.color);
  if (CatalogState.size && CatalogState.size !== 'all') params.set('size', CatalogState.size);
  if (CatalogState.inStock) params.set('inStock', 'true');
  if (CatalogState.sort && CatalogState.sort !== 'newest') params.set('sort', CatalogState.sort);
  if (CatalogState.page > 1) params.set('page', CatalogState.page);

  const newQuery = params.toString() ? `?${params.toString()}` : window.location.pathname;
  if (pushHistory) {
    history.pushState(null, '', newQuery);
  } else {
    history.replaceState(null, '', newQuery);
  }
}

// 4. BỘ LỌC & SẮP XẾP SẢN PHẨM
function getFilteredAndSortedProducts() {
  return PRODUCTS_DATABASE.filter(item => {
    // 4.1. Lọc theo danh mục
    if (CatalogState.category !== 'all' && item.category !== CatalogState.category) {
      return false;
    }

    // 4.2. Lọc theo từ khóa tìm kiếm
    if (CatalogState.search) {
      const q = CatalogState.search.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchCat = item.categoryName.toLowerCase().includes(q);
      if (!matchName && !matchCat) return false;
    }

    // 4.3. Lọc theo giá
    if (CatalogState.price === 'under300' && item.price >= 300000) return false;
    if (CatalogState.price === '300-600' && (item.price < 300000 || item.price > 600000)) return false;
    if (CatalogState.price === '600-1000' && (item.price < 600000 || item.price > 1000000)) return false;
    if (CatalogState.price === 'over1000' && item.price <= 1000000) return false;

    // 4.4. Lọc theo màu sắc
    if (CatalogState.color !== 'all' && !item.colors.some(c => c.slug === CatalogState.color)) {
      return false;
    }

    // 4.5. Lọc theo size
    if (CatalogState.size !== 'all' && !item.sizes.includes(CatalogState.size)) {
      return false;
    }

    // 4.6. Chỉ còn hàng
    if (CatalogState.inStock && !item.inStock) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    // Sắp xếp
    if (CatalogState.sort === 'price_asc') return a.price - b.price;
    if (CatalogState.sort === 'price_desc') return b.price - a.price;
    if (CatalogState.sort === 'bestseller') return b.sales - a.sales;
    // Mặc định newest
    return b.isNew ? 1 : -1;
  });
}

// 5. HIỂN THỊ GIAO DIỆN CHÍNH
function renderCatalog() {
  const loadingEl = document.getElementById('llCatalogLoading');
  const emptyEl = document.getElementById('llCatalogEmpty');
  const errorEl = document.getElementById('llCatalogError');
  const gridEl = document.getElementById('llCatalogGrid');
  const paginationWrap = document.getElementById('llPaginationWrap');

  // Trạng thái đang tải tạm
  if (loadingEl) loadingEl.classList.remove('show');
  if (emptyEl) emptyEl.classList.remove('show');
  if (errorEl) errorEl.classList.remove('show');

  const filtered = getFilteredAndSortedProducts();
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / CatalogState.pageSize) || 1;
  if (CatalogState.page > totalPages) CatalogState.page = totalPages;

  const startIndex = (CatalogState.page - 1) * CatalogState.pageSize;
  const pageItems = filtered.slice(startIndex, startIndex + CatalogState.pageSize);

  // 5.1. Cập nhật Tiêu đề & Breadcrumb & Counter
  updateHeadingsAndBreadcrumb(totalItems);

  // 5.2. Cập nhật Chip bộ lọc đang áp dụng
  renderActiveFilterChips();

  // 5.3. Đồng bộ trạng thái vào các input form (Sidebar & Drawer)
  syncControlsFromState();

  // 5.4. Render danh sách sản phẩm
  if (totalItems === 0) {
    if (gridEl) gridEl.innerHTML = '';
    if (emptyEl) emptyEl.classList.add('show');
    if (paginationWrap) paginationWrap.style.display = 'none';
    return;
  }

  if (paginationWrap) paginationWrap.style.display = 'flex';

  if (gridEl) {
    gridEl.innerHTML = pageItems.map(item => `
      <article class="ll-product-card" data-product-id="${item.id}">
        <!-- Bấm card -> chi tiết sản phẩm, không chuyển đăng nhập -->
        <a href="/Products/Detail/${item.id}" class="ll-product-img-box" title="${item.name}">
          <img src="${item.image}" alt="${item.name}" class="ll-product-img" loading="lazy" />
          ${item.tag ? `<span class="ll-product-tag" ${item.tag === 'Bán Chạy' ? 'style="background-color: var(--color-gold); color: #201C1A;"' : ''}>${item.tag}</span>` : ''}
        </a>
        <div class="ll-product-body">
          <span class="ll-product-category">${item.categoryName}</span>
          <h3 class="ll-product-title">
            <a href="/Products/Detail/${item.id}" title="${item.name}">${item.name}</a>
          </h3>
          
          <!-- Swatches màu sắc sẵn có trên card -->
          <div class="ll-product-swatches" title="Màu sắc: ${item.colors.map(c => c.name).join(', ')}">
            ${item.colors.map(c => `<span class="ll-mini-swatch" style="background-color: ${c.hex};" title="${c.name}"></span>`).join('')}
          </div>

          <div class="ll-product-footer">
            <span class="ll-product-price">${item.price.toLocaleString('vi-VN')} đ</span>
          </div>
          <div class="ll-card-action-bar">
            <a href="/Products/Detail/${item.id}" class="ll-btn ll-btn-secondary" style="width: 100%; min-height: 44px;">
              <i class="fa-regular fa-eye"></i> Xem chi tiết sản phẩm
            </a>
          </div>
        </div>
      </article>
    `).join('');
  }

  // 5.5. Render phân trang
  renderPagination(totalItems, totalPages, startIndex + 1, Math.min(startIndex + CatalogState.pageSize, totalItems));
}

// 6. RENDER CHIP BỘ LỌC ĐANG ÁP DỤNG & XÓA TẤT CẢ
function renderActiveFilterChips() {
  const chipsContainer = document.getElementById('llActiveChips');
  const chipsBar = document.getElementById('llActiveChipsBar');
  const mobileBadge = document.getElementById('llMobileFilterBadge');
  if (!chipsContainer || !chipsBar) return;

  const chips = [];

  // Chip Danh mục
  if (CatalogState.category !== 'all') {
    const catName = CatalogState.category === 'nu' ? 'Thời Trang Nữ' : (CatalogState.category === 'nam' ? 'Thời Trang Nam' : 'Phụ Kiện');
    chips.push({
      key: 'category',
      label: `Danh mục: ${catName}`,
      remove: () => { CatalogState.category = 'all'; }
    });
  }

  // Chip Từ khóa tìm kiếm
  if (CatalogState.search) {
    chips.push({
      key: 'search',
      label: `Tìm: "${CatalogState.search}"`,
      remove: () => { CatalogState.search = ''; }
    });
  }

  // Chip Khoảng giá
  if (CatalogState.price !== 'all') {
    const priceMap = {
      'under300': 'Dưới 300.000 đ',
      '300-600': '300.000 đ - 600.000 đ',
      '600-1000': '600.000 đ - 1.000.000 đ',
      'over1000': 'Trên 1.000.000 đ'
    };
    chips.push({
      key: 'price',
      label: `Giá: ${priceMap[CatalogState.price] || CatalogState.price}`,
      remove: () => { CatalogState.price = 'all'; }
    });
  }

  // Chip Màu sắc
  if (CatalogState.color !== 'all') {
    const colorMap = { 'trang': 'Trắng', 'den': 'Đen', 'be': 'Be/Nâu', 'do': 'Đỏ mận', 'xanh': 'Xanh' };
    chips.push({
      key: 'color',
      label: `Màu: ${colorMap[CatalogState.color] || CatalogState.color}`,
      remove: () => { CatalogState.color = 'all'; }
    });
  }

  // Chip Kích cỡ
  if (CatalogState.size !== 'all') {
    chips.push({
      key: 'size',
      label: `Size: ${CatalogState.size}`,
      remove: () => { CatalogState.size = 'all'; }
    });
  }

  // Chip Chỉ còn hàng
  if (CatalogState.inStock) {
    chips.push({
      key: 'inStock',
      label: 'Chỉ còn hàng',
      remove: () => { CatalogState.inStock = false; }
    });
  }

  // Cập nhật số lượng trên mobile filter button
  if (mobileBadge) {
    mobileBadge.textContent = chips.length;
    mobileBadge.style.display = chips.length > 0 ? 'inline-flex' : 'none';
  }

  if (chips.length === 0) {
    chipsBar.classList.add('empty');
    chipsContainer.innerHTML = '';
    return;
  }

  chipsBar.classList.remove('empty');
  chipsContainer.innerHTML = chips.map(chip => `
    <button type="button" class="ll-filter-chip" onclick="removeSpecificFilter('${chip.key}')" aria-label="Bỏ lọc ${chip.label}">
      <span>${chip.label}</span>
      <i class="fa-solid fa-xmark ll-chip-remove"></i>
    </button>
  `).join('') + `
    <button type="button" class="ll-clear-all-btn" onclick="clearAllFilters()">
      Xóa tất cả
    </button>
  `;
}

// 7. XÓA BỘ LỌC
function removeSpecificFilter(key) {
  if (key === 'category') CatalogState.category = 'all';
  if (key === 'search') CatalogState.search = '';
  if (key === 'price') CatalogState.price = 'all';
  if (key === 'color') CatalogState.color = 'all';
  if (key === 'size') CatalogState.size = 'all';
  if (key === 'inStock') CatalogState.inStock = false;
  CatalogState.page = 1;
  syncStateToURL(true);
  renderCatalog();
}

function clearAllFilters() {
  CatalogState.category = 'all';
  CatalogState.search = '';
  CatalogState.price = 'all';
  CatalogState.color = 'all';
  CatalogState.size = 'all';
  CatalogState.inStock = false;
  CatalogState.page = 1;
  syncStateToURL(true);
  renderCatalog();
}

// 8. ĐỒNG BỘ TRẠNG THÁI VÀO INPUTS
function syncControlsFromState() {
  // Sort select
  const sortSelect = document.getElementById('llSortSelect');
  if (sortSelect) sortSelect.value = CatalogState.sort;

  // Category radios
  document.querySelectorAll('input[name="cat_filter"]').forEach(radio => {
    radio.checked = (radio.value === CatalogState.category);
  });

  // Price radios
  document.querySelectorAll('input[name="price_filter"]').forEach(radio => {
    radio.checked = (radio.value === CatalogState.price);
  });

  // Color swatch buttons
  document.querySelectorAll('.ll-color-swatch-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.color === CatalogState.color);
  });

  // Size buttons
  document.querySelectorAll('.ll-size-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.size === CatalogState.size);
  });

  // In stock checkboxes
  document.querySelectorAll('input[name="stock_filter"]').forEach(chk => {
    chk.checked = CatalogState.inStock;
  });
}

// 9. CẬP NHẬT TIÊU ĐỀ, BREADCRUMB & COUNTER
function updateHeadingsAndBreadcrumb(count) {
  const titleEl = document.getElementById('llCatalogTitle');
  const countEl = document.getElementById('llCatalogCount');
  const breadcrumbCurrent = document.getElementById('llBreadcrumbCurrent');

  let title = "Tất Cả Sản Phẩm";
  if (CatalogState.category === 'nu') title = "Thời Trang Nữ";
  else if (CatalogState.category === 'nam') title = "Thời Trang Nam";
  else if (CatalogState.category === 'phukien') title = "Phụ Kiện Thời Trang";

  if (CatalogState.search) {
    title = `Kết quả tìm kiếm cho "${CatalogState.search}"`;
  }

  if (titleEl) titleEl.textContent = title;
  if (breadcrumbCurrent) breadcrumbCurrent.textContent = title;
  if (countEl) countEl.textContent = `Hiển thị ${count} sản phẩm`;
}

// 10. PHÂN TRANG (Pagination)
function renderPagination(totalItems, totalPages, fromIndex, toIndex) {
  const infoEl = document.getElementById('llPaginationInfo');
  const navEl = document.getElementById('llPaginationNav');
  if (!navEl) return;

  if (infoEl) {
    infoEl.textContent = `Hiển thị ${fromIndex} tới ${toIndex} trong ${totalItems} sản phẩm`;
  }

  if (totalPages <= 1) {
    navEl.innerHTML = '';
    return;
  }

  let html = `
    <button type="button" class="ll-page-btn" ${CatalogState.page <= 1 ? 'disabled' : ''} onclick="goToPage(${CatalogState.page - 1})" aria-label="Trang trước">
      <i class="fa-solid fa-angle-left"></i>
    </button>
  `;

  for (let p = 1; p <= totalPages; p++) {
    html += `
      <button type="button" class="ll-page-btn ${p === CatalogState.page ? 'active' : ''}" onclick="goToPage(${p})">
        ${p}
      </button>
    `;
  }

  html += `
    <button type="button" class="ll-page-btn" ${CatalogState.page >= totalPages ? 'disabled' : ''} onclick="goToPage(${CatalogState.page + 1})" aria-label="Trang sau">
      <i class="fa-solid fa-angle-right"></i>
    </button>
  `;

  navEl.innerHTML = html;
}

function goToPage(page) {
  CatalogState.page = page;
  syncStateToURL(true);
  renderCatalog();
  window.scrollTo({ top: 120, behavior: 'smooth' });
}

// 11. XỬ LÝ DRAWER TRÊN MOBILE
function openMobileDrawer() {
  const drawer = document.getElementById('llFilterDrawer');
  const backdrop = document.getElementById('llDrawerBackdrop');
  if (drawer && backdrop) {
    drawer.classList.add('open');
    backdrop.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
}

function closeMobileDrawer() {
  const drawer = document.getElementById('llFilterDrawer');
  const backdrop = document.getElementById('llDrawerBackdrop');
  if (drawer && backdrop) {
    drawer.classList.remove('open');
    backdrop.classList.remove('show');
    document.body.style.overflow = '';
  }
}

// 12. KHỞI TẠO EVENT LISTENERS KHI TẢI TRANG
document.addEventListener('DOMContentLoaded', () => {
  // 12.1. Đọc query params từ URL
  loadStateFromURL();

  // 12.2. Lắng nghe sự kiện browser Back / Forward (popstate)
  window.addEventListener('popstate', () => {
    loadStateFromURL();
    renderCatalog();
  });

  // 12.3. Sắp xếp dropdown
  const sortSelect = document.getElementById('llSortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      CatalogState.sort = e.target.value;
      CatalogState.page = 1;
      syncStateToURL(true);
      renderCatalog();
    });
  }

  // 12.4. Đổi Category radio
  document.querySelectorAll('input[name="cat_filter"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      CatalogState.category = e.target.value;
      CatalogState.page = 1;
      syncStateToURL(true);
      renderCatalog();
    });
  });

  // 12.5. Đổi Khoảng giá radio
  document.querySelectorAll('input[name="price_filter"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      CatalogState.price = e.target.value;
      CatalogState.page = 1;
      syncStateToURL(true);
      renderCatalog();
    });
  });

  // 12.6. Bấm Swatch Màu sắc
  document.querySelectorAll('.ll-color-swatch-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const selectedColor = btn.dataset.color;
      CatalogState.color = (CatalogState.color === selectedColor) ? 'all' : selectedColor;
      CatalogState.page = 1;
      syncStateToURL(true);
      renderCatalog();
    });
  });

  // 12.7. Bấm Nút Size
  document.querySelectorAll('.ll-size-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const selectedSize = btn.dataset.size;
      CatalogState.size = (CatalogState.size === selectedSize) ? 'all' : selectedSize;
      CatalogState.page = 1;
      syncStateToURL(true);
      renderCatalog();
    });
  });

  // 12.8. Checkbox Chỉ còn hàng
  document.querySelectorAll('input[name="stock_filter"]').forEach(chk => {
    chk.addEventListener('change', (e) => {
      CatalogState.inStock = e.target.checked;
      CatalogState.page = 1;
      syncStateToURL(true);
      renderCatalog();
    });
  });

  // 12.9. Nút Drawer Mobile
  const mobileFilterBtn = document.getElementById('llMobileFilterBtn');
  const drawerCloseBtn = document.getElementById('llDrawerCloseBtn');
  const drawerBackdrop = document.getElementById('llDrawerBackdrop');
  const drawerApplyBtn = document.getElementById('llDrawerApplyBtn');
  const drawerResetBtn = document.getElementById('llDrawerResetBtn');

  if (mobileFilterBtn) mobileFilterBtn.addEventListener('click', openMobileDrawer);
  if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeMobileDrawer);
  if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeMobileDrawer);
  if (drawerApplyBtn) {
    drawerApplyBtn.addEventListener('click', () => {
      closeMobileDrawer();
      renderCatalog();
    });
  }
  if (drawerResetBtn) {
    drawerResetBtn.addEventListener('click', () => {
      clearAllFilters();
      closeMobileDrawer();
    });
  }

  // 12.10. Render danh sách lần đầu
  renderCatalog();
});

// Xuất các hàm điều khiển vào window
window.CatalogState = CatalogState;
window.renderCatalog = renderCatalog;
window.clearAllFilters = clearAllFilters;
window.removeSpecificFilter = removeSpecificFilter;
window.goToPage = goToPage;

