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
    setDefaultAddress: '/api/customer/addresses/',
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

  mockAddresses: []
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
   MODULE 2: SỔ ĐỊA CHỈ NHẬN HÀNG (ADDRESSES) - ĐÃ KẾT NỐI DATABASE & OPEN API
   ========================================================================== */

// 2.1. Khởi tạo trang Sổ địa chỉ
async function initAddressesPage() {
    accountState.addresses = [];

    // Nạp danh mục Tỉnh/TP từ API hành chính
    await initAdministrativeApi();

    // Tải danh sách địa chỉ từ SQL Server qua API C#
    await reloadAddressesFromServer();

    // Đăng ký sự kiện Submit Form & Click ngoài Modal
    setupAddressModalEvents();
}

// 2.2. Hàm tải dữ liệu thực tế từ Database
async function reloadAddressesFromServer() {
    try {
        const res = await fetch(ACCOUNT_CONFIG.endpoints.getAddresses, {
            credentials: 'same-origin'
        });

        if (res.ok) {
            accountState.addresses = await res.json();
        } else {
            accountState.addresses = [];
        }
    } catch (e) {
        console.warn('[LIGHT LIFE] Không kết nối được API địa chỉ, danh sách rỗng.');
        accountState.addresses = [];
    }

    renderAddressList();
}

// 2.3. Hiển thị danh sách thẻ địa chỉ hoặc Empty State
function renderAddressList() {
    const container = document.getElementById('addressGridContainer');
    const emptyState = document.getElementById('addressEmptyState');
    if (!container) return;

    // Nếu rỗng -> Hiển thị Empty State
    if (!accountState.addresses || accountState.addresses.length === 0) {
        container.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    container.style.display = 'grid';

    container.innerHTML = accountState.addresses.map(addr => {
        // Ghép chuỗi: Nếu không có quận/huyện thì không bị dư dấu phẩy
        const districtPart = addr.district ? `, ${addr.district}` : '';
        const fullAddress = `${addr.detailAddress}, ${addr.ward}${districtPart}, ${addr.province}`;

        return `
      <article class="ll-address-card ${addr.isDefault ? 'is-default' : ''}" data-address-id="${addr.id}">
        <div>
          <div class="ll-address-card__header">
            <div>
              <h3 class="ll-address-card__name">${escapeHtml(addr.receiverName || addr.recipientName)}</h3>
              <div class="ll-address-card__phone"><i class="fa-solid fa-phone me-1"></i> ${escapeHtml(addr.phone)}</div>
            </div>
            ${addr.isDefault ? '<span class="ll-badge-default"><i class="fa-solid fa-check"></i> Mặc định</span>' : ''}
          </div>
          <div class="ll-address-card__body">
              <p style="margin: 0; font-size: 0.875rem; color: #333; line-height: 1.5; font-weight: 500;">
                <i class="fa-solid fa-location-dot" style="color: var(--color-brand, #5c1d24); margin-right: 6px;"></i>
                ${escapeHtml(addr.addressLine || `${addr.detailAddress || ''}, ${addr.ward || ''}, ${addr.province || ''}`)}
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
    `;
    }).join('');
}

// 2.4. Tích hợp Open API Hành chính 2 cấp (Tỉnh/TP -> Phường/Xã)
let administrativeProvinces = [];

async function initAdministrativeApi() {
    const provinceSelect = document.getElementById('addrProvince');
    const wardSelect = document.getElementById('addrWard');
    if (!provinceSelect || !wardSelect) return;

    try {
        const res = await fetch('https://provinces.open-api.vn/api/v2/p/');
        if (!res.ok) return;
        administrativeProvinces = await res.json();

        // Nạp Tỉnh/TP vào dropdown
        provinceSelect.innerHTML = '<option value="">-- Chọn Tỉnh / TP --</option>';
        administrativeProvinces.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.name;
            opt.dataset.code = p.code;
            opt.textContent = p.name;
            provinceSelect.appendChild(opt);
        });

        // Khi thay đổi Tỉnh -> Nạp Xã/Phường tương ứng
        provinceSelect.addEventListener('change', async function () {
            await loadWardsByProvince(this.value);
        });
    } catch (e) {
        console.warn('[LIGHT LIFE] Không tải được danh mục hành chính từ Open API.', e);
    }
}

// Hàm phụ trợ tải xã/phường theo Tỉnh
async function loadWardsByProvince(provinceName, selectedWard = '') {
    const wardSelect = document.getElementById('addrWard');
    if (!wardSelect) return;

    const provinceObj = administrativeProvinces.find(p => p.name === provinceName);
    wardSelect.innerHTML = '<option value="">-- Chọn Phường / Xã --</option>';
    wardSelect.disabled = true;

    if (!provinceObj) return;

    try {
        wardSelect.innerHTML = '<option value="">Đang tải danh sách xã/phường...</option>';
        const res = await fetch(`https://provinces.open-api.vn/api/v2/p/${provinceObj.code}?depth=2`);
        const data = await res.json();

        wardSelect.innerHTML = '<option value="">-- Chọn Phường / Xã --</option>';
        if (data.wards && data.wards.length > 0) {
            data.wards.forEach(w => {
                const opt = document.createElement('option');
                opt.value = w.name;
                opt.textContent = w.name;
                if (selectedWard && w.name === selectedWard) opt.selected = true;
                wardSelect.appendChild(opt);
            });
            wardSelect.disabled = false;
        }
    } catch (e) {
        wardSelect.disabled = false;
        wardSelect.innerHTML = '<option value="">-- Vui lòng chọn hoặc nhập --</option>';
    }
}

// 2.5. Mở Modal Thêm mới
function openAddAddressModal() {
    accountState.editingAddressId = null;
    const modal = document.getElementById('addressModal');
    const title = document.getElementById('addressModalTitle');
    const form = document.getElementById('addressForm');

    if (title) title.textContent = 'Thêm địa chỉ nhận hàng mới';
    if (form) form.reset();

    const wardSelect = document.getElementById('addrWard');
    if (wardSelect) {
        wardSelect.innerHTML = '<option value="">-- Chọn Phường / Xã --</option>';
        wardSelect.disabled = true;
    }

    const isDefaultCheck = document.getElementById('addrIsDefault');
    if (isDefaultCheck) {
        // Nếu chưa có địa chỉ nào thì tự động tick Mặc định
        isDefaultCheck.checked = accountState.addresses.length === 0;
    }

    if (modal) modal.classList.add('show');
}

// 2.6. Mở Modal Sửa
async function openEditAddressModal(id) {
    const addr = accountState.addresses.find(a => a.id === id);
    if (!addr) return;

    accountState.editingAddressId = id;
    const modal = document.getElementById('addressModal');
    const title = document.getElementById('addressModalTitle');

    if (title) title.textContent = 'Chỉnh sửa địa chỉ nhận hàng';

    const nameInput = document.getElementById('addrRecipientName');
    const phoneInput = document.getElementById('addrPhone');
    const provinceSelect = document.getElementById('addrProvince');
    const districtInput = document.getElementById('addrDistrict');
    const detailInput = document.getElementById('addrDetail');
    const defaultCheck = document.getElementById('addrIsDefault');

    if (nameInput) nameInput.value = addr.recipientName;
    if (phoneInput) phoneInput.value = addr.phone;
    if (provinceSelect) provinceSelect.value = addr.province;
    if (districtInput) districtInput.value = addr.district || '';
    if (detailInput) detailInput.value = addr.detailAddress;
    if (defaultCheck) defaultCheck.checked = addr.isDefault;

    // Nạp danh sách xã/phường của tỉnh này và chọn sẵn xã hiện tại
    if (addr.province) {
        await loadWardsByProvince(addr.province, addr.ward);
    }

    if (modal) modal.classList.add('show');
}

function closeAddressModal() {
    const modal = document.getElementById('addressModal');
    if (modal) modal.classList.remove('show');
}

// 2.7. Lưu địa chỉ vào SQL Server (POST /api/customer/addresses)
async function handleSaveAddress(e) {
    e.preventDefault();

    const recipientName = document.getElementById('addrRecipientName').value.trim();
    const phone = document.getElementById('addrPhone').value.trim();
    const province = document.getElementById('addrProvince').value.trim();
    const district = document.getElementById('addrDistrict').value.trim(); // Cho phép rỗng
    const ward = document.getElementById('addrWard').value.trim();
    const detailAddress = document.getElementById('addrDetail').value.trim();
    const isDefault = document.getElementById('addrIsDefault').checked;

    // ĐÃ BỎ KIỂM TRA !district (cho phép bỏ trống Quận/Huyện)
    if (!recipientName || !phone || !province || !ward || !detailAddress) {
        showAccountToast('Vui lòng điền đầy đủ các thông tin bắt buộc (*)!', 'error');
        return;
    }

    const submitBtn = document.getElementById('saveAddressBtn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
    }

    const payload = {
        id: accountState.editingAddressId, // null nếu Thêm mới, có số nếu Sửa
        receiverName: recipientName,
        phone,
        province,
        district: district || null,
        ward,
        detailAddress,
        isDefault
    };

    try {
        const res = await fetch(ACCOUNT_CONFIG.endpoints.saveAddress, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'same-origin'
        });

        const result = await res.json();
        if (!res.ok) {
            throw new Error(result.message || 'Lưu địa chỉ thất bại.');
        }

        closeAddressModal();
        await reloadAddressesFromServer(); // Nạp lại danh sách mới nhất từ Database

        showAccountToast(
            accountState.editingAddressId ? 'Đã cập nhật thông tin địa chỉ!' : 'Đã thêm địa chỉ mới vào sổ địa chỉ!',
            'success'
        );
    } catch (err) {
        showAccountToast(err.message || 'Có lỗi xảy ra khi lưu địa chỉ.', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Lưu địa chỉ';
        }
    }
}

// 2.8. Thiết lập địa chỉ mặc định trong SQL Server (PUT /api/customer/addresses/{id}/default)
async function handleSetDefaultAddress(id) {
    try {
        const res = await fetch(`${ACCOUNT_CONFIG.endpoints.setDefaultAddress}${id}/default`, {
            method: 'PUT',
            credentials: 'same-origin'
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Không thể thiết lập địa chỉ mặc định.');
        }

        await reloadAddressesFromServer();
        showAccountToast('Đã đặt làm địa chỉ giao hàng mặc định!', 'success');
    } catch (err) {
        showAccountToast(err.message || 'Lỗi cập nhật địa chỉ mặc định.', 'error');
    }
}

// 2.9. Xóa địa chỉ khỏi SQL Server (DELETE /api/customer/addresses/{id})
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

async function handleConfirmDeleteAddress() {
    if (!accountState.deletingAddressId) return;

    try {
        const res = await fetch(`${ACCOUNT_CONFIG.endpoints.deleteAddress}${accountState.deletingAddressId}`, {
            method: 'DELETE',
            credentials: 'same-origin'
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Không thể xóa địa chỉ.');
        }

        closeDeleteAddressConfirm();
        await reloadAddressesFromServer();
        showAccountToast('Đã xóa địa chỉ khỏi sổ địa chỉ!', 'success');
    } catch (err) {
        showAccountToast(err.message || 'Lỗi khi xóa địa chỉ.', 'error');
    }
}

// 2.10. Bắt sự kiện form và click ngoài đóng modal
function setupAddressModalEvents() {
    const form = document.getElementById('addressForm');
    if (form) {
        // Gỡ event cũ nếu có để tránh submit 2 lần
        form.removeEventListener('submit', handleSaveAddress);
        form.addEventListener('submit', handleSaveAddress);
    }

    window.addEventListener('click', (e) => {
        const addrModal = document.getElementById('addressModal');
        if (addrModal && e.target === addrModal) closeAddressModal();

        const delModal = document.getElementById('deleteAddressModal');
        if (delModal && e.target === delModal) closeDeleteAddressConfirm();
    });
}

// Hàm phụ trợ chống XSS
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
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
  const currentPass = document.getElementById('currentPassword').value;
  const newPass = document.getElementById('newPassword').value;
  const confirmPass = document.getElementById('confirmPassword').value;
  const submitBtn = document.getElementById('changePassSubmitBtn');

  const currError = document.getElementById('currentPassError');
  const newError = document.getElementById('newPassError');
  const confirmError = document.getElementById('confirmPassError');

  // Reset lỗi cũ
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

  // Nếu có lỗi ở Client -> Chặn submit để người dùng sửa ngay
  if (hasError) {
    e.preventDefault();
    return;
  }

  // Nếu hợp lệ -> Cho phép Form POST gửi thẳng về C# Controller!
  if (submitBtn) {
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';
  }
}

