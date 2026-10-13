/**
 * ==========================================================================
 * LIGHT LIFE FASHION STUDIO - ACCOUNT MANAGEMENT JAVASCRIPT
 * (Hồ sơ cá nhân, Sổ địa chỉ nhận hàng, Đổi mật khẩu)
 * ==========================================================================
 * Quy ước bảo mật & nghiệp vụ:
 * - Không lưu mật khẩu hoặc quyền hạn phía trình duyệt (không dùng localStorage).
 * - Email là định danh tài khoản, thuộc chính sách chỉ đọc kèm giải thích.
 * - Sổ địa chỉ hỗ trợ Thêm, Sửa, Xóa (có xác nhận), Đặt làm mặc định.
 * - Đổi mật khẩu có kiểm tra độ mạnh, ẩn/hiện mật khẩu, hỗ trợ kịch bản đăng nhập lại.
 * ==========================================================================
 */

// 1. CẤU HÌNH HỆ THỐNG VÀ ENDPOINTS
const ACCOUNT_CONFIG = {
  endpoints: {
    getProfile: '/api/customer/profile',
    updateProfile: '/api/customer/profile',
    getAddresses: '/api/customer/addresses',
    saveAddress: '/api/customer/addresses',
    deleteAddress: '/api/customer/addresses/',
    setDefaultAddress: '/api/customer/addresses/default/',
    changePassword: '/api/customer/change-password',
    loginUrl: '/Account/Login'
  },

  // Dữ liệu mẫu ban đầu
  mockProfile: {
    fullName: 'Nguyễn Thu Trang',
    email: 'thutrang@lightlife.vn',
    phone: '0908 123 456',
    emailVerified: true,
    phoneVerified: true,
    memberSince: '15/01/2026'
  },

  mockAddresses: [
    {
      id: 1,
      recipientName: 'Nguyễn Thu Trang',
      phone: '0908 123 456',
      province: 'TP. Hồ Chí Minh',
      district: 'Quận Bình Thạnh',
      ward: 'Phường 22',
      detailAddress: 'Phòng 1204, Tòa Park 3, Vinhomes Central Park, 208 Nguyễn Hữu Cảnh',
      isDefault: true
    },
    {
      id: 2,
      recipientName: 'Nguyễn Thu Trang (Văn phòng)',
      phone: '0908 123 456',
      province: 'TP. Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Nghé',
      detailAddress: 'Tầng 8, Tòa nhà Bitexco Financial, 2 Hải Triều',
      isDefault: false
    }
  ]
};

// 2. BIẾN TRẠNG THÁI CLIENT-SIDE
const accountState = {
  profile: null,
  addresses: [],
  editingAddressId: null,
  deletingAddressId: null
};

// 3. TIỆN ÍCH TOAST THÔNG BÁO
function showAccountToast(message, type = 'success') {
  let toast = document.getElementById('accountToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'accountToast';
    toast.className = 'll-toast';
    document.body.appendChild(toast);
  }

  toast.className = `ll-toast ll-toast--${type} show`;
  toast.innerHTML = `
    <i class="fa-solid ${type === 'success' ? 'fa-check' : 'fa-triangle-exclamation'}"></i>
    <span>${message}</span>
  `;

  setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

// 4. KHỞI TẠO TÙY THEO MÀN HÌNH ĐANG MỞ
document.addEventListener('DOMContentLoaded', () => {
  // 4.1. Màn hình Hồ sơ cá nhân
  if (document.getElementById('profileForm')) {
    initProfilePage();
  }

  // 4.2. Màn hình Sổ địa chỉ
  if (document.getElementById('addressGridContainer')) {
    initAddressesPage();
  }

  // 4.3. Màn hình Đổi mật khẩu
  if (document.getElementById('changePasswordForm')) {
    initChangePasswordPage();
  }
});

/* ==========================================================================
   MODULE 1: HỒ SƠ CÁ NHÂN (PROFILE)
   ========================================================================== */
async function initProfilePage() {
  accountState.profile = JSON.parse(JSON.stringify(ACCOUNT_CONFIG.mockProfile));

  // Tải dữ liệu từ backend nếu có
  try {
    const res = await fetch(ACCOUNT_CONFIG.endpoints.getProfile, { credentials: 'same-origin' });
    if (res.ok) {
      accountState.profile = await res.json();
    }
  } catch (e) {
    console.info('[LIGHT LIFE] Dùng dữ liệu demo hồ sơ khách hàng.');
  }

  // Điền vào form
  const nameInput = document.getElementById('profileFullName');
  const emailInput = document.getElementById('profileEmail');
  const phoneInput = document.getElementById('profilePhone');
  const verifiedBadge = document.getElementById('emailVerifiedBadge');

  if (nameInput) nameInput.value = accountState.profile.fullName || '';
  if (emailInput) emailInput.value = accountState.profile.email || '';
  if (phoneInput) phoneInput.value = accountState.profile.phone || '';

  if (verifiedBadge) {
    if (accountState.profile.emailVerified) {
      verifiedBadge.className = 'll-verified-badge ll-verified-badge--success';
      verifiedBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> Đã xác minh';
    } else {
      verifiedBadge.className = 'll-verified-badge ll-verified-badge--warning';
      verifiedBadge.innerHTML = '<i class="fa-solid fa-clock"></i> Chưa xác minh';
    }
  }

  // Bắt sự kiện submit lưu hồ sơ
  const form = document.getElementById('profileForm');
  if (form) {
    form.addEventListener('submit', handleSaveProfile);
  }
}

async function handleSaveProfile(e) {
  e.preventDefault();
  const nameInput = document.getElementById('profileFullName');
  const phoneInput = document.getElementById('profilePhone');
  const submitBtn = document.getElementById('profileSubmitBtn');

  const fullName = nameInput ? nameInput.value.trim() : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';

  if (!fullName) {
    showAccountToast('Vui lòng nhập họ và tên của bạn!', 'error');
    if (nameInput) nameInput.focus();
    return;
  }

  if (!phone || !/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(phone.replace(/\s+/g, ''))) {
    showAccountToast('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam 10 chữ số!', 'error');
    if (phoneInput) phoneInput.focus();
    return;
  }

  // Hiển thị trạng thái loading
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
  }

  try {
    const res = await fetch(ACCOUNT_CONFIG.endpoints.updateProfile, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, phone }),
      credentials: 'same-origin'
    });
  } catch (e) {
    console.info('[LIGHT LIFE] Cập nhật demo hồ sơ.');
  }

  setTimeout(() => {
    accountState.profile.fullName = fullName;
    accountState.profile.phone = phone;

    // Cập nhật tên trên sidebar & header nếu có
    const sidebarName = document.getElementById('accountUserName');
    if (sidebarName) sidebarName.textContent = fullName;
    const headerName = document.getElementById('llUserName');
    if (headerName) headerName.textContent = fullName;

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Lưu thay đổi';
    }

    showAccountToast('Cập nhật thông tin hồ sơ thành công!', 'success');
  }, 600);
}

/* ==========================================================================
   MODULE 2: SỔ ĐỊA CHỈ NHẬN HÀNG (ADDRESSES)
   ========================================================================== */
async function initAddressesPage() {
  accountState.addresses = JSON.parse(JSON.stringify(ACCOUNT_CONFIG.mockAddresses));

  try {
    const res = await fetch(ACCOUNT_CONFIG.endpoints.getAddresses, { credentials: 'same-origin' });
    if (res.ok) {
      accountState.addresses = await res.json();
    }
  } catch (e) {
    console.info('[LIGHT LIFE] Dùng dữ liệu demo sổ địa chỉ.');
  }

  renderAddressList();
  setupAddressModalEvents();
}

// Render danh sách thẻ địa chỉ
function renderAddressList() {
  const container = document.getElementById('addressGridContainer');
  const emptyState = document.getElementById('addressEmptyState');
  if (!container) return;

  if (accountState.addresses.length === 0) {
    container.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  container.style.display = 'grid';

  container.innerHTML = accountState.addresses.map(addr => `
    <article class="ll-address-card ${addr.isDefault ? 'is-default' : ''}" data-address-id="${addr.id}">
      <div>
        <div class="ll-address-card__header">
          <div>
            <h3 class="ll-address-card__name">${addr.recipientName}</h3>
            <div class="ll-address-card__phone"><i class="fa-solid fa-phone me-1"></i> ${addr.phone}</div>
          </div>
          ${addr.isDefault ? '<span class="ll-badge-default"><i class="fa-solid fa-check"></i> Mặc định</span>' : ''}
        </div>
        <div class="ll-address-card__body">
          <p style="margin: 0;">${addr.detailAddress}</p>
          <p style="margin: 0.25rem 0 0 0; color: var(--color-text-sub); font-size: 0.8125rem;">
            ${addr.ward}, ${addr.district}, ${addr.province}
          </p>
        </div>
      </div>
      <div class="ll-address-card__actions">
        <div>
          ${!addr.isDefault ? `
            <button type="button" class="ll-address-action-btn ll-address-action-btn--set-default" onclick="handleSetDefaultAddress(${addr.id})">
              <i class="fa-regular fa-star"></i> Thiết lập mặc định
            </button>
          ` : '<span style="font-size: 0.8125rem; color: var(--color-success); font-weight: 600;"><i class="fa-solid fa-circle-check"></i> Địa chỉ giao hàng chính</span>'}
        </div>
        <div style="display: flex; gap: 0.25rem;">
          <button type="button" class="ll-address-action-btn" onclick="openEditAddressModal(${addr.id})">
            <i class="fa-solid fa-pen-to-square"></i> Sửa
          </button>
          ${!addr.isDefault ? `
            <button type="button" class="ll-address-action-btn ll-address-action-btn--delete" onclick="openDeleteAddressConfirm(${addr.id})">
              <i class="fa-regular fa-trash-can"></i> Xóa
            </button>
          ` : ''}
        </div>
      </div>
    </article>
  `).join('');
}

// Mở Modal Thêm mới Địa chỉ
function openAddAddressModal() {
  accountState.editingAddressId = null;
  const modal = document.getElementById('addressModal');
  const title = document.getElementById('addressModalTitle');
  const form = document.getElementById('addressForm');

  if (title) title.textContent = 'Thêm địa chỉ nhận hàng mới';
  if (form) form.reset();

  const isDefaultCheck = document.getElementById('addrIsDefault');
  if (isDefaultCheck) {
    // Nếu chưa có địa chỉ nào, tự tick mặc định
    isDefaultCheck.checked = accountState.addresses.length === 0;
  }

  if (modal) modal.classList.add('show');
}

// Mở Modal Sửa Địa chỉ
function openEditAddressModal(id) {
  const addr = accountState.addresses.find(a => a.id === id);
  if (!addr) return;

  accountState.editingAddressId = id;
  const modal = document.getElementById('addressModal');
  const title = document.getElementById('addressModalTitle');

  if (title) title.textContent = 'Chỉnh sửa địa chỉ nhận hàng';

  const nameInput = document.getElementById('addrRecipientName');
  const phoneInput = document.getElementById('addrPhone');
  const provinceInput = document.getElementById('addrProvince');
  const districtInput = document.getElementById('addrDistrict');
  const wardInput = document.getElementById('addrWard');
  const detailInput = document.getElementById('addrDetail');
  const defaultCheck = document.getElementById('addrIsDefault');

  if (nameInput) nameInput.value = addr.recipientName;
  if (phoneInput) phoneInput.value = addr.phone;
  if (provinceInput) provinceInput.value = addr.province;
  if (districtInput) districtInput.value = addr.district;
  if (wardInput) wardInput.value = addr.ward;
  if (detailInput) detailInput.value = addr.detailAddress;
  if (defaultCheck) defaultCheck.checked = addr.isDefault;

  if (modal) modal.classList.add('show');
}

function closeAddressModal() {
  const modal = document.getElementById('addressModal');
  if (modal) modal.classList.remove('show');
}

// Lưu địa chỉ (Thêm hoặc Cập nhật)
async function handleSaveAddress(e) {
  e.preventDefault();

  const recipientName = document.getElementById('addrRecipientName').value.trim();
  const phone = document.getElementById('addrPhone').value.trim();
  const province = document.getElementById('addrProvince').value.trim();
  const district = document.getElementById('addrDistrict').value.trim();
  const ward = document.getElementById('addrWard').value.trim();
  const detailAddress = document.getElementById('addrDetail').value.trim();
  const isDefault = document.getElementById('addrIsDefault').checked;

  if (!recipientName || !phone || !province || !district || !ward || !detailAddress) {
    showAccountToast('Vui lòng điền đầy đủ các thông tin bắt buộc!', 'error');
    return;
  }

  const submitBtn = document.getElementById('saveAddressBtn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
  }

  setTimeout(() => {
    if (isDefault) {
      // Bỏ mặc định các địa chỉ cũ
      accountState.addresses.forEach(a => a.isDefault = false);
    }

    if (accountState.editingAddressId) {
      // Cập nhật
      const index = accountState.addresses.findIndex(a => a.id === accountState.editingAddressId);
      if (index !== -1) {
        accountState.addresses[index] = {
          id: accountState.editingAddressId,
          recipientName, phone, province, district, ward, detailAddress, isDefault
        };
      }
      showAccountToast('Đã cập nhật thông tin địa chỉ!', 'success');
    } else {
      // Thêm mới
      const newId = Date.now();
      accountState.addresses.unshift({
        id: newId,
        recipientName, phone, province, district, ward, detailAddress,
        isDefault: isDefault || accountState.addresses.length === 0
      });
      showAccountToast('Đã thêm địa chỉ mới vào sổ địa chỉ!', 'success');
    }

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Lưu địa chỉ';
    }

    closeAddressModal();
    renderAddressList();
  }, 450);
}

// Thiết lập địa chỉ mặc định
function handleSetDefaultAddress(id) {
  accountState.addresses.forEach(a => {
    a.isDefault = (a.id === id);
  });
  renderAddressList();
  showAccountToast('Đã đặt làm địa chỉ giao hàng mặc định!', 'success');
}

// Xác nhận Xóa địa chỉ
function openDeleteAddressConfirm(id) {
  accountState.deletingAddressId = id;
  const modal = document.getElementById('deleteAddressModal');
  if (modal) modal.classList.add('show');
}

function closeDeleteAddressConfirm() {
  accountState.deletingAddressId = null;
  const modal = document.getElementById('deleteAddressModal');
  if (modal) modal.classList.remove('show');
}

function handleConfirmDeleteAddress() {
  if (!accountState.deletingAddressId) return;

  accountState.addresses = accountState.addresses.filter(a => a.id !== accountState.deletingAddressId);
  closeDeleteAddressConfirm();
  renderAddressList();
  showAccountToast('Đã xóa địa chỉ khỏi sổ địa chỉ!', 'success');
}

function setupAddressModalEvents() {
  const form = document.getElementById('addressForm');
  if (form) form.addEventListener('submit', handleSaveAddress);

  window.addEventListener('click', (e) => {
    const addrModal = document.getElementById('addressModal');
    if (addrModal && e.target === addrModal) closeAddressModal();

    const delModal = document.getElementById('deleteAddressModal');
    if (delModal && e.target === delModal) closeDeleteAddressConfirm();
  });
}

/* ==========================================================================
   MODULE 3: ĐỔI MẬT KHẨU (CHANGE PASSWORD)
   ========================================================================== */
function initChangePasswordPage() {
  const form = document.getElementById('changePasswordForm');
  if (!form) return;

  // Toggle ẩn/hiện mật khẩu
  document.querySelectorAll('.ll-password-toggle-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const targetId = this.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (!input) return;

      if (input.type === 'password') {
        input.type = 'text';
        this.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
        this.setAttribute('aria-label', 'Ẩn mật khẩu');
      } else {
        input.type = 'password';
        this.innerHTML = '<i class="fa-solid fa-eye"></i>';
        this.setAttribute('aria-label', 'Hiện mật khẩu');
      }
    });
  });

  // Kiểm tra độ mạnh realtime khi gõ mật khẩu mới
  const newPassInput = document.getElementById('newPassword');
  if (newPassInput) {
    newPassInput.addEventListener('input', validatePasswordStrength);
  }

  form.addEventListener('submit', handleSavePassword);
}

function validatePasswordStrength() {
  const pass = document.getElementById('newPassword').value;
  const ruleLen = document.getElementById('ruleLength');
  const ruleMix = document.getElementById('ruleLetterNumber');

  const isLenValid = pass.length >= 8;
  const isMixValid = /[a-zA-Z]/.test(pass) && /[0-9]/.test(pass);

  if (ruleLen) {
    ruleLen.className = `ll-password-hint-item ${isLenValid ? 'valid' : ''}`;
    ruleLen.querySelector('i').className = `fa-solid ${isLenValid ? 'fa-check' : 'fa-circle-notch'}`;
  }

  if (ruleMix) {
    ruleMix.className = `ll-password-hint-item ${isMixValid ? 'valid' : ''}`;
    ruleMix.querySelector('i').className = `fa-solid ${isMixValid ? 'fa-check' : 'fa-circle-notch'}`;
  }

  return isLenValid && isMixValid;
}

async function handleSavePassword(e) {
  e.preventDefault();

  const currentPass = document.getElementById('currentPassword').value;
  const newPass = document.getElementById('newPassword').value;
  const confirmPass = document.getElementById('confirmPassword').value;
  const submitBtn = document.getElementById('changePassSubmitBtn');

  const currError = document.getElementById('currentPassError');
  const newError = document.getElementById('newPassError');
  const confirmError = document.getElementById('confirmPassError');

  // Reset lỗi
  [currError, newError, confirmError].forEach(err => {
    if (err) {
      err.textContent = '';
      err.classList.remove('show');
    }
  });

  let hasError = false;

  if (!currentPass) {
    if (currError) {
      currError.textContent = 'Vui lòng nhập mật khẩu hiện tại!';
      currError.classList.add('show');
    }
    hasError = true;
  }

  if (!validatePasswordStrength()) {
    if (newError) {
      newError.textContent = 'Mật khẩu mới phải có tối thiểu 8 ký tự, bao gồm cả chữ và số!';
      newError.classList.add('show');
    }
    hasError = true;
  }

  if (newPass === currentPass && currentPass !== '') {
    if (newError) {
      newError.textContent = 'Mật khẩu mới không được trùng với mật khẩu hiện tại!';
      newError.classList.add('show');
    }
    hasError = true;
  }

  if (newPass !== confirmPass) {
    if (confirmError) {
      confirmError.textContent = 'Xác nhận mật khẩu không khớp với mật khẩu mới!';
      confirmError.classList.add('show');
    }
    hasError = true;
  }

  if (hasError) return;

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';
  }

  try {
    const res = await fetch(ACCOUNT_CONFIG.endpoints.changePassword, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }),
      credentials: 'same-origin'
    });
  } catch (err) {
    console.info('[LIGHT LIFE] Đổi mật khẩu giả lập thành công trên demo.');
  }

  setTimeout(() => {
    document.getElementById('changePasswordForm').reset();
    validatePasswordStrength();

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-key"></i> Đổi mật khẩu';
    }

    showAccountToast('Đổi mật khẩu thành công! Tài khoản của bạn đã được bảo vệ.', 'success');

    // Mở thông báo gợi ý nếu hệ thống yêu cầu đăng nhập lại
    const reloginModal = document.getElementById('reloginNoticeModal');
    if (reloginModal) {
      reloginModal.classList.add('show');
    }
  }, 700);
}

