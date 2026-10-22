-- Tạo database
USE [master];
GO
IF DB_ID(N'LightLifeDb') IS NULL
    EXEC(N'CREATE DATABASE [LightLifeDb]');
GO
USE [LightLifeDb];
GO
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET ARITHABORT ON;
SET NUMERIC_ROUNDABORT OFF;

IF EXISTS (SELECT 1 FROM sys.tables WHERE is_ms_shipped = 0)
    THROW 51000, N'LightLifeDb đã có bảng. Script chỉ dành cho database trống; không thay đổi dữ liệu hiện có.', 1;

BEGIN TRY
    BEGIN TRANSACTION;

-- Tạo bảng vai trò
CREATE TABLE AspNetRoles (
    Id nvarchar(450) NOT NULL PRIMARY KEY,
    Name nvarchar(256) NOT NULL,
    NormalizedName nvarchar(256) NOT NULL,
    ConcurrencyStamp nvarchar(max) NULL,
    CONSTRAINT CK_Roles_Name CHECK (Name COLLATE Latin1_General_100_BIN2 IN (N'Admin',N'Employee',N'Customer')),
    CONSTRAINT CK_Roles_Normalized CHECK (NormalizedName COLLATE Latin1_General_100_BIN2 = UPPER(Name) COLLATE Latin1_General_100_BIN2)
);

-- Tạo bảng tài khoản
CREATE TABLE AspNetUsers (
    Id nvarchar(450) NOT NULL PRIMARY KEY,
    UserName nvarchar(256) NOT NULL,
    NormalizedUserName nvarchar(256) NOT NULL,
    Email nvarchar(256) NULL,
    NormalizedEmail nvarchar(256) NULL,
    EmailConfirmed bit NOT NULL DEFAULT 0,
    PasswordHash nvarchar(max) NULL,
    SecurityStamp nvarchar(max) NULL,
    ConcurrencyStamp nvarchar(max) NULL,
    PhoneNumber nvarchar(max) NULL,
    PhoneNumberConfirmed bit NOT NULL DEFAULT 0,
    TwoFactorEnabled bit NOT NULL DEFAULT 0,
    LockoutEnd datetimeoffset(7) NULL,
    LockoutEnabled bit NOT NULL DEFAULT 1,
    AccessFailedCount int NOT NULL DEFAULT 0,
    FullName nvarchar(100) NOT NULL,
    AvatarPath nvarchar(500) NULL,
    IsActive bit NOT NULL DEFAULT 1,
    CreatedAt datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_Users_FailedCount CHECK (AccessFailedCount >= 0)
);

-- Tạo bảng vai trò của tài khoản
CREATE TABLE AspNetUserRoles (
    UserId nvarchar(450) NOT NULL,
    RoleId nvarchar(450) NOT NULL,
    CONSTRAINT PK_AspNetUserRoles PRIMARY KEY (UserId,RoleId),
    CONSTRAINT UQ_UserRoles_OneRole UNIQUE (UserId),
    CONSTRAINT FK_UserRoles_User FOREIGN KEY (UserId) REFERENCES AspNetUsers (Id),
    CONSTRAINT FK_UserRoles_Role FOREIGN KEY (RoleId) REFERENCES AspNetRoles (Id)
);

-- Tạo bảng thuộc tính quyền của tài khoản
CREATE TABLE AspNetUserClaims (
    Id int IDENTITY(1,1) NOT NULL PRIMARY KEY,
    UserId nvarchar(450) NOT NULL,
    ClaimType nvarchar(max) NULL,
    ClaimValue nvarchar(max) NULL,
    CONSTRAINT FK_UserClaims_User FOREIGN KEY (UserId) REFERENCES AspNetUsers (Id)
);

-- Tạo bảng thuộc tính quyền của vai trò
CREATE TABLE AspNetRoleClaims (
    Id int IDENTITY(1,1) NOT NULL PRIMARY KEY,
    RoleId nvarchar(450) NOT NULL,
    ClaimType nvarchar(max) NULL,
    ClaimValue nvarchar(max) NULL,
    CONSTRAINT FK_RoleClaims_Role FOREIGN KEY (RoleId) REFERENCES AspNetRoles (Id)
);

-- Tạo bảng tài khoản đăng nhập bên ngoài
CREATE TABLE AspNetUserLogins (
    LoginProvider nvarchar(128) NOT NULL,
    ProviderKey nvarchar(128) NOT NULL,
    ProviderDisplayName nvarchar(max) NULL,
    UserId nvarchar(450) NOT NULL,
    CONSTRAINT PK_AspNetUserLogins PRIMARY KEY (LoginProvider,ProviderKey),
    CONSTRAINT FK_UserLogins_User FOREIGN KEY (UserId) REFERENCES AspNetUsers (Id)
);

-- Tạo bảng token tài khoản
CREATE TABLE AspNetUserTokens (
    UserId nvarchar(450) NOT NULL,
    LoginProvider nvarchar(128) NOT NULL,
    Name nvarchar(128) NOT NULL,
    Value nvarchar(max) NULL,
    CONSTRAINT PK_AspNetUserTokens PRIMARY KEY (UserId,LoginProvider,Name),
    CONSTRAINT FK_UserTokens_User FOREIGN KEY (UserId) REFERENCES AspNetUsers (Id)
);

-- Tạo bảng danh mục sản phẩm
CREATE TABLE Categories (
    Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    Name nvarchar(100) NOT NULL,
    Slug varchar(120) NOT NULL,
    ParentId bigint NULL,
    IsActive bit NOT NULL DEFAULT 1,
    CONSTRAINT UQ_Categories_Slug UNIQUE (Slug),
    CONSTRAINT FK_Categories_Parent FOREIGN KEY (ParentId) REFERENCES Categories (Id),
    CONSTRAINT CK_Categories_Parent CHECK (ParentId IS NULL OR ParentId <> Id)
);

-- Tạo bảng thương hiệu
CREATE TABLE Brands (
    Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    Name nvarchar(100) NOT NULL,
    IsActive bit NOT NULL DEFAULT 1,
    CONSTRAINT UQ_Brands_Name UNIQUE (Name)
);

-- Tạo bảng màu sắc
CREATE TABLE Colors (
    Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    Name nvarchar(50) NOT NULL,
    HexCode char(7) NULL,
    CONSTRAINT UQ_Colors_Name UNIQUE (Name),
    CONSTRAINT CK_Colors_Hex CHECK (HexCode IS NULL OR (LEFT(HexCode,1) = '#' AND SUBSTRING(HexCode,2,6) COLLATE Latin1_General_100_BIN2 NOT LIKE '%[^0-9A-Fa-f]%'))
);

-- Tạo bảng kích cỡ
CREATE TABLE Sizes (
    Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    Name nvarchar(30) NOT NULL,
    SortOrder int NOT NULL DEFAULT 0,
    CONSTRAINT UQ_Sizes_Name UNIQUE (Name)
);

-- Tạo bảng sản phẩm
CREATE TABLE Products (
    Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    ProductCode varchar(50) NOT NULL,
    Name nvarchar(200) NOT NULL,
    Slug varchar(220) NOT NULL,
    CategoryId bigint NOT NULL,
    BrandId bigint NULL,
    Material nvarchar(150) NULL,
    Description nvarchar(max) NULL,
    CareInstructions nvarchar(max) NULL,
    IsActive bit NOT NULL DEFAULT 1,
    IsPublished bit NOT NULL DEFAULT 0,
    CreatedAt datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    RowVersion rowversion NOT NULL,
    CONSTRAINT UQ_Products_Code UNIQUE (ProductCode),
    CONSTRAINT UQ_Products_Slug UNIQUE (Slug),
    CONSTRAINT FK_Products_Category FOREIGN KEY (CategoryId) REFERENCES Categories (Id),
    CONSTRAINT FK_Products_Brand FOREIGN KEY (BrandId) REFERENCES Brands (Id)
);

-- Tạo bảng biến thể sản phẩm
CREATE TABLE ProductVariants (
    Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    ProductId bigint NOT NULL,
    ColorId bigint NOT NULL,
    SizeId bigint NOT NULL,
    Sku varchar(80) NOT NULL,
    Barcode varchar(80) NULL,
    SalePrice decimal(18,2) NOT NULL,
    LowStockThreshold int NOT NULL DEFAULT 5,
    IsActive bit NOT NULL DEFAULT 1,
    RowVersion rowversion NOT NULL,
    CONSTRAINT UQ_Variants_Sku UNIQUE (Sku),
    CONSTRAINT UQ_Variants_Combination UNIQUE (ProductId,ColorId,SizeId),
    CONSTRAINT FK_Variants_Product FOREIGN KEY (ProductId) REFERENCES Products (Id),
    CONSTRAINT FK_Variants_Color FOREIGN KEY (ColorId) REFERENCES Colors (Id),
    CONSTRAINT FK_Variants_Size FOREIGN KEY (SizeId) REFERENCES Sizes (Id),
    CONSTRAINT CK_Variants_Values CHECK (SalePrice >= 0 AND LowStockThreshold >= 0)
);

-- Tạo bảng hình ảnh sản phẩm
CREATE TABLE ProductImages (
    Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    ProductId bigint NOT NULL,
    ColorId bigint NULL,
    ImagePath nvarchar(500) NOT NULL,
    AltText nvarchar(200) NULL,
    IsMain bit NOT NULL DEFAULT 0,
    SortOrder int NOT NULL DEFAULT 0,
    CONSTRAINT FK_Images_Product FOREIGN KEY (ProductId) REFERENCES Products (Id),
    CONSTRAINT FK_Images_Color FOREIGN KEY (ColorId) REFERENCES Colors (Id)
);

-- Tạo bảng khách hàng
CREATE TABLE Customers (
    Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    UserId nvarchar(450) NULL,
    FullName nvarchar(100) NOT NULL,
    Phone varchar(20) NULL,
    Email nvarchar(256) NULL,
    Note nvarchar(500) NULL,
    IsActive bit NOT NULL DEFAULT 1,
    CreatedAt datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Customers_User FOREIGN KEY (UserId) REFERENCES AspNetUsers (Id)
);

-- Tạo bảng địa chỉ khách hàng
CREATE TABLE CustomerAddresses (
    Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    CustomerId bigint NOT NULL,
    ReceiverName nvarchar(100) NOT NULL,
    Phone varchar(20) NOT NULL,
    AddressLine nvarchar(400) NOT NULL,
    IsDefault bit NOT NULL DEFAULT 0,
    CreatedAt datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Addresses_Customer FOREIGN KEY (CustomerId) REFERENCES Customers (Id)
);

-- Tạo bảng nhà cung cấp
CREATE TABLE Suppliers (
    Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    SupplierCode varchar(50) NOT NULL,
    Name nvarchar(200) NOT NULL,
    ContactName nvarchar(100) NULL,
    Phone varchar(20) NULL,
    Email nvarchar(256) NULL,
    AddressLine nvarchar(400) NULL,
    Note nvarchar(500) NULL,
    IsActive bit NOT NULL DEFAULT 1,
    CONSTRAINT UQ_Suppliers_Code UNIQUE (SupplierCode)
);

-- Tạo bảng quầy bán hàng
CREATE TABLE CashRegisters (
    Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    Code varchar(30) NOT NULL,
    Name nvarchar(100) NOT NULL,
    IsActive bit NOT NULL DEFAULT 1,
    CONSTRAINT UQ_Registers_Code UNIQUE (Code)
);

-- Tạo bảng ca làm việc
CREATE TABLE Shifts (
    Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    CashRegisterId bigint NOT NULL,
    EmployeeUserId nvarchar(450) NOT NULL,
    Status tinyint NOT NULL DEFAULT 1, -- 1: Đang mở; 2: Chờ đối soát; 3: Đã đóng
    OpenedAt datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    OpeningCash decimal(18,2) NOT NULL,
    SubmittedAt datetime2(3) NULL,
    ClosingActualCash decimal(18,2) NULL,
    ClosingExpectedCash decimal(18,2) NULL,
    VarianceReason nvarchar(1000) NULL,
    ReconciledByUserId nvarchar(450) NULL,
    ReconciledAt datetime2(3) NULL,
    Note nvarchar(1000) NULL,
    RowVersion rowversion NOT NULL,
    CONSTRAINT FK_Shifts_Register FOREIGN KEY (CashRegisterId) REFERENCES CashRegisters (Id),
    CONSTRAINT FK_Shifts_Employee FOREIGN KEY (EmployeeUserId) REFERENCES AspNetUsers (Id),
    CONSTRAINT FK_Shifts_Reconciler FOREIGN KEY (ReconciledByUserId) REFERENCES AspNetUsers (Id),
    CONSTRAINT CK_Shifts_Status CHECK (Status IN (1,2,3)),
    CONSTRAINT CK_Shifts_Cash CHECK (OpeningCash >= 0 AND (ClosingActualCash IS NULL OR ClosingActualCash >= 0)),
    CONSTRAINT CK_Shifts_State CHECK ((Status = 1 AND SubmittedAt IS NULL AND ReconciledAt IS NULL AND ReconciledByUserId IS NULL) OR (Status = 2 AND SubmittedAt IS NOT NULL AND ClosingActualCash IS NOT NULL AND ClosingExpectedCash IS NOT NULL AND ReconciledAt IS NULL AND ReconciledByUserId IS NULL) OR (Status = 3 AND SubmittedAt IS NOT NULL AND ClosingActualCash IS NOT NULL AND ClosingExpectedCash IS NOT NULL AND ReconciledAt IS NOT NULL AND ReconciledByUserId IS NOT NULL)),
    CONSTRAINT CK_Shifts_Time CHECK ((SubmittedAt IS NULL OR SubmittedAt >= OpenedAt) AND (ReconciledAt IS NULL OR ReconciledAt >= SubmittedAt)),
    CONSTRAINT CK_Shifts_ExpectedCash CHECK (ClosingExpectedCash IS NULL OR ClosingExpectedCash >= 0)
);

-- Tạo bảng thu chi tiền mặt trong ca
CREATE TABLE ShiftCashEntries (
    Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    ShiftId bigint NOT NULL,
    Direction tinyint NOT NULL, -- 1: Thu; 2: Chi
    Amount decimal(18,2) NOT NULL,
    Reason nvarchar(500) NOT NULL,
    RecordedByUserId nvarchar(450) NOT NULL,
    ApprovedByUserId nvarchar(450) NOT NULL,
    RequestId uniqueidentifier NOT NULL,
    CreatedAt datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_CashEntries_Shift FOREIGN KEY (ShiftId) REFERENCES Shifts (Id),
    CONSTRAINT FK_CashEntries_Recorder FOREIGN KEY (RecordedByUserId) REFERENCES AspNetUsers (Id),
    CONSTRAINT FK_CashEntries_Approver FOREIGN KEY (ApprovedByUserId) REFERENCES AspNetUsers (Id),
    CONSTRAINT CK_CashEntries_Values CHECK (Direction IN (1,2) AND Amount > 0),
    CONSTRAINT UQ_CashEntries_Request UNIQUE (RecordedByUserId,RequestId)
);

-- Tạo bảng tồn kho theo biến thể
CREATE TABLE StockBalances (
    VariantId bigint NOT NULL PRIMARY KEY,
    SellableQuantity int NOT NULL DEFAULT 0,
    ReservedQuantity int NOT NULL DEFAULT 0,
    DamagedQuantity int NOT NULL DEFAULT 0,
    AvailableQuantity AS (SellableQuantity - ReservedQuantity) PERSISTED,
    UpdatedAt datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    RowVersion rowversion NOT NULL,
    CONSTRAINT FK_Balances_Variant FOREIGN KEY (VariantId) REFERENCES ProductVariants (Id),
    CONSTRAINT CK_Balances_Quantity CHECK (SellableQuantity >= 0 AND ReservedQuantity >= 0 AND DamagedQuantity >= 0 AND ReservedQuantity <= SellableQuantity)
);

-- Tạo bảng khuyến mãi
CREATE TABLE Promotions (
    Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    Code varchar(50) NOT NULL,
    Name nvarchar(150) NOT NULL,
    Scope tinyint NOT NULL DEFAULT 1, -- 1: Toàn bộ sản phẩm; 2: Sản phẩm được chọn
    Channel tinyint NULL, -- NULL: Cả hai kênh; 1: Trực tuyến; 2: Tại quầy
    DiscountType tinyint NOT NULL, -- 1: Phần trăm; 2: Số tiền
    DiscountValue decimal(18,2) NOT NULL,
    MaxDiscountAmount decimal(18,2) NULL,
    MinEligibleSubtotal decimal(18,2) NOT NULL DEFAULT 0,
    StartsAt datetime2(3) NOT NULL,
    EndsAt datetime2(3) NOT NULL,
    UsageLimit int NULL,
    UsedCount int NOT NULL DEFAULT 0,
    IsActive bit NOT NULL DEFAULT 0,
    RowVersion rowversion NOT NULL,
    CONSTRAINT UQ_Promotions_Code UNIQUE (Code),
    CONSTRAINT CK_Promotions_Scope CHECK (Scope IN (1,2) AND (Channel IS NULL OR Channel IN (1,2))),
    CONSTRAINT CK_Promotions_Discount CHECK (DiscountType IN (1,2) AND DiscountValue > 0 AND (DiscountType = 2 OR DiscountValue <= 100) AND (MaxDiscountAmount IS NULL OR MaxDiscountAmount > 0) AND MinEligibleSubtotal >= 0),
    CONSTRAINT CK_Promotions_Time CHECK (EndsAt > StartsAt),
    CONSTRAINT CK_Promotions_Usage CHECK (UsedCount >= 0 AND (UsageLimit IS NULL OR (UsageLimit > 0 AND UsedCount <= UsageLimit)))
);

-- Tạo bảng sản phẩm áp dụng khuyến mãi
CREATE TABLE PromotionProducts (
    PromotionId bigint NOT NULL,
    ProductId bigint NOT NULL,
    CONSTRAINT PK_PromotionProducts PRIMARY KEY (PromotionId,ProductId),
    CONSTRAINT FK_PromoProducts_Promo FOREIGN KEY (PromotionId) REFERENCES Promotions (Id),
    CONSTRAINT FK_PromoProducts_Product FOREIGN KEY (ProductId) REFERENCES Products (Id)
);

-- Tạo bảng đơn hàng
CREATE TABLE Orders (
    Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    OrderCode varchar(40) NOT NULL,
    Channel tinyint NOT NULL, -- 1: Trực tuyến; 2: Tại quầy
    Status tinyint NOT NULL, -- 1: Chờ xác nhận; 2: Đã xác nhận; 3: Đang chuẩn bị; 4: Đang giao; 5: Hoàn tất; 6: Đã hủy; 7: Giao thất bại
    CustomerId bigint NULL,
    BuyerUserId nvarchar(450) NULL,
    CreatedByUserId nvarchar(450) NOT NULL,
    AssignedEmployeeUserId nvarchar(450) NULL,
    ShiftId bigint NULL,
    PromotionId bigint NULL,
    ReceiverName nvarchar(100) NULL,
    ReceiverPhone varchar(20) NULL,
    DeliveryAddress nvarchar(400) NULL,
    PaymentMethod tinyint NOT NULL, -- 1: Tiền mặt tại quầy; 2: Chuyển khoản; 3: Thu hộ khi giao hàng
    Subtotal decimal(18,2) NOT NULL,
    DiscountAmount decimal(18,2) NOT NULL DEFAULT 0,
    ShippingFee decimal(18,2) NOT NULL DEFAULT 0,
    GrandTotal AS (Subtotal - DiscountAmount + ShippingFee) PERSISTED,
    Note nvarchar(1000) NULL,
    CancelReason nvarchar(500) NULL,
    CancelledAt datetime2(3) NULL,
    CancelledByUserId nvarchar(450) NULL,
    ReservationExpiresAt datetime2(3) NULL,
    CompletedAt datetime2(3) NULL,
    CreatedAt datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    RowVersion rowversion NOT NULL,
    CONSTRAINT UQ_Orders_Code UNIQUE (OrderCode),
    CONSTRAINT FK_Orders_Customer FOREIGN KEY (CustomerId) REFERENCES Customers (Id),
    CONSTRAINT FK_Orders_Buyer FOREIGN KEY (BuyerUserId) REFERENCES AspNetUsers (Id),
    CONSTRAINT FK_Orders_Creator FOREIGN KEY (CreatedByUserId) REFERENCES AspNetUsers (Id),
    CONSTRAINT FK_Orders_Assignee FOREIGN KEY (AssignedEmployeeUserId) REFERENCES AspNetUsers (Id),
    CONSTRAINT FK_Orders_Shift FOREIGN KEY (ShiftId) REFERENCES Shifts (Id),
    CONSTRAINT FK_Orders_Promo FOREIGN KEY (PromotionId) REFERENCES Promotions (Id),
    CONSTRAINT FK_Orders_Canceller FOREIGN KEY (CancelledByUserId) REFERENCES AspNetUsers (Id),
    CONSTRAINT CK_Orders_Enums CHECK (Channel IN (1,2) AND Status IN (1,2,3,4,5,6,7) AND PaymentMethod IN (1,2,3)),
    CONSTRAINT CK_Orders_Amounts CHECK (Subtotal >= 0 AND DiscountAmount >= 0 AND DiscountAmount <= Subtotal AND ShippingFee >= 0),
    CONSTRAINT CK_Orders_Channel CHECK ((Channel = 1 AND CustomerId IS NOT NULL AND BuyerUserId IS NOT NULL AND ShiftId IS NULL AND PaymentMethod IN (2,3) AND ReceiverName IS NOT NULL AND ReceiverPhone IS NOT NULL AND DeliveryAddress IS NOT NULL AND LEN(LTRIM(RTRIM(ReceiverName))) > 0 AND LEN(LTRIM(RTRIM(ReceiverPhone))) > 0 AND LEN(LTRIM(RTRIM(DeliveryAddress))) > 0) OR (Channel = 2 AND BuyerUserId IS NULL AND ShiftId IS NOT NULL AND Status = 5 AND PaymentMethod IN (1,2) AND ShippingFee = 0 AND ReservationExpiresAt IS NULL)),
    CONSTRAINT CK_Orders_Cancel CHECK ((Status = 6 AND CancelledAt IS NOT NULL AND CancelledByUserId IS NOT NULL AND CancelReason IS NOT NULL) OR (Status <> 6 AND CancelledAt IS NULL AND CancelledByUserId IS NULL AND CancelReason IS NULL)),
    CONSTRAINT CK_Orders_Completed CHECK ((Status = 5 AND CompletedAt IS NOT NULL) OR (Status <> 5 AND CompletedAt IS NULL)),
    CONSTRAINT CK_Orders_Time CHECK ((CompletedAt IS NULL OR CompletedAt >= CreatedAt) AND (CancelledAt IS NULL OR CancelledAt >= CreatedAt) AND (ReservationExpiresAt IS NULL OR ReservationExpiresAt > CreatedAt))
);

-- Tạo bảng chi tiết đơn hàng
CREATE TABLE OrderItems (
    Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    OrderId bigint NOT NULL,
    VariantId bigint NOT NULL,
    SkuSnapshot varchar(80) NOT NULL,
    ProductNameSnapshot nvarchar(200) NOT NULL,
    ColorSnapshot nvarchar(50) NOT NULL,
    SizeSnapshot nvarchar(30) NOT NULL,
    Quantity int NOT NULL,
    UnitPrice decimal(18,2) NOT NULL,
    DiscountAmount decimal(18,2) NOT NULL DEFAULT 0,
    LineTotal AS (Quantity * UnitPrice - DiscountAmount) PERSISTED,
    RowVersion rowversion NOT NULL,
    CONSTRAINT FK_OrderItems_Order FOREIGN KEY (OrderId) REFERENCES Orders (Id),
    CONSTRAINT FK_OrderItems_Variant FOREIGN KEY (VariantId) REFERENCES ProductVariants (Id),
    CONSTRAINT UQ_OrderItems_OrderVariant UNIQUE (OrderId,VariantId),
    CONSTRAINT UQ_OrderItems_LineVariant UNIQUE (Id,VariantId),
    CONSTRAINT UQ_OrderItems_OrderLine UNIQUE (OrderId,Id),
    CONSTRAINT CK_OrderItems_Amounts CHECK (Quantity > 0 AND UnitPrice >= 0 AND DiscountAmount >= 0 AND DiscountAmount <= Quantity * UnitPrice)
);

-- Tạo bảng lịch sử trạng thái đơn hàng
CREATE TABLE OrderStatusHistory (
    Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    OrderId bigint NOT NULL,
    FromStatus tinyint NULL, -- NULL: Lần tạo đơn; 1: Chờ xác nhận; 2: Đã xác nhận; 3: Đang chuẩn bị; 4: Đang giao; 5: Hoàn tất; 6: Đã hủy; 7: Giao thất bại
    ToStatus tinyint NOT NULL, -- 1: Chờ xác nhận; 2: Đã xác nhận; 3: Đang chuẩn bị; 4: Đang giao; 5: Hoàn tất; 6: Đã hủy; 7: Giao thất bại
    ChangedByUserId nvarchar(450) NOT NULL,
    Reason nvarchar(500) NULL,
    CreatedAt datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_OrderHistory_Order FOREIGN KEY (OrderId) REFERENCES Orders (Id),
    CONSTRAINT FK_OrderHistory_Actor FOREIGN KEY (ChangedByUserId) REFERENCES AspNetUsers (Id),
    CONSTRAINT CK_OrderHistory_Status CHECK (ToStatus IN (1,2,3,4,5,6,7) AND (FromStatus IS NULL OR FromStatus IN (1,2,3,4,5,6,7))),
    CONSTRAINT CK_History_StatusDomain CHECK ((FromStatus IS NULL OR FromStatus IN (1,2,3,4,5,6,7)) AND ToStatus IN (1,2,3,4,5,6,7))
);

-- Tạo bảng giữ hàng cho đơn trực tuyến
CREATE TABLE InventoryReservations (
    Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    OrderItemId bigint NOT NULL,
    VariantId bigint NOT NULL,
    Quantity int NOT NULL,
    Status tinyint NOT NULL DEFAULT 1, -- 1: Đang giữ; 2: Đã giải phóng; 3: Đã xuất hàng
    CreatedAt datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    ClosedAt datetime2(3) NULL,
    RowVersion rowversion NOT NULL,
    CONSTRAINT FK_Reservations_LineVariant FOREIGN KEY (OrderItemId,VariantId) REFERENCES OrderItems (Id,VariantId),
    CONSTRAINT UQ_Reservations_Line UNIQUE (OrderItemId),
    CONSTRAINT CK_Reservations_Values CHECK (Quantity > 0 AND Status IN (1,2,3)),
    CONSTRAINT CK_Reservations_Closed CHECK ((Status = 1 AND ClosedAt IS NULL) OR (Status IN (2,3) AND ClosedAt IS NOT NULL)),
    CONSTRAINT CK_Reservations_Time CHECK (ClosedAt IS NULL OR ClosedAt >= CreatedAt)
);

-- Tạo bảng giao hàng
CREATE TABLE Shipments (
    Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    OrderId bigint NOT NULL,
    Status tinyint NOT NULL DEFAULT 1, -- 1: Chuẩn bị giao; 2: Đã bàn giao; 3: Đã giao; 4: Giao thất bại; 5: Đã trả về cửa hàng
    CarrierName nvarchar(100) NULL,
    TrackingCode varchar(100) NULL,
    DispatchedAt datetime2(3) NULL,
    DeliveredAt datetime2(3) NULL,
    ReturnedAt datetime2(3) NULL,
    FailureReason nvarchar(500) NULL,
    UpdatedByUserId nvarchar(450) NOT NULL,
    CreatedAt datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    RowVersion rowversion NOT NULL,
    CONSTRAINT UQ_Shipments_Order UNIQUE (OrderId),
    CONSTRAINT FK_Shipments_Order FOREIGN KEY (OrderId) REFERENCES Orders (Id),
    CONSTRAINT FK_Shipments_Actor FOREIGN KEY (UpdatedByUserId) REFERENCES AspNetUsers (Id),
    CONSTRAINT CK_Shipments_Status CHECK (Status IN (1,2,3,4,5)),
    CONSTRAINT CK_Shipments_Time CHECK ((Status = 1 AND DispatchedAt IS NULL AND DeliveredAt IS NULL AND ReturnedAt IS NULL) OR (Status = 2 AND DispatchedAt IS NOT NULL AND DeliveredAt IS NULL AND ReturnedAt IS NULL) OR (Status = 3 AND DispatchedAt IS NOT NULL AND DeliveredAt IS NOT NULL AND ReturnedAt IS NULL) OR (Status = 4 AND DispatchedAt IS NOT NULL AND FailureReason IS NOT NULL AND DeliveredAt IS NULL AND ReturnedAt IS NULL) OR (Status = 5 AND DispatchedAt IS NOT NULL AND ReturnedAt IS NOT NULL AND DeliveredAt IS NULL)),
    CONSTRAINT CK_Shipments_TimeOrder CHECK ((DispatchedAt IS NULL OR DispatchedAt >= CreatedAt) AND (DeliveredAt IS NULL OR DeliveredAt >= DispatchedAt) AND (ReturnedAt IS NULL OR ReturnedAt >= DispatchedAt))
);

-- Tạo bảng lượt sử dụng khuyến mãi
CREATE TABLE PromotionRedemptions (
    Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    PromotionId bigint NOT NULL,
    OrderId bigint NOT NULL,
    DiscountAmount decimal(18,2) NOT NULL,
    Status tinyint NOT NULL DEFAULT 1, -- 1: Đã sử dụng; 2: Đã giải phóng
    CreatedAt datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Redemptions_Promotion FOREIGN KEY (PromotionId) REFERENCES Promotions (Id),
    CONSTRAINT FK_Redemptions_Order FOREIGN KEY (OrderId) REFERENCES Orders (Id),
    CONSTRAINT UQ_Redemptions_Order UNIQUE (OrderId),
    CONSTRAINT CK_Redemptions_Values CHECK (DiscountAmount >= 0 AND Status IN (1,2))
);

-- Tạo bảng phiếu nhập kho
CREATE TABLE GoodsReceipts (
    Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    ReceiptCode varchar(40) NOT NULL,
    SupplierId bigint NOT NULL,
    SupplierDocumentNumber nvarchar(100) NULL,
    Status tinyint NOT NULL DEFAULT 1, -- 1: Chờ duyệt; 2: Đã ghi sổ; 3: Bị từ chối
    ReceivedAt datetime2(3) NOT NULL,
    CreatedByUserId nvarchar(450) NOT NULL,
    PostedByUserId nvarchar(450) NULL,
    PostedAt datetime2(3) NULL,
    RejectedByUserId nvarchar(450) NULL,
    RejectedAt datetime2(3) NULL,
    RejectionReason nvarchar(500) NULL,
    Note nvarchar(1000) NULL,
    CreatedAt datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    RowVersion rowversion NOT NULL,
    CONSTRAINT UQ_Receipts_Code UNIQUE (ReceiptCode),
    CONSTRAINT FK_Receipts_Supplier FOREIGN KEY (SupplierId) REFERENCES Suppliers (Id),
    CONSTRAINT FK_Receipts_Creator FOREIGN KEY (CreatedByUserId) REFERENCES AspNetUsers (Id),
    CONSTRAINT FK_Receipts_Poster FOREIGN KEY (PostedByUserId) REFERENCES AspNetUsers (Id),
    CONSTRAINT FK_Receipts_Rejector FOREIGN KEY (RejectedByUserId) REFERENCES AspNetUsers (Id),
    CONSTRAINT CK_Receipts_State CHECK ((Status = 1 AND PostedAt IS NULL AND PostedByUserId IS NULL AND RejectedAt IS NULL AND RejectedByUserId IS NULL) OR (Status = 2 AND PostedAt IS NOT NULL AND PostedByUserId IS NOT NULL AND RejectedAt IS NULL AND RejectedByUserId IS NULL) OR (Status = 3 AND RejectedAt IS NOT NULL AND RejectedByUserId IS NOT NULL AND RejectionReason IS NOT NULL AND PostedAt IS NULL AND PostedByUserId IS NULL))
);

-- Tạo bảng chi tiết phiếu nhập kho
CREATE TABLE GoodsReceiptItems (
    Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    GoodsReceiptId bigint NOT NULL,
    VariantId bigint NOT NULL,
    SellableQuantity int NOT NULL,
    DamagedQuantity int NOT NULL DEFAULT 0,
    UnitCost decimal(18,2) NULL,
    Note nvarchar(500) NULL,
    CONSTRAINT FK_ReceiptItems_Header FOREIGN KEY (GoodsReceiptId) REFERENCES GoodsReceipts (Id),
    CONSTRAINT FK_ReceiptItems_Variant FOREIGN KEY (VariantId) REFERENCES ProductVariants (Id),
    CONSTRAINT UQ_ReceiptItems_Variant UNIQUE (GoodsReceiptId,VariantId),
    CONSTRAINT UQ_ReceiptItems_LineVariant UNIQUE (Id,VariantId),
    CONSTRAINT CK_ReceiptItems_Values CHECK (SellableQuantity >= 0 AND DamagedQuantity >= 0 AND SellableQuantity + DamagedQuantity > 0 AND (UnitCost IS NULL OR UnitCost >= 0))
);

-- Tạo bảng phiếu xuất kho
CREATE TABLE StockIssues (
    Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    IssueCode varchar(40) NOT NULL,
    SupplierId bigint NULL,
    ReasonType tinyint NOT NULL, -- 1: Trả nhà cung cấp; 2: Hủy hàng; 3: Khác
    Reason nvarchar(1000) NOT NULL,
    Status tinyint NOT NULL DEFAULT 1, -- 1: Chờ duyệt; 2: Đã ghi sổ; 3: Bị từ chối
    CreatedByUserId nvarchar(450) NOT NULL,
    PostedByUserId nvarchar(450) NULL,
    PostedAt datetime2(3) NULL,
    RejectedByUserId nvarchar(450) NULL,
    RejectedAt datetime2(3) NULL,
    RejectionReason nvarchar(500) NULL,
    CreatedAt datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    RowVersion rowversion NOT NULL,
    CONSTRAINT UQ_Issues_Code UNIQUE (IssueCode),
    CONSTRAINT FK_Issues_Supplier FOREIGN KEY (SupplierId) REFERENCES Suppliers (Id),
    CONSTRAINT FK_Issues_Creator FOREIGN KEY (CreatedByUserId) REFERENCES AspNetUsers (Id),
    CONSTRAINT FK_Issues_Poster FOREIGN KEY (PostedByUserId) REFERENCES AspNetUsers (Id),
    CONSTRAINT FK_Issues_Rejector FOREIGN KEY (RejectedByUserId) REFERENCES AspNetUsers (Id),
    CONSTRAINT CK_Issues_Reason CHECK (ReasonType IN (1,2,3) AND (ReasonType <> 1 OR SupplierId IS NOT NULL)),
    CONSTRAINT CK_Issues_State CHECK ((Status = 1 AND PostedAt IS NULL AND PostedByUserId IS NULL AND RejectedAt IS NULL AND RejectedByUserId IS NULL) OR (Status = 2 AND PostedAt IS NOT NULL AND PostedByUserId IS NOT NULL AND RejectedAt IS NULL AND RejectedByUserId IS NULL) OR (Status = 3 AND RejectedAt IS NOT NULL AND RejectedByUserId IS NOT NULL AND RejectionReason IS NOT NULL AND PostedAt IS NULL AND PostedByUserId IS NULL))
);

-- Tạo bảng chi tiết phiếu xuất kho
CREATE TABLE StockIssueItems (
    Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    StockIssueId bigint NOT NULL,
    VariantId bigint NOT NULL,
    SellableQuantity int NOT NULL DEFAULT 0,
    DamagedQuantity int NOT NULL DEFAULT 0,
    CONSTRAINT FK_IssueItems_Header FOREIGN KEY (StockIssueId) REFERENCES StockIssues (Id),
    CONSTRAINT FK_IssueItems_Variant FOREIGN KEY (VariantId) REFERENCES ProductVariants (Id),
    CONSTRAINT UQ_IssueItems_Variant UNIQUE (StockIssueId,VariantId),
    CONSTRAINT UQ_IssueItems_LineVariant UNIQUE (Id,VariantId),
    CONSTRAINT CK_IssueItems_Values CHECK (SellableQuantity >= 0 AND DamagedQuantity >= 0 AND SellableQuantity + DamagedQuantity > 0)
);

-- Tạo bảng đợt kiểm kê
CREATE TABLE Stocktakes (
    Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    StocktakeCode varchar(40) NOT NULL,
    Status tinyint NOT NULL DEFAULT 1, -- 1: Đang kiểm đếm; 2: Chờ duyệt; 3: Hoàn tất; 4: Đã hủy
    CreatedByUserId nvarchar(450) NOT NULL,
    ApprovedByUserId nvarchar(450) NULL,
    ApprovedAt datetime2(3) NULL,
    ClosedAt datetime2(3) NULL,
    CloseReason nvarchar(1000) NULL,
    CreatedAt datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    RowVersion rowversion NOT NULL,
    CONSTRAINT UQ_Stocktakes_Code UNIQUE (StocktakeCode),
    CONSTRAINT FK_Stocktakes_Creator FOREIGN KEY (CreatedByUserId) REFERENCES AspNetUsers (Id),
    CONSTRAINT FK_Stocktakes_Approver FOREIGN KEY (ApprovedByUserId) REFERENCES AspNetUsers (Id),
    CONSTRAINT CK_Stocktakes_State CHECK ((Status IN (1,2) AND ApprovedAt IS NULL AND ApprovedByUserId IS NULL AND ClosedAt IS NULL) OR (Status = 3 AND ApprovedAt IS NOT NULL AND ApprovedByUserId IS NOT NULL AND ClosedAt IS NOT NULL) OR (Status = 4 AND ClosedAt IS NOT NULL AND CloseReason IS NOT NULL AND ApprovedAt IS NULL AND ApprovedByUserId IS NULL))
);

-- Tạo bảng chi tiết kiểm kê
CREATE TABLE StocktakeItems (
    Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    StocktakeId bigint NOT NULL,
    VariantId bigint NOT NULL,
    SystemSellableQuantity int NOT NULL,
    SystemDamagedQuantity int NOT NULL,
    CountedSellableQuantity int NULL,
    CountedDamagedQuantity int NULL,
    DifferenceReason nvarchar(1000) NULL,
    CountedByUserId nvarchar(450) NULL,
    CountedAt datetime2(3) NULL,
    RowVersion rowversion NOT NULL,
    CONSTRAINT FK_StocktakeItems_Header FOREIGN KEY (StocktakeId) REFERENCES Stocktakes (Id),
    CONSTRAINT FK_StocktakeItems_Variant FOREIGN KEY (VariantId) REFERENCES ProductVariants (Id),
    CONSTRAINT FK_StocktakeItems_Counter FOREIGN KEY (CountedByUserId) REFERENCES AspNetUsers (Id),
    CONSTRAINT UQ_StocktakeItems_Variant UNIQUE (StocktakeId,VariantId),
    CONSTRAINT UQ_StocktakeItems_LineVariant UNIQUE (Id,VariantId),
    CONSTRAINT CK_StocktakeItems_Values CHECK (SystemSellableQuantity >= 0 AND SystemDamagedQuantity >= 0 AND (CountedSellableQuantity IS NULL OR CountedSellableQuantity >= 0) AND (CountedDamagedQuantity IS NULL OR CountedDamagedQuantity >= 0)),
    CONSTRAINT CK_StocktakeItems_CountRecord CHECK ((CountedSellableQuantity IS NULL AND CountedDamagedQuantity IS NULL AND CountedByUserId IS NULL AND CountedAt IS NULL) OR (CountedSellableQuantity IS NOT NULL AND CountedDamagedQuantity IS NOT NULL AND CountedByUserId IS NOT NULL AND CountedAt IS NOT NULL))
);

-- Tạo bảng khóa biến thể trong đợt kiểm kê
CREATE TABLE StocktakeScopeLocks (
    Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    StocktakeId bigint NOT NULL,
    VariantId bigint NOT NULL,
    IsActive bit NOT NULL DEFAULT 1,
    LockedAt datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    ReleasedAt datetime2(3) NULL,
    CONSTRAINT FK_ScopeLock_Item FOREIGN KEY (StocktakeId,VariantId) REFERENCES StocktakeItems (StocktakeId,VariantId),
    CONSTRAINT UQ_ScopeLock_StocktakeVariant UNIQUE (StocktakeId,VariantId),
    CONSTRAINT CK_ScopeLock_State CHECK ((IsActive = 1 AND ReleasedAt IS NULL) OR (IsActive = 0 AND ReleasedAt IS NOT NULL)),
    CONSTRAINT CK_ScopeLocks_Time CHECK (ReleasedAt IS NULL OR ReleasedAt >= LockedAt)
);

-- Tạo bảng yêu cầu đổi trả
CREATE TABLE ReturnRequests (
    Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    ReturnCode varchar(40) NOT NULL,
    OrderId bigint NOT NULL,
    RequestType tinyint NOT NULL DEFAULT 1, -- 1: Trả hàng; 2: Đổi hàng
    ReplacementOrderId bigint NULL,
    Status tinyint NOT NULL DEFAULT 1, -- 1: Đã gửi yêu cầu; 2: Đã duyệt; 3: Đang xử lý; 4: Hoàn tất; 5: Bị từ chối; 6: Đã hủy
    Reason nvarchar(1000) NOT NULL,
    CreatedByUserId nvarchar(450) NOT NULL,
    AssignedEmployeeUserId nvarchar(450) NULL,
    ReviewedByUserId nvarchar(450) NULL,
    ReviewedAt datetime2(3) NULL,
    ReviewNote nvarchar(1000) NULL,
    CompletedAt datetime2(3) NULL,
    CreatedAt datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    RowVersion rowversion NOT NULL,
    CONSTRAINT UQ_Returns_Code UNIQUE (ReturnCode),
    CONSTRAINT UQ_Returns_OrderRequest UNIQUE (OrderId,Id),
    CONSTRAINT FK_Returns_Order FOREIGN KEY (OrderId) REFERENCES Orders (Id),
    CONSTRAINT FK_Returns_Replacement FOREIGN KEY (ReplacementOrderId) REFERENCES Orders (Id),
    CONSTRAINT FK_Returns_Creator FOREIGN KEY (CreatedByUserId) REFERENCES AspNetUsers (Id),
    CONSTRAINT FK_Returns_Assignee FOREIGN KEY (AssignedEmployeeUserId) REFERENCES AspNetUsers (Id),
    CONSTRAINT FK_Returns_Reviewer FOREIGN KEY (ReviewedByUserId) REFERENCES AspNetUsers (Id),
    CONSTRAINT CK_Returns_Enums CHECK (Status IN (1,2,3,4,5,6) AND RequestType IN (1,2)),
    CONSTRAINT CK_Returns_Replacement CHECK ((ReplacementOrderId IS NULL OR (RequestType = 2 AND ReplacementOrderId <> OrderId))),
    CONSTRAINT CK_Returns_Reviewed CHECK ((Status IN (1,6) AND ReviewedAt IS NULL AND ReviewedByUserId IS NULL AND CompletedAt IS NULL) OR (Status IN (2,3,5) AND ReviewedAt IS NOT NULL AND ReviewedByUserId IS NOT NULL AND CompletedAt IS NULL) OR (Status = 4 AND ReviewedAt IS NOT NULL AND ReviewedByUserId IS NOT NULL AND CompletedAt IS NOT NULL))
);

-- Tạo bảng chi tiết hàng trả
CREATE TABLE ReturnItems (
    Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    ReturnRequestId bigint NOT NULL,
    OrderId bigint NOT NULL,
    OrderItemId bigint NOT NULL,
    VariantId bigint NOT NULL,
    Quantity int NOT NULL,
    RefundAmount decimal(18,2) NOT NULL,
    ReceivedSellableQuantity int NOT NULL DEFAULT 0,
    ReceivedDamagedQuantity int NOT NULL DEFAULT 0,
    ReceivedByUserId nvarchar(450) NULL,
    ReceivedAt datetime2(3) NULL,
    EvidencePath nvarchar(500) NULL,
    RowVersion rowversion NOT NULL,
    CONSTRAINT FK_ReturnItems_RequestOrder FOREIGN KEY (OrderId,ReturnRequestId) REFERENCES ReturnRequests (OrderId,Id),
    CONSTRAINT FK_ReturnItems_OrderLine FOREIGN KEY (OrderId,OrderItemId) REFERENCES OrderItems (OrderId,Id),
    CONSTRAINT FK_ReturnItems_LineVariant FOREIGN KEY (OrderItemId,VariantId) REFERENCES OrderItems (Id,VariantId),
    CONSTRAINT FK_ReturnItems_Receiver FOREIGN KEY (ReceivedByUserId) REFERENCES AspNetUsers (Id),
    CONSTRAINT UQ_ReturnItems_Line UNIQUE (ReturnRequestId,OrderItemId),
    CONSTRAINT UQ_ReturnItems_LineVariant UNIQUE (Id,VariantId),
    CONSTRAINT CK_ReturnItems_Values CHECK (Quantity > 0 AND RefundAmount >= 0 AND ReceivedSellableQuantity >= 0 AND ReceivedDamagedQuantity >= 0),
    CONSTRAINT CK_ReturnItems_Receipt CHECK ((ReceivedAt IS NULL AND ReceivedByUserId IS NULL AND ReceivedSellableQuantity = 0 AND ReceivedDamagedQuantity = 0) OR (ReceivedAt IS NOT NULL AND ReceivedByUserId IS NOT NULL AND ReceivedSellableQuantity + ReceivedDamagedQuantity = Quantity))
);

-- Tạo bảng giao dịch thu tiền và hoàn tiền
CREATE TABLE PaymentTransactions (
    Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    OrderId bigint NOT NULL,
    ReturnRequestId bigint NULL,
    Direction tinyint NOT NULL, -- 1: Thu tiền; 2: Hoàn tiền
    Method tinyint NOT NULL, -- 1: Tiền mặt tại quầy; 2: Chuyển khoản; 3: Thu hộ khi giao hàng
    Amount decimal(18,2) NOT NULL,
    ShiftId bigint NULL,
    RecordedByUserId nvarchar(450) NOT NULL,
    ExternalReference nvarchar(150) NULL,
    EvidencePath nvarchar(500) NULL,
    Reason nvarchar(500) NULL,
    RequestId uniqueidentifier NOT NULL,
    OccurredAt datetime2(3) NOT NULL,
    CreatedAt datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Payments_Order FOREIGN KEY (OrderId) REFERENCES Orders (Id),
    CONSTRAINT FK_Payments_ReturnOrder FOREIGN KEY (OrderId,ReturnRequestId) REFERENCES ReturnRequests (OrderId,Id),
    CONSTRAINT FK_Payments_Shift FOREIGN KEY (ShiftId) REFERENCES Shifts (Id),
    CONSTRAINT FK_Payments_Actor FOREIGN KEY (RecordedByUserId) REFERENCES AspNetUsers (Id),
    CONSTRAINT UQ_Payments_Request UNIQUE (RecordedByUserId,RequestId),
    CONSTRAINT CK_Payments_Enums CHECK (Direction IN (1,2) AND Method IN (1,2,3) AND Amount > 0),
    CONSTRAINT CK_Payments_Refund CHECK ((Direction = 1 AND ReturnRequestId IS NULL) OR (Direction = 2 AND Method IN (1,2) AND Reason IS NOT NULL)),
    CONSTRAINT CK_Payments_CashShift CHECK ((Method = 1 AND ShiftId IS NOT NULL) OR (Method IN (2,3) AND ShiftId IS NULL))
);

-- Tạo bảng biến động kho
CREATE TABLE StockMovements (
    Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    VariantId bigint NOT NULL,
    Kind tinyint NOT NULL, -- 1: Xuất bán; 2: Nhập từ nhà cung cấp; 3: Xuất kho khác; 4: Điều chỉnh kiểm kê; 5: Khách trả hàng; 6: Nhận hàng giao thất bại
    SellableDelta int NOT NULL DEFAULT 0,
    DamagedDelta int NOT NULL DEFAULT 0,
    OrderItemId bigint NULL,
    GoodsReceiptItemId bigint NULL,
    StockIssueItemId bigint NULL,
    StocktakeItemId bigint NULL,
    ReturnItemId bigint NULL,
    UnitCostSnapshot decimal(18,2) NULL,
    RecordedByUserId nvarchar(450) NOT NULL,
    BusinessEventId uniqueidentifier NOT NULL,
    CreatedAt datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Movements_Variant FOREIGN KEY (VariantId) REFERENCES ProductVariants (Id),
    CONSTRAINT FK_Movements_Actor FOREIGN KEY (RecordedByUserId) REFERENCES AspNetUsers (Id),
    CONSTRAINT FK_Movements_OrderLine FOREIGN KEY (OrderItemId,VariantId) REFERENCES OrderItems (Id,VariantId),
    CONSTRAINT FK_Movements_ReceiptLine FOREIGN KEY (GoodsReceiptItemId,VariantId) REFERENCES GoodsReceiptItems (Id,VariantId),
    CONSTRAINT FK_Movements_IssueLine FOREIGN KEY (StockIssueItemId,VariantId) REFERENCES StockIssueItems (Id,VariantId),
    CONSTRAINT FK_Movements_StocktakeLine FOREIGN KEY (StocktakeItemId,VariantId) REFERENCES StocktakeItems (Id,VariantId),
    CONSTRAINT FK_Movements_ReturnLine FOREIGN KEY (ReturnItemId,VariantId) REFERENCES ReturnItems (Id,VariantId),
    CONSTRAINT UQ_Movements_EventVariant UNIQUE (BusinessEventId,VariantId),
    CONSTRAINT CK_Movements_Delta CHECK ((SellableDelta <> 0 OR DamagedDelta <> 0) AND (UnitCostSnapshot IS NULL OR UnitCostSnapshot >= 0)),
    CONSTRAINT CK_Movements_Source CHECK ((Kind IN (1,6) AND OrderItemId IS NOT NULL AND GoodsReceiptItemId IS NULL AND StockIssueItemId IS NULL AND StocktakeItemId IS NULL AND ReturnItemId IS NULL) OR (Kind = 2 AND GoodsReceiptItemId IS NOT NULL AND OrderItemId IS NULL AND StockIssueItemId IS NULL AND StocktakeItemId IS NULL AND ReturnItemId IS NULL) OR (Kind = 3 AND StockIssueItemId IS NOT NULL AND OrderItemId IS NULL AND GoodsReceiptItemId IS NULL AND StocktakeItemId IS NULL AND ReturnItemId IS NULL) OR (Kind = 4 AND StocktakeItemId IS NOT NULL AND OrderItemId IS NULL AND GoodsReceiptItemId IS NULL AND StockIssueItemId IS NULL AND ReturnItemId IS NULL) OR (Kind = 5 AND ReturnItemId IS NOT NULL AND OrderItemId IS NULL AND GoodsReceiptItemId IS NULL AND StockIssueItemId IS NULL AND StocktakeItemId IS NULL)),
    CONSTRAINT CK_Movements_Signs CHECK ((Kind = 1 AND SellableDelta < 0 AND DamagedDelta = 0) OR (Kind IN (2,5,6) AND SellableDelta >= 0 AND DamagedDelta >= 0) OR (Kind = 3 AND SellableDelta <= 0 AND DamagedDelta <= 0) OR Kind = 4)
);

-- Tạo bảng cấu hình cửa hàng
CREATE TABLE StoreSettings (
    SettingKey varchar(100) NOT NULL PRIMARY KEY,
    SettingValue nvarchar(max) NOT NULL,
    UpdatedByUserId nvarchar(450) NULL,
    UpdatedAt datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Settings_Actor FOREIGN KEY (UpdatedByUserId) REFERENCES AspNetUsers (Id)
);

-- Tạo bảng thông báo
CREATE TABLE Notifications (
    Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    RecipientUserId nvarchar(450) NOT NULL,
    Title nvarchar(200) NOT NULL,
    Message nvarchar(1000) NOT NULL,
    OrderId bigint NULL,
    ReturnRequestId bigint NULL,
    TargetPath nvarchar(300) NULL,
    ReadAt datetime2(3) NULL,
    CreatedAt datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Notifications_Recipient FOREIGN KEY (RecipientUserId) REFERENCES AspNetUsers (Id),
    CONSTRAINT FK_Notifications_Order FOREIGN KEY (OrderId) REFERENCES Orders (Id),
    CONSTRAINT FK_Notifications_Return FOREIGN KEY (ReturnRequestId) REFERENCES ReturnRequests (Id)
);

-- Tạo bảng nhật ký thao tác
CREATE TABLE AuditLogs (
    Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    ActorUserId nvarchar(450) NULL,
    Action varchar(100) NOT NULL,
    EntityType varchar(100) NOT NULL,
    EntityKey nvarchar(450) NOT NULL,
    Reason nvarchar(1000) NULL,
    ChangeJson nvarchar(max) NULL,
    CorrelationId uniqueidentifier NULL,
    CreatedAt datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Audit_Actor FOREIGN KEY (ActorUserId) REFERENCES AspNetUsers (Id),
    CONSTRAINT CK_Audit_JSON CHECK (ChangeJson IS NULL OR ISJSON(ChangeJson) = 1)
);

-- Tạo bảng yêu cầu đã xử lý
CREATE TABLE ProcessedRequests (
    Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    ActorUserId nvarchar(450) NOT NULL,
    Operation varchar(60) NOT NULL,
    RequestId uniqueidentifier NOT NULL,
    PayloadHash binary(32) NOT NULL,
    ResultEntityType varchar(60) NOT NULL,
    ResultEntityId bigint NOT NULL,
    CreatedAt datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Requests_Actor FOREIGN KEY (ActorUserId) REFERENCES AspNetUsers (Id),
    CONSTRAINT UQ_Requests_Key UNIQUE (ActorUserId,Operation,RequestId),
    CONSTRAINT CK_Requests_Id CHECK (RequestId <> '00000000-0000-0000-0000-000000000000')
);

-- Tạo chỉ mục
CREATE UNIQUE INDEX RoleNameIndex ON AspNetRoles (NormalizedName);
CREATE UNIQUE INDEX UserNameIndex ON AspNetUsers (NormalizedUserName);
CREATE UNIQUE INDEX EmailIndex ON AspNetUsers (NormalizedEmail) WHERE NormalizedEmail IS NOT NULL;
CREATE INDEX IX_UserRoles_RoleId ON AspNetUserRoles (RoleId);
CREATE INDEX IX_AspNetUserClaims_UserId ON AspNetUserClaims (UserId);
CREATE INDEX IX_AspNetRoleClaims_RoleId ON AspNetRoleClaims (RoleId);
CREATE INDEX IX_AspNetUserLogins_UserId ON AspNetUserLogins (UserId);
CREATE UNIQUE INDEX UX_Variants_Barcode ON ProductVariants (Barcode) WHERE Barcode IS NOT NULL;
CREATE UNIQUE INDEX UX_Product_MainImage ON ProductImages (ProductId) WHERE IsMain = 1;
CREATE UNIQUE INDEX UX_Customers_User ON Customers (UserId) WHERE UserId IS NOT NULL;
CREATE UNIQUE INDEX UX_Customers_Phone ON Customers (Phone) WHERE Phone IS NOT NULL;
CREATE UNIQUE INDEX UX_Address_Default ON CustomerAddresses (CustomerId) WHERE IsDefault = 1;
CREATE UNIQUE INDEX UX_Shifts_OpenRegister ON Shifts (CashRegisterId) WHERE Status = 1;
CREATE UNIQUE INDEX UX_Shifts_OpenEmployee ON Shifts (EmployeeUserId) WHERE Status = 1;
CREATE INDEX IX_Orders_BuyerDate ON Orders (BuyerUserId,CreatedAt DESC);
CREATE INDEX IX_Orders_AssignedStatus ON Orders (AssignedEmployeeUserId,Status,CreatedAt);
CREATE INDEX IX_Orders_StatusDate ON Orders (Status,CreatedAt);
CREATE INDEX IX_Reservations_ActiveVariant ON InventoryReservations (VariantId) WHERE Status = 1;
CREATE UNIQUE INDEX UX_ScopeLock_ActiveVariant ON StocktakeScopeLocks (VariantId) WHERE IsActive = 1;
CREATE INDEX IX_Returns_Status ON ReturnRequests (Status,CreatedAt);
CREATE UNIQUE INDEX UX_Payments_ExternalReference ON PaymentTransactions (Method,ExternalReference) WHERE ExternalReference IS NOT NULL;
CREATE INDEX IX_Payments_Order ON PaymentTransactions (OrderId,OccurredAt);
CREATE INDEX IX_Payments_Shift ON PaymentTransactions (ShiftId);
CREATE INDEX IX_Movements_VariantDate ON StockMovements (VariantId,CreatedAt);
CREATE UNIQUE INDEX UX_Movements_OrderSale ON StockMovements (OrderItemId) WHERE Kind = 1;
CREATE UNIQUE INDEX UX_Movements_FailedDelivery ON StockMovements (OrderItemId) WHERE Kind = 6;
CREATE UNIQUE INDEX UX_Movements_Receipt ON StockMovements (GoodsReceiptItemId) WHERE GoodsReceiptItemId IS NOT NULL;
CREATE UNIQUE INDEX UX_Movements_Issue ON StockMovements (StockIssueItemId) WHERE StockIssueItemId IS NOT NULL;
CREATE UNIQUE INDEX UX_Movements_Stocktake ON StockMovements (StocktakeItemId) WHERE StocktakeItemId IS NOT NULL;
CREATE UNIQUE INDEX UX_Movements_CustomerReturn ON StockMovements (ReturnItemId) WHERE ReturnItemId IS NOT NULL;
CREATE INDEX IX_Notifications_UserReadDate ON Notifications (RecipientUserId,ReadAt,CreatedAt DESC);
CREATE INDEX IX_Audit_EntityDate ON AuditLogs (EntityType,EntityKey,CreatedAt DESC);

-- Thêm dữ liệu ban đầu
INSERT AspNetRoles (Id,Name,NormalizedName,ConcurrencyStamp) VALUES
(N'role-admin',N'Admin',N'ADMIN',CONVERT(nvarchar(36),NEWID())),
(N'role-employee',N'Employee',N'EMPLOYEE',CONVERT(nvarchar(36),NEWID())),
(N'role-customer',N'Customer',N'CUSTOMER',CONVERT(nvarchar(36),NEWID()));
INSERT CashRegisters (Code,Name) VALUES ('COUNTER-01',N'Quầy 01');
INSERT StoreSettings (SettingKey,SettingValue) VALUES ('StoreName',N'LIGHT LIFE'),('TimeZone',N'SE Asia Standard Time'),('Currency',N'VND');

-- Tạo view danh sách sản phẩm đang bán
EXEC(N'CREATE VIEW vw_PublicProducts AS
SELECT p.Id AS ProductId,p.Name,p.Slug,p.CategoryId,p.BrandId,
 v.Id AS VariantId,v.Sku,v.ColorId,v.SizeId,v.SalePrice,
 CASE WHEN b.AvailableQuantity > 0 THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END AS IsInStock
 FROM Products p JOIN ProductVariants v ON v.ProductId=p.Id
 LEFT JOIN StockBalances b ON b.VariantId=v.Id
 WHERE p.IsActive=1 AND p.IsPublished=1 AND v.IsActive=1;');

-- Tạo view tổng hợp thanh toán đơn hàng
EXEC(N'CREATE VIEW vw_OrderPaymentSummary AS
SELECT o.Id AS OrderId,o.OrderCode,o.GrandTotal,
 ISNULL(p.CollectedAmount,0) AS CollectedAmount,
 ISNULL(p.RefundedAmount,0) AS RefundedAmount,
 ISNULL(p.CollectedAmount,0)-ISNULL(p.RefundedAmount,0) AS NetCollected,
 CASE WHEN ISNULL(p.RefundedAmount,0)>0 AND ISNULL(p.RefundedAmount,0)>=ISNULL(p.CollectedAmount,0) THEN ''Refunded''
 WHEN ISNULL(p.RefundedAmount,0)>0 THEN ''PartiallyRefunded''
 WHEN ISNULL(p.CollectedAmount,0)>=o.GrandTotal THEN ''Paid''
 WHEN ISNULL(p.CollectedAmount,0)>0 THEN ''PartiallyPaid'' ELSE ''Unpaid'' END AS PaymentStatus
 FROM Orders o LEFT JOIN
 (SELECT OrderId,
 SUM(CASE WHEN Direction=1 THEN Amount ELSE 0 END) AS CollectedAmount,
 SUM(CASE WHEN Direction=2 THEN Amount ELSE 0 END) AS RefundedAmount
 FROM PaymentTransactions GROUP BY OrderId) p ON p.OrderId=o.Id;');

-- Tạo view tổng hợp tiền mặt theo ca
EXEC(N'CREATE VIEW vw_ShiftCashSummary AS
SELECT s.Id AS ShiftId,s.CashRegisterId,s.EmployeeUserId,s.Status,s.OpeningCash,
 ISNULL(p.CashCollected,0) AS CashCollected,ISNULL(p.CashRefunded,0) AS CashRefunded,
 ISNULL(e.OtherCashIn,0) AS OtherCashIn,ISNULL(e.OtherCashOut,0) AS OtherCashOut,
 s.OpeningCash+ISNULL(p.CashCollected,0)-ISNULL(p.CashRefunded,0)+ISNULL(e.OtherCashIn,0)-ISNULL(e.OtherCashOut,0) AS ExpectedCash
 FROM Shifts s LEFT JOIN
 (SELECT ShiftId,SUM(CASE WHEN Direction=1 THEN Amount ELSE 0 END) AS CashCollected,
 SUM(CASE WHEN Direction=2 THEN Amount ELSE 0 END) AS CashRefunded
 FROM PaymentTransactions WHERE Method=1 GROUP BY ShiftId) p ON p.ShiftId=s.Id
 LEFT JOIN (SELECT ShiftId,SUM(CASE WHEN Direction=1 THEN Amount ELSE 0 END) AS OtherCashIn,
 SUM(CASE WHEN Direction=2 THEN Amount ELSE 0 END) AS OtherCashOut
 FROM ShiftCashEntries GROUP BY ShiftId) e ON e.ShiftId=s.Id;');

-- Tạo trigger bảo vệ ba vai trò
EXEC(N'CREATE TRIGGER TR_Roles_ProtectNames
ON AspNetRoles
AFTER UPDATE, DELETE
AS
BEGIN
    IF ROWCOUNT_BIG() = 0 RETURN;
    SET NOCOUNT ON;
IF EXISTS (SELECT 1 FROM deleted d LEFT JOIN inserted i ON i.Id = d.Id
               WHERE i.Id IS NULL OR i.Name <> d.Name OR i.NormalizedName <> d.NormalizedName)
        THROW 51101, N''Không xóa hoặc đổi tên vai trò.'', 1;
END;');

-- Tạo trigger bảo vệ vai trò đang được chứng từ tham chiếu
EXEC(N'CREATE TRIGGER TR_UserRoles_ReferencedRoles
ON AspNetUserRoles
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    IF ROWCOUNT_BIG() = 0 RETURN;
    SET NOCOUNT ON;
IF EXISTS (SELECT 1 FROM (SELECT t.UserId AS UserId FROM Customers t
        JOIN (SELECT UserId FROM inserted UNION SELECT UserId FROM deleted) a ON a.UserId = t.UserId
        WHERE NOT EXISTS (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
                          WHERE ur.UserId = t.UserId AND r.Name IN (N''Customer''))
UNION ALL
SELECT t.EmployeeUserId AS UserId FROM Shifts t
        JOIN (SELECT UserId FROM inserted UNION SELECT UserId FROM deleted) a ON a.UserId = t.EmployeeUserId
        WHERE NOT EXISTS (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
                          WHERE ur.UserId = t.EmployeeUserId AND r.Name IN (N''Admin'',N''Employee''))
UNION ALL
SELECT t.ReconciledByUserId AS UserId FROM Shifts t
        JOIN (SELECT UserId FROM inserted UNION SELECT UserId FROM deleted) a ON a.UserId = t.ReconciledByUserId
        WHERE NOT EXISTS (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
                          WHERE ur.UserId = t.ReconciledByUserId AND r.Name IN (N''Admin''))
UNION ALL
SELECT t.RecordedByUserId AS UserId FROM ShiftCashEntries t
        JOIN (SELECT UserId FROM inserted UNION SELECT UserId FROM deleted) a ON a.UserId = t.RecordedByUserId
        WHERE NOT EXISTS (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
                          WHERE ur.UserId = t.RecordedByUserId AND r.Name IN (N''Admin'',N''Employee''))
UNION ALL
SELECT t.ApprovedByUserId AS UserId FROM ShiftCashEntries t
        JOIN (SELECT UserId FROM inserted UNION SELECT UserId FROM deleted) a ON a.UserId = t.ApprovedByUserId
        WHERE NOT EXISTS (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
                          WHERE ur.UserId = t.ApprovedByUserId AND r.Name IN (N''Admin''))
UNION ALL
SELECT t.AssignedEmployeeUserId AS UserId FROM Orders t
        JOIN (SELECT UserId FROM inserted UNION SELECT UserId FROM deleted) a ON a.UserId = t.AssignedEmployeeUserId
        WHERE NOT EXISTS (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
                          WHERE ur.UserId = t.AssignedEmployeeUserId AND r.Name IN (N''Admin'',N''Employee''))
UNION ALL
SELECT t.UpdatedByUserId AS UserId FROM Shipments t
        JOIN (SELECT UserId FROM inserted UNION SELECT UserId FROM deleted) a ON a.UserId = t.UpdatedByUserId
        WHERE NOT EXISTS (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
                          WHERE ur.UserId = t.UpdatedByUserId AND r.Name IN (N''Admin'',N''Employee''))
UNION ALL
SELECT t.CreatedByUserId AS UserId FROM GoodsReceipts t
        JOIN (SELECT UserId FROM inserted UNION SELECT UserId FROM deleted) a ON a.UserId = t.CreatedByUserId
        WHERE NOT EXISTS (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
                          WHERE ur.UserId = t.CreatedByUserId AND r.Name IN (N''Admin'',N''Employee''))
UNION ALL
SELECT t.PostedByUserId AS UserId FROM GoodsReceipts t
        JOIN (SELECT UserId FROM inserted UNION SELECT UserId FROM deleted) a ON a.UserId = t.PostedByUserId
        WHERE NOT EXISTS (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
                          WHERE ur.UserId = t.PostedByUserId AND r.Name IN (N''Admin''))
UNION ALL
SELECT t.RejectedByUserId AS UserId FROM GoodsReceipts t
        JOIN (SELECT UserId FROM inserted UNION SELECT UserId FROM deleted) a ON a.UserId = t.RejectedByUserId
        WHERE NOT EXISTS (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
                          WHERE ur.UserId = t.RejectedByUserId AND r.Name IN (N''Admin''))
UNION ALL
SELECT t.CreatedByUserId AS UserId FROM StockIssues t
        JOIN (SELECT UserId FROM inserted UNION SELECT UserId FROM deleted) a ON a.UserId = t.CreatedByUserId
        WHERE NOT EXISTS (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
                          WHERE ur.UserId = t.CreatedByUserId AND r.Name IN (N''Admin'',N''Employee''))
UNION ALL
SELECT t.PostedByUserId AS UserId FROM StockIssues t
        JOIN (SELECT UserId FROM inserted UNION SELECT UserId FROM deleted) a ON a.UserId = t.PostedByUserId
        WHERE NOT EXISTS (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
                          WHERE ur.UserId = t.PostedByUserId AND r.Name IN (N''Admin''))
UNION ALL
SELECT t.RejectedByUserId AS UserId FROM StockIssues t
        JOIN (SELECT UserId FROM inserted UNION SELECT UserId FROM deleted) a ON a.UserId = t.RejectedByUserId
        WHERE NOT EXISTS (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
                          WHERE ur.UserId = t.RejectedByUserId AND r.Name IN (N''Admin''))
UNION ALL
SELECT t.CreatedByUserId AS UserId FROM Stocktakes t
        JOIN (SELECT UserId FROM inserted UNION SELECT UserId FROM deleted) a ON a.UserId = t.CreatedByUserId
        WHERE NOT EXISTS (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
                          WHERE ur.UserId = t.CreatedByUserId AND r.Name IN (N''Admin'',N''Employee''))
UNION ALL
SELECT t.ApprovedByUserId AS UserId FROM Stocktakes t
        JOIN (SELECT UserId FROM inserted UNION SELECT UserId FROM deleted) a ON a.UserId = t.ApprovedByUserId
        WHERE NOT EXISTS (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
                          WHERE ur.UserId = t.ApprovedByUserId AND r.Name IN (N''Admin''))
UNION ALL
SELECT t.CountedByUserId AS UserId FROM StocktakeItems t
        JOIN (SELECT UserId FROM inserted UNION SELECT UserId FROM deleted) a ON a.UserId = t.CountedByUserId
        WHERE NOT EXISTS (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
                          WHERE ur.UserId = t.CountedByUserId AND r.Name IN (N''Admin'',N''Employee''))
UNION ALL
SELECT t.AssignedEmployeeUserId AS UserId FROM ReturnRequests t
        JOIN (SELECT UserId FROM inserted UNION SELECT UserId FROM deleted) a ON a.UserId = t.AssignedEmployeeUserId
        WHERE NOT EXISTS (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
                          WHERE ur.UserId = t.AssignedEmployeeUserId AND r.Name IN (N''Admin'',N''Employee''))
UNION ALL
SELECT t.ReviewedByUserId AS UserId FROM ReturnRequests t
        JOIN (SELECT UserId FROM inserted UNION SELECT UserId FROM deleted) a ON a.UserId = t.ReviewedByUserId
        WHERE NOT EXISTS (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
                          WHERE ur.UserId = t.ReviewedByUserId AND r.Name IN (N''Admin''))
UNION ALL
SELECT t.ReceivedByUserId AS UserId FROM ReturnItems t
        JOIN (SELECT UserId FROM inserted UNION SELECT UserId FROM deleted) a ON a.UserId = t.ReceivedByUserId
        WHERE NOT EXISTS (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
                          WHERE ur.UserId = t.ReceivedByUserId AND r.Name IN (N''Admin'',N''Employee''))
UNION ALL
SELECT t.RecordedByUserId AS UserId FROM PaymentTransactions t
        JOIN (SELECT UserId FROM inserted UNION SELECT UserId FROM deleted) a ON a.UserId = t.RecordedByUserId
        WHERE NOT EXISTS (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
                          WHERE ur.UserId = t.RecordedByUserId AND r.Name IN (N''Admin'',N''Employee''))
UNION ALL
SELECT t.RecordedByUserId AS UserId FROM StockMovements t
        JOIN (SELECT UserId FROM inserted UNION SELECT UserId FROM deleted) a ON a.UserId = t.RecordedByUserId
        WHERE NOT EXISTS (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
                          WHERE ur.UserId = t.RecordedByUserId AND r.Name IN (N''Admin'',N''Employee''))
UNION ALL
SELECT t.UpdatedByUserId AS UserId FROM StoreSettings t
        JOIN (SELECT UserId FROM inserted UNION SELECT UserId FROM deleted) a ON a.UserId = t.UpdatedByUserId
        WHERE NOT EXISTS (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
                          WHERE ur.UserId = t.UpdatedByUserId AND r.Name IN (N''Admin''))
UNION ALL
SELECT o.BuyerUserId AS UserId FROM Orders o
    JOIN (SELECT UserId FROM inserted UNION SELECT UserId FROM deleted) a ON a.UserId = o.BuyerUserId
    WHERE o.Channel = 1 AND NOT EXISTS
    (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
     WHERE ur.UserId = o.BuyerUserId AND r.Name IN (N''Customer''))
UNION ALL
SELECT o.CreatedByUserId AS UserId FROM Orders o
    JOIN (SELECT UserId FROM inserted UNION SELECT UserId FROM deleted) a ON a.UserId = o.CreatedByUserId
    WHERE o.Channel = 1 AND NOT EXISTS
    (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
     WHERE ur.UserId = o.CreatedByUserId AND r.Name IN (N''Customer''))
UNION ALL
SELECT o.CreatedByUserId AS UserId FROM Orders o
    JOIN (SELECT UserId FROM inserted UNION SELECT UserId FROM deleted) a ON a.UserId = o.CreatedByUserId
    WHERE o.Channel = 2 AND NOT EXISTS
    (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
     WHERE ur.UserId = o.CreatedByUserId AND r.Name IN (N''Admin'',N''Employee''))) invalid)
        THROW 51102, N''Không đổi hoặc gỡ vai trò đang được hồ sơ và chứng từ sử dụng.'', 1;
END;');

-- Tạo trigger kiểm tra vai trò tài khoản khách hàng
EXEC(N'CREATE TRIGGER TR_Customers_Role
ON Customers
AFTER INSERT, UPDATE
AS
BEGIN
    IF ROWCOUNT_BIG() = 0 RETURN;
    SET NOCOUNT ON;
IF EXISTS (SELECT 1 FROM inserted i WHERE i.UserId IS NOT NULL AND NOT EXISTS
        (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
         WHERE ur.UserId = i.UserId AND r.Name IN (N''Customer'')))
        THROW 51100, N''Vai trò tài khoản tại UserId không hợp lệ.'', 1;

    IF EXISTS (SELECT 1 FROM inserted i JOIN Orders o ON o.CustomerId = i.Id AND o.Channel = 1
               WHERE i.UserId IS NULL OR i.UserId <> o.BuyerUserId)
        THROW 51172, N''Không đổi liên kết tài khoản của hồ sơ đã có đơn trực tuyến.'', 1;
END;');

-- Tạo trigger khởi tạo tồn kho cho biến thể mới
EXEC(N'CREATE TRIGGER TR_ProductVariants_InitializeStock
ON ProductVariants
AFTER INSERT
AS
BEGIN
    IF ROWCOUNT_BIG() = 0 RETURN;
    SET NOCOUNT ON;
INSERT StockBalances (VariantId)
    SELECT Id FROM inserted;
END;');

-- Tạo trigger ngăn danh mục cha con tạo vòng lặp
EXEC(N'CREATE TRIGGER TR_Categories_NoCycle
ON Categories
AFTER INSERT, UPDATE
AS
BEGIN
    IF ROWCOUNT_BIG() = 0 RETURN;
    SET NOCOUNT ON;
DECLARE @Count bigint;
    SELECT @Count = COUNT_BIG(*) FROM Categories WITH (TABLOCKX, HOLDLOCK);
    DECLARE @Cycle bit = 0;
    ;WITH Walk AS (
        SELECT i.Id AS StartId, i.ParentId AS NextId,
               CAST(''/'' + CONVERT(varchar(20),i.Id) + ''/'' AS varchar(max)) AS Visited,
               CAST(0 AS bit) AS IsCycle
        FROM inserted i
        UNION ALL
        SELECT w.StartId,c.ParentId,
               CAST(w.Visited + CONVERT(varchar(20),c.Id) + ''/'' AS varchar(max)),
               CAST(CASE WHEN CHARINDEX(''/'' + CONVERT(varchar(20),c.Id) + ''/'', w.Visited) > 0 THEN 1 ELSE 0 END AS bit)
        FROM Walk w JOIN Categories c ON c.Id = w.NextId WHERE w.IsCycle = 0
    )
    SELECT @Cycle = CASE WHEN EXISTS (SELECT 1 FROM Walk WHERE IsCycle = 1) THEN 1 ELSE 0 END
    OPTION (MAXRECURSION 0);
    IF @Cycle = 1 THROW 51103, N''Danh mục cha con không được tạo vòng lặp.'', 1;
END;');

-- Tạo trigger kiểm tra người mua và chuyển trạng thái đơn hàng
EXEC(N'CREATE TRIGGER TR_Orders_Integrity
ON Orders
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    IF ROWCOUNT_BIG() = 0 RETURN;
    SET NOCOUNT ON;
IF EXISTS (SELECT 1 FROM inserted i WHERE i.AssignedEmployeeUserId IS NOT NULL AND NOT EXISTS
        (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
         WHERE ur.UserId = i.AssignedEmployeeUserId AND r.Name IN (N''Admin'',N''Employee'')))
        THROW 51100, N''Vai trò tài khoản tại AssignedEmployeeUserId không hợp lệ.'', 1;

    IF EXISTS (SELECT 1 FROM deleted d LEFT JOIN inserted i ON i.Id = d.Id WHERE i.Id IS NULL)
        THROW 51104, N''Không xóa đơn hàng. Đơn không tiếp tục phải chuyển trạng thái hủy.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i LEFT JOIN deleted d ON d.Id = i.Id
               WHERE d.Id IS NULL AND ((i.Channel = 1 AND i.Status <> 1) OR (i.Channel = 2 AND i.Status <> 5)))
        THROW 51105, N''Đơn trực tuyến bắt đầu chờ xác nhận; đơn tại quầy bắt đầu hoàn tất.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i JOIN Customers c ON c.Id = i.CustomerId
               WHERE i.Channel = 1 AND (c.UserId IS NULL OR c.UserId <> i.BuyerUserId OR i.CreatedByUserId <> i.BuyerUserId))
        THROW 51106, N''Tài khoản đặt hàng không khớp hồ sơ khách hàng.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i WHERE i.Channel = 1 AND NOT EXISTS
               (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
                WHERE ur.UserId = i.BuyerUserId AND r.Name = N''Customer''))
        THROW 51107, N''Người mua trực tuyến phải có vai trò khách hàng.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i WHERE i.CancelledByUserId IS NOT NULL AND NOT EXISTS
        (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
         WHERE ur.UserId = i.CancelledByUserId AND
           (r.Name IN (N''Admin'',N''Employee'') OR (r.Name = N''Customer'' AND i.CancelledByUserId = i.BuyerUserId))))
        THROW 51176, N''Chỉ chủ đơn hoặc nhân viên được ghi thao tác hủy đơn.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i LEFT JOIN deleted d ON d.Id = i.Id
               WHERE d.Id IS NULL AND i.Channel = 2 AND NOT EXISTS
               (SELECT 1 FROM Shifts s WHERE s.Id = i.ShiftId AND s.Status = 1 AND s.EmployeeUserId = i.CreatedByUserId))
        THROW 51108, N''Đơn tại quầy phải thuộc ca đang mở của người bán.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i JOIN deleted d ON d.Id = i.Id
               WHERE i.Channel <> d.Channel OR i.CreatedByUserId <> d.CreatedByUserId
                  OR ISNULL(i.CustomerId,-1) <> ISNULL(d.CustomerId,-1)
                  OR ISNULL(i.BuyerUserId,N'''') <> ISNULL(d.BuyerUserId,N'''')
                  OR ISNULL(i.ShiftId,-1) <> ISNULL(d.ShiftId,-1) OR i.PaymentMethod <> d.PaymentMethod
                  OR i.OrderCode <> d.OrderCode OR i.ShippingFee <> d.ShippingFee)
        THROW 51109, N''Không đổi thông tin định danh và phương thức thanh toán của đơn đã tạo.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i JOIN deleted d ON d.Id = i.Id WHERE d.Status IN (4,5,6,7) AND
       (ISNULL(i.ReceiverName,N'''') <> ISNULL(d.ReceiverName,N'''') OR ISNULL(i.ReceiverPhone,'''') <> ISNULL(d.ReceiverPhone,'''')
        OR ISNULL(i.DeliveryAddress,N'''') <> ISNULL(d.DeliveryAddress,N'''')))
        THROW 51168, N''Không đổi thông tin nhận hàng khi đơn đã xuất giao hoặc kết thúc.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i JOIN deleted d ON d.Id = i.Id
        WHERE i.Status <> d.Status AND NOT
        ((d.Status = 1 AND i.Status IN (2,6)) OR (d.Status = 2 AND i.Status IN (3,6))
          OR (d.Status = 3 AND i.Status IN (4,6)) OR (d.Status = 4 AND i.Status IN (5,7))
          OR (d.Status = 7 AND i.Status = 6 AND EXISTS
              (SELECT 1 FROM Shipments sh WHERE sh.OrderId = i.Id AND sh.Status = 5))))
        THROW 51110, N''Chuyển trạng thái đơn hàng không hợp lệ.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i JOIN deleted d ON d.Id = i.Id
               OUTER APPLY (SELECT SUM(Quantity * UnitPrice) AS Subtotal, SUM(DiscountAmount) AS Discount
                            FROM OrderItems x WHERE x.OrderId = i.Id) a
               WHERE i.Subtotal <> ISNULL(a.Subtotal,0) OR i.DiscountAmount <> ISNULL(a.Discount,0))
        THROW 51111, N''Tổng tiền đơn hàng không khớp chi tiết.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i JOIN deleted d ON d.Id = i.Id
               WHERE i.Status <> d.Status AND i.Status IN (2,3,4,5)
                 AND NOT EXISTS (SELECT 1 FROM OrderItems x WHERE x.OrderId = i.Id))
        THROW 51112, N''Đơn hàng phải có ít nhất một dòng hàng.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i JOIN deleted d ON d.Id = i.Id
               WHERE i.Channel = 1 AND d.Status <> 5 AND i.Status = 5 AND
                (NOT EXISTS (SELECT 1 FROM Shipments sh WHERE sh.OrderId = i.Id AND sh.Status = 3)
                 OR ISNULL((SELECT SUM(p.Amount) FROM PaymentTransactions p WHERE p.OrderId = i.Id AND p.Direction = 1),0) < i.GrandTotal))
        THROW 51113, N''Đơn trực tuyến chỉ hoàn tất khi đã giao và thu đủ tiền.'', 1;
END;');

-- Tạo trigger bảo vệ chi tiết đơn và tính lại tổng tiền
EXEC(N'CREATE TRIGGER TR_OrderItems_Totals
ON OrderItems
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    IF ROWCOUNT_BIG() = 0 RETURN;
    SET NOCOUNT ON;
DECLARE @Locked bigint;
    SELECT @Locked = COUNT_BIG(*) FROM Orders WITH (UPDLOCK, HOLDLOCK)
    WHERE Id IN (SELECT OrderId FROM inserted UNION SELECT OrderId FROM deleted);
    IF EXISTS (SELECT 1 FROM deleted d LEFT JOIN inserted i ON i.Id = d.Id WHERE i.Id IS NULL)
        THROW 51114, N''Không xóa dòng hàng của đơn đã tạo.'', 1;
    IF EXISTS (SELECT Id,OrderId,VariantId,SkuSnapshot,ProductNameSnapshot,ColorSnapshot,SizeSnapshot,Quantity,UnitPrice,DiscountAmount
               FROM inserted WHERE Id IN (SELECT Id FROM deleted)
               EXCEPT SELECT Id,OrderId,VariantId,SkuSnapshot,ProductNameSnapshot,ColorSnapshot,SizeSnapshot,Quantity,UnitPrice,DiscountAmount FROM deleted)
        THROW 51115, N''Không sửa hàng, số lượng hoặc giá của đơn đã tạo.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i LEFT JOIN deleted d ON d.Id = i.Id JOIN Orders o ON o.Id = i.OrderId
        WHERE d.Id IS NULL AND (o.Status NOT IN (1,5) OR EXISTS
        (SELECT 1 FROM OrderItems x WHERE x.OrderId = i.OrderId AND NOT EXISTS (SELECT 1 FROM inserted a WHERE a.Id = x.Id))))
        THROW 51116, N''Các dòng hàng của một đơn phải được thêm cùng một câu lệnh khi tạo đơn.'', 1;
    IF NOT EXISTS (SELECT 1 FROM deleted)
        UPDATE o SET Subtotal = a.Subtotal, DiscountAmount = a.Discount
        FROM Orders o JOIN
        (SELECT x.OrderId,SUM(x.Quantity * x.UnitPrice) AS Subtotal,SUM(x.DiscountAmount) AS Discount
         FROM OrderItems x WHERE x.OrderId IN (SELECT OrderId FROM inserted) GROUP BY x.OrderId) a ON a.OrderId = o.Id;
END;');

-- Tạo trigger kiểm tra lượng giữ hàng cho đơn trực tuyến
EXEC(N'CREATE TRIGGER TR_Reservations_Integrity
ON InventoryReservations
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    IF ROWCOUNT_BIG() = 0 RETURN;
    SET NOCOUNT ON;
DECLARE @Locked bigint;
    SELECT @Locked = COUNT_BIG(*) FROM StockBalances WITH (UPDLOCK,HOLDLOCK)
        WHERE VariantId IN (SELECT VariantId FROM inserted UNION SELECT VariantId FROM deleted);
    IF EXISTS (SELECT 1 FROM deleted d LEFT JOIN inserted i ON i.Id = d.Id WHERE i.Id IS NULL)
        THROW 51117, N''Không xóa lịch sử giữ hàng.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i JOIN OrderItems x ON x.Id = i.OrderItemId JOIN Orders o ON o.Id = x.OrderId
               WHERE o.Channel <> 1 OR i.Quantity <> x.Quantity)
        THROW 51118, N''Giữ hàng phải thuộc đơn trực tuyến và đúng số lượng dòng hàng.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i JOIN deleted d ON d.Id = i.Id
               WHERE i.OrderItemId <> d.OrderItemId OR i.VariantId <> d.VariantId OR i.Quantity <> d.Quantity
                  OR (i.Status <> d.Status AND NOT (d.Status = 1 AND i.Status IN (2,3))))
        THROW 51119, N''Không sửa lượng giữ hoặc mở lại lượt giữ đã kết thúc.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i JOIN deleted d ON d.Id = i.Id JOIN OrderItems x ON x.Id = i.OrderItemId
               JOIN Orders o ON o.Id = x.OrderId WHERE d.Status = 1 AND
                 ((i.Status = 2 AND o.Status <> 6) OR (i.Status = 3 AND o.Status <> 4)))
        THROW 51169, N''Giải phóng hàng sau hủy đơn; tiêu thụ lượng giữ khi đơn xuất giao.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i LEFT JOIN deleted d ON d.Id = i.Id JOIN OrderItems x ON x.Id = i.OrderItemId
               JOIN Orders o ON o.Id = x.OrderId
               WHERE d.Id IS NULL AND (i.Status <> 1 OR o.Status NOT IN (1,2,3)))
        THROW 51120, N''Lượt giữ mới phải đang hoạt động và thuộc đơn chưa xuất giao.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i JOIN StocktakeScopeLocks l ON l.VariantId = i.VariantId AND l.IsActive = 1
               WHERE i.Status = 1)
        THROW 51166, N''Không giữ hàng cho SKU đang khóa kiểm kê.'', 1;
    UPDATE b SET ReservedQuantity = ISNULL(a.Quantity,0), UpdatedAt = SYSUTCDATETIME()
    FROM StockBalances b OUTER APPLY
       (SELECT SUM(r.Quantity) AS Quantity FROM InventoryReservations r WHERE r.VariantId = b.VariantId AND r.Status = 1) a
    WHERE b.VariantId IN (SELECT VariantId FROM inserted UNION SELECT VariantId FROM deleted);
END;');

-- Tạo trigger kiểm tra đơn giao hàng và trạng thái vận chuyển
EXEC(N'CREATE TRIGGER TR_Shipments_Integrity
ON Shipments
AFTER INSERT, UPDATE
AS
BEGIN
    IF ROWCOUNT_BIG() = 0 RETURN;
    SET NOCOUNT ON;
IF EXISTS (SELECT 1 FROM inserted i WHERE i.UpdatedByUserId IS NOT NULL AND NOT EXISTS
        (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
         WHERE ur.UserId = i.UpdatedByUserId AND r.Name IN (N''Admin'',N''Employee'')))
        THROW 51100, N''Vai trò tài khoản tại UpdatedByUserId không hợp lệ.'', 1;

    IF EXISTS (SELECT 1 FROM inserted i JOIN Orders o ON o.Id = i.OrderId WHERE o.Channel <> 1)
        THROW 51121, N''Chỉ đơn trực tuyến có phiếu giao hàng.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i LEFT JOIN deleted d ON d.Id = i.Id WHERE d.Id IS NULL AND i.Status <> 1)
        THROW 51122, N''Phiếu giao hàng bắt đầu ở trạng thái chuẩn bị giao.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i JOIN deleted d ON d.Id = i.Id WHERE i.OrderId <> d.OrderId
               OR (i.Status <> d.Status AND NOT
                   ((d.Status = 1 AND i.Status = 2) OR (d.Status = 2 AND i.Status IN (3,4)) OR (d.Status = 4 AND i.Status = 5))))
        THROW 51123, N''Chuyển trạng thái giao hàng không hợp lệ.'', 1;
END;');

-- Tạo trigger kiểm tra duyệt phiếu nhập kho
EXEC(N'CREATE TRIGGER TR_GoodsReceipts_Approval
ON GoodsReceipts
AFTER INSERT, UPDATE
AS
BEGIN
    IF ROWCOUNT_BIG() = 0 RETURN;
    SET NOCOUNT ON;
IF EXISTS (SELECT 1 FROM inserted i WHERE i.CreatedByUserId IS NOT NULL AND NOT EXISTS
        (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
         WHERE ur.UserId = i.CreatedByUserId AND r.Name IN (N''Admin'',N''Employee'')))
        THROW 51100, N''Vai trò tài khoản tại CreatedByUserId không hợp lệ.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i WHERE i.PostedByUserId IS NOT NULL AND NOT EXISTS
        (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
         WHERE ur.UserId = i.PostedByUserId AND r.Name IN (N''Admin'')))
        THROW 51100, N''Vai trò tài khoản tại PostedByUserId không hợp lệ.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i WHERE i.RejectedByUserId IS NOT NULL AND NOT EXISTS
        (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
         WHERE ur.UserId = i.RejectedByUserId AND r.Name IN (N''Admin'')))
        THROW 51100, N''Vai trò tài khoản tại RejectedByUserId không hợp lệ.'', 1;

    IF EXISTS (SELECT 1 FROM inserted i LEFT JOIN deleted d ON d.Id = i.Id WHERE d.Id IS NULL AND i.Status <> 1)
        THROW 51124, N''Phiếu nhập kho bắt đầu chờ duyệt.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i JOIN deleted d ON d.Id = i.Id
               WHERE i.Status <> d.Status AND NOT (d.Status = 1 AND i.Status IN (2,3)))
        THROW 51125, N''Phiếu nhập kho đã kết thúc không được mở lại.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i WHERE i.Status = 2 AND
               (NOT EXISTS (SELECT 1 FROM GoodsReceiptItems x WHERE x.GoodsReceiptId = i.Id) OR EXISTS (SELECT 1 FROM GoodsReceiptItems x WHERE x.GoodsReceiptId = i.Id AND x.UnitCost IS NULL)))
        THROW 51126, N''Phiếu nhập kho ghi sổ phải có chi tiết hợp lệ.'', 1;

    IF EXISTS (SELECT Id,ReceiptCode,SupplierId,SupplierDocumentNumber,Status,ReceivedAt,CreatedByUserId,PostedByUserId,PostedAt,RejectedByUserId,RejectedAt,RejectionReason,Note,CreatedAt FROM inserted WHERE Id IN (SELECT Id FROM deleted WHERE Status IN (2,3))
               EXCEPT SELECT Id,ReceiptCode,SupplierId,SupplierDocumentNumber,Status,ReceivedAt,CreatedByUserId,PostedByUserId,PostedAt,RejectedByUserId,RejectedAt,RejectionReason,Note,CreatedAt FROM deleted WHERE Status IN (2,3))
        THROW 51170, N''Không sửa chứng từ GoodsReceipts đã kết thúc.'', 1;
END;');

-- Tạo trigger bảo vệ chi tiết phiếu nhập kho đã kết thúc
EXEC(N'CREATE TRIGGER TR_GoodsReceiptItems_ClosedDocument
ON GoodsReceiptItems
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    IF ROWCOUNT_BIG() = 0 RETURN;
    SET NOCOUNT ON;
IF EXISTS (SELECT 1 FROM GoodsReceipts h JOIN
        (SELECT GoodsReceiptId AS HeaderId FROM inserted UNION SELECT GoodsReceiptId FROM deleted) a ON a.HeaderId = h.Id
        WHERE h.Status <> 1)
        THROW 51127, N''Không sửa chi tiết phiếu nhập kho đã ghi sổ hoặc bị từ chối.'', 1;
END;');

-- Tạo trigger kiểm tra duyệt phiếu xuất kho
EXEC(N'CREATE TRIGGER TR_StockIssues_Approval
ON StockIssues
AFTER INSERT, UPDATE
AS
BEGIN
    IF ROWCOUNT_BIG() = 0 RETURN;
    SET NOCOUNT ON;
IF EXISTS (SELECT 1 FROM inserted i WHERE i.CreatedByUserId IS NOT NULL AND NOT EXISTS
        (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
         WHERE ur.UserId = i.CreatedByUserId AND r.Name IN (N''Admin'',N''Employee'')))
        THROW 51100, N''Vai trò tài khoản tại CreatedByUserId không hợp lệ.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i WHERE i.PostedByUserId IS NOT NULL AND NOT EXISTS
        (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
         WHERE ur.UserId = i.PostedByUserId AND r.Name IN (N''Admin'')))
        THROW 51100, N''Vai trò tài khoản tại PostedByUserId không hợp lệ.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i WHERE i.RejectedByUserId IS NOT NULL AND NOT EXISTS
        (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
         WHERE ur.UserId = i.RejectedByUserId AND r.Name IN (N''Admin'')))
        THROW 51100, N''Vai trò tài khoản tại RejectedByUserId không hợp lệ.'', 1;

    IF EXISTS (SELECT 1 FROM inserted i LEFT JOIN deleted d ON d.Id = i.Id WHERE d.Id IS NULL AND i.Status <> 1)
        THROW 51128, N''Phiếu xuất kho bắt đầu chờ duyệt.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i JOIN deleted d ON d.Id = i.Id
               WHERE i.Status <> d.Status AND NOT (d.Status = 1 AND i.Status IN (2,3)))
        THROW 51129, N''Phiếu xuất kho đã kết thúc không được mở lại.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i WHERE i.Status = 2 AND
               (NOT EXISTS (SELECT 1 FROM StockIssueItems x WHERE x.StockIssueId = i.Id)))
        THROW 51130, N''Phiếu xuất kho ghi sổ phải có chi tiết hợp lệ.'', 1;

    IF EXISTS (SELECT Id,IssueCode,SupplierId,ReasonType,Reason,Status,CreatedByUserId,PostedByUserId,PostedAt,RejectedByUserId,RejectedAt,RejectionReason,CreatedAt FROM inserted WHERE Id IN (SELECT Id FROM deleted WHERE Status IN (2,3))
               EXCEPT SELECT Id,IssueCode,SupplierId,ReasonType,Reason,Status,CreatedByUserId,PostedByUserId,PostedAt,RejectedByUserId,RejectedAt,RejectionReason,CreatedAt FROM deleted WHERE Status IN (2,3))
        THROW 51170, N''Không sửa chứng từ StockIssues đã kết thúc.'', 1;
END;');

-- Tạo trigger bảo vệ chi tiết phiếu xuất kho đã kết thúc
EXEC(N'CREATE TRIGGER TR_StockIssueItems_ClosedDocument
ON StockIssueItems
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    IF ROWCOUNT_BIG() = 0 RETURN;
    SET NOCOUNT ON;
IF EXISTS (SELECT 1 FROM StockIssues h JOIN
        (SELECT StockIssueId AS HeaderId FROM inserted UNION SELECT StockIssueId FROM deleted) a ON a.HeaderId = h.Id
        WHERE h.Status <> 1)
        THROW 51131, N''Không sửa chi tiết phiếu xuất kho đã ghi sổ hoặc bị từ chối.'', 1;
END;');

-- Tạo trigger kiểm tra kết quả kiểm kê trước duyệt
EXEC(N'CREATE TRIGGER TR_Stocktakes_Integrity
ON Stocktakes
AFTER INSERT, UPDATE
AS
BEGIN
    IF ROWCOUNT_BIG() = 0 RETURN;
    SET NOCOUNT ON;
IF EXISTS (SELECT 1 FROM inserted i WHERE i.CreatedByUserId IS NOT NULL AND NOT EXISTS
        (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
         WHERE ur.UserId = i.CreatedByUserId AND r.Name IN (N''Admin'',N''Employee'')))
        THROW 51100, N''Vai trò tài khoản tại CreatedByUserId không hợp lệ.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i WHERE i.ApprovedByUserId IS NOT NULL AND NOT EXISTS
        (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
         WHERE ur.UserId = i.ApprovedByUserId AND r.Name IN (N''Admin'')))
        THROW 51100, N''Vai trò tài khoản tại ApprovedByUserId không hợp lệ.'', 1;

    IF EXISTS (SELECT 1 FROM inserted i LEFT JOIN deleted d ON d.Id = i.Id WHERE d.Id IS NULL AND i.Status <> 1)
        THROW 51132, N''Kiểm kê bắt đầu ở trạng thái đang kiểm đếm.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i JOIN deleted d ON d.Id = i.Id WHERE i.Status <> d.Status AND NOT
               ((d.Status = 1 AND i.Status IN (2,4)) OR (d.Status = 2 AND i.Status IN (3,4))))
        THROW 51133, N''Chuyển trạng thái kiểm kê không hợp lệ.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i WHERE i.Status IN (2,3) AND
       (NOT EXISTS (SELECT 1 FROM StocktakeItems x WHERE x.StocktakeId = i.Id) OR EXISTS
       (SELECT 1 FROM StocktakeItems x WHERE x.StocktakeId = i.Id AND
         (x.CountedSellableQuantity IS NULL OR x.CountedDamagedQuantity IS NULL OR x.CountedAt IS NULL OR x.CountedByUserId IS NULL
          OR ((x.CountedSellableQuantity <> x.SystemSellableQuantity OR x.CountedDamagedQuantity <> x.SystemDamagedQuantity)
              AND NULLIF(LTRIM(RTRIM(x.DifferenceReason)),N'''') IS NULL)))))
        THROW 51134, N''Phải đếm đủ hàng và ghi lý do chênh lệch trước khi gửi duyệt kiểm kê.'', 1;

    IF EXISTS (SELECT Id,StocktakeCode,Status,CreatedByUserId,ApprovedByUserId,ApprovedAt,ClosedAt,CloseReason,CreatedAt FROM inserted WHERE Id IN (SELECT Id FROM deleted WHERE Status IN (3,4))
               EXCEPT SELECT Id,StocktakeCode,Status,CreatedByUserId,ApprovedByUserId,ApprovedAt,ClosedAt,CloseReason,CreatedAt FROM deleted WHERE Status IN (3,4))
        THROW 51170, N''Không sửa chứng từ Stocktakes đã kết thúc.'', 1;
END;');

-- Tạo trigger kiểm tra người đếm và bảo vệ kiểm kê đã kết thúc
EXEC(N'CREATE TRIGGER TR_StocktakeItems_Integrity
ON StocktakeItems
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    IF ROWCOUNT_BIG() = 0 RETURN;
    SET NOCOUNT ON;
IF EXISTS (SELECT 1 FROM inserted i WHERE i.CountedByUserId IS NOT NULL AND NOT EXISTS
        (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
         WHERE ur.UserId = i.CountedByUserId AND r.Name IN (N''Admin'',N''Employee'')))
        THROW 51100, N''Vai trò tài khoản tại CountedByUserId không hợp lệ.'', 1;
    IF EXISTS (SELECT 1 FROM Stocktakes h JOIN
    (SELECT StocktakeId FROM inserted UNION SELECT StocktakeId FROM deleted) a ON a.StocktakeId = h.Id WHERE h.Status <> 1)
        THROW 51135, N''Không sửa chi tiết kiểm kê đã gửi duyệt hoặc kết thúc.'', 1;

    IF EXISTS (SELECT 1 FROM inserted i JOIN deleted d ON d.Id = i.Id WHERE
        i.StocktakeId <> d.StocktakeId OR i.VariantId <> d.VariantId OR
        ((i.SystemSellableQuantity <> d.SystemSellableQuantity OR i.SystemDamagedQuantity <> d.SystemDamagedQuantity)
         AND EXISTS (SELECT 1 FROM StocktakeScopeLocks l WHERE l.StocktakeId = d.StocktakeId AND l.VariantId = d.VariantId AND l.IsActive = 1)))
        THROW 51173, N''Không đổi SKU hoặc tồn hệ thống sau khi khóa kiểm kê.'', 1;
END;');

-- Tạo trigger kiểm tra khóa kiểm kê và hàng đang giữ
EXEC(N'CREATE TRIGGER TR_StocktakeLocks_Integrity
ON StocktakeScopeLocks
AFTER INSERT, UPDATE
AS
BEGIN
    IF ROWCOUNT_BIG() = 0 RETURN;
    SET NOCOUNT ON;
DECLARE @Locked bigint;
    SELECT @Locked = COUNT_BIG(*) FROM StockBalances WITH (UPDLOCK,HOLDLOCK)
        WHERE VariantId IN (SELECT VariantId FROM inserted);
    IF EXISTS (SELECT 1 FROM inserted i JOIN Stocktakes h ON h.Id = i.StocktakeId
               LEFT JOIN StockBalances b ON b.VariantId = i.VariantId
               JOIN StocktakeItems x ON x.StocktakeId = i.StocktakeId AND x.VariantId = i.VariantId
               WHERE i.IsActive = 1 AND (h.Status <> 1 OR b.VariantId IS NULL OR b.ReservedQuantity > 0
                 OR x.SystemSellableQuantity <> b.SellableQuantity OR x.SystemDamagedQuantity <> b.DamagedQuantity
                 OR EXISTS (SELECT 1 FROM InventoryReservations r WHERE r.VariantId = i.VariantId AND r.Status = 1)))
        THROW 51136, N''Chỉ khóa SKU đang kiểm đếm và không còn hàng giữ cho đơn.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i JOIN deleted d ON d.Id = i.Id JOIN Stocktakes h ON h.Id = i.StocktakeId
        WHERE i.StocktakeId <> d.StocktakeId OR i.VariantId <> d.VariantId OR (d.IsActive = 0 AND i.IsActive = 1)
          OR (d.IsActive = 1 AND i.IsActive = 0 AND h.Status NOT IN (3,4)))
        THROW 51174, N''Chỉ mở khóa khi kiểm kê kết thúc và không mở lại khóa cũ.'', 1;
END;');

-- Tạo trigger kiểm tra người yêu cầu và duyệt đổi trả
EXEC(N'CREATE TRIGGER TR_ReturnRequests_Integrity
ON ReturnRequests
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    IF ROWCOUNT_BIG() = 0 RETURN;
    SET NOCOUNT ON;
IF EXISTS (SELECT 1 FROM inserted i WHERE i.AssignedEmployeeUserId IS NOT NULL AND NOT EXISTS
        (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
         WHERE ur.UserId = i.AssignedEmployeeUserId AND r.Name IN (N''Admin'',N''Employee'')))
        THROW 51100, N''Vai trò tài khoản tại AssignedEmployeeUserId không hợp lệ.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i WHERE i.ReviewedByUserId IS NOT NULL AND NOT EXISTS
        (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
         WHERE ur.UserId = i.ReviewedByUserId AND r.Name IN (N''Admin'')))
        THROW 51100, N''Vai trò tài khoản tại ReviewedByUserId không hợp lệ.'', 1;

    IF EXISTS (SELECT 1 FROM deleted d LEFT JOIN inserted i ON i.Id = d.Id WHERE i.Id IS NULL)
        THROW 51138, N''Không xóa yêu cầu đổi trả.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i JOIN Orders o ON o.Id = i.OrderId WHERE o.Status <> 5)
        THROW 51139, N''Chỉ yêu cầu đổi trả cho đơn đã hoàn tất.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i JOIN Orders o ON o.Id = i.OrderId WHERE NOT EXISTS
        (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
         WHERE ur.UserId = i.CreatedByUserId AND (r.Name IN (N''Admin'',N''Employee'') OR (r.Name = N''Customer'' AND i.CreatedByUserId = o.BuyerUserId))))
        THROW 51140, N''Người yêu cầu không thuộc đơn hàng và không có vai trò nhân viên.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i LEFT JOIN deleted d ON d.Id = i.Id WHERE d.Id IS NULL AND i.Status <> 1)
        THROW 51141, N''Yêu cầu đổi trả bắt đầu ở trạng thái đã gửi.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i JOIN deleted d ON d.Id = i.Id WHERE i.OrderId <> d.OrderId
        OR i.CreatedByUserId <> d.CreatedByUserId OR i.RequestType <> d.RequestType OR
        (i.Status <> d.Status AND NOT ((d.Status = 1 AND i.Status IN (2,5,6)) OR (d.Status = 2 AND i.Status = 3) OR (d.Status = 3 AND i.Status = 4))))
        THROW 51142, N''Chuyển trạng thái đổi trả không hợp lệ.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i WHERE i.Status IN (2,3,4) AND NOT EXISTS
               (SELECT 1 FROM ReturnItems x WHERE x.ReturnRequestId = i.Id))
        THROW 51143, N''Yêu cầu được duyệt phải có ít nhất một dòng hàng trả.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i WHERE i.Status = 4 AND
        (EXISTS (SELECT 1 FROM ReturnItems x WHERE x.ReturnRequestId = i.Id AND x.ReceivedAt IS NULL)
         OR ISNULL((SELECT SUM(p.Amount) FROM PaymentTransactions p WHERE p.ReturnRequestId = i.Id AND p.Direction = 2),0)
            <> ISNULL((SELECT SUM(x.RefundAmount) FROM ReturnItems x WHERE x.ReturnRequestId = i.Id),0)
         OR (i.RequestType = 2 AND i.ReplacementOrderId IS NULL)))
        THROW 51144, N''Hoàn tất đổi trả cần nhận đủ hàng, hoàn đúng tiền và có đơn đổi nếu đổi hàng.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i JOIN Orders oldOrder ON oldOrder.Id = i.OrderId
               JOIN Orders newOrder ON newOrder.Id = i.ReplacementOrderId
               WHERE ISNULL(oldOrder.CustomerId,-1) <> ISNULL(newOrder.CustomerId,-1)
                 OR (i.Status = 4 AND newOrder.Status <> 5))
        THROW 51175, N''Đơn hàng đổi phải cùng khách hàng và hoàn tất trước khi kết thúc đổi trả.'', 1;

    DECLARE @Locked bigint;
    SELECT @Locked = COUNT_BIG(*) FROM OrderItems WITH (UPDLOCK,HOLDLOCK)
    WHERE Id IN (SELECT x.OrderItemId FROM ReturnItems x
                 WHERE x.ReturnRequestId IN (SELECT Id FROM inserted UNION SELECT Id FROM deleted));
    IF EXISTS (SELECT 1 FROM OrderItems line
        JOIN (SELECT x.OrderItemId,SUM(CONVERT(bigint,x.Quantity)) AS TotalQuantity,SUM(x.RefundAmount) AS TotalRefund
              FROM ReturnItems x JOIN ReturnRequests h ON h.Id = x.ReturnRequestId WHERE h.Status IN (1,2,3,4)
              AND x.OrderItemId IN (SELECT t.OrderItemId FROM ReturnItems t WHERE t.ReturnRequestId IN (SELECT Id FROM inserted UNION SELECT Id FROM deleted))
              GROUP BY x.OrderItemId) a ON a.OrderItemId = line.Id
        WHERE a.TotalQuantity > line.Quantity OR a.TotalRefund > line.LineTotal)
        THROW 51137, N''Tổng lượng trả hoặc số tiền hoàn vượt dòng hàng đã mua.'', 1;
END;');

-- Tạo trigger kiểm tra số lượng và giá trị hàng trả
EXEC(N'CREATE TRIGGER TR_ReturnItems_Integrity
ON ReturnItems
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    IF ROWCOUNT_BIG() = 0 RETURN;
    SET NOCOUNT ON;
IF EXISTS (SELECT 1 FROM inserted i WHERE i.ReceivedByUserId IS NOT NULL AND NOT EXISTS
        (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
         WHERE ur.UserId = i.ReceivedByUserId AND r.Name IN (N''Admin'',N''Employee'')))
        THROW 51100, N''Vai trò tài khoản tại ReceivedByUserId không hợp lệ.'', 1;

    DECLARE @Locked bigint;
    SELECT @Locked = COUNT_BIG(*) FROM OrderItems WITH (UPDLOCK,HOLDLOCK)
        WHERE Id IN (SELECT OrderItemId FROM inserted UNION SELECT OrderItemId FROM deleted);
    IF EXISTS (SELECT 1 FROM deleted d LEFT JOIN inserted i ON i.Id = d.Id WHERE i.Id IS NULL)
        THROW 51145, N''Không xóa dòng yêu cầu đổi trả.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i LEFT JOIN deleted d ON d.Id = i.Id JOIN ReturnRequests h ON h.Id = i.ReturnRequestId
        JOIN OrderItems line ON line.Id = i.OrderItemId
        WHERE (d.Id IS NULL AND h.Status <> 1) OR i.Quantity > line.Quantity
          OR i.RefundAmount > ROUND(line.LineTotal * CONVERT(decimal(18,2),i.Quantity) / line.Quantity,2,1)
          OR (i.ReceivedAt IS NOT NULL AND h.Status NOT IN (2,3,4)))
        THROW 51146, N''Lượng trả, tiền hoàn hoặc trạng thái nhận hàng không hợp lệ.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i JOIN deleted d ON d.Id = i.Id
        WHERE i.ReturnRequestId <> d.ReturnRequestId OR i.OrderItemId <> d.OrderItemId OR i.VariantId <> d.VariantId
          OR i.OrderId <> d.OrderId OR i.Quantity <> d.Quantity OR i.RefundAmount <> d.RefundAmount
          OR (d.ReceivedAt IS NOT NULL AND (i.ReceivedAt IS NULL OR i.ReceivedAt <> d.ReceivedAt
              OR i.ReceivedSellableQuantity <> d.ReceivedSellableQuantity OR i.ReceivedDamagedQuantity <> d.ReceivedDamagedQuantity
              OR i.ReceivedByUserId <> d.ReceivedByUserId)))
        THROW 51147, N''Không đổi nội dung yêu cầu hoặc sửa lần nhận hàng đã ghi.'', 1;
    IF EXISTS (SELECT 1 FROM OrderItems line JOIN
        (SELECT x.OrderItemId,SUM(CONVERT(bigint,x.Quantity)) AS TotalQuantity,SUM(x.RefundAmount) AS TotalRefund
         FROM ReturnItems x JOIN ReturnRequests h ON h.Id = x.ReturnRequestId WHERE h.Status IN (1,2,3,4)
           AND x.OrderItemId IN (SELECT OrderItemId FROM inserted UNION SELECT OrderItemId FROM deleted)
         GROUP BY x.OrderItemId) a ON a.OrderItemId = line.Id
        WHERE a.TotalQuantity > line.Quantity OR a.TotalRefund > line.LineTotal)
        THROW 51148, N''Tổng các yêu cầu đang xử lý và đã hoàn tất vượt lượng hoặc tiền của dòng mua.'', 1;
END;');

-- Tạo trigger kiểm tra giới hạn thu hoàn và bảo vệ giao dịch tiền
EXEC(N'CREATE TRIGGER TR_Payments_Integrity
ON PaymentTransactions
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    IF ROWCOUNT_BIG() = 0 RETURN;
    SET NOCOUNT ON;
IF EXISTS (SELECT 1 FROM inserted i WHERE i.RecordedByUserId IS NOT NULL AND NOT EXISTS
        (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
         WHERE ur.UserId = i.RecordedByUserId AND r.Name IN (N''Admin'',N''Employee'')))
        THROW 51100, N''Vai trò tài khoản tại RecordedByUserId không hợp lệ.'', 1;

    IF EXISTS (SELECT 1 FROM deleted)
        THROW 51149, N''Không sửa hoặc xóa giao dịch tiền đã ghi nhận.'', 1;
    DECLARE @Locked bigint;
    SELECT @Locked = COUNT_BIG(*) FROM Orders WITH (UPDLOCK,HOLDLOCK) WHERE Id IN (SELECT OrderId FROM inserted);
    SELECT @Locked = COUNT_BIG(*) FROM Shifts WITH (UPDLOCK,HOLDLOCK) WHERE Id IN (SELECT ShiftId FROM inserted WHERE ShiftId IS NOT NULL);
    IF EXISTS (SELECT 1 FROM inserted i JOIN Orders o ON o.Id = i.OrderId
        WHERE (i.Direction = 1 AND (i.Method <> o.PaymentMethod OR o.Status IN (6,7)))
           OR (i.Direction = 2 AND i.ReturnRequestId IS NULL AND o.Status <> 6)
           OR (i.Method = 1 AND NOT EXISTS (SELECT 1 FROM Shifts s WHERE s.Id = i.ShiftId AND s.Status = 1 AND s.EmployeeUserId = i.RecordedByUserId))
           OR (i.Direction = 1 AND i.Method = 3 AND NOT EXISTS (SELECT 1 FROM Shipments sh WHERE sh.OrderId = i.OrderId AND sh.Status = 3)))
        THROW 51150, N''Phương thức thu, hoàn do hủy hoặc ca tiền mặt không hợp lệ.'', 1;
    IF EXISTS (SELECT 1 FROM Orders o JOIN
        (SELECT OrderId,SUM(CASE WHEN Direction = 1 THEN Amount ELSE 0 END) AS Collected,
                        SUM(CASE WHEN Direction = 2 THEN Amount ELSE 0 END) AS Refunded
         FROM PaymentTransactions WHERE OrderId IN (SELECT OrderId FROM inserted) GROUP BY OrderId) a ON a.OrderId = o.Id
        WHERE a.Collected > o.GrandTotal OR a.Refunded > a.Collected)
        THROW 51151, N''Thu vượt tổng đơn hoặc hoàn vượt số tiền đã thu.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i JOIN ReturnRequests r ON r.Id = i.ReturnRequestId
        WHERE r.Status NOT IN (2,3,4) OR
          ISNULL((SELECT SUM(p.Amount) FROM PaymentTransactions p WHERE p.ReturnRequestId = r.Id AND p.Direction = 2),0)
             > ISNULL((SELECT SUM(x.RefundAmount) FROM ReturnItems x WHERE x.ReturnRequestId = r.Id),0))
        THROW 51152, N''Hoàn tiền phải thuộc yêu cầu đã duyệt và không vượt số tiền được hoàn.'', 1;
    IF EXISTS (SELECT 1 FROM vw_ShiftCashSummary v WHERE v.ShiftId IN (SELECT ShiftId FROM inserted) AND v.ExpectedCash < 0)
        THROW 51171, N''Giao dịch làm tiền mặt kỳ vọng trong ca bị âm.'', 1;
END;');

-- Tạo trigger kiểm tra nguồn chứng từ và bảo vệ sổ kho
EXEC(N'CREATE TRIGGER TR_StockMovements_Integrity
ON StockMovements
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    IF ROWCOUNT_BIG() = 0 RETURN;
    SET NOCOUNT ON;
IF EXISTS (SELECT 1 FROM inserted i WHERE i.RecordedByUserId IS NOT NULL AND NOT EXISTS
        (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
         WHERE ur.UserId = i.RecordedByUserId AND r.Name IN (N''Admin'',N''Employee'')))
        THROW 51100, N''Vai trò tài khoản tại RecordedByUserId không hợp lệ.'', 1;

    IF EXISTS (SELECT 1 FROM deleted)
        THROW 51153, N''Không sửa hoặc xóa biến động kho đã ghi.'', 1;
    DECLARE @Locked bigint;
    SELECT @Locked = COUNT_BIG(*) FROM StockBalances WITH (UPDLOCK,HOLDLOCK) WHERE VariantId IN (SELECT VariantId FROM inserted);
    IF EXISTS (SELECT 1 FROM inserted i JOIN StocktakeScopeLocks l ON l.VariantId = i.VariantId AND l.IsActive = 1
               LEFT JOIN StocktakeItems x ON x.Id = i.StocktakeItemId
               WHERE i.Kind <> 4 OR x.StocktakeId <> l.StocktakeId)
        THROW 51154, N''SKU đang khóa kiểm kê không được phát sinh nhập xuất khác.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i JOIN OrderItems x ON x.Id = i.OrderItemId JOIN Orders o ON o.Id = x.OrderId
        WHERE (i.Kind = 1 AND (i.SellableDelta <> -x.Quantity OR i.DamagedDelta <> 0
            OR NOT ((o.Channel = 2 AND o.Status = 5) OR (o.Channel = 1 AND o.Status IN (4,5)
                AND EXISTS (SELECT 1 FROM InventoryReservations r WHERE r.OrderItemId = x.Id AND r.Status = 3)))))
           OR (i.Kind = 6 AND (i.SellableDelta + i.DamagedDelta <> x.Quantity
               OR NOT EXISTS (SELECT 1 FROM Shipments sh WHERE sh.OrderId = o.Id AND sh.Status = 5)
               OR NOT EXISTS (SELECT 1 FROM StockMovements m WHERE m.OrderItemId = x.Id AND m.Kind = 1))))
        THROW 51155, N''Xuất bán hoặc nhận hàng giao thất bại không khớp đơn.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i JOIN GoodsReceiptItems x ON x.Id = i.GoodsReceiptItemId JOIN GoodsReceipts h ON h.Id = x.GoodsReceiptId
               WHERE h.Status <> 2 OR i.SellableDelta <> x.SellableQuantity OR i.DamagedDelta <> x.DamagedQuantity)
        THROW 51156, N''Biến động nhập phải khớp phiếu nhập đã ghi sổ.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i JOIN StockIssueItems x ON x.Id = i.StockIssueItemId JOIN StockIssues h ON h.Id = x.StockIssueId
               WHERE h.Status <> 2 OR i.SellableDelta <> -x.SellableQuantity OR i.DamagedDelta <> -x.DamagedQuantity)
        THROW 51157, N''Biến động xuất phải khớp phiếu xuất đã ghi sổ.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i JOIN StocktakeItems x ON x.Id = i.StocktakeItemId JOIN Stocktakes h ON h.Id = x.StocktakeId
               WHERE h.Status <> 3 OR x.CountedSellableQuantity IS NULL OR x.CountedDamagedQuantity IS NULL
                   OR i.SellableDelta <> x.CountedSellableQuantity - x.SystemSellableQuantity
                   OR i.DamagedDelta <> x.CountedDamagedQuantity - x.SystemDamagedQuantity)
        THROW 51158, N''Điều chỉnh kho phải khớp kiểm kê đã duyệt.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i JOIN ReturnItems x ON x.Id = i.ReturnItemId JOIN ReturnRequests h ON h.Id = x.ReturnRequestId
               WHERE h.Status NOT IN (2,3,4) OR x.ReceivedAt IS NULL
                   OR i.SellableDelta <> x.ReceivedSellableQuantity OR i.DamagedDelta <> x.ReceivedDamagedQuantity)
        THROW 51159, N''Nhập hàng trả phải khớp hàng đã thực nhận.'', 1;
    UPDATE b SET SellableQuantity = b.SellableQuantity + a.SellableDelta,
                 DamagedQuantity = b.DamagedQuantity + a.DamagedDelta, UpdatedAt = SYSUTCDATETIME()
    FROM StockBalances b JOIN
       (SELECT VariantId,SUM(SellableDelta) AS SellableDelta,SUM(DamagedDelta) AS DamagedDelta
        FROM inserted GROUP BY VariantId) a ON a.VariantId = b.VariantId;
END;');

-- Tạo trigger bảo vệ tồn kho được cập nhật từ sổ kho và giữ hàng
EXEC(N'CREATE TRIGGER TR_StockBalances_Source
ON StockBalances
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    IF ROWCOUNT_BIG() = 0 RETURN;
    SET NOCOUNT ON;
IF TRIGGER_NESTLEVEL(OBJECT_ID(N''TR_ProductVariants_InitializeStock''), ''AFTER'', ''DML'') = 0
       AND TRIGGER_NESTLEVEL(OBJECT_ID(N''TR_Reservations_Integrity''), ''AFTER'', ''DML'') = 0
       AND TRIGGER_NESTLEVEL(OBJECT_ID(N''TR_StockMovements_Integrity''), ''AFTER'', ''DML'') = 0
        THROW 51167, N''Tồn kho chỉ được cập nhật qua biến thể mới, giữ hàng hoặc biến động kho.'', 1;
END;');

-- Tạo trigger kiểm tra ca làm và số tiền đối soát
EXEC(N'CREATE TRIGGER TR_Shifts_Integrity
ON Shifts
AFTER INSERT, UPDATE
AS
BEGIN
    IF ROWCOUNT_BIG() = 0 RETURN;
    SET NOCOUNT ON;
IF EXISTS (SELECT 1 FROM inserted i WHERE i.EmployeeUserId IS NOT NULL AND NOT EXISTS
        (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
         WHERE ur.UserId = i.EmployeeUserId AND r.Name IN (N''Admin'',N''Employee'')))
        THROW 51100, N''Vai trò tài khoản tại EmployeeUserId không hợp lệ.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i WHERE i.ReconciledByUserId IS NOT NULL AND NOT EXISTS
        (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
         WHERE ur.UserId = i.ReconciledByUserId AND r.Name IN (N''Admin'')))
        THROW 51100, N''Vai trò tài khoản tại ReconciledByUserId không hợp lệ.'', 1;

    IF EXISTS (SELECT 1 FROM inserted i LEFT JOIN deleted d ON d.Id = i.Id WHERE d.Id IS NULL AND i.Status <> 1)
        THROW 51160, N''Ca làm bắt đầu ở trạng thái đang mở.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i JOIN deleted d ON d.Id = i.Id
        WHERE i.EmployeeUserId <> d.EmployeeUserId OR i.CashRegisterId <> d.CashRegisterId OR i.OpeningCash <> d.OpeningCash
           OR (i.Status <> d.Status AND NOT ((d.Status = 1 AND i.Status = 2) OR (d.Status = 2 AND i.Status = 3))))
        THROW 51161, N''Không đổi người, quầy, tiền đầu ca hoặc mở lại ca đã kết thúc.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i JOIN vw_ShiftCashSummary v ON v.ShiftId = i.Id
        WHERE i.Status IN (2,3) AND (i.ClosingExpectedCash <> v.ExpectedCash
          OR (i.ClosingActualCash <> i.ClosingExpectedCash AND NULLIF(LTRIM(RTRIM(i.VarianceReason)),N'''') IS NULL)))
        THROW 51162, N''Tiền kỳ vọng phải khớp sổ thu chi; lệch tiền phải có lý do.'', 1;

    IF EXISTS (SELECT Id,CashRegisterId,EmployeeUserId,Status,OpenedAt,OpeningCash,SubmittedAt,ClosingActualCash,ClosingExpectedCash,VarianceReason,ReconciledByUserId,ReconciledAt,Note FROM inserted WHERE Id IN (SELECT Id FROM deleted WHERE Status IN (3))
               EXCEPT SELECT Id,CashRegisterId,EmployeeUserId,Status,OpenedAt,OpeningCash,SubmittedAt,ClosingActualCash,ClosingExpectedCash,VarianceReason,ReconciledByUserId,ReconciledAt,Note FROM deleted WHERE Status IN (3))
        THROW 51170, N''Không sửa chứng từ Shifts đã kết thúc.'', 1;
END;');

-- Tạo trigger kiểm tra ca mở và bảo vệ thu chi tiền mặt
EXEC(N'CREATE TRIGGER TR_ShiftCashEntries_Integrity
ON ShiftCashEntries
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    IF ROWCOUNT_BIG() = 0 RETURN;
    SET NOCOUNT ON;
IF EXISTS (SELECT 1 FROM inserted i WHERE i.RecordedByUserId IS NOT NULL AND NOT EXISTS
        (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
         WHERE ur.UserId = i.RecordedByUserId AND r.Name IN (N''Admin'',N''Employee'')))
        THROW 51100, N''Vai trò tài khoản tại RecordedByUserId không hợp lệ.'', 1;
    IF EXISTS (SELECT 1 FROM inserted i WHERE i.ApprovedByUserId IS NOT NULL AND NOT EXISTS
        (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
         WHERE ur.UserId = i.ApprovedByUserId AND r.Name IN (N''Admin'')))
        THROW 51100, N''Vai trò tài khoản tại ApprovedByUserId không hợp lệ.'', 1;

    IF EXISTS (SELECT 1 FROM deleted) THROW 51163, N''Không sửa hoặc xóa thu chi đã ghi.'', 1;
    DECLARE @Locked bigint;
    SELECT @Locked = COUNT_BIG(*) FROM Shifts WITH (UPDLOCK,HOLDLOCK) WHERE Id IN (SELECT ShiftId FROM inserted);
    IF EXISTS (SELECT 1 FROM inserted i JOIN Shifts s ON s.Id = i.ShiftId
               WHERE s.Status <> 1 OR s.EmployeeUserId <> i.RecordedByUserId)
        THROW 51164, N''Thu chi phải thuộc ca đang mở của người ghi.'', 1;
    IF EXISTS (SELECT 1 FROM vw_ShiftCashSummary v WHERE v.ShiftId IN (SELECT ShiftId FROM inserted) AND v.ExpectedCash < 0)
        THROW 51171, N''Thu chi làm tiền mặt kỳ vọng trong ca bị âm.'', 1;
END;');

-- Tạo trigger kiểm tra người cập nhật cấu hình
EXEC(N'CREATE TRIGGER TR_StoreSettings_Admin
ON StoreSettings
AFTER INSERT, UPDATE
AS
BEGIN
    IF ROWCOUNT_BIG() = 0 RETURN;
    SET NOCOUNT ON;
IF EXISTS (SELECT 1 FROM inserted i WHERE i.UpdatedByUserId IS NOT NULL AND NOT EXISTS
        (SELECT 1 FROM AspNetUserRoles ur JOIN AspNetRoles r ON r.Id = ur.RoleId
         WHERE ur.UserId = i.UpdatedByUserId AND r.Name IN (N''Admin'')))
        THROW 51100, N''Vai trò tài khoản tại UpdatedByUserId không hợp lệ.'', 1;
END;');

-- Tạo trigger bảo vệ lịch sử đơn hàng
EXEC(N'CREATE TRIGGER TR_OrderStatusHistory_AppendOnly
ON OrderStatusHistory
AFTER UPDATE, DELETE
AS
BEGIN
    IF ROWCOUNT_BIG() = 0 RETURN;
    SET NOCOUNT ON;
IF EXISTS (SELECT 1 FROM deleted) THROW 51165, N''Không sửa hoặc xóa lịch sử OrderStatusHistory.'', 1;
END;');

-- Tạo trigger bảo vệ lịch sử thao tác
EXEC(N'CREATE TRIGGER TR_AuditLogs_AppendOnly
ON AuditLogs
AFTER UPDATE, DELETE
AS
BEGIN
    IF ROWCOUNT_BIG() = 0 RETURN;
    SET NOCOUNT ON;
IF EXISTS (SELECT 1 FROM deleted) THROW 51165, N''Không sửa hoặc xóa lịch sử AuditLogs.'', 1;
END;');

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
