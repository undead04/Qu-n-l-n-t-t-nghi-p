-- ===============================
-- 1. Bảng SINH VIÊN
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
        UpdatedAt DATETIME DEFAULT GETDATE()
    );
END
GO

-- ===============================
-- 2. Bảng GIÁO VIÊN
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
        UpdatedAt DATETIME DEFAULT GETDATE()
    );
END
GO
-- ===============================
-- 3. Bảng HỘI ĐỒNG
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
        FOREIGN KEY (MaGVChuTich) REFERENCES GIAOVIEN(MaGV),
        FOREIGN KEY (MaGVThuKy)   REFERENCES GIAOVIEN(MaGV),
        FOREIGN KEY (MaGVPhanBien) REFERENCES GIAOVIEN(MaGV)
    );
END
GO
-- ===============================
-- 4. Bảng ĐỒ ÁN
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
        FOREIGN KEY (MaGVHuongDan) REFERENCES GIAOVIEN(MaGV),
        FOREIGN KEY (MaHD) REFERENCES HOIDONG(MaHD)
    );
END
GO
-- ===============================
-- 5. Bảng TÀI LIỆU
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
-- 6. Bảng PHÂN CÔNG SINH VIÊN VÀO ĐỒ ÁN
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
-- 7. Bảng Diem
-- ===============================
IF OBJECT_ID('Diem','U') IS NULL
BEGIN
CREATE TABLE Diem (
    MaDT VARCHAR(20) NOT NULL,
    MaSV VARCHAR(20) NOT NULL,
    Diem Float NOT NULL,
    MaGV VARCHAR(20) NOT NULL,
    PRIMARY KEY (MaDT, MaSV,MaGV),
    FOREIGN KEY (MaDT, MaSV) REFERENCES DETAI_SINHVIEN(MaDT, MaSV),
);
END
GO

-- ===============================
-- TẠO BẢNG COUNTER
-- ===============================
IF OBJECT_ID('Dem','U') IS NULL 
BEGIN
    CREATE TABLE Dem (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Nam CHAR(2),         -- Năm (2 số cuối)       -- SV / GV / DT
        STT INT NOT NULL,
        Loai CHAR(2),   
    );
END
GO