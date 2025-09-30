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
-- TẠO DỮ LIỆU KHOA (2 khoa)
-- ===============================
INSERT INTO KHOA (TenKhoa)
VALUES 
    (N'Công nghệ thông tin'),
    (N'Cơ khí');
GO

-- ===============================
-- TẠO DỮ LIỆU NĂM HỌC (2 năm)
-- ===============================
INSERT INTO NAMHOC (MaNamHoc, ThoiGianBatDau, ThoiGianKetThuc)
VALUES 
('2024-2025', '2024-09-01', '2025-06-30'),
('2025-2026', '2025-09-01', '2026-06-30');
GO

-- ============================================
-- BẢNG TÊN GIẢ
-- ============================================
-- Tạo bảng tạm họ - tên đệm - tên
CREATE TABLE #Ho (Ho NVARCHAR(20));
GO

CREATE TABLE #TenDem (TenDem NVARCHAR(20));
GO

CREATE TABLE #Ten (Ten NVARCHAR(20));
GO

-- Họ
INSERT INTO #Ho VALUES (N'Nguyễn'),(N'Trần'),(N'Lê'),(N'Phạm'),(N'Hoàng'),
                       (N'Vũ'),(N'Đặng'),(N'Bùi'),(N'Đỗ'),(N'Huỳnh'),
                       (N'Ngô'),(N'Dương'),(N'Tạ'),(N'Võ'),(N'Mai'),
                       (N'Lý'),(N'Châu'),(N'Tôn'),(N'Cao'),(N'Triệu');
GO

-- Tên đệm
INSERT INTO #TenDem VALUES (N'Văn'),(N'Thị'),(N'Thanh'),(N'Hữu'),(N'Ngọc');
GO

-- Tên
INSERT INTO #Ten VALUES (N'An'),(N'Bình'),(N'Cường'),(N'Dung'),(N'Hạnh'),
                        (N'Khánh'),(N'Linh'),(N'Minh'),(N'Phong'),(N'Thu'),
                        (N'Tú'),(N'Giang'),(N'Tiến'),(N'Hiếu'),(N'Nam'),
                        (N'Hùng'),(N'Hương'),(N'Lan'),(N'Trung'),(N'Sơn'),
                        (N'Thảo'),(N'Ngân'),(N'Thắng'),(N'Tú Anh'),(N'Đạt'),
                        (N'Khoa'),(N'Hải'),(N'Long'),(N'Vy'),(N'Tâm'),
                        (N'Trinh'),(N'Loan'),(N'Kim'),(N'Tuyết'),(N'Phúc'),
                        (N'Hòa'),(N'Thuận'),(N'Nhung'),(N'Tiên'),(N'Quang'),
                        (N'Nga'),(N'Liên'),(N'Hải Yến'),(N'Mai Anh'),(N'Truyền');
GO

CREATE OR ALTER PROC usp_GenerateName
    @HoTen NVARCHAR(250) OUTPUT
AS
BEGIN
    DECLARE @Ho NVARCHAR(250);
    DECLARE @TenDem NVARCHAR(250);
    DECLARE @Ten NVARCHAR(250);

    SELECT TOP 1 @Ho = Ho FROM #Ho ORDER BY NEWID();
    SELECT TOP 1 @TenDem = TenDem FROM #TenDem ORDER BY NEWID();
    SELECT TOP 1 @Ten = Ten FROM #Ten ORDER BY NEWID();
    SET @HoTen =@Ho + N' ' + @TenDem + N' ' + @Ten
END
GO
-- ===============================
-- TẠO DỮ LIỆU SINH VIÊN (200 SV)
-- ===============================
DECLARE @i INT = 1;
DECLARE @MaKhoa INT
DECLARE @MaSV VARCHAR(20);
DECLARE @HoTenSV NVARCHAR(250);
WHILE @i <= 200
BEGIN
 -- Gán giá trị cho @MaKhoa
    SET @MaKhoa = CASE 
                      WHEN @i <= 100 THEN 1
                      ELSE 2
                  END;
    EXEC usp_GetCode 
        @KhoaCode = @MaKhoa, 
        @Loai = 'SV', 
        @NewCode = @MaSV OUTPUT;

    EXEC usp_GenerateName @HoTen = @HoTenSV OUTPUT;

    INSERT INTO SINHVIEN (MaSV, MaKhoa, TenSV,DiaChi,SoDienThoai)
    VALUES (
        @MaSV,
        @MaKhoa,
        @HoTenSV,
        'Ho Chi Minh',
        '0394565789'
    );
    SET @i += 1;
END
GO
-- ===============================
-- TẠO DỮ LIỆU giáo viên (40)
-- ===============================
DECLARE @i INT = 1;
DECLARE @MaKhoa INT
DECLARE @MaGV VARCHAR(20);
DECLARE @HoTenGV NVARCHAR(250);
WHILE @i <= 40
BEGIN
 -- Gán giá trị cho @MaKhoa
    SET @MaKhoa = CASE 
                      WHEN @i <= 20 THEN 1
                      ELSE 2
                  END;
    EXEC usp_GetCode 
        @KhoaCode = @MaKhoa, 
        @Loai = 'GV', 
        @NewCode = @MaGV OUTPUT;

    EXEC usp_GenerateName @HoTen = @HoTenGV OUTPUT;

    INSERT INTO GIAOVIEN(MaGV, MaKhoa, TenGV,DiaChi,SoDienThoai,ChuyenNganh,HocVi)
    VALUES (
        @MaGV,
        @MaKhoa,
        @HoTenGV,
        N'Hồ Chí Minh',
        '0394565789',
        N'An Toàn thông tin',
        N'Tiến sĩ'
    );
    SET @i += 1;
END
GO
-- ===============================
-- TẠO DỮ LIỆU ĐỀ TÀI (40)
-- ===============================
DECLARE @i INT = 1;
DECLARE @MaKhoa INT;
DECLARE @MaDT NVARCHAR(20);
DECLARE @TenDT NVARCHAR(250);

-- Keywords cho từng khoa
DECLARE @KeywordsCNTT TABLE (Keyword NVARCHAR(50));
INSERT INTO @KeywordsCNTT (Keyword)
VALUES 
    (N'AI'), (N'Machine Learning'), (N'Big Data'), (N'IoT'), (N'Web Development'),
    (N'Computer Vision'), (N'Blockchain'), (N'Data Mining'), (N'Cloud Computing'), (N'Cybersecurity');

DECLARE @KeywordsCoKhi TABLE (Keyword NVARCHAR(50));
INSERT INTO @KeywordsCoKhi (Keyword)
VALUES 
    (N'Robot'), (N'Máy CNC'), (N'Tự động hóa'), (N'Chế tạo máy'), (N'Kỹ thuật vật liệu'),
    (N'Năng lượng'), (N'Cơ điện tử'), (N'Động cơ'), (N'Xử lý cơ khí'), (N'Khí nén');

WHILE @i <= 40
BEGIN
    -- Gán MaKhoa: 1 = CNTT, 2 = Cơ Khí
    SET @MaKhoa = CASE WHEN @i <= 20 THEN 1 ELSE 2 END;

    -- Tạo MaDT: DT01 → DT40
     EXEC usp_GetCode 
         @KhoaCode = @MaKhoa, 
         @Loai = 'DT', 
         @NewCode = @MaDT OUTPUT;

    -- Chọn từ khóa ngẫu nhiên cho TenDT
    DECLARE @randIndex INT = CAST(ABS(CHECKSUM(NEWID())) % 10 + 1 AS INT);

    IF @MaKhoa = 1
    BEGIN
        SELECT @TenDT = Keyword FROM (
            SELECT Keyword, ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS rn
            FROM @KeywordsCNTT
        ) AS t WHERE rn = @randIndex;
    END
    ELSE
    BEGIN
        SELECT @TenDT = Keyword FROM (
            SELECT Keyword, ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS rn
            FROM @KeywordsCoKhi
        ) AS t WHERE rn = @randIndex;
    END

    -- Chèn dữ liệu vào DETAI
    INSERT INTO DETAI (MaDT, MaKhoa, TenDT)
    VALUES (
        @MaDT,
        @MaKhoa,
        N'Đề tài ' + @TenDT + N' số ' + CAST(@i AS NVARCHAR(10))
    );

    SET @i += 1;
END
GO
-- ===============================
-- TẠO DỮ LIỆU HỘI ĐÒNG (20)
-- ===============================
DECLARE @i INT = 1;
DECLARE @MaKhoa INT;
DECLARE @MaHD VARCHAR(20);
DECLARE @MaNamHoc VARCHAR(20);
DECLARE @NgayBaoVe DATE;
DECLARE @DiaChi NVARCHAR(250);
DECLARE @MaGVChuTich VARCHAR(20);
DECLARE @MaGVThuKy VARCHAR(20);
DECLARE @MaGVPhanBien VARCHAR(20);

WHILE @i <= 20
BEGIN
    -- 1. Khoa
    SET @MaKhoa = CASE WHEN @i <= 10 THEN 1 ELSE 2 END;

    -- 2. Sinh mã hội đồng
    EXEC usp_GetCode 
        @KhoaCode = @MaKhoa,
        @Loai = 'HD',
        @NewCode = @MaHD OUTPUT;

    -- 3. Năm học
    SET @MaNamHoc = '2024-2025';

    -- 4. Ngày bảo vệ random
    SET @NgayBaoVe = DATEFROMPARTS(
        CAST(RIGHT(@MaNamHoc, 4) AS INT),
        (4 + ABS(CHECKSUM(NEWID())) % 3),
        (1 + ABS(CHECKSUM(NEWID())) % 28)
    );

    -- 5. Địa chỉ
    SET @DiaChi = N'Phòng bảo vệ số ' + CAST(@i AS NVARCHAR(10));

    -- 6. Random GV
    SELECT TOP 1 @MaGVChuTich = MaGV
    FROM GIAOVIEN 
    WHERE MaKhoa = @MaKhoa
    ORDER BY NEWID();

    SELECT TOP 1 @MaGVThuKy = MaGV
    FROM GIAOVIEN 
    WHERE MaKhoa = @MaKhoa
      AND MaGV <> @MaGVChuTich
    ORDER BY NEWID();

    SELECT TOP 1 @MaGVPhanBien = MaGV
    FROM GIAOVIEN 
    WHERE MaKhoa = @MaKhoa
      AND MaGV <> @MaGVChuTich
      AND MaGV <> @MaGVThuKy
    ORDER BY NEWID();

    -- 7. Chèn
    IF @MaGVChuTich IS NOT NULL AND @MaGVThuKy IS NOT NULL AND @MaGVPhanBien IS NOT NULL
    BEGIN
        INSERT INTO HOIDONG (MaHD, MaNamHoc, MaKhoa, NgayBaoVe, DiaChiBaoVe,
                             MaGVChuTich, MaGVThuKy, MaGVPhanBien)
        VALUES (@MaHD, @MaNamHoc, @MaKhoa, @NgayBaoVe, @DiaChi,
                @MaGVChuTich, @MaGVThuKy, @MaGVPhanBien);
    END

    SET @i += 1;
END
GO

