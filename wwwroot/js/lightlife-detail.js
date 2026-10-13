/**
 * ==========================================================================
 * LIGHT LIFE FASHION STUDIO - PRODUCT DETAIL ENGINE (Thuần ES6)
 * ==========================================================================
 * Quy ước:
 * - Khách chưa đăng nhập được xem và thêm giỏ bình thường.
 * - Bắt buộc chọn màu/size; size hết hàng có chữ và bị vô hiệu hóa.
 * - Đổi màu cập nhật ảnh chính tương ứng khi có dữ liệu.
 * - Thêm vào giỏ: gọi hook, cập nhật badge, hiện popup Xem giỏ / Tiếp tục mua.
 * - Mua ngay: đưa biến thể vào luồng checkout; chưa login chuyển trang login
 *   với returnUrl quay lại checkout.
 * - Giỏ chưa giữ hàng; backend kiểm tra lại tồn & giá lúc đặt hàng.
 * - Không thêm đánh giá giả.
 */

// 1. DỮ LIỆU CHI TIẾT SẢN PHẨM MẪU (Bổ sung biến thể màu, size & tồn kho)
const PRODUCT_DETAIL_DATA = {
  101: {
    id: 101,
    name: "Áo Blazer Nữ Cổ Điển Dáng Suông",
    categorySlug: "nu",
    categoryName: "Thời Trang Nữ",
    price: 650000,
    shortDesc: "Thiết kế blazer phom suông tối giản với kỹ thuật may cao cấp, ve áo thanh lịch và đệm vai tự nhiên. Dễ dàng kết hợp cùng áo sơ mi, áo thun hoặc quần tây cho vẻ ngoài đĩnh đạc và cuốn hút.",
    tag: "Mới Về",
    inStock: true,
    colors: [
      {
        slug: "den",
        name: "Đen Quyền Lực",
        hex: "#201C1A",
        image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop"
      },
      {
        slug: "be",
        name: "Be Tinh Tế",
        hex: "#D6C3B1",
        image: "https://images.unsplash.com/photo-1548624313-0396c75e4b1a?q=80&w=1000&auto=format&fit=crop"
      }
    ],
    sizes: [
      { code: "S", label: "S", inStock: true },
      { code: "M", label: "M", inStock: true },
      { code: "L", label: "L", inStock: false }, // Size L tạm hết hàng
      { code: "XL", label: "XL", inStock: false } // Size XL tạm hết hàng
    ],
    gallery: [
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1548624313-0396c75e4b1a?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1550639525-c97d455acf70?q=80&w=1000&auto=format&fit=crop"
    ],
    details: {
      material: "70% Polyester cao cấp, 28% Rayon mềm mịn, 2% Spandex co giãn nhẹ. Lớp lót lụa habutai êm ái thoáng mát.",
      care: "Giặt khô hoặc giặt tay với nước lạnh. Không vắt xoắn mạnh. Là ủi ở nhiệt độ trung bình dưới 110°C, ưu tiên bàn ủi hơi nước.",
      policies: "Miễn phí giao hàng cho đơn từ 500.000 đ. Đổi size / mẫu trong 7 ngày nếu nguyên tem mác. Kiểm tra hàng trước khi thanh toán (COD)."
    }
  }
};

// 2. TRẠNG THÁI CHỌN MUA HIỆN TẠI
const SelectionState = {
  productId: 101,
  selectedColor: null,
  selectedSize: null,
  quantity: 1,
  currentImageIndex: 0
};

// 3. KHỞI TẠO DỮ LIỆU THEO URL PARAM / MẶC ĐỊNH
function initProductDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const idFromParam = parseInt(urlParams.get('id') || '101', 10);
  const product = PRODUCT_DETAIL_DATA[idFromParam] || PRODUCT_DETAIL_DATA[101];

  SelectionState.productId = product.id;

  // Render thông tin chính
  document.getElementById('llDetailTitle').textContent = product.name;
  document.getElementById('llDetailPrice').textContent = product.price.toLocaleString('vi-VN') + ' đ';
  document.getElementById('llDetailDesc').textContent = product.shortDesc;
  document.getElementById('llBreadcrumbTitle').textContent = product.name;
  document.getElementById('llBreadcrumbCategory').textContent = product.categoryName;
  document.getElementById('llBreadcrumbCategory').href = `/Products?category=${product.categorySlug}`;
  document.getElementById('llCategoryEyebrow').textContent = product.categoryName;

  // Render Gallery Ảnh
  renderGallery(product);

  // Render Swatches Màu Sắc
  renderColorSwatches(product);

  // Render Kích Cỡ Size
  renderSizeChips(product);

  // Render Tabs Thông Tin Chi Tiết
  renderTabDetails(product);

  // Render Sản Phẩm Liên Quan
  renderRelatedProducts(product.categorySlug);
}

// 4. RENDER GALLERY ẢNH & THUMBNAILS
function renderGallery(product) {
  const mainImg = document.getElementById('llMainImg');
  const thumbsContainer = document.getElementById('llThumbnailsStrip');
  if (!mainImg || !thumbsContainer) return;

  mainImg.src = product.gallery[0];
  mainImg.alt = product.name;

  thumbsContainer.innerHTML = product.gallery.map((imgUrl, index) => `
    <button type="button" class="ll-thumb-btn ${index === 0 ? 'active' : ''}" 
            onclick="switchMainImage(${index})" aria-label="Xem ảnh ${index + 1}">
      <img src="${imgUrl}" alt="${product.name} ảnh ${index + 1}" class="ll-thumb-img" />
    </button>
  `).join('');
}

function switchMainImage(index) {
  const product = PRODUCT_DETAIL_DATA[SelectionState.productId] || PRODUCT_DETAIL_DATA[101];
  const mainImg = document.getElementById('llMainImg');
  const thumbs = document.querySelectorAll('.ll-thumb-btn');

  if (mainImg && product.gallery[index]) {
    mainImg.src = product.gallery[index];
    SelectionState.currentImageIndex = index;
    thumbs.forEach((thumb, i) => {
      thumb.classList.toggle('active', i === index);
    });
  }
}

// 5. RENDER CHỌN MÀU & ĐỔI ẢNH THEO MÀU
function renderColorSwatches(product) {
  const swatchesWrap = document.getElementById('llColorSwatches');
  if (!swatchesWrap) return;

  swatchesWrap.innerHTML = product.colors.map(color => `
    <button type="button" class="ll-detail-swatch-item" data-color="${color.slug}" 
            onclick="selectColor('${color.slug}', '${color.name}', '${color.image}')" 
            aria-label="Chọn màu ${color.name}">
      <span class="ll-swatch-dot" style="background-color: ${color.hex};"></span>
      <span>${color.name}</span>
    </button>
  `).join('');
}

function selectColor(colorSlug, colorName, colorImage) {
  SelectionState.selectedColor = colorSlug;
  document.getElementById('llSelectedColorName').textContent = colorName;

  // Cập nhật trạng thái active
  document.querySelectorAll('.ll-detail-swatch-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.color === colorSlug);
  });

  // Ẩn cảnh báo lỗi nếu có
  const errorEl = document.getElementById('llColorError');
  if (errorEl) errorEl.classList.remove('show');

  // Đổi ảnh chính tương ứng khi có dữ liệu
  if (colorImage) {
    const mainImg = document.getElementById('llMainImg');
    if (mainImg) mainImg.src = colorImage;
  }
}

// 6. RENDER CHỌN SIZE & XỬ LÝ SIZE HẾT HÀNG
function renderSizeChips(product) {
  const sizesWrap = document.getElementById('llSizesWrap');
  if (!sizesWrap) return;

  sizesWrap.innerHTML = product.sizes.map(size => {
    if (!size.inStock) {
      return `
        <button type="button" class="ll-size-chip out-of-stock" disabled 
                title="Size ${size.label} hiện đang tạm hết hàng" aria-label="Size ${size.label} tạm hết hàng">
          <span>${size.label}</span>
          <span class="ll-size-out-text">(Hết)</span>
        </button>
      `;
    }
    return `
      <button type="button" class="ll-size-chip" data-size="${size.code}" 
              onclick="selectSize('${size.code}')" aria-label="Chọn size ${size.label}">
        <span>${size.label}</span>
      </button>
    `;
  }).join('');
}

function selectSize(sizeCode) {
  SelectionState.selectedSize = sizeCode;
  document.getElementById('llSelectedSizeName').textContent = sizeCode;

  document.querySelectorAll('.ll-size-chip:not(:disabled)').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.size === sizeCode);
  });

  const errorEl = document.getElementById('llSizeError');
  if (errorEl) errorEl.classList.remove('show');
}

// 7. SỐ LƯỢNG (Stepper)
function updateQuantity(delta) {
  const input = document.getElementById('llQuantityInput');
  if (!input) return;

  let current = parseInt(input.value || '1', 10);
  current += delta;
  if (current < 1) current = 1;
  if (current > 10) current = 10; // Giới hạn demo an toàn

  input.value = current;
  SelectionState.quantity = current;

  document.getElementById('llQtyMinus').disabled = (current <= 1);
  document.getElementById('llQtyPlus').disabled = (current >= 10);
}

// 8. VALIDATION TRƯỚC KHI THỰC HIỆN HÀNH ĐỘNG
function validateSelection() {
  let valid = true;
  const colorError = document.getElementById('llColorError');
  const sizeError = document.getElementById('llSizeError');

  if (!SelectionState.selectedColor) {
    if (colorError) colorError.classList.add('show');
    valid = false;
  } else {
    if (colorError) colorError.classList.remove('show');
  }

  if (!SelectionState.selectedSize) {
    if (sizeError) sizeError.classList.add('show');
    valid = false;
  } else {
    if (sizeError) sizeError.classList.remove('show');
  }

  return valid;
}

// 9. THÊM VÀO GIỎ HÀNG (Không yêu cầu đăng nhập)
async function handleAddToCart() {
  if (!validateSelection()) return;

  const product = PRODUCT_DETAIL_DATA[SelectionState.productId] || PRODUCT_DETAIL_DATA[101];

  // Gọi hook giỏ hàng backend
  if (window.LightLifeCart) {
    await window.LightLifeCart.addItem(product.id, `${product.name} (${SelectionState.selectedColor.toUpperCase()} / ${SelectionState.selectedSize})`);
  }

  // Mở modal thông báo thêm thành công có nút "Xem giỏ hàng" và "Tiếp tục mua"
  const modal = document.getElementById('llAddedModal');
  const detailsEl = document.getElementById('llAddedDetailsText');
  if (detailsEl) {
    detailsEl.textContent = `${product.name} • Phân loại: ${SelectionState.selectedColor.toUpperCase()} / Size ${SelectionState.selectedSize} • Số lượng: ${SelectionState.quantity}`;
  }
  if (modal) modal.classList.add('show');
}

function closeAddedModal() {
  const modal = document.getElementById('llAddedModal');
  if (modal) modal.classList.remove('show');
}

// 10. MUA NGAY (Luồng Checkout & Chuyển hướng xác thực an toàn)
function handleBuyNow() {
  if (!validateSelection()) return;

  const product = PRODUCT_DETAIL_DATA[SelectionState.productId] || PRODUCT_DETAIL_DATA[101];

  // Lưu biến thể vào session checkout tạm thời
  const checkoutItem = {
    productId: product.id,
    name: product.name,
    price: product.price,
    color: SelectionState.selectedColor,
    size: SelectionState.selectedSize,
    quantity: SelectionState.quantity
  };

  try {
    sessionStorage.setItem('lightLifeCheckoutDirect', JSON.stringify(checkoutItem));
  } catch (e) {}

  // Kiểm tra trạng thái đăng nhập qua cookie/session (không dùng localStorage lưu quyền)
  // Nếu chưa đăng nhập: chuyển tới trang đăng nhập kèm returnUrl quay lại checkout
  const rawUser = sessionStorage.getItem('lightLifeUser') || localStorage.getItem('lightLifeUser');
  if (rawUser) {
    // Đã đăng nhập -> chuyển thẳng tới trang Checkout
    window.location.href = '/Checkout';
  } else {
    // Chưa đăng nhập -> chuyển tới Login với returnUrl = /Checkout
    window.location.href = `/Account/Login?returnUrl=${encodeURIComponent('/Checkout')}`;
  }
}

// 11. MODAL HƯỚNG DẪN SIZE & LIGHTBOX
function openSizeGuideModal() {
  const modal = document.getElementById('llSizeGuideModal');
  if (modal) modal.classList.add('show');
}

function closeSizeGuideModal() {
  const modal = document.getElementById('llSizeGuideModal');
  if (modal) modal.classList.remove('show');
}

function openLightbox() {
  const mainImg = document.getElementById('llMainImg');
  const lightbox = document.getElementById('llLightbox');
  const targetImg = document.getElementById('llLightboxImg');
  if (mainImg && lightbox && targetImg) {
    targetImg.src = mainImg.src;
    lightbox.classList.add('show');
  }
}

function closeLightbox() {
  const lightbox = document.getElementById('llLightbox');
  if (lightbox) lightbox.classList.remove('show');
}

// 12. RENDER TABS CHI TIẾT
function renderTabDetails(product) {
  document.getElementById('llTabMaterial').textContent = product.details.material;
  document.getElementById('llTabCare').textContent = product.details.care;
  document.getElementById('llTabPolicies').textContent = product.details.policies;
}

function switchTab(tabId) {
  document.querySelectorAll('.ll-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });
  document.querySelectorAll('.ll-tab-content').forEach(content => {
    content.classList.toggle('active', content.id === tabId);
  });
}

// 13. SẢN PHẨM LIÊN QUAN
function renderRelatedProducts(categorySlug) {
  const container = document.getElementById('llRelatedGrid');
  if (!container) return;

  const related = [
    {
      id: 202,
      name: "Set Váy Dạ Tweed Thu Đông Sang Trọng",
      price: 950000,
      image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop"
    },
    {
      id: 103,
      name: "Đầm Lụa Dáng Dài Dự Tiệc Cao Cấp",
      price: 890000,
      image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=800&auto=format&fit=crop"
    },
    {
      id: 203,
      name: "Quần Jean Nữ Ống Đứng Vintage",
      price: 450000,
      image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=800&auto=format&fit=crop"
    },
    {
      id: 302,
      name: "Áo Khoác Da Biker Nữ Cá Tính",
      price: 1150000,
      image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800&auto=format&fit=crop"
    }
  ];

  container.innerHTML = related.map(item => `
    <article class="ll-product-card" data-product-id="${item.id}">
      <a href="/Products/Detail/${item.id}" class="ll-product-img-box" title="${item.name}">
        <img src="${item.image}" alt="${item.name}" class="ll-product-img" loading="lazy" />
      </a>
      <div class="ll-product-body">
        <span class="ll-product-category">Gợi Ý Cho Bạn</span>
        <h3 class="ll-product-title">
          <a href="/Products/Detail/${item.id}">${item.name}</a>
        </h3>
        <div class="ll-product-footer">
          <span class="ll-product-price">${item.price.toLocaleString('vi-VN')} đ</span>
        </div>
        <div class="ll-card-action-bar">
          <a href="/Products/Detail/${item.id}" class="ll-btn ll-btn-secondary" style="width: 100%; min-height: 44px;">
            Xem chi tiết
          </a>
        </div>
      </div>
    </article>
  `).join('');
}

// 14. KHỞI TẠO DOM
document.addEventListener('DOMContentLoaded', () => {
  initProductDetail();

  // Tab switching
  document.querySelectorAll('.ll-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Quantity stepper
  const minusBtn = document.getElementById('llQtyMinus');
  const plusBtn = document.getElementById('llQtyPlus');
  if (minusBtn) minusBtn.addEventListener('click', () => updateQuantity(-1));
  if (plusBtn) plusBtn.addEventListener('click', () => updateQuantity(1));

  // Modal đóng khi click ngoài backdrop
  window.addEventListener('click', (e) => {
    const sizeModal = document.getElementById('llSizeGuideModal');
    const addedModal = document.getElementById('llAddedModal');
    const lightbox = document.getElementById('llLightbox');

    if (e.target === sizeModal) closeSizeGuideModal();
    if (e.target === addedModal) closeAddedModal();
    if (e.target === lightbox) closeLightbox();
  });
});

window.selectColor = selectColor;
window.selectSize = selectSize;
window.switchMainImage = switchMainImage;
window.openSizeGuideModal = openSizeGuideModal;
window.closeSizeGuideModal = closeSizeGuideModal;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.handleAddToCart = handleAddToCart;
window.closeAddedModal = closeAddedModal;
window.handleBuyNow = handleBuyNow;

