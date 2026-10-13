using Microsoft.AspNetCore.Mvc;

namespace fashionstore.Controllers
{
    public class AccountController : Controller
    {
        // 1. Đăng nhập khách hàng
        [HttpGet]
        public IActionResult Login(string? returnUrl = null)
        {
            ViewData["Title"] = "Đăng nhập";
            ViewData["ReturnUrl"] = returnUrl ?? "/";
            return View();
        }

        // 2. Đăng ký khách hàng
        [HttpGet]
        public IActionResult Register(string? returnUrl = null)
        {
            ViewData["Title"] = "Đăng ký tài khoản";
            ViewData["ReturnUrl"] = returnUrl ?? "/";
            return View();
        }

        // 3. Quên mật khẩu
        [HttpGet]
        public IActionResult ForgotPassword()
        {
            ViewData["Title"] = "Quên mật khẩu";
            return View();
        }

        // 4. Đặt lại mật khẩu (Khi backend cung cấp token hợp lệ)
        [HttpGet]
        public IActionResult ResetPassword(string? token = null, string? email = null)
        {
            ViewData["Title"] = "Đặt lại mật khẩu";
            ViewData["Token"] = token ?? "";
            ViewData["Email"] = email ?? "";
            return View();
        }

        // 5. Đơn hàng của tôi (Khu vực tài khoản khách hàng)
        [HttpGet]
        public IActionResult Orders(string? status = null, string? search = null, int page = 1)
        {
            ViewData["Title"] = "Đơn hàng của tôi";
            ViewData["CurrentStatus"] = status ?? "all";
            ViewData["SearchKeyword"] = search ?? "";
            ViewData["CurrentPage"] = page;
            return View();
        }

        // 6. Chi tiết đơn hàng và yêu cầu đổi trả
        [HttpGet]
        public IActionResult OrderDetail(string? id = null)
        {
            ViewData["Title"] = "Chi tiết đơn hàng";
            ViewData["OrderId"] = id ?? "";
            return View();
        }

        // 7. Hồ sơ cá nhân
        [HttpGet]
        public IActionResult Profile()
        {
            ViewData["Title"] = "Hồ sơ cá nhân";
            return View();
        }

        // 8. Sổ địa chỉ nhận hàng
        [HttpGet]
        public IActionResult Addresses()
        {
            ViewData["Title"] = "Sổ địa chỉ nhận hàng";
            return View();
        }

        // 9. Đổi mật khẩu
        [HttpGet]
        public IActionResult ChangePassword()
        {
            ViewData["Title"] = "Đổi mật khẩu";
            return View();
        }
    }
}

