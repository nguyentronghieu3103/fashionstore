using Microsoft.AspNetCore.Mvc;

namespace fashionstore.Areas.Admin.Controllers
{
    [Area("Admin")]
    public class ProfileController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}

