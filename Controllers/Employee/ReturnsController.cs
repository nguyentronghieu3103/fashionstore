using Microsoft.AspNetCore.Mvc;

namespace fashionstore.Areas.Employee.Controllers
{
    [Area("Employee")]
    public class ReturnsController : Controller
    {
        public IActionResult Create()
        {
            return View();
        }

        public IActionResult Index()
        {
            return View("Create");
        }
    }
}
