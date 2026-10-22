using System;
using System.Collections.Generic;

namespace fashionstore.Models.Dtos
{
    // =========================================================================
    // 1. DTO HIỂN THỊ DANH SÁCH ĐƠN HÀNG (/Account/Orders)
    // =========================================================================
    public class OrderListItemDto
    {
        public long Id { get; set; }
        public string OrderId { get; set; } = string.Empty;   // JS đọc order.orderId
        public string OrderCode { get; set; } = string.Empty;

        public string CreatedAt { get; set; } = string.Empty;

        // JS lọc theo các chữ thường: all, pending, shipping, completed, cancelled
        public string Status { get; set; } = "all";
        public string StatusLabel { get; set; } = string.Empty;
        public string StatusText { get; set; } = string.Empty;
        public string StatusClass { get; set; } = string.Empty;
        public string StatusBadgeClass { get; set; } = string.Empty;

        public string PaymentMethod { get; set; } = "COD";
        public string PaymentStatus { get; set; } = "Chưa thanh toán";
        public string PaymentClass { get; set; } = "ll-badge-payment--pending";

        public decimal Total { get; set; }                    // JS đọc order.total
        public decimal TotalAmount { get; set; }
        public int TotalItems { get; set; }

        public bool CanCancel { get; set; }
        public bool CanReturn { get; set; }

        public OrderRecipientDto Recipient { get; set; } = new();
        public List<OrderItemSummaryDto> Items { get; set; } = new();
    }

    public class OrderRecipientDto
    {
        public string Name { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
    }

    public class OrderItemSummaryDto
    {
        public long ProductId { get; set; }
        public long? VariantId { get; set; }

        public string Name { get; set; } = string.Empty;        // JS đọc item.name
        public string ProductName { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = "/images/product-placeholder.png"; // JS đọc item.imageUrl
        public string ThumbnailUrl { get; set; } = "/images/product-placeholder.png";

        public string? Color { get; set; }
        public string? Size { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal LineTotal { get; set; }
    }

    // =========================================================================
    // 2. DTO HIỂN THỊ CHI TIẾT 1 ĐƠN HÀNG (/Account/OrderDetail)
    // =========================================================================
    public class OrderDetailDto
    {
        public long Id { get; set; }
        public string OrderId { get; set; } = string.Empty;
        public string OrderCode { get; set; } = string.Empty;
        public string CreatedAt { get; set; } = string.Empty;
        public string? CompletedAt { get; set; }

        public string Status { get; set; } = string.Empty;
        public string StatusLabel { get; set; } = string.Empty;
        public string StatusText { get; set; } = string.Empty;
        public string StatusClass { get; set; } = string.Empty;
        public string StatusBadgeClass { get; set; } = string.Empty;

        public string ReceiverName { get; set; } = string.Empty;
        public string ReceiverPhone { get; set; } = string.Empty;
        public string ShippingAddress { get; set; } = string.Empty;
        public string? Note { get; set; }
        public string? CancelReason { get; set; }

        public string PaymentMethod { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;
        public decimal Subtotal { get; set; }
        public decimal ShippingFee { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal Total { get; set; }
        public decimal TotalAmount { get; set; }

        public bool CanCancel { get; set; }
        public bool CanReturn { get; set; }

        public OrderRecipientDto Recipient { get; set; } = new();
        public List<OrderItemSummaryDto> Items { get; set; } = new();
        public List<OrderTimelineItemDto> Timeline { get; set; } = new();
    }

    public class OrderTimelineItemDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Time { get; set; }
        public bool IsCompleted { get; set; }
        public bool IsCurrent { get; set; }
    }

    // =========================================================================
    // 3. DTO HỨNG THAO TÁC HỦY & ĐỔI TRẢ ĐƠN HÀNG
    // =========================================================================
    public class CancelOrderRequestDto
    {
        public string Reason { get; set; } = string.Empty;
        public string? Note { get; set; }
    }

    public class ReturnOrderRequestDto
    {
        public string Reason { get; set; } = string.Empty;
        public string? Note { get; set; }
        public string? BankName { get; set; }
        public string? AccountNumber { get; set; }
        public string? AccountHolder { get; set; }
    }
}