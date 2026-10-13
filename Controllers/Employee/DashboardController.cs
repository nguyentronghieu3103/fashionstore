using Microsoft.AspNetCore.Mvc;

namespace fashionstore.Areas.Employee.Controllers
{
    [Area("Employee")]
    public class DashboardController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult OpenShift()
        {
            return View("~/Views/Employee/Shifts/Open.cshtml");
        }

        public IActionResult Pos()
        {
            return View("~/Views/Employee/Pos/Index.cshtml");
        }

        public IActionResult Invoices()
        {
            return View("~/Views/Employee/Invoices/Index.cshtml");
        }

        public IActionResult Returns()
        {
            return View("~/Views/Employee/Returns/Create.cshtml");
        }
    }
}

