using System.ComponentModel.DataAnnotations;

namespace fashionstore.Models.ViewModels
{
    public class LoginViewModel
    {
        [Required(ErrorMessage = "Vui lòng nhập Tên đăng nhập hoặc Email")]
        [Display(Name = "Tên đăng nhập hoặc Email")]
        public string Email { get; set; } = string.Empty;

        // Ô nhập mật khẩu
        [Required(ErrorMessage = "Vui lòng nhập Mật khẩu")]
        [DataType(DataType.Password)]
        [Display(Name = "Mật khẩu")]
        public string Password { get; set; } = string.Empty;

        // Ô tích chọn "Ghi nhớ đăng nhập"
        [Display(Name = "Ghi nhớ đăng nhập")]
        public bool RememberMe { get; set; }

        // Đường dẫn người dùng muốn vào trước khi bị chuyển về trang đăng nhập
        // Ví dụ: Khách đang ở trang giỏ hàng /Checkout mà bấm đăng nhập thì ReturnUrl = "/Checkout"
        public string ReturnUrl { get; set; } = string.Empty;
    }
}
