using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using fashionstore.Models.Entities;
using fashionstore.Models.EF;

namespace fashionstore.Areas.Admin.Controllers
{
    [Area("Admin")]
    [Authorize(Roles = "Admin,Employee")]
    public class DashboardController : Controller
    {
        private readonly LightLifeDbContext _context;

        public DashboardController(LightLifeDbContext context)
        {
            _context = context;
        }
        public IActionResult Index()
        {
            return View();
        }
        [HttpGet("/api/admin/header/notifications")]
        public async Task<IActionResult> GetHeaderNotifications()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            // 1. Lấy 10 thông báo mới nhất từ bảng Notifications trong CSDL
            var notifications = await _context.Notifications
                .Where(n => n.RecipientUserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(10)
                .Select(n => new
                {
                    id = n.Id,
                    title = n.Title,
                    message = n.Message,
                    targetPath = n.TargetPath ?? "/Admin/Orders",
                    createdAt = n.CreatedAt.ToString("HH:mm dd/MM/yyyy"),
                    isUnread = n.ReadAt == null
                })
                .ToListAsync();

            // 2. Đếm số thông báo chưa đọc
            int unreadNotifs = await _context.Notifications
                .CountAsync(n => n.RecipientUserId == userId && n.ReadAt == null);

            // 3. Đếm thêm số đơn hàng mới đang Chờ xác nhận (Status == 1) để nhắc việc
            int pendingOrdersCount = await _context.Orders
                .CountAsync(o => o.Status == 1);

            // Tổng số đỏ hiển thị trên quả chuông = Thông báo chưa đọc + Đơn hàng mới cần duyệt
            int totalBadgeCount = unreadNotifs + pendingOrdersCount;

            return Ok(new
            {
                unreadCount = totalBadgeCount,
                pendingOrdersCount = pendingOrdersCount,
                items = notifications
            });
        }

        // =====================================================================
        // API CHO HEADER: ĐÁNH DẤU TẤT CẢ THÔNG BÁO LÀ ĐÃ ĐỌC
        // POST: /api/admin/header/notifications/read-all
        // =====================================================================
        [HttpPost("/api/admin/header/notifications/read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var unreadList = await _context.Notifications
                .Where(n => n.RecipientUserId == userId && n.ReadAt == null)
                .ToListAsync();

            foreach (var item in unreadList)
            {
                item.ReadAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }
    }
}

