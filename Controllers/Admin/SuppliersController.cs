using Microsoft.AspNetCore.Mvc;

namespace fashionstore.Areas.Admin.Controllers
{
    [Area("Admin")]
    public class SuppliersController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        [HttpGet]
        public IActionResult Edit(int? id)
        {
            ViewBag.SupplierId = id ?? 1;
            return View();
        }
    }
}

