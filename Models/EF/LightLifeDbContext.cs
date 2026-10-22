
#nullable disable
using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using fashionstore.Models.Entities;
namespace fashionstore.Models.EF;

public partial class LightLifeDbContext : DbContext
{
    public LightLifeDbContext(DbContextOptions<LightLifeDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<AspNetRole> AspNetRoles { get; set; }

    public virtual DbSet<AspNetRoleClaim> AspNetRoleClaims { get; set; }

    public virtual DbSet<AspNetUser> AspNetUsers { get; set; }

    public virtual DbSet<AspNetUserClaim> AspNetUserClaims { get; set; }

    public virtual DbSet<AspNetUserLogin> AspNetUserLogins { get; set; }

    public virtual DbSet<AspNetUserRole> AspNetUserRoles { get; set; }

    public virtual DbSet<AspNetUserToken> AspNetUserTokens { get; set; }

    public virtual DbSet<AuditLog> AuditLogs { get; set; }

    public virtual DbSet<Brand> Brands { get; set; }

    public virtual DbSet<CashRegister> CashRegisters { get; set; }

    public virtual DbSet<Category> Categories { get; set; }

    public virtual DbSet<Color> Colors { get; set; }

    public virtual DbSet<Customer> Customers { get; set; }

    public virtual DbSet<CustomerAddress> CustomerAddresses { get; set; }

    public virtual DbSet<GoodsReceipt> GoodsReceipts { get; set; }

    public virtual DbSet<GoodsReceiptItem> GoodsReceiptItems { get; set; }

    public virtual DbSet<InventoryReservation> InventoryReservations { get; set; }

    public virtual DbSet<Notification> Notifications { get; set; }

    public virtual DbSet<Order> Orders { get; set; }

    public virtual DbSet<OrderItem> OrderItems { get; set; }

    public virtual DbSet<OrderStatusHistory> OrderStatusHistories { get; set; }

    public virtual DbSet<PaymentTransaction> PaymentTransactions { get; set; }

    public virtual DbSet<ProcessedRequest> ProcessedRequests { get; set; }

    public virtual DbSet<Product> Products { get; set; }

    public virtual DbSet<ProductImage> ProductImages { get; set; }

    public virtual DbSet<ProductVariant> ProductVariants { get; set; }

    public virtual DbSet<Promotion> Promotions { get; set; }

    public virtual DbSet<PromotionRedemption> PromotionRedemptions { get; set; }

    public virtual DbSet<ReturnItem> ReturnItems { get; set; }

    public virtual DbSet<ReturnRequest> ReturnRequests { get; set; }

    public virtual DbSet<Shift> Shifts { get; set; }

    public virtual DbSet<ShiftCashEntry> ShiftCashEntries { get; set; }

    public virtual DbSet<Shipment> Shipments { get; set; }

    public virtual DbSet<Size> Sizes { get; set; }

    public virtual DbSet<StockBalance> StockBalances { get; set; }

    public virtual DbSet<StockIssue> StockIssues { get; set; }

    public virtual DbSet<StockIssueItem> StockIssueItems { get; set; }

    public virtual DbSet<StockMovement> StockMovements { get; set; }

    public virtual DbSet<Stocktake> Stocktakes { get; set; }

    public virtual DbSet<StocktakeItem> StocktakeItems { get; set; }

    public virtual DbSet<StocktakeScopeLock> StocktakeScopeLocks { get; set; }

    public virtual DbSet<StoreSetting> StoreSettings { get; set; }

    public virtual DbSet<Supplier> Suppliers { get; set; }

    public virtual DbSet<VwOrderPaymentSummary> VwOrderPaymentSummaries { get; set; }

    public virtual DbSet<VwPublicProduct> VwPublicProducts { get; set; }

    public virtual DbSet<VwShiftCashSummary> VwShiftCashSummaries { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AspNetRole>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__AspNetRo__3214EC07B64BE95F");

            entity.ToTable(tb => tb.HasTrigger("TR_Roles_ProtectNames"));

            entity.HasIndex(e => e.NormalizedName, "RoleNameIndex").IsUnique();

            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(256);
            entity.Property(e => e.NormalizedName)
                .IsRequired()
                .HasMaxLength(256);
        });

        modelBuilder.Entity<AspNetRoleClaim>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__AspNetRo__3214EC07003A17E0");

            entity.HasIndex(e => e.RoleId, "IX_AspNetRoleClaims_RoleId");

            entity.Property(e => e.RoleId).IsRequired();

            entity.HasOne(d => d.Role).WithMany(p => p.AspNetRoleClaims)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_RoleClaims_Role");
        });

        modelBuilder.Entity<AspNetUser>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__AspNetUs__3214EC07658F948A");

            entity.HasIndex(e => e.NormalizedEmail, "EmailIndex")
                .IsUnique()
                .HasFilter("([NormalizedEmail] IS NOT NULL)");

            entity.HasIndex(e => e.NormalizedUserName, "UserNameIndex").IsUnique();

            entity.Property(e => e.AvatarPath).HasMaxLength(500);
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Email).HasMaxLength(256);
            entity.Property(e => e.FullName)
                .IsRequired()
                .HasMaxLength(100);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.LockoutEnabled).HasDefaultValue(true);
            entity.Property(e => e.NormalizedEmail).HasMaxLength(256);
            entity.Property(e => e.NormalizedUserName)
                .IsRequired()
                .HasMaxLength(256);
            entity.Property(e => e.UserName)
                .IsRequired()
                .HasMaxLength(256);
        });

        modelBuilder.Entity<AspNetUserClaim>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__AspNetUs__3214EC07C1D811B7");

            entity.HasIndex(e => e.UserId, "IX_AspNetUserClaims_UserId");

            entity.Property(e => e.UserId).IsRequired();

            entity.HasOne(d => d.User).WithMany(p => p.AspNetUserClaims)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UserClaims_User");
        });

        modelBuilder.Entity<AspNetUserLogin>(entity =>
        {
            entity.HasKey(e => new { e.LoginProvider, e.ProviderKey });

            entity.HasIndex(e => e.UserId, "IX_AspNetUserLogins_UserId");

            entity.Property(e => e.LoginProvider).HasMaxLength(128);
            entity.Property(e => e.ProviderKey).HasMaxLength(128);
            entity.Property(e => e.UserId).IsRequired();

            entity.HasOne(d => d.User).WithMany(p => p.AspNetUserLogins)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UserLogins_User");
        });

        modelBuilder.Entity<AspNetUserRole>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.RoleId });

            entity.ToTable(tb => tb.HasTrigger("TR_UserRoles_ReferencedRoles"));

            entity.HasIndex(e => e.RoleId, "IX_UserRoles_RoleId");

            entity.HasIndex(e => e.UserId, "UQ_UserRoles_OneRole").IsUnique();

            entity.HasOne(d => d.Role).WithMany(p => p.AspNetUserRoles)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UserRoles_Role");

            entity.HasOne(d => d.User).WithOne(p => p.AspNetUserRole)
                .HasForeignKey<AspNetUserRole>(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UserRoles_User");
        });

        modelBuilder.Entity<AspNetUserToken>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.LoginProvider, e.Name });

            entity.Property(e => e.LoginProvider).HasMaxLength(128);
            entity.Property(e => e.Name).HasMaxLength(128);

            entity.HasOne(d => d.User).WithMany(p => p.AspNetUserTokens)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_UserTokens_User");
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__AuditLog__3214EC07C62B3EE8");

            entity.ToTable(tb => tb.HasTrigger("TR_AuditLogs_AppendOnly"));

            entity.HasIndex(e => new { e.EntityType, e.EntityKey, e.CreatedAt }, "IX_Audit_EntityDate").IsDescending(false, false, true);

            entity.Property(e => e.Action)
                .IsRequired()
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.ActorUserId).HasMaxLength(450);
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.EntityKey).IsRequired();
            entity.Property(e => e.EntityType)
                .IsRequired()
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Reason).HasMaxLength(1000);

            entity.HasOne(d => d.ActorUser).WithMany(p => p.AuditLogs)
                .HasForeignKey(d => d.ActorUserId)
                .HasConstraintName("FK_Audit_Actor");
        });

        modelBuilder.Entity<Brand>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Brands__3214EC07ACCE5429");

            entity.HasIndex(e => e.Name, "UQ_Brands_Name").IsUnique();

            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(100);
        });

        modelBuilder.Entity<CashRegister>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__CashRegi__3214EC07FDA90D12");

            entity.HasIndex(e => e.Code, "UQ_Registers_Code").IsUnique();

            entity.Property(e => e.Code)
                .IsRequired()
                .HasMaxLength(30)
                .IsUnicode(false);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(100);
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Categori__3214EC07D7484AD6");

            entity.ToTable(tb => tb.HasTrigger("TR_Categories_NoCycle"));

            entity.HasIndex(e => e.Slug, "UQ_Categories_Slug").IsUnique();

            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(100);
            entity.Property(e => e.Slug)
                .IsRequired()
                .HasMaxLength(120)
                .IsUnicode(false);

            entity.HasOne(d => d.Parent).WithMany(p => p.InverseParent)
                .HasForeignKey(d => d.ParentId)
                .HasConstraintName("FK_Categories_Parent");
        });

        modelBuilder.Entity<Color>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Colors__3214EC076CE33DFB");

            entity.HasIndex(e => e.Name, "UQ_Colors_Name").IsUnique();

            entity.Property(e => e.HexCode)
                .HasMaxLength(7)
                .IsUnicode(false)
                .IsFixedLength();
            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(50);
        });

        modelBuilder.Entity<Customer>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Customer__3214EC0792037D9B");

            entity.ToTable(tb => tb.HasTrigger("TR_Customers_Role"));

            entity.HasIndex(e => e.Phone, "UX_Customers_Phone")
                .IsUnique()
                .HasFilter("([Phone] IS NOT NULL)");

            entity.HasIndex(e => e.UserId, "UX_Customers_User")
                .IsUnique()
                .HasFilter("([UserId] IS NOT NULL)");

            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Email).HasMaxLength(256);
            entity.Property(e => e.FullName)
                .IsRequired()
                .HasMaxLength(100);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Note).HasMaxLength(500);
            entity.Property(e => e.Phone)
                .HasMaxLength(20)
                .IsUnicode(false);

            entity.HasOne(d => d.User).WithOne(p => p.Customer)
                .HasForeignKey<Customer>(d => d.UserId)
                .HasConstraintName("FK_Customers_User");
        });

        modelBuilder.Entity<CustomerAddress>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Customer__3214EC070C00D11A");

            entity.HasIndex(e => e.CustomerId, "UX_Address_Default")
                .IsUnique()
                .HasFilter("([IsDefault]=(1))");

            entity.Property(e => e.AddressLine)
                .IsRequired()
                .HasMaxLength(400);
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Phone)
                .IsRequired()
                .HasMaxLength(20)
                .IsUnicode(false);
            entity.Property(e => e.ReceiverName)
                .IsRequired()
                .HasMaxLength(100);

            entity.HasOne(d => d.Customer).WithOne(p => p.CustomerAddress)
                .HasForeignKey<CustomerAddress>(d => d.CustomerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Addresses_Customer");
        });

        modelBuilder.Entity<GoodsReceipt>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__GoodsRec__3214EC07FD5EA5CE");

            entity.ToTable(tb => tb.HasTrigger("TR_GoodsReceipts_Approval"));

            entity.HasIndex(e => e.ReceiptCode, "UQ_Receipts_Code").IsUnique();

            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.CreatedByUserId)
                .IsRequired()
                .HasMaxLength(450);
            entity.Property(e => e.Note).HasMaxLength(1000);
            entity.Property(e => e.PostedAt).HasPrecision(3);
            entity.Property(e => e.PostedByUserId).HasMaxLength(450);
            entity.Property(e => e.ReceiptCode)
                .IsRequired()
                .HasMaxLength(40)
                .IsUnicode(false);
            entity.Property(e => e.ReceivedAt).HasPrecision(3);
            entity.Property(e => e.RejectedAt).HasPrecision(3);
            entity.Property(e => e.RejectedByUserId).HasMaxLength(450);
            entity.Property(e => e.RejectionReason).HasMaxLength(500);
            entity.Property(e => e.RowVersion)
                .IsRequired()
                .IsRowVersion()
                .IsConcurrencyToken();
            entity.Property(e => e.Status).HasDefaultValue((byte)1);
            entity.Property(e => e.SupplierDocumentNumber).HasMaxLength(100);

            entity.HasOne(d => d.CreatedByUser).WithMany(p => p.GoodsReceiptCreatedByUsers)
                .HasForeignKey(d => d.CreatedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Receipts_Creator");

            entity.HasOne(d => d.PostedByUser).WithMany(p => p.GoodsReceiptPostedByUsers)
                .HasForeignKey(d => d.PostedByUserId)
                .HasConstraintName("FK_Receipts_Poster");

            entity.HasOne(d => d.RejectedByUser).WithMany(p => p.GoodsReceiptRejectedByUsers)
                .HasForeignKey(d => d.RejectedByUserId)
                .HasConstraintName("FK_Receipts_Rejector");

            entity.HasOne(d => d.Supplier).WithMany(p => p.GoodsReceipts)
                .HasForeignKey(d => d.SupplierId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Receipts_Supplier");
        });

        modelBuilder.Entity<GoodsReceiptItem>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__GoodsRec__3214EC07F07B254B");

            entity.ToTable(tb => tb.HasTrigger("TR_GoodsReceiptItems_ClosedDocument"));

            entity.HasIndex(e => new { e.Id, e.VariantId }, "UQ_ReceiptItems_LineVariant").IsUnique();

            entity.HasIndex(e => new { e.GoodsReceiptId, e.VariantId }, "UQ_ReceiptItems_Variant").IsUnique();

            entity.Property(e => e.Note).HasMaxLength(500);
            entity.Property(e => e.UnitCost).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.GoodsReceipt).WithMany(p => p.GoodsReceiptItems)
                .HasForeignKey(d => d.GoodsReceiptId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ReceiptItems_Header");

            entity.HasOne(d => d.Variant).WithMany(p => p.GoodsReceiptItems)
                .HasForeignKey(d => d.VariantId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ReceiptItems_Variant");
        });

        modelBuilder.Entity<InventoryReservation>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Inventor__3214EC077B20DB98");

            entity.ToTable(tb => tb.HasTrigger("TR_Reservations_Integrity"));

            entity.HasIndex(e => e.VariantId, "IX_Reservations_ActiveVariant").HasFilter("([Status]=(1))");

            entity.HasIndex(e => e.OrderItemId, "UQ_Reservations_Line").IsUnique();

            entity.Property(e => e.ClosedAt).HasPrecision(3);
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.RowVersion)
                .IsRequired()
                .IsRowVersion()
                .IsConcurrencyToken();
            entity.Property(e => e.Status).HasDefaultValue((byte)1);

            entity.HasOne(d => d.OrderItem).WithMany(p => p.InventoryReservations)
                .HasPrincipalKey(p => new { p.Id, p.VariantId })
                .HasForeignKey(d => new { d.OrderItemId, d.VariantId })
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Reservations_LineVariant");
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Notifica__3214EC07437F4E5C");

            entity.HasIndex(e => new { e.RecipientUserId, e.ReadAt, e.CreatedAt }, "IX_Notifications_UserReadDate").IsDescending(false, false, true);

            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Message)
                .IsRequired()
                .HasMaxLength(1000);
            entity.Property(e => e.ReadAt).HasPrecision(3);
            entity.Property(e => e.RecipientUserId).IsRequired();
            entity.Property(e => e.TargetPath).HasMaxLength(300);
            entity.Property(e => e.Title)
                .IsRequired()
                .HasMaxLength(200);

            entity.HasOne(d => d.Order).WithMany(p => p.Notifications)
                .HasForeignKey(d => d.OrderId)
                .HasConstraintName("FK_Notifications_Order");

            entity.HasOne(d => d.RecipientUser).WithMany(p => p.Notifications)
                .HasForeignKey(d => d.RecipientUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Notifications_Recipient");

            entity.HasOne(d => d.ReturnRequest).WithMany(p => p.Notifications)
                .HasForeignKey(d => d.ReturnRequestId)
                .HasConstraintName("FK_Notifications_Return");
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Orders__3214EC077D432F02");

            entity.ToTable(tb => tb.HasTrigger("TR_Orders_Integrity"));

            entity.HasIndex(e => new { e.AssignedEmployeeUserId, e.Status, e.CreatedAt }, "IX_Orders_AssignedStatus");

            entity.HasIndex(e => new { e.BuyerUserId, e.CreatedAt }, "IX_Orders_BuyerDate").IsDescending(false, true);

            entity.HasIndex(e => new { e.Status, e.CreatedAt }, "IX_Orders_StatusDate");

            entity.HasIndex(e => e.OrderCode, "UQ_Orders_Code").IsUnique();

            entity.Property(e => e.CancelReason).HasMaxLength(500);
            entity.Property(e => e.CancelledAt).HasPrecision(3);
            entity.Property(e => e.CancelledByUserId).HasMaxLength(450);
            entity.Property(e => e.CompletedAt).HasPrecision(3);
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.CreatedByUserId)
                .IsRequired()
                .HasMaxLength(450);
            entity.Property(e => e.DeliveryAddress).HasMaxLength(400);
            entity.Property(e => e.DiscountAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.GrandTotal)
                .HasComputedColumnSql("(([Subtotal]-[DiscountAmount])+[ShippingFee])", true)
                .HasColumnType("decimal(20, 2)");
            entity.Property(e => e.Note).HasMaxLength(1000);
            entity.Property(e => e.OrderCode)
                .IsRequired()
                .HasMaxLength(40)
                .IsUnicode(false);
            entity.Property(e => e.ReceiverName).HasMaxLength(100);
            entity.Property(e => e.ReceiverPhone)
                .HasMaxLength(20)
                .IsUnicode(false);
            entity.Property(e => e.ReservationExpiresAt).HasPrecision(3);
            entity.Property(e => e.RowVersion)
                .IsRequired()
                .IsRowVersion()
                .IsConcurrencyToken();
            entity.Property(e => e.ShippingFee).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Subtotal).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.AssignedEmployeeUser).WithMany(p => p.OrderAssignedEmployeeUsers)
                .HasForeignKey(d => d.AssignedEmployeeUserId)
                .HasConstraintName("FK_Orders_Assignee");

            entity.HasOne(d => d.BuyerUser).WithMany(p => p.OrderBuyerUsers)
                .HasForeignKey(d => d.BuyerUserId)
                .HasConstraintName("FK_Orders_Buyer");

            entity.HasOne(d => d.CancelledByUser).WithMany(p => p.OrderCancelledByUsers)
                .HasForeignKey(d => d.CancelledByUserId)
                .HasConstraintName("FK_Orders_Canceller");

            entity.HasOne(d => d.CreatedByUser).WithMany(p => p.OrderCreatedByUsers)
                .HasForeignKey(d => d.CreatedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Orders_Creator");

            entity.HasOne(d => d.Customer).WithMany(p => p.Orders)
                .HasForeignKey(d => d.CustomerId)
                .HasConstraintName("FK_Orders_Customer");

            entity.HasOne(d => d.Promotion).WithMany(p => p.Orders)
                .HasForeignKey(d => d.PromotionId)
                .HasConstraintName("FK_Orders_Promo");

            entity.HasOne(d => d.Shift).WithMany(p => p.Orders)
                .HasForeignKey(d => d.ShiftId)
                .HasConstraintName("FK_Orders_Shift");
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__OrderIte__3214EC07C9FA7291");

            entity.ToTable(tb => tb.HasTrigger("TR_OrderItems_Totals"));

            entity.HasIndex(e => new { e.Id, e.VariantId }, "UQ_OrderItems_LineVariant").IsUnique();

            entity.HasIndex(e => new { e.OrderId, e.Id }, "UQ_OrderItems_OrderLine").IsUnique();

            entity.HasIndex(e => new { e.OrderId, e.VariantId }, "UQ_OrderItems_OrderVariant").IsUnique();

            entity.Property(e => e.ColorSnapshot)
                .IsRequired()
                .HasMaxLength(50);
            entity.Property(e => e.DiscountAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.LineTotal)
                .HasComputedColumnSql("([Quantity]*[UnitPrice]-[DiscountAmount])", true)
                .HasColumnType("decimal(30, 2)");
            entity.Property(e => e.ProductNameSnapshot)
                .IsRequired()
                .HasMaxLength(200);
            entity.Property(e => e.RowVersion)
                .IsRequired()
                .IsRowVersion()
                .IsConcurrencyToken();
            entity.Property(e => e.SizeSnapshot)
                .IsRequired()
                .HasMaxLength(30);
            entity.Property(e => e.SkuSnapshot)
                .IsRequired()
                .HasMaxLength(80)
                .IsUnicode(false);
            entity.Property(e => e.UnitPrice).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Order).WithMany(p => p.OrderItems)
                .HasForeignKey(d => d.OrderId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_OrderItems_Order");

            entity.HasOne(d => d.Variant).WithMany(p => p.OrderItems)
                .HasForeignKey(d => d.VariantId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_OrderItems_Variant");
        });

        modelBuilder.Entity<OrderStatusHistory>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__OrderSta__3214EC0721F7AD74");

            entity.ToTable("OrderStatusHistory", tb => tb.HasTrigger("TR_OrderStatusHistory_AppendOnly"));

            entity.Property(e => e.ChangedByUserId)
                .IsRequired()
                .HasMaxLength(450);
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Reason).HasMaxLength(500);

            entity.HasOne(d => d.ChangedByUser).WithMany(p => p.OrderStatusHistories)
                .HasForeignKey(d => d.ChangedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_OrderHistory_Actor");

            entity.HasOne(d => d.Order).WithMany(p => p.OrderStatusHistories)
                .HasForeignKey(d => d.OrderId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_OrderHistory_Order");
        });

        modelBuilder.Entity<PaymentTransaction>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__PaymentT__3214EC0791DF49BC");

            entity.ToTable(tb => tb.HasTrigger("TR_Payments_Integrity"));

            entity.HasIndex(e => new { e.OrderId, e.OccurredAt }, "IX_Payments_Order");

            entity.HasIndex(e => e.ShiftId, "IX_Payments_Shift");

            entity.HasIndex(e => new { e.RecordedByUserId, e.RequestId }, "UQ_Payments_Request").IsUnique();

            entity.HasIndex(e => new { e.Method, e.ExternalReference }, "UX_Payments_ExternalReference")
                .IsUnique()
                .HasFilter("([ExternalReference] IS NOT NULL)");

            entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.EvidencePath).HasMaxLength(500);
            entity.Property(e => e.ExternalReference).HasMaxLength(150);
            entity.Property(e => e.OccurredAt).HasPrecision(3);
            entity.Property(e => e.Reason).HasMaxLength(500);
            entity.Property(e => e.RecordedByUserId).IsRequired();

            entity.HasOne(d => d.Order).WithMany(p => p.PaymentTransactions)
                .HasForeignKey(d => d.OrderId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Payments_Order");

            entity.HasOne(d => d.RecordedByUser).WithMany(p => p.PaymentTransactions)
                .HasForeignKey(d => d.RecordedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Payments_Actor");

            entity.HasOne(d => d.Shift).WithMany(p => p.PaymentTransactions)
                .HasForeignKey(d => d.ShiftId)
                .HasConstraintName("FK_Payments_Shift");

            entity.HasOne(d => d.ReturnRequest).WithMany(p => p.PaymentTransactions)
                .HasPrincipalKey(p => new { p.OrderId, p.Id })
                .HasForeignKey(d => new { d.OrderId, d.ReturnRequestId })
                .HasConstraintName("FK_Payments_ReturnOrder");
        });

        modelBuilder.Entity<ProcessedRequest>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Processe__3214EC073C088E34");

            entity.HasIndex(e => new { e.ActorUserId, e.Operation, e.RequestId }, "UQ_Requests_Key").IsUnique();

            entity.Property(e => e.ActorUserId).IsRequired();
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Operation)
                .IsRequired()
                .HasMaxLength(60)
                .IsUnicode(false);
            entity.Property(e => e.PayloadHash)
                .IsRequired()
                .HasMaxLength(32)
                .IsFixedLength();
            entity.Property(e => e.ResultEntityType)
                .IsRequired()
                .HasMaxLength(60)
                .IsUnicode(false);

            entity.HasOne(d => d.ActorUser).WithMany(p => p.ProcessedRequests)
                .HasForeignKey(d => d.ActorUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Requests_Actor");
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Products__3214EC07326BD75D");

            entity.HasIndex(e => e.ProductCode, "UQ_Products_Code").IsUnique();

            entity.HasIndex(e => e.Slug, "UQ_Products_Slug").IsUnique();

            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Material).HasMaxLength(150);
            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(200);
            entity.Property(e => e.ProductCode)
                .IsRequired()
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.RowVersion)
                .IsRequired()
                .IsRowVersion()
                .IsConcurrencyToken();
            entity.Property(e => e.Slug)
                .IsRequired()
                .HasMaxLength(220)
                .IsUnicode(false);

            entity.HasOne(d => d.Brand).WithMany(p => p.Products)
                .HasForeignKey(d => d.BrandId)
                .HasConstraintName("FK_Products_Brand");

            entity.HasOne(d => d.Category).WithMany(p => p.Products)
                .HasForeignKey(d => d.CategoryId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Products_Category");
        });

        modelBuilder.Entity<ProductImage>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ProductI__3214EC07B4A0D97B");

            entity.HasIndex(e => e.ProductId, "UX_Product_MainImage")
                .IsUnique()
                .HasFilter("([IsMain]=(1))");

            entity.Property(e => e.AltText).HasMaxLength(200);
            entity.Property(e => e.ImagePath)
                .IsRequired()
                .HasMaxLength(500);

            entity.HasOne(d => d.Color).WithMany(p => p.ProductImages)
                .HasForeignKey(d => d.ColorId)
                .HasConstraintName("FK_Images_Color");

            entity.HasOne(d => d.Product).WithOne(p => p.ProductImage)
                .HasForeignKey<ProductImage>(d => d.ProductId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Images_Product");
        });

        modelBuilder.Entity<ProductVariant>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ProductV__3214EC075685B5EC");

            entity.ToTable(tb => tb.HasTrigger("TR_ProductVariants_InitializeStock"));

            entity.HasIndex(e => new { e.ProductId, e.ColorId, e.SizeId }, "UQ_Variants_Combination").IsUnique();

            entity.HasIndex(e => e.Sku, "UQ_Variants_Sku").IsUnique();

            entity.HasIndex(e => e.Barcode, "UX_Variants_Barcode")
                .IsUnique()
                .HasFilter("([Barcode] IS NOT NULL)");

            entity.Property(e => e.Barcode)
                .HasMaxLength(80)
                .IsUnicode(false);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.LowStockThreshold).HasDefaultValue(5);
            entity.Property(e => e.RowVersion)
                .IsRequired()
                .IsRowVersion()
                .IsConcurrencyToken();
            entity.Property(e => e.SalePrice).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Sku)
                .IsRequired()
                .HasMaxLength(80)
                .IsUnicode(false);

            entity.HasOne(d => d.Color).WithMany(p => p.ProductVariants)
                .HasForeignKey(d => d.ColorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Variants_Color");

            entity.HasOne(d => d.Product).WithMany(p => p.ProductVariants)
                .HasForeignKey(d => d.ProductId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Variants_Product");

            entity.HasOne(d => d.Size).WithMany(p => p.ProductVariants)
                .HasForeignKey(d => d.SizeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Variants_Size");
        });

        modelBuilder.Entity<Promotion>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Promotio__3214EC0750D135B2");

            entity.HasIndex(e => e.Code, "UQ_Promotions_Code").IsUnique();

            entity.Property(e => e.Code)
                .IsRequired()
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.DiscountValue).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.EndsAt).HasPrecision(3);
            entity.Property(e => e.MaxDiscountAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.MinEligibleSubtotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(150);
            entity.Property(e => e.RowVersion)
                .IsRequired()
                .IsRowVersion()
                .IsConcurrencyToken();
            entity.Property(e => e.Scope).HasDefaultValue((byte)1);
            entity.Property(e => e.StartsAt).HasPrecision(3);

            entity.HasMany(d => d.Products).WithMany(p => p.Promotions)
                .UsingEntity<Dictionary<string, object>>(
                    "PromotionProduct",
                    r => r.HasOne<Product>().WithMany()
                        .HasForeignKey("ProductId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("FK_PromoProducts_Product"),
                    l => l.HasOne<Promotion>().WithMany()
                        .HasForeignKey("PromotionId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("FK_PromoProducts_Promo"),
                    j =>
                    {
                        j.HasKey("PromotionId", "ProductId");
                        j.ToTable("PromotionProducts");
                    });
        });

        modelBuilder.Entity<PromotionRedemption>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Promotio__3214EC0768FC4F69");

            entity.HasIndex(e => e.OrderId, "UQ_Redemptions_Order").IsUnique();

            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.DiscountAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Status).HasDefaultValue((byte)1);

            entity.HasOne(d => d.Order).WithOne(p => p.PromotionRedemption)
                .HasForeignKey<PromotionRedemption>(d => d.OrderId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Redemptions_Order");

            entity.HasOne(d => d.Promotion).WithMany(p => p.PromotionRedemptions)
                .HasForeignKey(d => d.PromotionId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Redemptions_Promotion");
        });

        modelBuilder.Entity<ReturnItem>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ReturnIt__3214EC07A1830CF8");

            entity.ToTable(tb => tb.HasTrigger("TR_ReturnItems_Integrity"));

            entity.HasIndex(e => new { e.ReturnRequestId, e.OrderItemId }, "UQ_ReturnItems_Line").IsUnique();

            entity.HasIndex(e => new { e.Id, e.VariantId }, "UQ_ReturnItems_LineVariant").IsUnique();

            entity.Property(e => e.EvidencePath).HasMaxLength(500);
            entity.Property(e => e.ReceivedAt).HasPrecision(3);
            entity.Property(e => e.ReceivedByUserId).HasMaxLength(450);
            entity.Property(e => e.RefundAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.RowVersion)
                .IsRequired()
                .IsRowVersion()
                .IsConcurrencyToken();

            entity.HasOne(d => d.ReceivedByUser).WithMany(p => p.ReturnItems)
                .HasForeignKey(d => d.ReceivedByUserId)
                .HasConstraintName("FK_ReturnItems_Receiver");

            entity.HasOne(d => d.OrderItem).WithMany(p => p.ReturnItemOrderItems)
                .HasPrincipalKey(p => new { p.OrderId, p.Id })
                .HasForeignKey(d => new { d.OrderId, d.OrderItemId })
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ReturnItems_OrderLine");

            entity.HasOne(d => d.ReturnRequest).WithMany(p => p.ReturnItems)
                .HasPrincipalKey(p => new { p.OrderId, p.Id })
                .HasForeignKey(d => new { d.OrderId, d.ReturnRequestId })
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ReturnItems_RequestOrder");

            entity.HasOne(d => d.OrderItemNavigation).WithMany(p => p.ReturnItemOrderItemNavigations)
                .HasPrincipalKey(p => new { p.Id, p.VariantId })
                .HasForeignKey(d => new { d.OrderItemId, d.VariantId })
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ReturnItems_LineVariant");
        });

        modelBuilder.Entity<ReturnRequest>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ReturnRe__3214EC073BEC3D0C");

            entity.ToTable(tb => tb.HasTrigger("TR_ReturnRequests_Integrity"));

            entity.HasIndex(e => new { e.Status, e.CreatedAt }, "IX_Returns_Status");

            entity.HasIndex(e => e.ReturnCode, "UQ_Returns_Code").IsUnique();

            entity.HasIndex(e => new { e.OrderId, e.Id }, "UQ_Returns_OrderRequest").IsUnique();

            entity.Property(e => e.AssignedEmployeeUserId).HasMaxLength(450);
            entity.Property(e => e.CompletedAt).HasPrecision(3);
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.CreatedByUserId)
                .IsRequired()
                .HasMaxLength(450);
            entity.Property(e => e.Reason)
                .IsRequired()
                .HasMaxLength(1000);
            entity.Property(e => e.RequestType).HasDefaultValue((byte)1);
            entity.Property(e => e.ReturnCode)
                .IsRequired()
                .HasMaxLength(40)
                .IsUnicode(false);
            entity.Property(e => e.ReviewNote).HasMaxLength(1000);
            entity.Property(e => e.ReviewedAt).HasPrecision(3);
            entity.Property(e => e.ReviewedByUserId).HasMaxLength(450);
            entity.Property(e => e.RowVersion)
                .IsRequired()
                .IsRowVersion()
                .IsConcurrencyToken();
            entity.Property(e => e.Status).HasDefaultValue((byte)1);

            entity.HasOne(d => d.AssignedEmployeeUser).WithMany(p => p.ReturnRequestAssignedEmployeeUsers)
                .HasForeignKey(d => d.AssignedEmployeeUserId)
                .HasConstraintName("FK_Returns_Assignee");

            entity.HasOne(d => d.CreatedByUser).WithMany(p => p.ReturnRequestCreatedByUsers)
                .HasForeignKey(d => d.CreatedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Returns_Creator");

            entity.HasOne(d => d.Order).WithMany(p => p.ReturnRequestOrders)
                .HasForeignKey(d => d.OrderId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Returns_Order");

            entity.HasOne(d => d.ReplacementOrder).WithMany(p => p.ReturnRequestReplacementOrders)
                .HasForeignKey(d => d.ReplacementOrderId)
                .HasConstraintName("FK_Returns_Replacement");

            entity.HasOne(d => d.ReviewedByUser).WithMany(p => p.ReturnRequestReviewedByUsers)
                .HasForeignKey(d => d.ReviewedByUserId)
                .HasConstraintName("FK_Returns_Reviewer");
        });

        modelBuilder.Entity<Shift>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Shifts__3214EC07AD0E3A3B");

            entity.ToTable(tb => tb.HasTrigger("TR_Shifts_Integrity"));

            entity.HasIndex(e => e.EmployeeUserId, "UX_Shifts_OpenEmployee")
                .IsUnique()
                .HasFilter("([Status]=(1))");

            entity.HasIndex(e => e.CashRegisterId, "UX_Shifts_OpenRegister")
                .IsUnique()
                .HasFilter("([Status]=(1))");

            entity.Property(e => e.ClosingActualCash).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.ClosingExpectedCash).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.EmployeeUserId).IsRequired();
            entity.Property(e => e.Note).HasMaxLength(1000);
            entity.Property(e => e.OpenedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.OpeningCash).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.ReconciledAt).HasPrecision(3);
            entity.Property(e => e.ReconciledByUserId).HasMaxLength(450);
            entity.Property(e => e.RowVersion)
                .IsRequired()
                .IsRowVersion()
                .IsConcurrencyToken();
            entity.Property(e => e.Status).HasDefaultValue((byte)1);
            entity.Property(e => e.SubmittedAt).HasPrecision(3);
            entity.Property(e => e.VarianceReason).HasMaxLength(1000);

            entity.HasOne(d => d.CashRegister).WithOne(p => p.Shift)
                .HasForeignKey<Shift>(d => d.CashRegisterId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Shifts_Register");

            entity.HasOne(d => d.EmployeeUser).WithOne(p => p.ShiftEmployeeUser)
                .HasForeignKey<Shift>(d => d.EmployeeUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Shifts_Employee");

            entity.HasOne(d => d.ReconciledByUser).WithMany(p => p.ShiftReconciledByUsers)
                .HasForeignKey(d => d.ReconciledByUserId)
                .HasConstraintName("FK_Shifts_Reconciler");
        });

        modelBuilder.Entity<ShiftCashEntry>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ShiftCas__3214EC0794E03889");

            entity.ToTable(tb => tb.HasTrigger("TR_ShiftCashEntries_Integrity"));

            entity.HasIndex(e => new { e.RecordedByUserId, e.RequestId }, "UQ_CashEntries_Request").IsUnique();

            entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.ApprovedByUserId)
                .IsRequired()
                .HasMaxLength(450);
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Reason)
                .IsRequired()
                .HasMaxLength(500);
            entity.Property(e => e.RecordedByUserId).IsRequired();

            entity.HasOne(d => d.ApprovedByUser).WithMany(p => p.ShiftCashEntryApprovedByUsers)
                .HasForeignKey(d => d.ApprovedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CashEntries_Approver");

            entity.HasOne(d => d.RecordedByUser).WithMany(p => p.ShiftCashEntryRecordedByUsers)
                .HasForeignKey(d => d.RecordedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CashEntries_Recorder");

            entity.HasOne(d => d.Shift).WithMany(p => p.ShiftCashEntries)
                .HasForeignKey(d => d.ShiftId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_CashEntries_Shift");
        });

        modelBuilder.Entity<Shipment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Shipment__3214EC07A4977DA5");

            entity.ToTable(tb => tb.HasTrigger("TR_Shipments_Integrity"));

            entity.HasIndex(e => e.OrderId, "UQ_Shipments_Order").IsUnique();

            entity.Property(e => e.CarrierName).HasMaxLength(100);
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.DeliveredAt).HasPrecision(3);
            entity.Property(e => e.DispatchedAt).HasPrecision(3);
            entity.Property(e => e.FailureReason).HasMaxLength(500);
            entity.Property(e => e.ReturnedAt).HasPrecision(3);
            entity.Property(e => e.RowVersion)
                .IsRequired()
                .IsRowVersion()
                .IsConcurrencyToken();
            entity.Property(e => e.Status).HasDefaultValue((byte)1);
            entity.Property(e => e.TrackingCode)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.UpdatedByUserId)
                .IsRequired()
                .HasMaxLength(450);

            entity.HasOne(d => d.Order).WithOne(p => p.Shipment)
                .HasForeignKey<Shipment>(d => d.OrderId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Shipments_Order");

            entity.HasOne(d => d.UpdatedByUser).WithMany(p => p.Shipments)
                .HasForeignKey(d => d.UpdatedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Shipments_Actor");
        });

        modelBuilder.Entity<Size>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Sizes__3214EC07D8D77ED4");

            entity.HasIndex(e => e.Name, "UQ_Sizes_Name").IsUnique();

            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(30);
        });

        modelBuilder.Entity<StockBalance>(entity =>
        {
            entity.HasKey(e => e.VariantId).HasName("PK__StockBal__0EA23384F251D6D8");

            entity.ToTable(tb => tb.HasTrigger("TR_StockBalances_Source"));

            entity.Property(e => e.VariantId).ValueGeneratedNever();
            entity.Property(e => e.AvailableQuantity).HasComputedColumnSql("([SellableQuantity]-[ReservedQuantity])", true);
            entity.Property(e => e.RowVersion)
                .IsRequired()
                .IsRowVersion()
                .IsConcurrencyToken();
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Variant).WithOne(p => p.StockBalance)
                .HasForeignKey<StockBalance>(d => d.VariantId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Balances_Variant");
        });

        modelBuilder.Entity<StockIssue>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__StockIss__3214EC073A251803");

            entity.ToTable(tb => tb.HasTrigger("TR_StockIssues_Approval"));

            entity.HasIndex(e => e.IssueCode, "UQ_Issues_Code").IsUnique();

            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.CreatedByUserId)
                .IsRequired()
                .HasMaxLength(450);
            entity.Property(e => e.IssueCode)
                .IsRequired()
                .HasMaxLength(40)
                .IsUnicode(false);
            entity.Property(e => e.PostedAt).HasPrecision(3);
            entity.Property(e => e.PostedByUserId).HasMaxLength(450);
            entity.Property(e => e.Reason)
                .IsRequired()
                .HasMaxLength(1000);
            entity.Property(e => e.RejectedAt).HasPrecision(3);
            entity.Property(e => e.RejectedByUserId).HasMaxLength(450);
            entity.Property(e => e.RejectionReason).HasMaxLength(500);
            entity.Property(e => e.RowVersion)
                .IsRequired()
                .IsRowVersion()
                .IsConcurrencyToken();
            entity.Property(e => e.Status).HasDefaultValue((byte)1);

            entity.HasOne(d => d.CreatedByUser).WithMany(p => p.StockIssueCreatedByUsers)
                .HasForeignKey(d => d.CreatedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Issues_Creator");

            entity.HasOne(d => d.PostedByUser).WithMany(p => p.StockIssuePostedByUsers)
                .HasForeignKey(d => d.PostedByUserId)
                .HasConstraintName("FK_Issues_Poster");

            entity.HasOne(d => d.RejectedByUser).WithMany(p => p.StockIssueRejectedByUsers)
                .HasForeignKey(d => d.RejectedByUserId)
                .HasConstraintName("FK_Issues_Rejector");

            entity.HasOne(d => d.Supplier).WithMany(p => p.StockIssues)
                .HasForeignKey(d => d.SupplierId)
                .HasConstraintName("FK_Issues_Supplier");
        });

        modelBuilder.Entity<StockIssueItem>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__StockIss__3214EC078F051635");

            entity.ToTable(tb => tb.HasTrigger("TR_StockIssueItems_ClosedDocument"));

            entity.HasIndex(e => new { e.Id, e.VariantId }, "UQ_IssueItems_LineVariant").IsUnique();

            entity.HasIndex(e => new { e.StockIssueId, e.VariantId }, "UQ_IssueItems_Variant").IsUnique();

            entity.HasOne(d => d.StockIssue).WithMany(p => p.StockIssueItems)
                .HasForeignKey(d => d.StockIssueId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_IssueItems_Header");

            entity.HasOne(d => d.Variant).WithMany(p => p.StockIssueItems)
                .HasForeignKey(d => d.VariantId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_IssueItems_Variant");
        });

        modelBuilder.Entity<StockMovement>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__StockMov__3214EC074CFB5FDF");

            entity.ToTable(tb => tb.HasTrigger("TR_StockMovements_Integrity"));

            entity.HasIndex(e => new { e.VariantId, e.CreatedAt }, "IX_Movements_VariantDate");

            entity.HasIndex(e => new { e.BusinessEventId, e.VariantId }, "UQ_Movements_EventVariant").IsUnique();

            entity.HasIndex(e => e.ReturnItemId, "UX_Movements_CustomerReturn")
                .IsUnique()
                .HasFilter("([ReturnItemId] IS NOT NULL)");

            entity.HasIndex(e => e.OrderItemId, "UX_Movements_FailedDelivery")
                .IsUnique()
                .HasFilter("([Kind]=(6))");

            entity.HasIndex(e => e.StockIssueItemId, "UX_Movements_Issue")
                .IsUnique()
                .HasFilter("([StockIssueItemId] IS NOT NULL)");

            entity.HasIndex(e => e.OrderItemId, "UX_Movements_OrderSale")
                .IsUnique()
                .HasFilter("([Kind]=(1))");

            entity.HasIndex(e => e.GoodsReceiptItemId, "UX_Movements_Receipt")
                .IsUnique()
                .HasFilter("([GoodsReceiptItemId] IS NOT NULL)");

            entity.HasIndex(e => e.StocktakeItemId, "UX_Movements_Stocktake")
                .IsUnique()
                .HasFilter("([StocktakeItemId] IS NOT NULL)");

            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.RecordedByUserId)
                .IsRequired()
                .HasMaxLength(450);
            entity.Property(e => e.UnitCostSnapshot).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.RecordedByUser).WithMany(p => p.StockMovements)
                .HasForeignKey(d => d.RecordedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Movements_Actor");

            entity.HasOne(d => d.Variant).WithMany(p => p.StockMovements)
                .HasForeignKey(d => d.VariantId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Movements_Variant");

            entity.HasOne(d => d.GoodsReceiptItem).WithMany(p => p.StockMovements)
                .HasPrincipalKey(p => new { p.Id, p.VariantId })
                .HasForeignKey(d => new { d.GoodsReceiptItemId, d.VariantId })
                .HasConstraintName("FK_Movements_ReceiptLine");

            entity.HasOne(d => d.OrderItem).WithMany(p => p.StockMovements)
                .HasPrincipalKey(p => new { p.Id, p.VariantId })
                .HasForeignKey(d => new { d.OrderItemId, d.VariantId })
                .HasConstraintName("FK_Movements_OrderLine");

            entity.HasOne(d => d.ReturnItem).WithMany(p => p.StockMovements)
                .HasPrincipalKey(p => new { p.Id, p.VariantId })
                .HasForeignKey(d => new { d.ReturnItemId, d.VariantId })
                .HasConstraintName("FK_Movements_ReturnLine");

            entity.HasOne(d => d.StockIssueItem).WithMany(p => p.StockMovements)
                .HasPrincipalKey(p => new { p.Id, p.VariantId })
                .HasForeignKey(d => new { d.StockIssueItemId, d.VariantId })
                .HasConstraintName("FK_Movements_IssueLine");

            entity.HasOne(d => d.StocktakeItem).WithMany(p => p.StockMovements)
                .HasPrincipalKey(p => new { p.Id, p.VariantId })
                .HasForeignKey(d => new { d.StocktakeItemId, d.VariantId })
                .HasConstraintName("FK_Movements_StocktakeLine");
        });

        modelBuilder.Entity<Stocktake>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Stocktak__3214EC07E9C90DDE");

            entity.ToTable(tb => tb.HasTrigger("TR_Stocktakes_Integrity"));

            entity.HasIndex(e => e.StocktakeCode, "UQ_Stocktakes_Code").IsUnique();

            entity.Property(e => e.ApprovedAt).HasPrecision(3);
            entity.Property(e => e.ApprovedByUserId).HasMaxLength(450);
            entity.Property(e => e.CloseReason).HasMaxLength(1000);
            entity.Property(e => e.ClosedAt).HasPrecision(3);
            entity.Property(e => e.CreatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.CreatedByUserId)
                .IsRequired()
                .HasMaxLength(450);
            entity.Property(e => e.RowVersion)
                .IsRequired()
                .IsRowVersion()
                .IsConcurrencyToken();
            entity.Property(e => e.Status).HasDefaultValue((byte)1);
            entity.Property(e => e.StocktakeCode)
                .IsRequired()
                .HasMaxLength(40)
                .IsUnicode(false);

            entity.HasOne(d => d.ApprovedByUser).WithMany(p => p.StocktakeApprovedByUsers)
                .HasForeignKey(d => d.ApprovedByUserId)
                .HasConstraintName("FK_Stocktakes_Approver");

            entity.HasOne(d => d.CreatedByUser).WithMany(p => p.StocktakeCreatedByUsers)
                .HasForeignKey(d => d.CreatedByUserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Stocktakes_Creator");
        });

        modelBuilder.Entity<StocktakeItem>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Stocktak__3214EC072046EE75");

            entity.ToTable(tb => tb.HasTrigger("TR_StocktakeItems_Integrity"));

            entity.HasIndex(e => new { e.Id, e.VariantId }, "UQ_StocktakeItems_LineVariant").IsUnique();

            entity.HasIndex(e => new { e.StocktakeId, e.VariantId }, "UQ_StocktakeItems_Variant").IsUnique();

            entity.Property(e => e.CountedAt).HasPrecision(3);
            entity.Property(e => e.CountedByUserId).HasMaxLength(450);
            entity.Property(e => e.DifferenceReason).HasMaxLength(1000);
            entity.Property(e => e.RowVersion)
                .IsRequired()
                .IsRowVersion()
                .IsConcurrencyToken();

            entity.HasOne(d => d.CountedByUser).WithMany(p => p.StocktakeItems)
                .HasForeignKey(d => d.CountedByUserId)
                .HasConstraintName("FK_StocktakeItems_Counter");

            entity.HasOne(d => d.Stocktake).WithMany(p => p.StocktakeItems)
                .HasForeignKey(d => d.StocktakeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_StocktakeItems_Header");

            entity.HasOne(d => d.Variant).WithMany(p => p.StocktakeItems)
                .HasForeignKey(d => d.VariantId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_StocktakeItems_Variant");
        });

        modelBuilder.Entity<StocktakeScopeLock>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Stocktak__3214EC07191A3F47");

            entity.ToTable(tb => tb.HasTrigger("TR_StocktakeLocks_Integrity"));

            entity.HasIndex(e => new { e.StocktakeId, e.VariantId }, "UQ_ScopeLock_StocktakeVariant").IsUnique();

            entity.HasIndex(e => e.VariantId, "UX_ScopeLock_ActiveVariant")
                .IsUnique()
                .HasFilter("([IsActive]=(1))");

            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.LockedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.ReleasedAt).HasPrecision(3);

            entity.HasOne(d => d.StocktakeItem).WithOne(p => p.StocktakeScopeLock)
                .HasPrincipalKey<StocktakeItem>(p => new { p.StocktakeId, p.VariantId })
                .HasForeignKey<StocktakeScopeLock>(d => new { d.StocktakeId, d.VariantId })
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_ScopeLock_Item");
        });

        modelBuilder.Entity<StoreSetting>(entity =>
        {
            entity.HasKey(e => e.SettingKey).HasName("PK__StoreSet__01E719AC9CCC0C23");

            entity.ToTable(tb => tb.HasTrigger("TR_StoreSettings_Admin"));

            entity.Property(e => e.SettingKey)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.SettingValue).IsRequired();
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(3)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.UpdatedByUserId).HasMaxLength(450);

            entity.HasOne(d => d.UpdatedByUser).WithMany(p => p.StoreSettings)
                .HasForeignKey(d => d.UpdatedByUserId)
                .HasConstraintName("FK_Settings_Actor");
        });

        modelBuilder.Entity<Supplier>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Supplier__3214EC0723D99ED1");

            entity.HasIndex(e => e.SupplierCode, "UQ_Suppliers_Code").IsUnique();

            entity.Property(e => e.AddressLine).HasMaxLength(400);
            entity.Property(e => e.ContactName).HasMaxLength(100);
            entity.Property(e => e.Email).HasMaxLength(256);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(200);
            entity.Property(e => e.Note).HasMaxLength(500);
            entity.Property(e => e.Phone)
                .HasMaxLength(20)
                .IsUnicode(false);
            entity.Property(e => e.SupplierCode)
                .IsRequired()
                .HasMaxLength(50)
                .IsUnicode(false);
        });

        modelBuilder.Entity<VwOrderPaymentSummary>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_OrderPaymentSummary");

            entity.Property(e => e.CollectedAmount).HasColumnType("decimal(38, 2)");
            entity.Property(e => e.GrandTotal).HasColumnType("decimal(20, 2)");
            entity.Property(e => e.NetCollected).HasColumnType("decimal(38, 2)");
            entity.Property(e => e.OrderCode)
                .IsRequired()
                .HasMaxLength(40)
                .IsUnicode(false);
            entity.Property(e => e.PaymentStatus)
                .IsRequired()
                .HasMaxLength(17)
                .IsUnicode(false);
            entity.Property(e => e.RefundedAmount).HasColumnType("decimal(38, 2)");
        });

        modelBuilder.Entity<VwPublicProduct>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_PublicProducts");

            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(200);
            entity.Property(e => e.SalePrice).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Sku)
                .IsRequired()
                .HasMaxLength(80)
                .IsUnicode(false);
            entity.Property(e => e.Slug)
                .IsRequired()
                .HasMaxLength(220)
                .IsUnicode(false);
        });

        modelBuilder.Entity<VwShiftCashSummary>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_ShiftCashSummary");

            entity.Property(e => e.CashCollected).HasColumnType("decimal(38, 2)");
            entity.Property(e => e.CashRefunded).HasColumnType("decimal(38, 2)");
            entity.Property(e => e.EmployeeUserId)
                .IsRequired()
                .HasMaxLength(450);
            entity.Property(e => e.ExpectedCash).HasColumnType("decimal(38, 2)");
            entity.Property(e => e.OpeningCash).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.OtherCashIn).HasColumnType("decimal(38, 2)");
            entity.Property(e => e.OtherCashOut).HasColumnType("decimal(38, 2)");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}