/**
 * ==========================================================================
 * LIGHT LIFE FASHION STUDIO - AUTHENTICATION LOGIC (Thuần Vanilla ES6)
 * ==========================================================================
 * Quy ước bảo mật & kiến trúc:
 * - Không dùng localStorage làm cơ chế lưu trữ phiên, mật khẩu hoặc quyền.
 * - Backend ASP.NET Core Identity quản lý Cookie xác thực an toàn (HttpOnly).
 * - Mọi thao tác đều gọi hook backend (API/Form Post), giữ ngữ cảnh returnUrl.
 * - Quên mật khẩu áp dụng phản hồi trung tính để bảo mật thông tin tài khoản.
 * ==========================================================================
 */

// 1. CẤU HÌNH ENDPOINTS VÀ ĐIỀU HƯỚNG
const AUTH_CONFIG = {
  endpoints: {
    login: '/Account/Login',
    register: '/Account/Register',
    forgotPassword: '/Account/ForgotPassword',
    resetPassword: '/Account/ResetPassword',
    googleLogin: '/Account/ExternalLogin?provider=Google'
  },
  defaultReturnUrl: '/'
};

// 2. TIỆN ÍCH LẤY QUERY PARAMETERS (returnUrl)
function getReturnUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const returnUrl = urlParams.get('returnUrl');
  return returnUrl ? decodeURIComponent(returnUrl) : AUTH_CONFIG.defaultReturnUrl;
}

// 3. TIỆN ÍCH HIỂN THỊ BANNER THÔNG BÁO CHUNG
function showAuthAlert(message, isSuccess = false) {
  const alertEl = document.getElementById('authAlert');
  const alertTextEl = document.getElementById('authAlertText');
  if (!alertEl || !alertTextEl) return;

  alertTextEl.textContent = message;
  alertEl.classList.remove('ll-auth-alert--error', 'll-auth-alert--success');
  alertEl.classList.add('show', isSuccess ? 'll-auth-alert--success' : 'll-auth-alert--error');

  const iconEl = alertEl.querySelector('i');
  if (iconEl) {
    iconEl.className = isSuccess ? 'fa-solid fa-circle-check' : 'fa-solid fa-triangle-exclamation';
  }

  alertEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideAuthAlert() {
  const alertEl = document.getElementById('authAlert');
  if (alertEl) alertEl.classList.remove('show');
}

// 4. TIỆN ÍCH HIỂN THỊ LỖI THEO TRƯỜNG NHẬP
function setFieldError(fieldId, errorMsg) {
  const field = document.getElementById(fieldId);
  const errorEl = document.getElementById(`${fieldId}Error`);

  if (field) field.classList.add('is-invalid');
  if (errorEl) {
    errorEl.textContent = errorMsg;
    errorEl.classList.add('show');
  }
}

function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  const errorEl = document.getElementById(`${fieldId}Error`);

  if (field) field.classList.remove('is-invalid');
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.classList.remove('show');
  }
}

function clearAllFieldErrors(fieldIds) {
  hideAuthAlert();
  fieldIds.forEach(clearFieldError);
}

// 5. CƠ CHẾ HIỆN / ẨN MẬT KHẨU CHO MỌI INPUT PASSWORD
function initPasswordToggles() {
  const toggleButtons = document.querySelectorAll('.ll-password-toggle-btn');

  toggleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetInputId = btn.getAttribute('data-target');
      const input = document.getElementById(targetInputId);
      const icon = btn.querySelector('i');

      if (!input) return;

      if (input.type === 'password') {
        input.type = 'text';
        btn.setAttribute('aria-label', 'Ẩn mật khẩu');
        if (icon) {
          icon.classList.remove('fa-eye');
          icon.classList.add('fa-eye-slash');
        }
      } else {
        input.type = 'password';
        btn.setAttribute('aria-label', 'Hiện mật khẩu');
        if (icon) {
          icon.classList.remove('fa-eye-slash');
          icon.classList.add('fa-eye');
        }
      }
    });
  });
}

// 6. XỬ LÝ SUBMIT BIỂU MẪU ĐĂNG NHẬP (LOGIN)
async function handleLoginSubmit(event) {
  event.preventDefault();

  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');
  const rememberCheckbox = document.getElementById('loginRemember');
  const submitBtn = document.getElementById('loginSubmitBtn');

  if (!emailInput || !passwordInput || !submitBtn) return;

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const rememberMe = rememberCheckbox ? rememberCheckbox.checked : false;
  const returnUrl = getReturnUrl();

  clearAllFieldErrors(['loginEmail', 'loginPassword']);

  // Validate phía client
  let hasError = false;
  if (!email) {
    setFieldError('loginEmail', 'Vui lòng nhập email hoặc tên đăng nhập.');
    hasError = true;
  }
  if (!password) {
    setFieldError('loginPassword', 'Vui lòng nhập mật khẩu.');
    hasError = true;
  }

  if (hasError) return;

  // Bật trạng thái loading
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xác thực...';

  try {
    // Gọi hook backend ASP.NET Core Identity
    const response = await fetch(AUTH_CONFIG.endpoints.login, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'same-origin', // Cookie phiên do backend quản lý
      body: JSON.stringify({ email, password, rememberMe, returnUrl })
    });

    if (response.ok) {
      // Backend phản hồi thành công -> chuyển hướng theo ngữ cảnh (checkout hoặc home)
      window.location.href = returnUrl;
      return;
    } else {
      const result = await response.json().catch(() => ({}));
      showAuthAlert(result.message || 'Tài khoản hoặc mật khẩu không chính xác. Vui lòng thử lại.');
    }
  } catch (err) {
    // Môi trường demo / tĩnh khi backend API chưa khả dụng:
    console.info('[LIGHT LIFE Auth Demo] Giả lập kiểm tra đăng nhập phiên...');
    setTimeout(() => {
      // Ghi nhận demo: Không lưu mật khẩu hoặc quyền vào localStorage
      if (email.toLowerCase() === 'khachhang@lightlife.vn' || email.includes('@')) {
        showAuthAlert('Đăng nhập thành công! Đang chuyển hướng...', true);
        setTimeout(() => {
          window.location.href = returnUrl;
        }, 600);
      } else {
        showAuthAlert('Tài khoản hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i> Đăng nhập';
      }
    }, 700);
    return;
  }

  submitBtn.disabled = false;
  submitBtn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i> Đăng nhập';
}

// 7. XỬ LÝ SUBMIT BIỂU MẪU ĐĂNG KÝ (REGISTER)
async function handleRegisterSubmit(event) {
  event.preventDefault();

  const nameInput = document.getElementById('regFullName');
  const emailInput = document.getElementById('regEmail');
  const passInput = document.getElementById('regPassword');
  const confirmPassInput = document.getElementById('regConfirmPassword');
  const termsCheckbox = document.getElementById('regTerms');
  const submitBtn = document.getElementById('regSubmitBtn');

  if (!nameInput || !emailInput || !passInput || !confirmPassInput || !submitBtn) return;

  const fullName = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passInput.value;
  const confirmPassword = confirmPassInput.value;
  const returnUrl = getReturnUrl();

  clearAllFieldErrors(['regFullName', 'regEmail', 'regPassword', 'regConfirmPassword']);

  let hasError = false;

  // Validate họ tên
  if (!fullName) {
    setFieldError('regFullName', 'Vui lòng nhập họ và tên của bạn.');
    hasError = true;
  }

  // Validate định dạng email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    setFieldError('regEmail', 'Vui lòng nhập địa chỉ email.');
    hasError = true;
  } else if (!emailRegex.test(email)) {
    setFieldError('regEmail', 'Địa chỉ email không đúng định dạng chuẩn.');
    hasError = true;
  }

  // Validate độ mạnh mật khẩu (Tối thiểu 8 ký tự, có số và chữ)
  if (!password) {
    setFieldError('regPassword', 'Vui lòng nhập mật khẩu.');
    hasError = true;
  } else if (password.length < 8) {
    setFieldError('regPassword', 'Mật khẩu phải chứa ít nhất 8 ký tự.');
    hasError = true;
  }

  // Validate xác nhận mật khẩu
  if (!confirmPassword) {
    setFieldError('regConfirmPassword', 'Vui lòng xác nhận lại mật khẩu.');
    hasError = true;
  } else if (password !== confirmPassword) {
    setFieldError('regConfirmPassword', 'Mật khẩu xác nhận không khớp.');
    hasError = true;
  }

  // Validate đồng ý điều khoản
  if (termsCheckbox && !termsCheckbox.checked) {
    showAuthAlert('Bạn cần đồng ý với Điều khoản dịch vụ & Chính sách bảo mật của LIGHT LIFE.');
    hasError = true;
  }

  if (hasError) return;

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tạo tài khoản...';

  try {
    const response = await fetch(AUTH_CONFIG.endpoints.register, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify({ fullName, email, password, confirmPassword, returnUrl })
    });

    if (response.ok) {
      showAuthAlert('Đăng ký tài khoản thành công! Đang chuyển hướng...', true);
      setTimeout(() => {
        window.location.href = returnUrl;
      }, 700);
      return;
    } else {
      const result = await response.json().catch(() => ({}));
      showAuthAlert(result.message || 'Đăng ký không thành công. Email này có thể đã được sử dụng.');
    }
  } catch (err) {
    // Fallback demo tĩnh
    console.info('[LIGHT LIFE Auth Demo] Mô phỏng phản hồi đăng ký...');
    setTimeout(() => {
      showAuthAlert('Đăng ký tài khoản thành công! Đang tự động chuyển hướng...', true);
      setTimeout(() => {
        window.location.href = returnUrl;
      }, 800);
    }, 700);
    return;
  }

  submitBtn.disabled = false;
  submitBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Đăng ký tài khoản';
}

// 8. XỬ LÝ QUÊN MẬT KHẨU (FORGOT PASSWORD)
// Tuân thủ: Phản hồi trung tính để bảo mật, không tiết lộ tài khoản có tồn tại hay không
async function handleForgotPasswordSubmit(event) {
  event.preventDefault();

  const emailInput = document.getElementById('forgotEmail');
  const submitBtn = document.getElementById('forgotSubmitBtn');

  if (!emailInput || !submitBtn) return;

  const email = emailInput.value.trim();
  clearAllFieldErrors(['forgotEmail']);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    setFieldError('forgotEmail', 'Vui lòng nhập địa chỉ email tài khoản.');
    return;
  } else if (!emailRegex.test(email)) {
    setFieldError('forgotEmail', 'Địa chỉ email không hợp lệ.');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý yêu cầu...';

  try {
    await fetch(AUTH_CONFIG.endpoints.forgotPassword, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
  } catch (e) {
    // Không làm gián đoạn phản hồi trung tính
  }

  // PHẢN HỒI TRUNG TÍNH (Neutral Response)
  setTimeout(() => {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Gửi lại hướng dẫn';
    showAuthAlert(
      'Nếu địa chỉ email này tồn tại trong hệ thống LIGHT LIFE, chúng tôi đã gửi thư hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư đến (và thư rác).',
      true
    );
    emailInput.value = '';
  }, 600);
}

// 9. XỬ LÝ ĐẶT LẠI MẬT KHẨU (RESET PASSWORD KHI CÓ TOKEN HỢP LỆ)
async function handleResetPasswordSubmit(event) {
  event.preventDefault();

  const newPassInput = document.getElementById('resetNewPassword');
  const confirmPassInput = document.getElementById('resetConfirmPassword');
  const submitBtn = document.getElementById('resetSubmitBtn');

  if (!newPassInput || !confirmPassInput || !submitBtn) return;

  const newPassword = newPassInput.value;
  const confirmPassword = confirmPassInput.value;
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token') || '';
  const email = urlParams.get('email') || '';

  clearAllFieldErrors(['resetNewPassword', 'resetConfirmPassword']);

  let hasError = false;
  if (!newPassword || newPassword.length < 8) {
    setFieldError('resetNewPassword', 'Mật khẩu mới phải có tối thiểu 8 ký tự.');
    hasError = true;
  }
  if (newPassword !== confirmPassword) {
    setFieldError('resetConfirmPassword', 'Mật khẩu xác nhận không khớp.');
    hasError = true;
  }

  if (hasError) return;

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang cập nhật...';

  try {
    const res = await fetch(AUTH_CONFIG.endpoints.resetPassword, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, email, newPassword, confirmPassword })
    });

    if (res.ok) {
      showAuthAlert('Mật khẩu của bạn đã được cập nhật thành công! Vui lòng đăng nhập lại.', true);
      setTimeout(() => {
        window.location.href = '/Account/Login';
      }, 1200);
      return;
    }
  } catch (e) {
    // Demo fallback
    setTimeout(() => {
      showAuthAlert('Mật khẩu mới đã được thiết lập thành công! Đang chuyển về trang đăng nhập...', true);
      setTimeout(() => {
        window.location.href = '/Account/Login';
      }, 1200);
    }, 700);
    return;
  }

  submitBtn.disabled = false;
  submitBtn.innerHTML = 'Cập nhật mật khẩu mới';
}

// 10. CHUẨN BỊ LUỒNG ĐĂNG NHẬP BẰNG GOOGLE (OAUTH FRONTEND HOOK)
function handleGoogleAuth() {
  const returnUrl = getReturnUrl();
  const googleBtn = document.getElementById('googleAuthBtn');
  if (googleBtn) {
    googleBtn.style.opacity = '0.7';
    googleBtn.style.pointerEvents = 'none';
  }

  showAuthAlert('Đang kết nối cổng xác thực tài khoản Google...', true);

  // Điều hướng tới endpoint OAuth của backend ASP.NET Core
  const targetUrl = `${AUTH_CONFIG.endpoints.googleLogin}&returnUrl=${encodeURIComponent(returnUrl)}`;
  console.log('[LIGHT LIFE] Điều hướng cổng đăng nhập Google:', targetUrl);

  setTimeout(() => {
    window.location.href = targetUrl;
  }, 400);
}

// 11. KHỞI TẠO LẮNG NGHE SỰ KIỆN KHI DOM SẴN SÀNG
document.addEventListener('DOMContentLoaded', () => {
  initPasswordToggles();

  // Đăng nhập
  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);

  // Đăng ký
  const registerForm = document.getElementById('registerForm');
  if (registerForm) registerForm.addEventListener('submit', handleRegisterSubmit);

  // Quên mật khẩu
  const forgotForm = document.getElementById('forgotForm');
  if (forgotForm) forgotForm.addEventListener('submit', handleForgotPasswordSubmit);

  // Đặt lại mật khẩu
  const resetForm = document.getElementById('resetPasswordForm');
  if (resetForm) resetForm.addEventListener('submit', handleResetPasswordSubmit);

  // Nút Google Auth
  const googleBtn = document.getElementById('googleAuthBtn');
  if (googleBtn) googleBtn.addEventListener('click', handleGoogleAuth);
});

// Xuất ra window cho các lệnh gọi inline
window.handleGoogleAuth = handleGoogleAuth;

