using Microsoft.AspNetCore.Mvc;

namespace fashionstore.Controllers
{
    public class CartController : Controller
    {
        [HttpGet]
        public IActionResult Index()
        {
            ViewData["Title"] = "Giỏ hàng của bạn";
            return View();
        }
    }
}

