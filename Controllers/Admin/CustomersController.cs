using Microsoft.AspNetCore.Mvc;

namespace fashionstore.Areas.Admin.Controllers
{
    [Area("Admin")]
    public class CustomersController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        [HttpGet]
        public IActionResult Edit(int? id)
        {
            ViewBag.CustomerId = id ?? 1;
            ViewBag.IsEdit = true;
            return View();
        }

        [HttpPost]
        public IActionResult Edit()
        {
            TempData["SuccessMessage"] = "Cập nhật thông tin khách hàng thành công!";
            return RedirectToAction(nameof(Index));
        }
    }
}

