using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using fashionstore.Models.Entities;
using fashionstore.Models.ViewModels;
using fashionstore.Models.Dtos;
using fashionstore.Services.Auth;
using fashionstore.Models.EF; 
namespace fashionstore.Services.Customers
{
    // Bản hợp đồng dịch vụ địa chỉ
    public interface ICustomerAddressService
    {
        Task<List<AddressItemDto>> GetAddressesAsync(string userId);
        Task<AuthResult> SaveAddressAsync(string userId, SaveAddressRequestDto dto);
        Task<AuthResult> SetDefaultAddressAsync(string userId, long addressId);
        Task<AuthResult> DeleteAddressAsync(string userId, long addressId);
    }

    // Người thợ thực thi xử lý Database
    public class CustomerAddressService : ICustomerAddressService
    {
        private readonly LightLifeDbContext _context;

        public CustomerAddressService(LightLifeDbContext context)
        {
            _context = context;
        }

        // Hàm phụ trợ: Lấy CustomerId hoặc tự tạo mới nếu tài khoản chưa có hồ sơ
        private async Task<Customer> GetOrCreateCustomerAsync(string userId)
        {
            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId == userId);
            if (customer == null)
            {
                var user = await _context.AspNetUsers.FirstOrDefaultAsync(u => u.Id == userId);
                customer = new Customer
                {
                    UserId = userId,
                    FullName = user?.FullName ?? "Khách hàng",
                    Email = user?.Email,
                    Phone = user?.PhoneNumber,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Customers.Add(customer);
                await _context.SaveChangesAsync();
            }
            return customer;
        }

        // 1. Lấy danh sách địa chỉ của khách hàng (Nếu chưa có thì trả về mảng rỗng để hiện Empty State)
        public async Task<List<AddressItemDto>> GetAddressesAsync(string userId)
        {
            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId == userId);
            if (customer == null) return new List<AddressItemDto>();

            return await _context.CustomerAddresses
                .Where(a => a.CustomerId == customer.Id)
                .OrderByDescending(a => a.IsDefault)
                .ThenByDescending(a => a.CreatedAt)
                .Select(a => new AddressItemDto
                {
                    Id = a.Id,
                    ReceiverName = a.ReceiverName,
                    Phone = a.Phone,
                    AddressLine = a.AddressLine,
                    IsDefault = a.IsDefault,
                    CreatedAt = a.CreatedAt
                })
                .ToListAsync();
        }

        // 2. Thêm mới hoặc Cập nhật địa chỉ
        public async Task<AuthResult> SaveAddressAsync(string userId, SaveAddressRequestDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.ReceiverName) || string.IsNullOrWhiteSpace(dto.Phone))
            {
                return new AuthResult { Succeeded = false, ErrorMessage = "Vui lòng nhập tên người nhận và số điện thoại." };
            }

            string fullAddress = dto.BuildAddressLine();
            if (string.IsNullOrWhiteSpace(fullAddress))
            {
                return new AuthResult { Succeeded = false, ErrorMessage = "Vui lòng nhập đầy đủ địa chỉ giao hàng." };
            }

            var customer = await GetOrCreateCustomerAsync(userId);
            bool isFirstAddress = !await _context.CustomerAddresses.AnyAsync(a => a.CustomerId == customer.Id);
            bool shouldBeDefault = isFirstAddress || dto.IsDefault;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Nếu đặt làm mặc định: Phải hạ toàn bộ địa chỉ cũ về false trước để không nổ lỗi Unique Index!
                if (shouldBeDefault)
                {
                    var oldDefaults = await _context.CustomerAddresses
                        .Where(a => a.CustomerId == customer.Id && a.IsDefault && (dto.Id == null || a.Id != dto.Id))
                        .ToListAsync();

                    foreach (var addr in oldDefaults)
                    {
                        addr.IsDefault = false;
                    }
                    await _context.SaveChangesAsync();
                }

                if (dto.Id.HasValue && dto.Id.Value > 0)
                {
                    // Cập nhật địa chỉ cũ
                    var existing = await _context.CustomerAddresses
                        .FirstOrDefaultAsync(a => a.Id == dto.Id.Value && a.CustomerId == customer.Id);
                    if (existing == null)
                    {
                        return new AuthResult { Succeeded = false, ErrorMessage = "Không tìm thấy địa chỉ cần sửa." };
                    }

                    existing.ReceiverName = dto.ReceiverName.Trim();
                    existing.Phone = dto.Phone.Trim();
                    existing.AddressLine = fullAddress;
                    existing.IsDefault = shouldBeDefault;
                }
                else
                {
                    // Thêm địa chỉ mới
                    var newAddress = new CustomerAddress
                    {
                        CustomerId = customer.Id,
                        ReceiverName = dto.ReceiverName.Trim(),
                        Phone = dto.Phone.Trim(),
                        AddressLine = fullAddress,
                        IsDefault = shouldBeDefault,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.CustomerAddresses.Add(newAddress);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return new AuthResult { Succeeded = true, Message = "Lưu địa chỉ thành công!" };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return new AuthResult { Succeeded = false, ErrorMessage = $"Lỗi khi lưu địa chỉ: {ex.Message}" };
            }
        }

        // 3. Đổi địa chỉ mặc định
        public async Task<AuthResult> SetDefaultAddressAsync(string userId, long addressId)
        {
            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId == userId);
            if (customer == null) return new AuthResult { Succeeded = false, ErrorMessage = "Không tìm thấy khách hàng." };

            var targetAddress = await _context.CustomerAddresses
                .FirstOrDefaultAsync(a => a.Id == addressId && a.CustomerId == customer.Id);
            if (targetAddress == null) return new AuthResult { Succeeded = false, ErrorMessage = "Không tìm thấy địa chỉ." };

            if (targetAddress.IsDefault) return new AuthResult { Succeeded = true };

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Hạ địa chỉ mặc định cũ xuống false
                var currentDefaults = await _context.CustomerAddresses
                    .Where(a => a.CustomerId == customer.Id && a.IsDefault)
                    .ToListAsync();

                foreach (var addr in currentDefaults)
                {
                    addr.IsDefault = false;
                }
                await _context.SaveChangesAsync();

                // Bật địa chỉ mới lên true
                targetAddress.IsDefault = true;
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();
                return new AuthResult { Succeeded = true, Message = "Đã đặt làm địa chỉ mặc định." };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return new AuthResult { Succeeded = false, ErrorMessage = $"Lỗi khi đổi địa chỉ mặc định: {ex.Message}" };
            }
        }

        // 4. Xóa địa chỉ
        public async Task<AuthResult> DeleteAddressAsync(string userId, long addressId)
        {
            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId == userId);
            if (customer == null) return new AuthResult { Succeeded = false, ErrorMessage = "Không tìm thấy khách hàng." };

            var address = await _context.CustomerAddresses
                .FirstOrDefaultAsync(a => a.Id == addressId && a.CustomerId == customer.Id);
            if (address == null) return new AuthResult { Succeeded = false, ErrorMessage = "Không tìm thấy địa chỉ cần xóa." };

            bool wasDefault = address.IsDefault;
            _context.CustomerAddresses.Remove(address);
            await _context.SaveChangesAsync();

            // Nếu vừa xóa địa chỉ mặc định mà khách vẫn còn các địa chỉ khác -> đôn địa chỉ mới nhất lên làm mặc định
            if (wasDefault)
            {
                var nextDefault = await _context.CustomerAddresses
                    .Where(a => a.CustomerId == customer.Id)
                    .OrderByDescending(a => a.CreatedAt)
                    .FirstOrDefaultAsync();
                if (nextDefault != null)
                {
                    nextDefault.IsDefault = true;
                    await _context.SaveChangesAsync();
                }
            }

            return new AuthResult { Succeeded = true, Message = "Xóa địa chỉ thành công." };
        }
    }
}