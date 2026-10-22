using fashionstore.Models;
using fashionstore.Models.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using fashionstore.Models.Dtos;
using fashionstore.Models.EF;  
namespace fashionstore.Services.Auth
{
    // 1. Gói kết quả trả về từ Service cho Controller
    public class AuthResult
    {
        public bool Succeeded { get; set; }
        public string Message { get; set; } = string.Empty;
        public string ErrorMessage { get; set; } = string.Empty;
        public AspNetUser? User { get; set; }
        public string RoleName { get; set; } = "Customer";
    }

    // 2. Bản hợp đồng (Interface) quy định các việc AccountService phải làm
    public interface IAccountService
    {
        Task<AuthResult> LoginAsync(string userNameOrEmail, string password);
        Task<AuthResult> LoginWithGoogleAsync(string googleKey, string email, string fullName);
        Task<AspNetUser?> GetProfileAsync(string userId);
        Task<AuthResult> UpdateProfileAsync(string userId, string fullName, string? phone);
        Task<AuthResult> RegisterAndSendOtpAsync(string fullName, string email, string password);
        Task<AuthResult> VerifyRegisterOtpAsync(string email, string otpCode);
        Task<AuthResult> ResendOtpAsync(string email);
        Task<AuthResult> ChangePasswordAsync(string userId, ChangePasswordRequestDto dto);
        Task<AuthResult> SendForgotPasswordLinkAsync(string email, string baseUrl);
        Task<AuthResult> ValidateResetTokenAsync(string email, string token);
        Task<AuthResult> ResetPasswordAsync(ResetPasswordRequestDto dto);
    }

    // 3. Người thợ thực thi (Class AccountService): Chuyên làm việc với Database và PasswordHasher
    public class AccountService : IAccountService
    {
        private readonly LightLifeDbContext _context;
        private readonly IPasswordHasher<AspNetUser> _passwordHasher;
        private readonly IEmailService _emailService;

        public AccountService( LightLifeDbContext context, IPasswordHasher<AspNetUser> passwordHasher, IEmailService _emailServiceInput)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _emailService = _emailServiceInput;
        }

        // Nghiệp vụ 1: Kiểm tra đăng nhập bằng Tên đăng nhập/Email + Mật khẩu
        public async Task<AuthResult> LoginAsync(string userNameOrEmail, string password)
        {
            var user = await _context.AspNetUsers
                .Include(u => u.AspNetUserRole)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.UserName == userNameOrEmail
                                       || u.Email == userNameOrEmail);

            if (user == null)
            {
                return new AuthResult { Succeeded = false, ErrorMessage = "Tên đăng nhập hoặc mật khẩu không chính xác." };
            }

            if (!user.IsActive)
            {
                return new AuthResult { Succeeded = false, ErrorMessage = "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin." };
            }

            if (string.IsNullOrEmpty(user.PasswordHash))
            {
                return new AuthResult { Succeeded = false, ErrorMessage = "Tài khoản này đăng nhập bằng Google. Vui lòng bấm nút Tiếp tục với Google." };
            }

            var verifyResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password);
            if (verifyResult == PasswordVerificationResult.Failed)
            {
                return new AuthResult { Succeeded = false, ErrorMessage = "Tên đăng nhập hoặc mật khẩu không chính xác." };
            }

            string roleName = user.AspNetUserRole?.Role?.Name ?? "Customer";
            return new AuthResult { Succeeded = true, User = user, RoleName = roleName };
        }

        // Nghiệp vụ 2: Kiểm tra hoặc tự động tạo tài khoản khi đăng nhập bằng Google (Phương án G2)
        public async Task<AuthResult> LoginWithGoogleAsync(string googleKey, string email, string fullName)
        {
            var user = await _context.AspNetUsers
                .Include(u => u.AspNetUserRole)
                    .ThenInclude(ur => ur.Role)
                .Include(u => u.AspNetUserLogins)
                .FirstOrDefaultAsync(u => u.Email == email
                    || u.AspNetUserLogins.Any(l => l.LoginProvider == "Google" && l.ProviderKey == googleKey));

            // Kịch bản A: Tài khoản đã có trong DB (Admin, Nhân viên hoặc Khách hàng cũ)
            if (user != null)
            {
                if (!user.IsActive)
                {
                    return new AuthResult { Succeeded = false, ErrorMessage = "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin." };
                }

                // Nếu chưa ghi liên kết Google vào bảng AspNetUserLogins thì ghi thêm vào
                if (!user.AspNetUserLogins.Any(l => l.LoginProvider == "Google" && l.ProviderKey == googleKey))
                {
                    _context.AspNetUserLogins.Add(new AspNetUserLogin
                    {
                        LoginProvider = "Google",
                        ProviderKey = googleKey,
                        ProviderDisplayName = "Google",
                        UserId = user.Id
                    });
                    await _context.SaveChangesAsync();
                }

                string existingRole = user.AspNetUserRole?.Role?.Name ?? "Customer";
                return new AuthResult { Succeeded = true, User = user, RoleName = existingRole };
            }

            // Kịch bản B: Khách hàng mới tinh lần đầu bấm Google -> Tạo mới trong Transaction
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var newUserId = Guid.NewGuid().ToString();
                var newUser = new AspNetUser
                {
                    Id = newUserId,
                    UserName = email,
                    NormalizedUserName = email.ToUpperInvariant(),
                    Email = email,
                    NormalizedEmail = email.ToUpperInvariant(),
                    EmailConfirmed = true,
                    SecurityStamp = Guid.NewGuid().ToString(),
                    ConcurrencyStamp = Guid.NewGuid().ToString(),
                    FullName = fullName,
                    IsActive = true,
                    LockoutEnabled = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.AspNetUsers.Add(newUser);

                var customerRole = await _context.AspNetRoles.FirstAsync(r => r.Name == "Customer");
                _context.AspNetUserRoles.Add(new AspNetUserRole
                {
                    UserId = newUserId,
                    RoleId = customerRole.Id
                });

                _context.AspNetUserLogins.Add(new AspNetUserLogin
                {
                    LoginProvider = "Google",
                    ProviderKey = googleKey,
                    ProviderDisplayName = "Google",
                    UserId = newUserId
                });

                _context.Customers.Add(new Customer
                {
                    UserId = newUserId,
                    FullName = fullName,
                    Email = email,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return new AuthResult { Succeeded = true, User = newUser, RoleName = "Customer" };
            }
            catch
            {
                await transaction.RollbackAsync();
                return new AuthResult { Succeeded = false, ErrorMessage = "Đã xảy ra lỗi khi khởi tạo tài khoản Google." };
            }
        }
        // Nghiêp vụ 3: Lấy thông tin tài khoản kèm hồ sơ khách hàng để hiện ở trang Profile
        public async Task<AspNetUser?> GetProfileAsync(string userId)
        {
            return await _context.AspNetUsers
                .Include(u => u.Customer)
                .FirstOrDefaultAsync(u => u.Id == userId);
        }
        // Nghiệp vụ 4: Lưu thay đổi Họ tên và Số điện thoại khi khách bấm "Lưu thay đổi"
        public async Task<AuthResult> UpdateProfileAsync(string userId, string fullName, string? phone)
        {
            var user = await _context.AspNetUsers
                .Include(u => u.AspNetUserRole)
                    .ThenInclude(ur => ur.Role)
                .Include(u => u.Customer)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return new AuthResult { Succeeded = false, ErrorMessage = "Không tìm thấy tài khoản." };
            }

            // Chuẩn hóa số điện thoại (nếu để trống thì lưu null để không đụng Unique Index trong SQL)
            string? cleanPhone = string.IsNullOrWhiteSpace(phone) ? null : phone.Trim();

            // Kiểm tra xem số điện thoại mới có bị trùng với khách hàng khác trong bảng Customers không
            if (cleanPhone != null)
            {
                bool phoneExists = await _context.Customers
                    .AnyAsync(c => c.Phone == cleanPhone && c.UserId != userId);
                if (phoneExists)
                {
                    return new AuthResult { Succeeded = false, ErrorMessage = "Số điện thoại này đã được sử dụng bởi tài khoản khác." };
                }
            }

            // 1. Cập nhật vào bảng AspNetUsers
            user.FullName = fullName.Trim();
            user.PhoneNumber = cleanPhone;

            // 2. Đồng bộ sang bảng Customers (hồ sơ đặt hàng)
            if (user.Customer != null)
            {
                user.Customer.FullName = fullName.Trim();
                user.Customer.Phone = cleanPhone;
            }

            await _context.SaveChangesAsync();

            string roleName = user.AspNetUserRole?.Role?.Name ?? "Customer";
            return new AuthResult { Succeeded = true, User = user, RoleName = roleName };
        }
        // Nghiệp vụ 5: Đăng ký tài khoản ở trạng thái chờ + Sinh mã OTP 6 số gửi về Gmail
        public async Task<AuthResult> RegisterAndSendOtpAsync(string fullName, string email, string password)
        {
            string cleanEmail = email.Trim().ToLowerInvariant();

            // 1. Kiểm tra xem email này đã có trong hệ thống chưa
            var existingUser = await _context.AspNetUsers.FirstOrDefaultAsync(u => u.Email == cleanEmail);
            if (existingUser != null && existingUser.EmailConfirmed)
            {
                return new AuthResult { Succeeded = false, ErrorMessage = "Địa chỉ email này đã được sử dụng. Vui lòng đăng nhập." };
            }

            AspNetUser user;
            if (existingUser != null)
            {
                // Trường hợp khách đã từng bấm đăng ký nhưng chưa nhập OTP: dùng lại tài khoản đó
                user = existingUser;
                user.FullName = fullName.Trim();
                user.PasswordHash = _passwordHasher.HashPassword(user, password);
            }
            else
            {
                // Tạo tài khoản mới tinh với EmailConfirmed = false (chưa xác minh)
                var newUserId = Guid.NewGuid().ToString();
                user = new AspNetUser
                {
                    Id = newUserId,
                    UserName = cleanEmail,
                    NormalizedUserName = cleanEmail.ToUpperInvariant(),
                    Email = cleanEmail,
                    NormalizedEmail = cleanEmail.ToUpperInvariant(),
                    EmailConfirmed = false, // <-- Chưa xác minh
                    SecurityStamp = Guid.NewGuid().ToString(),
                    ConcurrencyStamp = Guid.NewGuid().ToString(),
                    FullName = fullName.Trim(),
                    IsActive = true,
                    LockoutEnabled = true,
                    CreatedAt = DateTime.UtcNow
                };
                user.PasswordHash = _passwordHasher.HashPassword(user, password);
                _context.AspNetUsers.Add(user);

                // Gán Role Customer
                var customerRole = await _context.AspNetRoles.FirstAsync(r => r.Name == "Customer");
                _context.AspNetUserRoles.Add(new AspNetUserRole
                {
                    UserId = newUserId,
                    RoleId = customerRole.Id
                });
            }

            // 2. Sinh mã OTP ngẫu nhiên 6 chữ số (từ 100000 đến 999999)
            string otpCode = new Random().Next(100000, 999999).ToString();
            DateTime expiryTime = DateTime.UtcNow.AddMinutes(5); // Hết hạn sau 5 phút

            // 3. Cất mã OTP vào bảng AspNetUserTokens có sẵn trong database của bạn!
            var existingToken = await _context.AspNetUserTokens
                .FirstOrDefaultAsync(t => t.UserId == user.Id && t.LoginProvider == "EmailVerification" && t.Name == "RegisterOTP");

            if (existingToken != null)
            {
                existingToken.Value = $"{otpCode}|{expiryTime:O}";
            }
            else
            {
                _context.AspNetUserTokens.Add(new AspNetUserToken
                {
                    UserId = user.Id,
                    LoginProvider = "EmailVerification",
                    Name = "RegisterOTP",
                    Value = $"{otpCode}|{expiryTime:O}"
                });
            }

            await _context.SaveChangesAsync();

            // 4. Bắn bức thư chứa mã OTP về hòm thư Gmail thật của khách hàng!
            try
            {
                await _emailService.SendOtpEmailAsync(cleanEmail, user.FullName, otpCode);
            }
            catch (Exception ex)
            {
                return new AuthResult { Succeeded = false, ErrorMessage = $"Lỗi khi gửi email: {ex.Message}" };
            }

            return new AuthResult { Succeeded = true, User = user, RoleName = "Customer" };
        }
        // Nghiệp vụ 6: Kiểm tra mã OTP 6 số khách gõ vào
        public async Task<AuthResult> VerifyRegisterOtpAsync(string email, string otpCode)
        {
            string cleanEmail = email.Trim().ToLowerInvariant();
            var user = await _context.AspNetUsers.FirstOrDefaultAsync(u => u.Email == cleanEmail);

            if (user == null)
            {
                return new AuthResult { Succeeded = false, ErrorMessage = "Không tìm thấy thông tin đăng ký của email này." };
            }

            // Tìm mã OTP trong bảng AspNetUserTokens
            var token = await _context.AspNetUserTokens
                .FirstOrDefaultAsync(t => t.UserId == user.Id && t.LoginProvider == "EmailVerification" && t.Name == "RegisterOTP");

            if (token == null || string.IsNullOrEmpty(token.Value))
            {
                return new AuthResult { Succeeded = false, ErrorMessage = "Mã xác thực không tồn tại hoặc đã hết hạn. Vui lòng bấm Gửi lại mã." };
            }

            // Mở gói dữ liệu "Mã_OTP|Thời_gian_hết_hạn"
            var parts = token.Value.Split('|');
            if (parts.Length < 2)
            {
                return new AuthResult { Succeeded = false, ErrorMessage = "Mã xác thực không hợp lệ." };
            }

            string storedOtp = parts[0];
            DateTime expiryTime = DateTime.Parse(parts[1], null, System.Globalization.DateTimeStyles.RoundtripKind);

            // Kiểm tra xem đã quá 5 phút chưa
            if (DateTime.UtcNow > expiryTime)
            {
                return new AuthResult { Succeeded = false, ErrorMessage = "Mã OTP đã hết hạn (chỉ có hiệu lực trong 5 phút). Vui lòng yêu cầu gửi lại mã mới." };
            }

            // Kiểm tra xem 6 số khách gõ có khớp không
            if (storedOtp != otpCode.Trim())
            {
                return new AuthResult { Succeeded = false, ErrorMessage = "Mã xác thực OTP không chính xác. Vui lòng kiểm tra lại hòm thư." };
            }

            // MÃ CHÍNH XÁC 100%! Tiến hành kích hoạt tài khoản
            user.EmailConfirmed = true; // Bật cờ đã xác minh email!
            _context.AspNetUserTokens.Remove(token); // Xóa mã OTP đi để không bị dùng lại lần 2

            // Tạo hồ sơ trong bảng Customers nếu chưa có
            bool hasCustomerProfile = await _context.Customers.AnyAsync(c => c.UserId == user.Id);
            if (!hasCustomerProfile)
            {
                _context.Customers.Add(new Customer
                {
                    UserId = user.Id,
                    FullName = user.FullName,
                    Email = user.Email,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();

            return new AuthResult { Succeeded = true, User = user, RoleName = "Customer" };
        }
        // Nghiệp vụ 7: Sinh mã OTP mới và gửi lại cho khách
        public async Task<AuthResult> ResendOtpAsync(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                return new AuthResult { Succeeded = false, ErrorMessage = "Email không hợp lệ." };
            }

            string cleanEmail = email.Trim().ToLowerInvariant();
            var user = await _context.AspNetUsers.FirstOrDefaultAsync(u => u.Email == cleanEmail);

            if (user == null)
            {
                return new AuthResult { Succeeded = false, ErrorMessage = "Không tìm thấy tài khoản tương ứng với email này." };
            }

            if (user.EmailConfirmed)
            {
                return new AuthResult { Succeeded = false, ErrorMessage = "Tài khoản này đã được xác thực rồi. Vui lòng đăng nhập." };
            }

            // Sinh mã 6 số ngẫu nhiên mới và gia hạn thêm 5 phút
            string otpCode = new Random().Next(100000, 999999).ToString();
            DateTime expiryTime = DateTime.UtcNow.AddMinutes(5);

            // Cập nhật lại vào bảng AspNetUserTokens
            var token = await _context.AspNetUserTokens
                .FirstOrDefaultAsync(t => t.UserId == user.Id && t.LoginProvider == "EmailVerification" && t.Name == "RegisterOTP");

            if (token != null)
            {
                token.Value = $"{otpCode}|{expiryTime:O}";
            }
            else
            {
                _context.AspNetUserTokens.Add(new AspNetUserToken
                {
                    UserId = user.Id,
                    LoginProvider = "EmailVerification",
                    Name = "RegisterOTP",
                    Value = $"{otpCode}|{expiryTime:O}"
                });
            }

            await _context.SaveChangesAsync();

            // Bắn thư mới về Gmail
            await _emailService.SendOtpEmailAsync(cleanEmail, user.FullName, otpCode);

            return new AuthResult { Succeeded = true, Message = "Mã OTP mới đã được gửi về Gmail của bạn!" };
        }
        // nghiệp vụ 8: Đổi mật khẩu cho khách hàng đã đăng nhập
        public async Task<AuthResult> ChangePasswordAsync(string userId, ChangePasswordRequestDto dto)
        {
            // 1. Kiểm tra rỗng
            if (string.IsNullOrWhiteSpace(dto.CurrentPassword) || string.IsNullOrWhiteSpace(dto.NewPassword) || string.IsNullOrWhiteSpace(dto.ConfirmPassword))
            {
                return new AuthResult
                {
                    Succeeded = false,
                    ErrorMessage = "Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới."
                };
            }

            // 2. Kiểm tra độ mạnh mật khẩu mới (>= 8 ký tự, có cả chữ và số)
            bool hasMinLength = dto.NewPassword.Length >= 8;
            bool hasLetter = dto.NewPassword.Any(char.IsLetter);
            bool hasDigit = dto.NewPassword.Any(char.IsDigit);

            if (!hasMinLength || !hasLetter || !hasDigit)
            {
                return new AuthResult
                {
                    Succeeded = false,
                    ErrorMessage = "Mật khẩu mới phải có tối thiểu 8 ký tự, bao gồm cả chữ cái (a-z, A-Z) và chữ số (0-9)."
                };
            }

            // 3. Kiểm tra xác nhận mật khẩu có khớp không
            if (dto.NewPassword != dto.ConfirmPassword)
            {
                return new AuthResult
                {
                    Succeeded = false,
                    ErrorMessage = "Xác nhận mật khẩu mới không khớp."
                };
            }

            // 4. Kiểm tra mật khẩu mới không được trùng mật khẩu cũ
            if (dto.NewPassword == dto.CurrentPassword)
            {
                return new AuthResult
                {
                    Succeeded = false,
                    ErrorMessage = "Mật khẩu mới không được trùng với mật khẩu đang sử dụng."
                };
            }

            // 5. Tìm tài khoản trong Database
            var user = await _context.AspNetUsers.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                return new AuthResult
                {
                    Succeeded = false,
                    ErrorMessage = "Không tìm thấy thông tin tài khoản."
                };
            }

            // Kiểm tra trường hợp tài khoản đăng nhập bằng Google chưa từng có PasswordHash
            if (string.IsNullOrEmpty(user.PasswordHash))
            {
                return new AuthResult
                {
                    Succeeded = false,
                    ErrorMessage = "Tài khoản của bạn đăng nhập qua Google nên chưa thiết lập mật khẩu riêng."
                };
            }

            // 6. Xác thực mật khẩu hiện tại bằng PasswordHasher
            var verifyResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.CurrentPassword);
            if (verifyResult == PasswordVerificationResult.Failed)
            {
                return new AuthResult
                {
                    Succeeded = false,
                    ErrorMessage = "Mật khẩu hiện tại không chính xác."
                };
            }

            // 7. Băm (Hash) mật khẩu mới và lưu xuống SQL Server
            user.PasswordHash = _passwordHasher.HashPassword(user, dto.NewPassword);
            user.SecurityStamp = Guid.NewGuid().ToString(); // Làm mới SecurityStamp để vô hiệu hóa các phiên cũ

            await _context.SaveChangesAsync();

            return new AuthResult
            {
                Succeeded = true,
                Message = "Đổi mật khẩu thành công! Vui lòng đăng nhập lại bằng mật khẩu mới."
            };
        }
        // Nghiệp vụ 9: TẠO TOKEN 15 PHÚT VÀ GỬI LINK KHÔI PHỤC QUA GMAIL
        public async Task<AuthResult> SendForgotPasswordLinkAsync(string email, string baseUrl)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                return new AuthResult { Succeeded = false, ErrorMessage = "Vui lòng nhập địa chỉ email tài khoản." };
            }

            var cleanEmail = email.Trim();
            var normalizedEmail = cleanEmail.ToUpperInvariant();

            var user = await _context.AspNetUsers
                .FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail || u.Email == cleanEmail);

            if (user == null)
            {
                return new AuthResult { Succeeded = false, ErrorMessage = "Email này chưa được đăng ký trong hệ thống." };
            }

            // Sinh chuỗi Token bảo mật ngẫu nhiên (32 ký tự không dấu gạch ngang)
            string rawToken = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
            DateTime expiryTime = DateTime.UtcNow.AddMinutes(15); // Hạn đúng 15 phút
            string tokenValue = $"{rawToken}|{expiryTime:O}";

            // Lưu hoặc cập nhật vào bảng AspNetUserTokens
            var existingToken = await _context.AspNetUserTokens.FirstOrDefaultAsync(t =>
                t.UserId == user.Id &&
                t.LoginProvider == "PasswordReset" &&
                t.Name == "ResetToken");

            if (existingToken != null)
            {
                existingToken.Value = tokenValue;
            }
            else
            {
                _context.AspNetUserTokens.Add(new AspNetUserToken
                {
                    UserId = user.Id,
                    LoginProvider = "PasswordReset",
                    Name = "ResetToken",
                    Value = tokenValue
                });
            }

            await _context.SaveChangesAsync();

            // Tạo đường dẫn khôi phục đầy đủ
            string encodedEmail = Uri.EscapeDataString(user.Email ?? cleanEmail);
            string encodedToken = Uri.EscapeDataString(rawToken);
            string resetLink = $"{baseUrl.TrimEnd('/')}/Account/ResetPassword?email={encodedEmail}&token={encodedToken}";

            // Lấy tên khách hàng để chào trong Email
            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId == user.Id);
            string fullName = customer?.FullName ?? user.UserName ?? "Quý khách";

            await _emailService.SendPasswordResetLinkAsync(user.Email ?? cleanEmail, fullName, resetLink);

            return new AuthResult
            {
                Succeeded = true,
                Message = "Liên kết khôi phục mật khẩu đã được gửi tới Gmail của bạn (hiệu lực trong 15 phút)."
            };
        }
        // nghiệp vụ 10: KIỂM TRA LINK HỢP LỆ KHI KHÁCH BẤM TỪ GMAIL MỞ TRANG RESET
        public async Task<AuthResult> ValidateResetTokenAsync(string email, string token)
        {
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(token))
            {
                return new AuthResult { Succeeded = false, ErrorMessage = "Liên kết khôi phục không hợp lệ hoặc bị thiếu thông tin." };
            }

            var normalizedEmail = email.Trim().ToUpperInvariant();
            var user = await _context.AspNetUsers
                .FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail || u.Email == email.Trim());

            if (user == null)
            {
                return new AuthResult { Succeeded = false, ErrorMessage = "Không tìm thấy tài khoản yêu cầu khôi phục." };
            }

            var userToken = await _context.AspNetUserTokens.FirstOrDefaultAsync(t =>
                t.UserId == user.Id &&
                t.LoginProvider == "PasswordReset" &&
                t.Name == "ResetToken");

            if (userToken == null || string.IsNullOrWhiteSpace(userToken.Value))
            {
                return new AuthResult { Succeeded = false, ErrorMessage = "Liên kết khôi phục đã được sử dụng hoặc không tồn tại." };
            }

            var parts = userToken.Value.Split('|');
            if (parts.Length != 2 || parts[0] != token.Trim())
            {
                return new AuthResult { Succeeded = false, ErrorMessage = "Mã bảo mật trong liên kết không chính xác." };
            }

            if (!DateTime.TryParse(parts[1], null, System.Globalization.DateTimeStyles.RoundtripKind, out DateTime expiryTime) ||
                DateTime.UtcNow > expiryTime)
            {
                // Xóa luôn token đã hết hạn
                _context.AspNetUserTokens.Remove(userToken);
                await _context.SaveChangesAsync();
                return new AuthResult { Succeeded = false, ErrorMessage = "Liên kết khôi phục đã hết hạn (quá 15 phút). Vui lòng yêu cầu gửi lại liên kết mới." };
            }

            return new AuthResult { Succeeded = true };
        }
        // nghiệp vụ 11: LƯU MẬT KHẨU MỚI & XÓA TOKEN (CHỈ DÙNG 1 LẦN)
        public async Task<AuthResult> ResetPasswordAsync(ResetPasswordRequestDto dto)
        {
            // B1: Kiểm tra lại Token lần cuối trước khi đổi
            var tokenCheck = await ValidateResetTokenAsync(dto.Email, dto.Token);
            if (!tokenCheck.Succeeded)
            {
                return tokenCheck;
            }

            // B2: Kiểm tra rỗng mật khẩu mới
            if (string.IsNullOrWhiteSpace(dto.NewPassword) || string.IsNullOrWhiteSpace(dto.ConfirmPassword))
            {
                return new AuthResult { Succeeded = false, ErrorMessage = "Vui lòng nhập mật khẩu mới và xác nhận mật khẩu." };
            }

            // B3: Kiểm tra độ mạnh mật khẩu (>= 8 ký tự, có cả chữ và số)
            bool hasMinLength = dto.NewPassword.Length >= 8;
            bool hasLetter = dto.NewPassword.Any(char.IsLetter);
            bool hasDigit = dto.NewPassword.Any(char.IsDigit);

            if (!hasMinLength || !hasLetter || !hasDigit)
            {
                return new AuthResult
                {
                    Succeeded = false,
                    ErrorMessage = "Mật khẩu mới phải có tối thiểu 8 ký tự, bao gồm cả chữ cái (a-z, A-Z) và chữ số (0-9)."
                };
            }

            // B4: Kiểm tra khớp xác nhận mật khẩu
            if (dto.NewPassword != dto.ConfirmPassword)
            {
                return new AuthResult { Succeeded = false, ErrorMessage = "Xác nhận mật khẩu mới không khớp." };
            }

            var normalizedEmail = dto.Email.Trim().ToUpperInvariant();
            var user = await _context.AspNetUsers
                .FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail || u.Email == dto.Email.Trim());

            if (user == null)
            {
                return new AuthResult { Succeeded = false, ErrorMessage = "Không tìm thấy tài khoản." };
            }

            // B5: Không cho đặt trùng lại mật khẩu cũ (nếu tài khoản đã có mật khẩu trước đó)
            if (!string.IsNullOrEmpty(user.PasswordHash))
            {
                var sameAsOld = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, dto.NewPassword);
                if (sameAsOld != PasswordVerificationResult.Failed)
                {
                    return new AuthResult { Succeeded = false, ErrorMessage = "Mật khẩu mới không được trùng với mật khẩu cũ của bạn." };
                }
            }

            // B6: Mã hóa mật khẩu mới và cập nhật SecurityStamp
            user.PasswordHash = _passwordHasher.HashPassword(user, dto.NewPassword);
            user.SecurityStamp = Guid.NewGuid().ToString();
            user.EmailConfirmed = true; // Kích hoạt luôn nếu trước đó chưa xác nhận

            // B7: Xóa Token khỏi AspNetUserTokens để link không thể dùng lại lần 2
            var usedToken = await _context.AspNetUserTokens.FirstOrDefaultAsync(t =>
                t.UserId == user.Id &&
                t.LoginProvider == "PasswordReset" &&
                t.Name == "ResetToken");

            if (usedToken != null)
            {
                _context.AspNetUserTokens.Remove(usedToken);
            }

            await _context.SaveChangesAsync();

            return new AuthResult
            {
                Succeeded = true,
                Message = "Đặt lại mật khẩu mới thành công! Vui lòng đăng nhập."
            };
        }
    }
}