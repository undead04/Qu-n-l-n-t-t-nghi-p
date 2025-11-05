-- ===============================
-- 1. Bảng KHOA
-- ===============================
IF OBJECT_ID('KHOA_MAP','U') IS NULL
BEGIN
    CREATE TABLE KHOA_MAP (
        MaKhoa INT IDENTITY PRIMARY KEY,
        TenKhoa NVARCHAR(250),
        DBName NVARCHAR(250),
        ServerName NVARCHAR(250),
        Username NVARCHAR(250),
        Password NVARCHAR(250)
    );
END
GO
-- ===============================
-- 2. Bảng Users
-- ===============================
IF OBJECT_ID('USERS','U') IS NULL
BEGIN
    CREATE TABLE USERS (
        UserID INT IDENTITY PRIMARY KEY,
        Username NVARCHAR(100) UNIQUE,
        PasswordHash NVARCHAR(255),
        Role NVARCHAR(20) CHECK (Role IN ('Admin', 'GiaoVien', 'SinhVien')),
        MaKhoa INT NULL,
        Salt VARCHAR(36),
        MaGV VARCHAR(20) NULL,
        MaSV VARCHAR(20) NULL,
        FOREIGN KEY (MaKhoa) REFERENCES KHOA_MAP(MaKhoa)
);
END
GO

-- ===============================
-- 3. Bảng NĂM HỌC
-- ===============================
IF OBJECT_ID('NAMHOC','U') IS NULL
BEGIN
    CREATE TABLE NAMHOC (
        MaNamHoc VARCHAR(20) PRIMARY KEY,  -- ví dụ: '2024-2025'
        ThoiGianBatDau  DATE NOT NULL,        -- 2024
        ThoiGianKetThuc   DATE NOT NULL,       -- 2025
        CHECK (ThoiGianKetThuc > ThoiGianBatDau)
    );
END
GO