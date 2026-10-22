using fashionstore.Services.Customers;
using fashionstore.Models;
using fashionstore.Models.Entities;
using fashionstore.Models.ViewModels;
using fashionstore.Services.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using fashionstore.Models.Dtos;
namespace fashionstore.Controllers
{
    public class AccountController : Controller
    {
        private readonly IAccountService _accountService;
        private readonly ICustomerAddressService _addressService;
        private readonly ICustomerOrderService _orderService;

        public AccountController(IAccountService accountService, ICustomerAddressService addressService, ICustomerOrderService orderService)
        {
            _accountService = accountService;
            _addressService = addressService;
            _orderService = orderService;
        }
        // ==========================================
        // 1. ĐĂNG NHẬP 
        // ==========================================
        [HttpGet]
        public IActionResult Login(string? returnUrl = null)
        {
            ViewData["Title"] = "Đăng nhập";
            ViewData["ReturnUrl"] = returnUrl ?? "/";
            return View(new LoginViewModel { ReturnUrl = returnUrl ?? "/" });
        }
        // 1b. Xử lý bấm nút Đăng nhập mật khẩu (POST) -> Giao cho AccountService làm!
        [HttpPost]
        public async Task<IActionResult> Login([FromBody] LoginViewModel model)
        {
            if (string.IsNullOrEmpty(model.Email) || string.IsNullOrEmpty(model.Password))
            {
                return BadRequest(new { message = "Vui lòng nhập đầy đủ email và mật khẩu." });
            }
            // Giao cho AccountService kiểm tra Database
            var result = await _accountService.LoginAsync(model.Email, model.Password);

            if (!result.Succeeded || result.User == null)
            {
                // Trả về lỗi dạng JSON để hàm showAuthAlert(...) trong JS hiện thông báo đỏ
                return BadRequest(new { message = result.ErrorMessage });
            }

            // Đăng nhập thành công -> Cấp Cookie phiên
            await SignInUserCookieAsync(result.User, result.RoleName, model.RememberMe);

            // Tính đường dẫn chuyển tiếp theo Role
            string targetUrl = model.ReturnUrl ?? "/";
            if (result.RoleName == "Admin") targetUrl = "/Admin/Dashboard";
            else if (result.RoleName == "Employee") targetUrl = "/Employee/Dashboard";

            // Trả về thành công dạng JSON cho JS
            return Ok(new { success = true, redirectUrl = targetUrl });
        }
        [HttpGet]
        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult ExternalLogin(string? returnUrl = null)
        {
            var redirectUrl = Url.Action(nameof(ExternalLoginCallback), "Account", new { returnUrl });
            var properties = new AuthenticationProperties { RedirectUri = redirectUrl };
            return Challenge(properties, GoogleDefaults.AuthenticationScheme);
        }

        [HttpGet]
        public async Task<IActionResult> ExternalLoginCallback(string? returnUrl = null, string? remoteError = null)
        {
            if (remoteError != null)
            {
                TempData["ErrorMessage"] = $"Lỗi từ Google: {remoteError}";
                return RedirectToAction(nameof(Login), new { returnUrl });
            }

            var authResult = await HttpContext.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            if (!authResult.Succeeded || authResult.Principal == null)
            {
                return RedirectToAction(nameof(Login), new { returnUrl });
            }

            var googleKey = authResult.Principal.FindFirstValue(ClaimTypes.NameIdentifier);
            var email = authResult.Principal.FindFirstValue(ClaimTypes.Email);
            var fullName = authResult.Principal.FindFirstValue(ClaimTypes.Name) ?? email?.Split('@')[0] ?? "Khách hàng";

            if (string.IsNullOrEmpty(googleKey) || string.IsNullOrEmpty(email))
            {
                await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                TempData["ErrorMessage"] = "Không lấy được Email từ tài khoản Google.";
                return RedirectToAction(nameof(Login), new { returnUrl });
            }

            // Giao cho Service kiểm tra hoặc tạo mới User trong Database
            var result = await _accountService.LoginWithGoogleAsync(googleKey, email, fullName);

            if (!result.Succeeded || result.User == null)
            {
                await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                TempData["ErrorMessage"] = result.ErrorMessage;
                return RedirectToAction(nameof(Login), new { returnUrl });
            }

            // Thành công -> Cấp Cookie chính thức và chuyển trang theo Role
            await SignInUserCookieAsync(result.User, result.RoleName, isPersistent: true);
            return RedirectByRole(result.RoleName, returnUrl);
        }
        [HttpGet]
        [HttpPost]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return RedirectToAction("Index", "Home");
        }
        // 1f. API kiểm tra trạng thái đăng nhập cho file lightlife-storefront.js
        [HttpGet("/api/auth/status")]
        public IActionResult GetAuthStatus()
        {
            // Nếu chưa có Cookie đăng nhập -> báo cho JS biết là khách vãng lai
            if (User.Identity == null || !User.Identity.IsAuthenticated)
            {
                return Unauthorized(new { isAuthenticated = false });
            }

            // Nếu đã đăng nhập -> Rút thông tin từ Cookie (Claims) ra
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
            var email = User.FindFirstValue(ClaimTypes.Email) ?? User.Identity.Name ?? "";
            var fullName = User.FindFirstValue("FullName") ?? User.Identity.Name ?? "Khách hàng";
            var role = User.FindFirstValue(ClaimTypes.Role) ?? "Customer";

            // Trả về JSON khớp 100% với câu lệnh if (user && user.fullName) trong JS
            return Ok(new
            {
                isAuthenticated = true,
                id = userId,
                fullName = fullName,
                name = fullName,
                email = email,
                role = role
            });
        }

        // 1g. Hỗ trợ thêm cổng đăng xuất qua API nếu nút Đăng xuất trên Header gọi bằng JS fetch
        [HttpPost("/api/auth/logout")]
        public async Task<IActionResult> ApiLogout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Ok(new { success = true });
        }

        // ==========================================
        // 2. ĐĂNG KÝ TÀI KHOẢN
        // ==========================================
        // 2a. Mở trang Đăng ký (GET)
        [HttpGet]
        public IActionResult Register(string? returnUrl = null)
        {
            ViewData["Title"] = "Đăng ký tài khoản";
            return View(new RegisterRequestDto { ReturnUrl = returnUrl ?? "/" });
        }

        // 2b. Bấm nút Đăng ký (POST thuần từ form Razor)
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Register(RegisterRequestDto model)
        {
            ViewData["Title"] = "Đăng ký tài khoản";

            if (!ModelState.IsValid) return View(model);

            if (model.Password != model.ConfirmPassword)
            {
                ModelState.AddModelError("ConfirmPassword", "Mật khẩu xác nhận không khớp.");
                return View(model);
            }

            // Giao cho Service sinh OTP và gửi email
            var result = await _accountService.RegisterAndSendOtpAsync(model.FullName, model.Email, model.Password);

            if (!result.Succeeded)
            {
                ModelState.AddModelError("", result.ErrorMessage);
                return View(model);
            }

            // Gửi mail xong -> Chuyển hướng sang trang nhập OTP!
            return RedirectToAction(nameof(VerifyOtp), new { email = model.Email, returnUrl = model.ReturnUrl });
        }

        // 2c. Mở trang nhập OTP (GET)
        [HttpGet]
        public IActionResult VerifyOtp(string email, string? returnUrl = null)
        {
            ViewData["Title"] = "Xác thực mã OTP";
            return View(new VerifyOtpRequestDto { Email = email, ReturnUrl = returnUrl ?? "/" });
        }

        // 2d. Bấm nút Xác nhận OTP (POST thuần)
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> VerifyOtp(VerifyOtpRequestDto model)
        {
            ViewData["Title"] = "Xác thực mã OTP";

            if (string.IsNullOrWhiteSpace(model.OtpCode))
            {
                ModelState.AddModelError("OtpCode", "Vui lòng nhập mã OTP.");
                return View(model);
            }

            // Giao cho Service kiểm tra 6 số
            var result = await _accountService.VerifyRegisterOtpAsync(model.Email, model.OtpCode);

            if (!result.Succeeded || result.User == null)
            {
                ModelState.AddModelError("", result.ErrorMessage);
                return View(model);
            }

            // OTP đúng -> Cấp Cookie và đưa về Trang chủ!
            await SignInUserCookieAsync(result.User, "Customer", isPersistent: true);
            return RedirectByRole("Customer", model.ReturnUrl);
        }
        // 2e. Xử lý khi khách bấm nút "Gửi lại mã mới"
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ResendOtp(string email, string? returnUrl = null)
        {
            var result = await _accountService.ResendOtpAsync(email);

            if (result.Succeeded)
            {
                // Gửi thông báo xanh sang trang VerifyOtp
                TempData["SuccessMessage"] = "Mã xác thực mới đã được gửi về Gmail của bạn!";
            }
            else
            {
                TempData["ErrorMessage"] = result.ErrorMessage;
            }

            // Ở nguyên tại trang VerifyOtp, không nhảy đi đâu cả!
            return RedirectToAction(nameof(VerifyOtp), new { email, returnUrl });
        }
        // ==========================================
        // 3. QUÊN MẬT KHẨU (NHẬP EMAIL ĐỂ NHẬN LINK)
        // ==========================================
        [HttpGet("/Account/ForgotPassword")]
        public IActionResult ForgotPassword()
        {
            return View("~/Views/Customer/Account/ForgotPassword.cshtml");
        }

        [HttpPost("/Account/ForgotPassword")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordRequestDto dto)
        {
            // Lấy địa chỉ gốc của web (VD: http://localhost:5078)
            string baseUrl = $"{Request.Scheme}://{Request.Host}";

            var result = await _accountService.SendForgotPasswordLinkAsync(dto.Email, baseUrl);
            if (!result.Succeeded)
            {
                ViewBag.ErrorMessage = result.ErrorMessage;
                ViewBag.EnteredEmail = dto.Email;
                return View("~/Views/Customer/Account/ForgotPassword.cshtml");
            }

            // Thành công: Hiện thông báo đã gửi mail ngay trên trang
            ViewBag.SuccessMessage = result.Message;
            return View("~/Views/Customer/Account/ForgotPassword.cshtml");
        }

        // ==========================================
        // 4. ĐẶT LẠI MẬT KHẨU (MỞ TỪ LINK TRONG GMAIL)
        // ==========================================
        [HttpGet("/Account/ResetPassword")]
        public async Task<IActionResult> ResetPassword(string email, string token)
        {
            var check = await _accountService.ValidateResetTokenAsync(email, token);
            if (!check.Succeeded)
            {
                // Nếu link hết hạn hoặc sai -> Đưa về trang Quên mật khẩu kèm lý do lỗi
                TempData["ErrorMessage"] = check.ErrorMessage;
                return RedirectToAction("ForgotPassword");
            }

            var model = new ResetPasswordRequestDto
            {
                Email = email,
                Token = token
            };

            return View("~/Views/Customer/Account/ResetPassword.cshtml", model);
        }

        [HttpPost("/Account/ResetPassword")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ResetPassword(ResetPasswordRequestDto dto)
        {
            var result = await _accountService.ResetPasswordAsync(dto);
            if (!result.Succeeded)
            {
                ViewBag.ErrorMessage = result.ErrorMessage;
                return View("~/Views/Customer/Account/ResetPassword.cshtml", dto);
            }

            // Nếu đang có phiên đăng nhập cũ thì xóa luôn để đăng nhập mới sạch sẽ
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

            TempData["SuccessMessage"] = result.Message;
            return RedirectToAction("Login", "Account");
        }

        // ==========================================
        // 5. TRANG ĐƠN HÀNG CỦA TÔI (/Account/Orders)
        // ==========================================
        [HttpGet]
        [Authorize]
        public IActionResult Orders()
        {
            ViewData["Title"] = "Đơn hàng của tôi";
            // Nếu file Orders.cshtml nằm ở Views/Account/Orders.cshtml thì chỉ cần: return View();
            // Nếu nằm ở Views/Customer/Account/Orders.cshtml thì ghi rõ đường dẫn:
            return View("~/Views/Customer/Account/Orders.cshtml");
        }

        // 5b. API lấy dữ liệu JSON cho JS (đã có sẵn của bạn)
        [Authorize]
        [HttpGet("/api/customer/orders")]
        public async Task<IActionResult> GetMyOrders([FromQuery] string? status, [FromQuery] string? search)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Vui lòng đăng nhập để xem đơn hàng." });
            }

            var orders = await _orderService.GetMyOrdersAsync(userId, status, search);
            return Ok(orders);
        }
        // ==========================================
        // 6. TRANG CHI TIẾT ĐƠN HÀNG (/Account/OrderDetail)
        // ==========================================
        [HttpGet]
        [Authorize]
        public IActionResult OrderDetail()
        {
            ViewData["Title"] = "Chi tiết đơn hàng";
            return View("~/Views/Customer/Account/OrderDetail.cshtml");
        }
        [Authorize]
        [HttpGet("/api/customer/orders/{idOrCode}")]
        public async Task<IActionResult> GetOrderDetail(string idOrCode)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Vui lòng đăng nhập để xem chi tiết đơn hàng." });
            }

            OrderDetailDto? order = null;

            // Nếu là số ID (ví dụ: 1, 2, 3...)
            if (long.TryParse(idOrCode, out long numericId))
            {
                order = await _orderService.GetOrderDetailAsync(userId, numericId);
            }

            // Nếu không tìm thấy hoặc là mã chữ (ví dụ: ORD2026...)
            if (order == null)
            {
                order = await _orderService.GetOrderDetailByCodeAsync(userId, idOrCode);
            }

            if (order == null)
            {
                return NotFound(new { message = "Không tìm thấy thông tin đơn hàng này." });
            }

            return Ok(order);
        }

        [Authorize]
        [HttpPost("/api/customer/orders/{id:long}/cancel")]
        public async Task<IActionResult> CancelOrder(long id, [FromBody] CancelOrderRequestDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Vui lòng đăng nhập để thực hiện thao tác." });
            }

            var result = await _orderService.CancelOrderAsync(userId, id, dto);
            if (!result.Succeeded)
            {
                return BadRequest(new { message = result.ErrorMessage });
            }

            return Ok(new { message = result.Message });
        }
        [Authorize]
        [HttpPost("/api/customer/orders/{id:long}/return")]
        public async Task<IActionResult> RequestReturnOrder(long id, [FromBody] ReturnOrderRequestDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "Vui lòng đăng nhập để thực hiện thao tác." });
            }

            var result = await _orderService.RequestReturnOrderAsync(userId, id, dto);
            if (!result.Succeeded)
            {
                return BadRequest(new { message = result.ErrorMessage });
            }

            return Ok(new { message = result.Message });
        }
        // ==========================================
        // 7. HỒ SƠ CÁ NHÂN (Profile)
        // ==========================================
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> Profile()
        {
            ViewData["Title"] = "Hồ sơ cá nhân";
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return RedirectToAction(nameof(Login), new { returnUrl = "/Account/Profile" });
            }

            var user = await _accountService.GetProfileAsync(userId);
            if (user == null)
            {
                return RedirectToAction(nameof(Login));
            }

            return View(user);
        }
        // 7b. API trả thông tin Profile thật cho file lightlife-account.js (Chặn đứng mockProfile!)
        [HttpGet("/api/customer/profile")]
        [Authorize]
        public async Task<IActionResult> GetCustomerProfileApi()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var user = await _accountService.GetProfileAsync(userId);
            if (user == null) return NotFound();

            string phone = user.Customer?.Phone ?? user.PhoneNumber ?? "";

            // Trả về JSON có tên trường giống hệt mockProfile trong lightlife-account.js
            return Ok(new
            {
                id = user.Id,
                fullName = user.FullName,
                email = user.Email,
                phone = phone,
                phoneNumber = phone,
                role = "Khách hàng",
                emailConfirmed = user.EmailConfirmed
            });
        }

        // 7c. API lưu thay đổi khi người dùng bấm nút "Lưu thay đổi" trên trang Profile
        [HttpPut("/api/customer/profile")]
        [HttpPost("/api/customer/profile")]
        [Authorize]
        public async Task<IActionResult> UpdateCustomerProfileApi([FromBody] UpdateProfileDto input)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            if (string.IsNullOrWhiteSpace(input.FullName))
            {
                return BadRequest(new { message = "Vui lòng nhập họ và tên." });
            }

            var result = await _accountService.UpdateProfileAsync(userId, input.FullName, input.Phone);
            if (!result.Succeeded || result.User == null)
            {
                return BadRequest(new { message = result.ErrorMessage });
            }

            // Cấp lại Cookie để tên trên góc phải Header cũng tự động cập nhật theo tên mới
            await SignInUserCookieAsync(result.User, result.RoleName, isPersistent: true);

            return Ok(new
            {
                success = true,
                message = "Cập nhật hồ sơ thành công!",
                fullName = result.User.FullName,
                email = result.User.Email,
                phone = result.User.Customer?.Phone ?? result.User.PhoneNumber ?? ""
            });
        }
        // ==========================================
        // 8. SỔ ĐỊA CHỈ NHẬN HÀNG (/Account/Addresses)
        // ==========================================

        // 8a. Mở giao diện trang Sổ địa chỉ
        [HttpGet]
        [Authorize] // Bắt buộc đăng nhập mới được vào
        public IActionResult Addresses()
        {
            ViewData["Title"] = "Sổ địa chỉ nhận hàng";
            return View();
        }

        // 8b. API lấy danh sách địa chỉ thật từ SQL Server cho JavaScript hiển thị
        [HttpGet("/api/customer/addresses")]
        [Authorize]
        public async Task<IActionResult> GetAddressesApi()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            // Nhờ Service lấy danh sách địa chỉ từ bảng CustomerAddresses
            var list = await _addressService.GetAddressesAsync(userId);
            return Ok(list);
        }

        // 8c. API Thêm mới hoặc Cập nhật địa chỉ khi bấm "Lưu địa chỉ"
        [HttpPost("/api/customer/addresses")]
        [Authorize]
        public async Task<IActionResult> SaveAddressApi([FromBody] SaveAddressRequestDto input)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            if (input == null)
            {
                return BadRequest(new { message = "Dữ liệu không hợp lệ." });
            }

            var result = await _addressService.SaveAddressAsync(userId, input);
            if (!result.Succeeded)
            {
                return BadRequest(new { message = result.ErrorMessage });
            }

            return Ok(new { success = true, message = result.Message });
        }

        // 8d. API Đặt một địa chỉ làm mặc định
        [HttpPut("/api/customer/addresses/{id}/default")]
        [HttpPost("/api/customer/addresses/{id}/default")]
        [Authorize]
        public async Task<IActionResult> SetDefaultAddressApi(long id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var result = await _addressService.SetDefaultAddressAsync(userId, id);
            if (!result.Succeeded)
            {
                return BadRequest(new { message = result.ErrorMessage });
            }

            return Ok(new { success = true, message = result.Message });
        }

        // 8e. API Xóa một địa chỉ
        [HttpDelete("/api/customer/addresses/{id}")]
        [HttpPost("/api/customer/addresses/{id}/delete")]
        [Authorize]
        public async Task<IActionResult> DeleteAddressApi(long id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var result = await _addressService.DeleteAddressAsync(userId, id);
            if (!result.Succeeded)
            {
                return BadRequest(new { message = result.ErrorMessage });
            }

            return Ok(new { success = true, message = result.Message });
        }

        // ==========================================
        // 9. ĐỔI MẬT KHẨU
        // ==========================================
        // 1. [GET] Hiển thị trang Đổi mật khẩu
        [Authorize]
        [HttpGet("/Account/ChangePassword")]
        public IActionResult ChangePassword()
        {
            return View("~/Views/Customer/Account/ChangePassword.cshtml");
        }

        // 2. [POST] Nhận dữ liệu Form, kiểm tra và chuyển về trang Login
        [Authorize]
        [HttpPost("/Account/ChangePassword")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ChangePassword(ChangePasswordRequestDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return RedirectToAction("Login");
            }

            var result = await _accountService.ChangePasswordAsync(userId, dto);

            // Nếu Validate thất bại -> Giữ nguyên ở trang Đổi mật khẩu và hiện lỗi
            if (!result.Succeeded)
            {
                ViewBag.ErrorMessage = result.ErrorMessage;
                return View("~/Views/Customer/Account/ChangePassword.cshtml", dto);
            }

            // Nếu Đổi mật khẩu THÀNH CÔNG:
            // B1: Xóa Cookie đăng nhập hiện tại để bắt buộc đăng nhập lại
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

            // B2: Gửi thông báo sang trang Login
            TempData["SuccessMessage"] = "Đổi mật khẩu thành công! Vui lòng đăng nhập lại bằng mật khẩu mới của bạn.";

            // B3: Chuyển hướng về thẳng trang Đăng nhập
            return RedirectToAction("Login", "Account");
        }
        // Hàm phụ trợ 1: Cấp chiếc vòng tay Cookie chứa ID, Tên và Role của người dùng
        private async Task SignInUserCookieAsync(AspNetUser user, string roleName, bool isPersistent)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name, user.UserName ?? ""),
                new Claim(ClaimTypes.Email, user.Email ?? ""),
                new Claim("FullName", user.FullName ?? ""),
                new Claim(ClaimTypes.Role, roleName)
            };

            var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            var properties = new AuthenticationProperties
            {
                IsPersistent = isPersistent,
                ExpiresUtc = isPersistent ? DateTimeOffset.UtcNow.AddDays(7) : null
            };

            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(identity),
                properties);
        }

        // Hàm phụ trợ 2: Rẽ nhánh đường đi theo Role
        private IActionResult RedirectByRole(string roleName, string? returnUrl)
        {
            if (roleName == "Admin")
                return Redirect("/Admin/Dashboard");

            if (roleName == "Employee")
                return Redirect("/Employee/Dashboard");

            if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
                return Redirect(returnUrl);

            return RedirectToAction("Index", "Home");
        }
    }
}

