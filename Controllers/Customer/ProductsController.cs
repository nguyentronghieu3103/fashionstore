using Microsoft.AspNetCore.Mvc;

namespace fashionstore.Controllers
{
    public class ProductsController : Controller
    {
        [HttpGet]
        public IActionResult Index(string? category, string? search, string? sort, string? price, string? color, string? size, bool? inStock, int page = 1)
        {
            ViewData["Title"] = !string.IsNullOrEmpty(search) 
                ? $"Tìm kiếm: {search}" 
                : (!string.IsNullOrEmpty(category) ? $"Danh mục: {category}" : "Danh sách sản phẩm");

            // Truyền các query params vào ViewData để View/JS dễ dàng khởi tạo trạng thái
            ViewData["Category"] = category ?? "";
            ViewData["Search"] = search ?? "";
            ViewData["Sort"] = sort ?? "newest";
            ViewData["Price"] = price ?? "";
            ViewData["Color"] = color ?? "";
            ViewData["Size"] = size ?? "";
            ViewData["InStock"] = inStock.HasValue && inStock.Value;
            ViewData["CurrentPage"] = page;

            return View();
        }

        [HttpGet]
        public IActionResult Detail(int id)
        {
            ViewData["Title"] = "Chi tiết sản phẩm";
            ViewData["ProductId"] = id;
            return View();
        }
    }
}

