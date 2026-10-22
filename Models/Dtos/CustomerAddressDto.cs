using System;
using System.Collections.Generic;

namespace fashionstore.Models.ViewModels
{
    // 1. Khay nhận dữ liệu khi khách Thêm mới hoặc Sửa địa chỉ
    public class SaveAddressRequestDto
    {
        public long? Id { get; set; } // null nếu là thêm mới, có số ID nếu là sửa địa chỉ cũ
        public string ReceiverName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Province { get; set; } = string.Empty;       // Tỉnh / Thành phố mới (34 đơn vị sau sáp nhập)
        public string? District { get; set; }                      // Quận / Huyện cũ (tùy chọn, không bắt buộc)
        public string Ward { get; set; } = string.Empty;           // Phường / Xã / Đặc khu
        public string DetailAddress { get; set; } = string.Empty;   // Số nhà, tên đường, thôn, buôn...
        public bool IsDefault { get; set; }

        // Hàm tự động ghép chuỗi chuẩn hóa AddressLine để lưu vào bảng CustomerAddresses
        public string BuildAddressLine()
        {
            var parts = new List<string>();
            if (!string.IsNullOrWhiteSpace(DetailAddress)) parts.Add(DetailAddress.Trim());
            if (!string.IsNullOrWhiteSpace(Ward)) parts.Add(Ward.Trim());
            if (!string.IsNullOrWhiteSpace(District)) parts.Add(District.Trim());
            if (!string.IsNullOrWhiteSpace(Province)) parts.Add(Province.Trim());
            return string.Join(", ", parts);
        }
    }

    // 2. Khay gửi dữ liệu địa chỉ ra ngoài cho giao diện hiển thị
    public class AddressItemDto
    {
        public long Id { get; set; }
        public string ReceiverName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string AddressLine { get; set; } = string.Empty;
        public bool IsDefault { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}