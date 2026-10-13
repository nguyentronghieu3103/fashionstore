using Microsoft.AspNetCore.Mvc;

namespace fashionstore.Areas.Admin.Controllers
{
    [Area("Admin")]
    public class AccountsController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}

