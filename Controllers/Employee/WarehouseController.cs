using Microsoft.AspNetCore.Mvc;

namespace fashionstore.Areas.Employee.Controllers
{
    [Area("Employee")]
    public class WarehouseController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Exports()
        {
            return View();
        }

        public IActionResult Audits()
        {
            return View();
        }
    }
}

