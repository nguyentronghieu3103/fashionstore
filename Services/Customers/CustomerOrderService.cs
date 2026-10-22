using fashionstore.Models.Dtos;
using fashionstore.Models.Entities;  
using fashionstore.Services.Auth;    
using Microsoft.EntityFrameworkCore;
using fashionstore.Models.EF;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;


namespace fashionstore.Services.Customers
{
    public class CustomerOrderService : ICustomerOrderService
    {
        private readonly LightLifeDbContext _context;

        public const byte STATUS_PENDING = 1;          // Chờ xác nhận
        public const byte STATUS_CONFIRMED = 2;        // Đã xác nhận
        public const byte STATUS_SHIPPING = 3;         // Đang vận chuyển
        public const byte STATUS_COMPLETED = 4;        // Giao thành công
        public const byte STATUS_CANCELLED = 5;        // Đã hủy
        public const byte STATUS_RETURN_REQUESTED = 6; // Yêu cầu đổi/trả

        public CustomerOrderService(LightLifeDbContext context)
        {
            _context = context;
        }

        // =====================================================================
        // 1. LẤY DANH SÁCH ĐƠN HÀNG (/Account/Orders)
        // =====================================================================
        public async Task<List<OrderListItemDto>> GetMyOrdersAsync(string userId, string? status, string? search)
        {
            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId == userId);
            if (customer == null)
            {
                return new List<OrderListItemDto>();
            }

            var query = _context.Orders
                .Where(o => o.CustomerId == customer.Id)
                .Include(o => o.OrderItems)
                    .ThenInclude(i => i.Variant)
                        .ThenInclude(v => v.Product)
                            .ThenInclude(p => p.ProductImage)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            {
                var s = status.Trim().ToUpperInvariant();
                byte? targetStatus = s switch
                {
                    "PENDING" or "CHO_XAC_NHAN" or "1" => STATUS_PENDING,
                    "CONFIRMED" or "DA_XAC_NHAN" or "2" => STATUS_CONFIRMED,
                    "SHIPPING" or "DANG_GIAO" or "3" => STATUS_SHIPPING,
                    "COMPLETED" or "DELIVERED" or "DA_GIAO" or "4" => STATUS_COMPLETED,
                    "CANCELLED" or "DA_HUY" or "5" => STATUS_CANCELLED,
                    "RETURNED" or "RETURN_REQUESTED" or "6" => STATUS_RETURN_REQUESTED,
                    _ => null
                };

                if (targetStatus.HasValue)
                {
                    query = query.Where(o => o.Status == targetStatus.Value);
                }
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(o => o.OrderCode.ToLower().Contains(term) ||
                                         o.OrderItems.Any(i => i.ProductNameSnapshot.ToLower().Contains(term)));
            }

            var orders = await query
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            return orders.Select(o => MapToOrderListItemDto(o)).ToList();
        }

        // =====================================================================
        // 2. LẤY CHI TIẾT 1 ĐƠN HÀNG (/Account/OrderDetail)
        // =====================================================================
        public async Task<OrderDetailDto?> GetOrderDetailAsync(string userId, long orderId)
        {
            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId == userId);
            if (customer == null) return null;

            var order = await _context.Orders
                .Where(o => o.Id == orderId && o.CustomerId == customer.Id)
                .Include(o => o.OrderItems)
                    .ThenInclude(i => i.Variant)
                        .ThenInclude(v => v.Product)
                            .ThenInclude(p => p.ProductImage)
                .Include(o => o.OrderStatusHistories)
                .FirstOrDefaultAsync();

            return order != null ? MapToOrderDetailDto(order) : null;
        }

        public async Task<OrderDetailDto?> GetOrderDetailByCodeAsync(string userId, string orderCode)
        {
            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId == userId);
            if (customer == null) return null;

            var order = await _context.Orders
                .Where(o => o.OrderCode == orderCode.Trim() && o.CustomerId == customer.Id)
                .Include(o => o.OrderItems)
                    .ThenInclude(i => i.Variant)
                        .ThenInclude(v => v.Product)
                            .ThenInclude(p => p.ProductImage)
                .Include(o => o.OrderStatusHistories)
                .FirstOrDefaultAsync();

            return order != null ? MapToOrderDetailDto(order) : null;
        }

        // =====================================================================
        // 3. THAO TÁC HỦY ĐƠN HÀNG (HOÀN LẠI TỒN KHO)
        // =====================================================================
        public async Task<AuthResult> CancelOrderAsync(string userId, long orderId, CancelOrderRequestDto dto)
        {
            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId == userId);
            if (customer == null)
            {
                return new AuthResult { Succeeded = false, ErrorMessage = "Không tìm thấy thông tin khách hàng." };
            }

            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == orderId && o.CustomerId == customer.Id);

            if (order == null)
            {
                return new AuthResult { Succeeded = false, ErrorMessage = "Không tìm thấy đơn hàng cần hủy." };
            }

            if (order.Status != STATUS_PENDING)
            {
                return new AuthResult
                {
                    Succeeded = false,
                    ErrorMessage = "Đơn hàng đã được xác nhận hoặc đang vận chuyển, không thể tự hủy. Vui lòng liên hệ CSKH!"
                };
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                order.Status = STATUS_CANCELLED;
                order.CancelReason = string.IsNullOrWhiteSpace(dto.Reason) ? "Khách hàng yêu cầu hủy đơn" : dto.Reason.Trim();
                if (!string.IsNullOrWhiteSpace(dto.Note))
                {
                    order.CancelReason += $" ({dto.Note.Trim()})";
                }
                order.CancelledAt = DateTime.UtcNow;
                order.CancelledByUserId = userId;

                // Hoàn lại tồn kho trong bảng StockBalances
                foreach (var item in order.OrderItems)
                {
                    var stock = await _context.StockBalances.FirstOrDefaultAsync(sb => sb.VariantId == item.VariantId);
                    if (stock != null)
                    {
                        stock.SellableQuantity += item.Quantity;
                    }
                }

                _context.OrderStatusHistories.Add(new OrderStatusHistory
                {
                    OrderId = order.Id,
                    ChangedByUserId = userId,
                    Reason = $"Khách hủy đơn: {order.CancelReason}",
                    CreatedAt = DateTime.UtcNow
                });

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return new AuthResult { Succeeded = true, Message = "Hủy đơn hàng thành công! Đã cập nhật lại trạng thái." };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return new AuthResult { Succeeded = false, ErrorMessage = $"Lỗi khi hủy đơn hàng: {ex.Message}" };
            }
        }

        // =====================================================================
        // 4. THAO TÁC YÊU CẦU ĐỔI / TRẢ HÀNG
        // =====================================================================
        public async Task<AuthResult> RequestReturnOrderAsync(string userId, long orderId, ReturnOrderRequestDto dto)
        {
            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId == userId);
            if (customer == null) return new AuthResult { Succeeded = false, ErrorMessage = "Khách hàng không hợp lệ." };

            var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == orderId && o.CustomerId == customer.Id);
            if (order == null) return new AuthResult { Succeeded = false, ErrorMessage = "Không tìm thấy đơn hàng." };

            if (order.Status != STATUS_COMPLETED)
            {
                return new AuthResult { Succeeded = false, ErrorMessage = "Chỉ có thể yêu cầu đổi trả đối với đơn hàng đã giao thành công." };
            }

            order.Status = STATUS_RETURN_REQUESTED;
            order.Note = (order.Note + $" | [Yêu cầu đổi/trả]: {dto.Reason}. {dto.Note}").Trim();

            _context.ReturnRequests.Add(new ReturnRequest
            {
                OrderId = order.Id,
                CreatedByUserId = userId,
                ReturnCode = "RET" + DateTime.UtcNow.ToString("yyMMddHHmmss"),
                Reason = dto.Reason + (string.IsNullOrWhiteSpace(dto.Note) ? "" : $" - {dto.Note}"),
                Status = 1,
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            return new AuthResult
            {
                Succeeded = true,
                Message = "Gửi yêu cầu đổi/trả hàng thành công! Nhân viên LIGHT LIFE sẽ liên hệ hỗ trợ bạn sớm nhất."
            };
        }

        // =====================================================================
        // HÀM TIỆN ÍCH ÁNH XẠ DỮ LIỆU SANG DTO
        // =====================================================================
        private OrderListItemDto MapToOrderListItemDto(Order o)
        {
            var (statusKey, statusLabel, statusClass, canCancel, canReturn) = ResolveOrderStatusDetails(o.Status);
            decimal totalMoney = o.GrandTotal ?? ((o.Subtotal - o.DiscountAmount) + o.ShippingFee);

            return new OrderListItemDto
            {
                Id = o.Id,
                OrderId = o.OrderCode,
                OrderCode = o.OrderCode,
                CreatedAt = o.CreatedAt.ToString("dd/MM/yyyy HH:mm"),
                Status = statusKey,
                StatusLabel = statusLabel,
                StatusText = statusLabel,
                StatusClass = statusClass,
                StatusBadgeClass = statusClass,
                PaymentMethod = FormatPaymentMethod(o.PaymentMethod),
                PaymentStatus = o.Status == STATUS_COMPLETED ? "Đã thanh toán" : "Chờ thanh toán",
                PaymentClass = o.Status == STATUS_COMPLETED ? "ll-badge-payment--paid" : "ll-badge-payment--pending",
                Total = totalMoney,
                TotalAmount = totalMoney,
                TotalItems = o.OrderItems.Sum(i => i.Quantity),
                CanCancel = canCancel,
                CanReturn = canReturn,
                Recipient = new OrderRecipientDto
                {
                    Name = o.ReceiverName ?? "",
                    Phone = o.ReceiverPhone ?? "",
                    Address = o.DeliveryAddress ?? ""
                },
                Items = o.OrderItems.Select(i => new OrderItemSummaryDto
                {
                    ProductId = i.Variant?.ProductId ?? 0,
                    VariantId = i.VariantId,
                    Name = i.ProductNameSnapshot ?? "Sản phẩm thời trang",
                    ProductName = i.ProductNameSnapshot ?? "Sản phẩm thời trang",
                    Color = i.ColorSnapshot,
                    Size = i.SizeSnapshot,
                    ImageUrl = i.Variant?.Product?.ProductImage?.ImagePath ?? "/images/product-placeholder.png",
                    ThumbnailUrl = i.Variant?.Product?.ProductImage?.ImagePath ?? "/images/product-placeholder.png",
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    LineTotal = i.LineTotal ?? (i.UnitPrice * i.Quantity)
                }).ToList()
            };
        }

        private OrderDetailDto MapToOrderDetailDto(Order o)
        {
            var (statusKey, statusLabel, statusClass, canCancel, canReturn) = ResolveOrderStatusDetails(o.Status);
            decimal totalMoney = o.GrandTotal ?? ((o.Subtotal - o.DiscountAmount) + o.ShippingFee);

            return new OrderDetailDto
            {
                Id = o.Id,
                OrderId = o.OrderCode,
                OrderCode = o.OrderCode,
                CreatedAt = o.CreatedAt.ToString("dd/MM/yyyy HH:mm"),
                CompletedAt = o.CompletedAt?.ToString("dd/MM/yyyy HH:mm"),
                Status = statusKey,
                StatusLabel = statusLabel,
                StatusText = statusLabel,
                StatusClass = statusClass,
                StatusBadgeClass = statusClass,
                ReceiverName = o.ReceiverName ?? "",
                ReceiverPhone = o.ReceiverPhone ?? "",
                ShippingAddress = o.DeliveryAddress ?? "",
                Note = o.Note,
                CancelReason = o.CancelReason,
                PaymentMethod = FormatPaymentMethod(o.PaymentMethod),
                PaymentStatus = o.Status == STATUS_COMPLETED ? "Đã thanh toán" : "Chờ thanh toán",
                Subtotal = o.Subtotal,
                ShippingFee = o.ShippingFee,
                DiscountAmount = o.DiscountAmount,
                Total = totalMoney,
                TotalAmount = totalMoney,
                CanCancel = canCancel,
                CanReturn = canReturn,
                Recipient = new OrderRecipientDto
                {
                    Name = o.ReceiverName ?? "",
                    Phone = o.ReceiverPhone ?? "",
                    Address = o.DeliveryAddress ?? ""
                },
                Items = o.OrderItems.Select(i => new OrderItemSummaryDto
                {
                    ProductId = i.Variant?.ProductId ?? 0,
                    VariantId = i.VariantId,
                    Name = i.ProductNameSnapshot ?? "Sản phẩm thời trang",
                    ProductName = i.ProductNameSnapshot ?? "Sản phẩm thời trang",
                    Color = i.ColorSnapshot,
                    Size = i.SizeSnapshot,
                    ImageUrl = i.Variant?.Product?.ProductImage?.ImagePath ?? "/images/product-placeholder.png",
                    ThumbnailUrl = i.Variant?.Product?.ProductImage?.ImagePath ?? "/images/product-placeholder.png",
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    LineTotal = i.LineTotal ?? (i.UnitPrice * i.Quantity)
                }).ToList(),
                Timeline = BuildOrderTimeline(o)
            };
        }

        private (string key, string label, string badgeClass, bool canCancel, bool canReturn) ResolveOrderStatusDetails(byte status)
        {
            return status switch
            {
                STATUS_PENDING => ("pending", "Chờ xác nhận", "ll-badge--pending", true, false),
                STATUS_CONFIRMED => ("pending", "Đã xác nhận", "ll-badge--confirmed", false, false),
                STATUS_SHIPPING => ("shipping", "Đang giao hàng", "ll-badge--shipping", false, false),
                STATUS_COMPLETED => ("completed", "Giao thành công", "ll-badge--completed", false, true),
                STATUS_CANCELLED => ("cancelled", "Đã hủy", "ll-badge--cancelled", false, false),
                STATUS_RETURN_REQUESTED => ("cancelled", "Yêu cầu đổi/trả", "ll-badge--return", false, false),
                _ => ("all", "Đang xử lý", "ll-badge--default", false, false)
            };
        }

        private string FormatPaymentMethod(byte method)
        {
            return method switch
            {
                1 => "COD (Thanh toán khi nhận hàng)",
                2 => "Chuyển khoản VNPAY",
                3 => "Ví MoMo",
                _ => "Tiền mặt / Khác"
            };
        }

        private List<OrderTimelineItemDto> BuildOrderTimeline(Order o)
        {
            var timeline = new List<OrderTimelineItemDto>();

            timeline.Add(new OrderTimelineItemDto
            {
                Title = "Đặt hàng thành công",
                Description = "Đơn hàng đã được tạo thành công trên hệ thống",
                Time = o.CreatedAt.ToString("dd/MM/yyyy HH:mm"),
                IsCompleted = true,
                IsCurrent = o.Status == STATUS_PENDING
            });

            if (o.Status == STATUS_CANCELLED)
            {
                timeline.Add(new OrderTimelineItemDto
                {
                    Title = "Đơn hàng đã hủy",
                    Description = o.CancelReason ?? "Đơn hàng đã bị hủy theo yêu cầu",
                    Time = (o.CancelledAt ?? o.CreatedAt).ToString("dd/MM/yyyy HH:mm"),
                    IsCompleted = true,
                    IsCurrent = true
                });
                return timeline;
            }

            bool isConfirmed = o.Status >= STATUS_CONFIRMED && o.Status != STATUS_CANCELLED;
            timeline.Add(new OrderTimelineItemDto
            {
                Title = "Đã xác nhận đơn hàng",
                Description = "Đơn hàng đã được duyệt và tiến hành đóng gói",
                Time = isConfirmed ? o.CreatedAt.AddHours(2).ToString("dd/MM/yyyy HH:mm") : null,
                IsCompleted = isConfirmed,
                IsCurrent = o.Status == STATUS_CONFIRMED
            });

            bool isShipping = o.Status >= STATUS_SHIPPING && o.Status != STATUS_CANCELLED;
            timeline.Add(new OrderTimelineItemDto
            {
                Title = "Đang giao hàng",
                Description = "Kiện hàng đã bàn giao cho đơn vị vận chuyển",
                Time = isShipping ? o.CreatedAt.AddDays(1).ToString("dd/MM/yyyy HH:mm") : null,
                IsCompleted = isShipping,
                IsCurrent = o.Status == STATUS_SHIPPING
            });

            bool isCompleted = o.Status == STATUS_COMPLETED;
            timeline.Add(new OrderTimelineItemDto
            {
                Title = "Giao hàng thành công",
                Description = "Đơn hàng đã được giao tới tay khách hàng",
                Time = isCompleted ? o.CompletedAt?.ToString("dd/MM/yyyy HH:mm") : null,
                IsCompleted = isCompleted,
                IsCurrent = isCompleted
            });

            return timeline;
        }
    }
}