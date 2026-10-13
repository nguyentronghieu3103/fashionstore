using Microsoft.AspNetCore.Mvc;

namespace fashionstore.Areas.Admin.Controllers
{
    [Area("Admin")]
    public class ReturnsController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        [HttpGet]
        public IActionResult Details(string id)
        {
            ViewBag.RequestId = id ?? "YC-2026-0089";
            return View();
        }
    }
}

