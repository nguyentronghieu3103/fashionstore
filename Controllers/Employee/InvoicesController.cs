using Microsoft.AspNetCore.Mvc;

namespace fashionstore.Areas.Employee.Controllers
{
    [Area("Employee")]
    public class InvoicesController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}

