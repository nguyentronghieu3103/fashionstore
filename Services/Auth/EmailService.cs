using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace fashionstore.Services.Auth
{
    // 1. Bản hợp đồng gửi Email
    public interface IEmailService
    {
        Task SendOtpEmailAsync(string toEmail, string fullName, string otpCode);
        Task SendPasswordResetLinkAsync(string toEmail, string fullName, string resetLink);
    }

    // 2. Người thợ gửi Email qua máy chủ SMTP của Gmail
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;

        // Nhận IConfiguration để đọc SenderEmail và AppPassword từ file secrets.json
        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendOtpEmailAsync(string toEmail, string fullName, string otpCode)
        {
            var senderEmail = _config["EmailSettings:SenderEmail"]!;
            var senderName = _config["EmailSettings:SenderName"] ?? "LIGHT LIFE FASHION";
            // Xóa khoảng trắng thừa trong 16 chữ cái App Password
            var appPassword = (_config["EmailSettings:AppPassword"] ?? "").Replace(" ", "");

            // Cấu hình kết nối tới bưu điện của Gmail (smtp.gmail.com, cổng 587)
            using var smtpClient = new SmtpClient("smtp.gmail.com", 587)
            {
                EnableSsl = true, // Bắt buộc mã hóa bảo mật SSL/TLS
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(senderEmail, appPassword)
            };

            // Thiết kế nội dung bức thư HTML gửi cho khách hàng
            string subject = $"[{otpCode}] Mã xác thực đăng ký tài khoản LIGHT LIFE";
            string htmlBody = $@"
                <div style='font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;'>
                    <h2 style='color: #5c1d24; margin-top: 0;'>LIGHT LIFE FASHION STUDIO</h2>
                    <p>Xin chào <strong>{fullName}</strong>,</p>
                    <p>Cảm ơn bạn đã đăng ký tài khoản tại LIGHT LIFE. Mã xác thực (OTP) của bạn là:</p>
                    <div style='background: #f9fafb; padding: 16px; text-align: center; border-radius: 8px; margin: 20px 0;'>
                        <span style='font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #5c1d24;'>{otpCode}</span>
                    </div>
                    <p style='color: #6b7280; font-size: 13px;'>Mã này có hiệu lực trong vòng <strong>5 phút</strong>. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
                </div>";

            using var mailMessage = new MailMessage
            {
                From = new MailAddress(senderEmail, senderName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };

            mailMessage.To.Add(toEmail);

            // Bắn bức thư đi!
            await smtpClient.SendMailAsync(mailMessage);
        }

        public async Task SendPasswordResetLinkAsync(string toEmail, string fullName, string resetLink)
        {
            var displayName = string.IsNullOrWhiteSpace(fullName) ? "Quý khách" : fullName;
            var senderEmail = _config["EmailSettings:SenderEmail"]!;
            var senderName = _config["EmailSettings:SenderName"] ?? "LIGHT LIFE FASHION";
            var appPassword = (_config["EmailSettings:AppPassword"] ?? "").Replace(" ", "");

            var subject = "[LIGHT LIFE] Liên kết khôi phục mật khẩu tài khoản của bạn";

            var htmlBody = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e8e0dc; border-radius: 12px; overflow: hidden; background-color: #ffffff;'>
                    <div style='background-color: #5c1d24; padding: 24px; text-align: center; color: #ffffff;'>
                        <h2 style='margin: 0; letter-spacing: 2px; font-weight: 700;'>LIGHT LIFE</h2>
                        <p style='margin: 4px 0 0 0; font-size: 12px; opacity: 0.85;'>FASHION STUDIO</p>
                    </div>
                    <div style='padding: 32px 24px; color: #333333; line-height: 1.6;'>
                        <h3 style='margin-top: 0; color: #5c1d24;'>Xin chào {displayName},</h3>
                        <p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản <strong>{toEmail}</strong> tại hệ thống LIGHT LIFE.</p>
                        <p>Vui lòng nhấn vào nút bên dưới để thiết lập mật khẩu mới (liên kết có hiệu lực trong vòng <strong>15 phút</strong>):</p>
                        
                        <div style='text-align: center; margin: 32px 0;'>
                            <a href='{resetLink}' style='background-color: #5c1d24; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;'>
                                ĐẶT LẠI MẬT KHẨU MỚI
                            </a>
                        </div>

                        <p style='font-size: 13px; color: #666666;'>Nếu nút trên không hoạt động, bạn có thể copy và dán đường dẫn sau vào trình duyệt:</p>
                        <p style='font-size: 12px; word-break: break-all; background: #faf7f5; padding: 10px; border-radius: 6px; color: #5c1d24;'>{resetLink}</p>
                        
                        <hr style='border: none; border-top: 1px solid #eee; margin: 24px 0;' />
                        <p style='font-size: 12px; color: #888888; margin: 0;'>Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn hoàn toàn an toàn.</p>
                    </div>
                </div>";

            // Kết nối tới bưu điện Gmail (giống hệt hàm SendOtpEmailAsync)
            using var smtpClient = new SmtpClient("smtp.gmail.com", 587)
            {
                EnableSsl = true,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(senderEmail, appPassword)
            };

            using var mailMessage = new MailMessage
            {
                From = new MailAddress(senderEmail, senderName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };

            mailMessage.To.Add(toEmail);

            await smtpClient.SendMailAsync(mailMessage);
        }
    }
}