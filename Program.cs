using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.EntityFrameworkCore;
using fashionstore.Models.Entities;
using fashionstore.Models.EF;
using fashionstore.Services.Customers;

namespace fashionstore
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.
            builder.Services.AddControllersWithViews()  
                .AddRazorOptions(options =>
                {
                    // 1. Phân hệ Quản trị & Nhân viên (Admin, Employee)
                    // {0}: Action, {1}: Controller, {2}: Area
                    options.AreaViewLocationFormats.Clear();
                    options.AreaViewLocationFormats.Add("/Views/{2}/{1}/{0}.cshtml");
                    options.AreaViewLocationFormats.Add("/Views/{2}/Shared/{0}.cshtml");
                    options.AreaViewLocationFormats.Add("/Views/Shared/{0}.cshtml");

                    // 2. Phân hệ Khách hàng (Customer / Storefront)
                    // {0}: Action, {1}: Controller
                    options.ViewLocationFormats.Clear();
                    options.ViewLocationFormats.Add("/Views/Customer/{1}/{0}.cshtml");
                    options.ViewLocationFormats.Add("/Views/{1}/{0}.cshtml");
                    options.ViewLocationFormats.Add("/Views/Shared/{0}.cshtml");
                });
            // Đăng ký dịch vụ Xác thực (Authentication)
            builder.Services.AddAuthentication(options =>
            {
                // Mặc định mọi hoạt động kiểm tra đăng nhập đều dựa trên Cookie
                options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = CookieAuthenticationDefaults.AuthenticationScheme;
            })
            .AddCookie(options =>
            {
                // Nếu ai đó chưa đăng nhập mà cố tình vào trang Admin/Nhân viên, đẩy họ về trang đăng nhập C01 này
                options.LoginPath = "/Account/Login";

                // Nếu tài khoản Khách hàng cố tình truy cập vào link của Admin (A01), đẩy về trang báo từ chối quyền
                options.AccessDeniedPath = "/Account/AccessDenied";

                // Thời hạn ghi nhớ đăng nhập (sau 7 ngày không quay lại thì bắt đăng nhập lại)
                options.ExpireTimeSpan = TimeSpan.FromDays(7);
            })
            .AddGoogle(options =>
            {
                // Tự động đọc ClientId và ClientSecret từ file secrets.json mà bạn đã lưu lúc nãy
                options.ClientId = builder.Configuration["Authentication:Google:ClientId"]!;
                options.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"]!;
            });
            builder.Services.AddScoped<Microsoft.AspNetCore.Identity.IPasswordHasher<fashionstore.Models.Entities.AspNetUser>,
                           Microsoft.AspNetCore.Identity.PasswordHasher<fashionstore.Models.Entities.AspNetUser>>();

            builder.Services.AddScoped<fashionstore.Services.Auth.IAccountService, fashionstore.Services.Auth.AccountService>();
            // Đăng ký chìa khóa kết nối Database LightLifeDb vào thùng đồ nghề
            builder.Services.AddDbContext<LightLifeDbContext>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

            builder.Services.AddScoped<fashionstore.Services.Auth.IEmailService, fashionstore.Services.Auth.EmailService>();

            builder.Services.AddScoped<fashionstore.Services.Customers.ICustomerAddressService, fashionstore.Services.Customers.CustomerAddressService>();
            builder.Services.AddScoped<ICustomerOrderService, CustomerOrderService>();

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (!app.Environment.IsDevelopment())
            {
                app.UseExceptionHandler("/Home/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            } 

            app.UseHttpsRedirection();
            app.UseRouting();
            app.UseAuthentication();
            app.UseAuthorization();

            app.MapStaticAssets();
            app.MapControllerRoute(name: "areas", pattern: "{area:exists}/{controller=Dashboard}/{action=Index}/{id?}"); app.MapControllerRoute(
                name: "default",
                pattern: "{controller=Home}/{action=Index}/{id?}")
                .WithStaticAssets();

            app.Run();
        }
    }
}
