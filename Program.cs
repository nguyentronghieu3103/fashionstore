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
