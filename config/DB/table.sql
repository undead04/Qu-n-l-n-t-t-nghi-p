IF NOT EXISTS (
    SELECT name 
    FROM sys.databases 
    WHERE name = N'DBTN'
)
BEGIN
    CREATE DATABASE DBTN;
END
GO

USE DBTN
GO
-- ===============================
-- 1. Bảng KHOA
-- ===============================
IF OBJECT_ID('KHOA','U') IS NULL
BEGIN
    CREATE TABLE KHOA (
        MaKhoa INT IDENTITY(1,1) PRIMARY KEY,
        TenKhoa NVARCHAR(250) NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE()
    );
END
GO

-- ===============================
-- 2. Bảng SINH VIÊN
-- ===============================
IF OBJECT_ID('SINHVIEN','U') IS NULL
BEGIN
    CREATE TABLE SINHVIEN (
        MaSV VARCHAR(20) PRIMARY KEY,
        MaKhoa INT NOT NULL,
        TenSV NVARCHAR(100) NOT NULL,
        DiaChi NVARCHAR(100),
        SoDienThoai NVARCHAR(100),
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (MaKhoa) REFERENCES KHOA(MaKhoa)
    );
END
GO

-- ===============================
-- 3. Bảng GIÁO VIÊN
-- ===============================
IF OBJECT_ID('GIAOVIEN','U') IS NULL
BEGIN
    CREATE TABLE GIAOVIEN (
        MaGV VARCHAR(20) PRIMARY KEY,
        MaKhoa INT NOT NULL,
        TenGV NVARCHAR(100) NOT NULL,
        DiaChi NVARCHAR(250),
        SoDienThoai NVARCHAR(50),
        HocVi NVARCHAR(100),
        ChuyenNganh NVARCHAR(150),
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (MaKhoa) REFERENCES KHOA(MaKhoa)
    );
END
GO

-- ===============================
-- 5. Bảng NĂM HỌC
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
-- ===============================
-- 4. Bảng HỘI ĐỒNG
-- ===============================
IF OBJECT_ID('HOIDONG','U') IS NULL
BEGIN
    CREATE TABLE HOIDONG (
        MaHD VARCHAR(20) PRIMARY KEY,
        MaNamHoc VARCHAR(20) NOT NULL,
        MaKhoa INT NOT NULL,
        NgayBaoVe DATE NOT NULL,
        DiaChiBaoVe NVARCHAR(250),
        MaGVChuTich VARCHAR(20) NOT NULL,
        MaGVThuKy   VARCHAR(20) NOT NULL,
        MaGVPhanBien VARCHAR(20) NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (MaKhoa) REFERENCES KHOA(MaKhoa),
        FOREIGN KEY (MaGVChuTich) REFERENCES GIAOVIEN(MaGV),
        FOREIGN KEY (MaNamHoc) REFERENCES NAMHOC(MaNamHoc),
        FOREIGN KEY (MaGVThuKy)   REFERENCES GIAOVIEN(MaGV),
        FOREIGN KEY (MaGVPhanBien) REFERENCES GIAOVIEN(MaGV)
    );
END

-- ===============================
-- 7. Bảng ĐỒ ÁN (instance của đề tài mỗi năm, có điểm)
-- ===============================
IF OBJECT_ID('DETAI','U') IS NULL
BEGIN
    CREATE TABLE DETAI (
        MaDT VARCHAR(20) PRIMARY KEY,
        MaKhoa INT NOT NULL,
        TenDT NVARCHAR(250) NOT NULL,         -- tham chiếu đề tài gốc
        MaNamHoc VARCHAR(20) NOT NULL,
        MaGVHuongDan VARCHAR(20) NOT NULL,
        ThoiGianBatDau DATE NOT NULL,
        ThoiGianKetThuc DATE NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (MaNamHoc) REFERENCES NAMHOC(MaNamHoc),
        FOREIGN KEY (MaGVHuongDan) REFERENCES GIAOVIEN(MaGV)
    );
END
GO
-- ===============================
-- 8. Bảng HỘI ĐỒNG VỚI ĐỀ TÀI
-- ===============================
IF OBJECT_ID('HOIDONG_DETAI') IS NULl
BEGIN
    CREATE TABLE HOIDONG_DETAI (
        MaDT VARCHAR(20),
        MaHD VARCHAR(20),
        PRIMARY KEY (MaDT,MaHD),
        LanBaoVe INT NOT NULL CHECK (LanBaoVe BETWEEN 1 AND 2),
        FOREIGN KEY (MaHD) REFERENCES HOIDONG(MAHD),
        FOREIGN KEY (MaDT) REFERENCES DETAI(MaDT)
    );
END
GO

-- ===============================
-- 8. Bảng PHÂN CÔNG SINH VIÊN VÀO ĐỒ ÁN
-- ===============================
IF OBJECT_ID('DETAI_SINHVIEN','U') IS NULL
BEGIN
    CREATE TABLE DETAI_SINHVIEN (
        MaDT VARCHAR(20),
        MaSV VARCHAR(20),
        PRIMARY KEY(MaDT, MaSV),
        FOREIGN KEY (MaDT) REFERENCES DETAI(MaDT),
        FOREIGN KEY (MaSV) REFERENCES SINHVIEN(MaSV)
    );
END
GO

-- ===============================
-- 8. Bảng KETQUA_BAOVE
-- ===============================
CREATE TABLE KETQUA_BAOVE (
    MaDT VARCHAR(20) NOT NULL,
    MaSV VARCHAR(20) NOT NULL,
    MaHD VARCHAR(20) NOT NULL,
    DiemGVHuongDan FLOAT NULL,
    DiemGVPhanBien FLOAT NULL,
    DiemGVChuTich FLOAT NULL,
    DiemTrungBinh FLOAT NULL CHECK (DiemTrungBinh BETWEEN 0 AND 10),
    KetQua NVARCHAR(20) NULL,   -- Đậu / Rớt

    PRIMARY KEY (MaDT, MaSV, MaHD),
    FOREIGN KEY (MaDT, MaSV) REFERENCES DETAI_SINHVIEN(MaDT, MaSV),
    FOREIGN KEY (MaDT,MaHD) REFERENCES HOIDONG_DETAI(MaDT,MaHD)
);

-- ===============================
-- TẠO BẢNG COUNTER
-- ===============================
IF OBJECT_ID('Dem','U') IS NULL 
BEGIN
    CREATE TABLE Dem (
        Nam CHAR(2),         -- Năm (2 số cuối)
        KhoaCode INT,
        Loai CHAR(2),        -- SV / GV / DT
        STT INT NOT NULL,
        PRIMARY KEY(Nam, KhoaCode, Loai)
    );
END
GO



