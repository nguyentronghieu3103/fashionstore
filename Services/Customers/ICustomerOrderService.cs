using System.Collections.Generic;
using System.Threading.Tasks;
using fashionstore.Models.Dtos;
using fashionstore.Services.Auth; 

namespace fashionstore.Services.Customers
{
    public interface ICustomerOrderService
    {
        Task<List<OrderListItemDto>> GetMyOrdersAsync(string userId, string? status, string? search);
        Task<OrderDetailDto?> GetOrderDetailAsync(string userId, long orderId);
        Task<OrderDetailDto?> GetOrderDetailByCodeAsync(string userId, string orderCode);
        Task<AuthResult> CancelOrderAsync(string userId, long orderId, CancelOrderRequestDto dto);
        Task<AuthResult> RequestReturnOrderAsync(string userId, long orderId, ReturnOrderRequestDto dto);
    }
}