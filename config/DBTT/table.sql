-- ===============================
-- 1. Bảng Khoa
-- ===============================
IF OBJECT_ID('KHOA','U') IS NULL
BEGIN
    CREATE TABLE KHOA (
        MaKhoa INT IDENTITY(1,1) PRIMARY KEY,
        TenKhoa NVARCHAR(250),
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE()
    );
END
GO

-- ===============================
-- 2. Bảng NĂM HỌC
-- ===============================
IF OBJECT_ID('NAMHOC','U') IS NULL
BEGIN
    CREATE TABLE NAMHOC (
        MaNamHoc VARCHAR(20) PRIMARY KEY,  
        ThoiGianBatDau  DATE NOT NULL,        
        ThoiGianKetThuc   DATE NOT NULL,      
        CHECK (ThoiGianKetThuc > ThoiGianBatDau)
    );
END
GO

-- ===============================
-- 3. Bảng SINH VIÊN
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
-- 4. Bảng GIÁO VIÊN
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
-- 5. Bảng HỘI ĐỒNG
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
        FOREIGN KEY (MaGVThuKy)   REFERENCES GIAOVIEN(MaGV),
        FOREIGN KEY (MaGVPhanBien) REFERENCES GIAOVIEN(MaGV),
        FOREIGN KEY (MaNamHoc) REFERENCES NAMHOC(MaNamHoc)
    );
END
GO
-- ===============================
-- 6. Bảng ĐỒ ÁN
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
        MaHD VARCHAR(20) NULL,
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (MaKhoa) REFERENCES KHOA(MaKhoa),
        FOREIGN KEY (MaGVHuongDan) REFERENCES GIAOVIEN(MaGV),
        FOREIGN KEY (MaHD) REFERENCES HOIDONG(MaHD),
        FOREIGN KEY (MaNamHoc) REFERENCES NAMHOC(MaNamHoc)
    );
END
GO
-- ===============================
-- 7. Bảng TÀI LIỆU
-- ===============================
IF OBJECT_ID('TAILIEU','U') IS NULL
BEGIN
    CREATE TABLE TAILIEU (
        MaTL INT IDENTITY(1,1) PRIMARY KEY,
        MaDT VARCHAR(20) NOT NULL,
        TenTL NVARCHAR(250),
        Url NVARCHAR(250),
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE(),
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
        DiemTrungBinh FLOAT NULL CHECK (DiemTrungBinh BETWEEN 0 AND 10),
        KetQua NVARCHAR(20) NULL,   -- Đậu / Rớt
        FOREIGN KEY (MaDT) REFERENCES DETAI(MaDT),
        FOREIGN KEY (MaSV) REFERENCES SINHVIEN(MaSV)
    );
END
GO

-- ===============================
-- 9. Bảng ĐIỂM
-- ===============================
IF OBJECT_ID('DIEM','U') IS NULL
BEGIN
    CREATE TABLE DIEM (
        MaDT VARCHAR(20) NOT NULL,
        MaSV VARCHAR(20) NOT NULL,
        MaGV VARCHAR(20) NOT NULL,
        Diem FLOAT NOT NULL CHECK (Diem BETWEEN 0 AND 10),
        PRIMARY KEY (MaDT, MaSV, MaGV),
        FOREIGN KEY (MaDT, MaSV) REFERENCES DETAI_SINHVIEN(MaDT, MaSV),
        FOREIGN KEY (MaGV) REFERENCES GIAOVIEN(MaGV)
    );
END
GO


-- ===============================
-- 10. TẠO BẢNG COUNTER
-- ===============================
IF OBJECT_ID('Dem','U') IS NULL 
BEGIN
    CREATE TABLE Dem (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Nam CHAR(2),         -- Năm (2 số cuối)       -- SV / GV / DT
        STT INT NOT NULL,
        Loai CHAR(2)
    );
END
GO

-- ===============================
-- 11. Bảng Users
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
        FOREIGN KEY (MaKhoa) REFERENCES KHOA(MaKhoa),
        FOREIGN KEY (MaGV) REFERENCES GIAOVIEN(MaGV),
        FOREIGN KEY (MaSV) REFERENCES SINHVIEN(MaSV)
    );
END
GO



