using Microsoft.AspNetCore.Mvc;

namespace fashionstore.Controllers
{
    public class CheckoutController : Controller
    {
        // GET: /Checkout - Trang đặt hàng dành cho khách đã đăng nhập
        [HttpGet]
        public IActionResult Index()
        {
            var isAuthenticated = User?.Identity?.IsAuthenticated ?? false;
            ViewData["Title"] = "Thanh toán & Đặt hàng";
            ViewData["IsAuthenticated"] = isAuthenticated;

            return View();
        }

        // GET: /Checkout/Success - Trang thông báo "Đã tiếp nhận đơn hàng" (Idempotent - Chỉ đọc dữ liệu đơn)
        [HttpGet]
        public IActionResult Success(string? orderId = null)
        {
            ViewData["Title"] = "Đã tiếp nhận đơn hàng";
            ViewData["OrderId"] = orderId ?? "";
            return View();
        }
    }
}

