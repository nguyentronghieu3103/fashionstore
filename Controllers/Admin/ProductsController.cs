using Microsoft.AspNetCore.Mvc;

namespace fashionstore.Areas.Admin.Controllers
{
    [Area("Admin")]
    public class ProductsController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        [HttpGet]
        public IActionResult Create()
        {
            ViewBag.IsEdit = false;
            ViewBag.Title = "Thêm sản phẩm mới";
            return View("Edit");
        }

        [HttpGet]
        public IActionResult Edit(int? id)
        {
            ViewBag.IsEdit = id.HasValue && id.Value > 0;
            ViewBag.ProductId = id ?? 1;
            ViewBag.Title = ViewBag.IsEdit ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới";
            return View();
        }

        [HttpPost]
        public IActionResult Save()
        {
            return RedirectToAction(nameof(Index));
        }
    }
}

