using Microsoft.AspNetCore.Mvc;

namespace fashionstore.Areas.Employee.Controllers
{
    [Area("Employee")]
    public class ShiftsController : Controller
    {
        public IActionResult Open()
        {
            return View();
        }

        public IActionResult Close()
        {
            return View();
        }
    }
}

