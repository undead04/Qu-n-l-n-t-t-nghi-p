
-- SỮ LÍ DATABASE CƠ KHÍ --
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
-- 1. Bảng Users
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
        MaSV VARCHAR(20) NULL
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
INSERT INTO KHOA_MAP
VALUES
(1, N'Công nghệ thông tin', 'DBTN_CNTT', '10.0.0.2', 'sa', '123456'),
(2, N'Cơ khí', 'DBTN_CK', '10.0.0.3', 'sa', '123456');
GO

-- 🔹 Thêm dữ liệu mẫu
INSERT INTO NAMHOC (MaNamHoc, ThoiGianBatDau, ThoiGianKetThuc)
VALUES 
    ('2023-2024', '2023-09-01', '2024-06-30'),
    ('2024-2025', '2024-09-01', '2025-06-30'),
     ('2025-2026', '2025-09-01', '2026-06-30');
GO


CREATE OR ALTER PROCEDURE usp_getListKhoa
    @search NVARCHAR(100) = NULL,  -- Từ khóa tìm kiếm theo tên khoa
    @limit INT = 10,               -- Số bản ghi mỗi trang
    @skip INT = 0                  -- Số bản ghi bỏ qua (offset)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        MaKhoa,
        TenKhoa
    FROM KHOA_MAP
    WHERE 
        (@search IS NULL OR TenKhoa LIKE N'%' + @search + N'%')
    ORDER BY TenKhoa
    OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY;
END;
GO

CREATE OR ALTER PROCEDURE usp_getListNamHoc
    @search NVARCHAR(20) = NULL,   -- ví dụ: '2024'
    @limit INT = 10,               -- số bản ghi mỗi trang
    @skip INT = 0                  -- số bản ghi bỏ qua
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        MaNamHoc,
        ThoiGianBatDau,
        ThoiGianKetThuc
    FROM NAMHOC
    WHERE 
        (@search IS NULL OR MaNamHoc LIKE '%' + @search + '%')
    ORDER BY MaNamHoc DESC
    OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY;
END;
GO


CREATE OR ALTER VIEW vw_List_Diem
AS
SELECT *
FROM DBTN_CNTT.dbo.Diem WITH (NOLOCK)
UNION ALL
SELECT *
FROM DBTN_CK.dbo.Diem WITH (NOLOCK)
GO

CREATE OR ALTER VIEW vw_List_DETAI
AS
SELECT *
FROM DBTN_CNTT.dbo.DETAI WITH (NOLOCK)
UNION ALL
SELECT *
FROM DBTN_CK.dbo.DETAI WITH (NOLOCK)
GO

CREATE OR ALTER VIEW vw_List_DETAI_SINHVIEN
AS
SELECT *
FROM DBTN_CNTT.dbo.DETAI_SINHVIEN WITH (NOLOCK)
UNION ALL
SELECT *
FROM DBTN_CK.dbo.DETAI_SINHVIEN WITH (NOLOCK)
GO

CREATE OR ALTER VIEW vw_List_SINHVIEN
AS
SELECT *
FROM DBTN_CNTT.dbo.SINHVIEN WITH (NOLOCK)
UNION ALL
SELECT *
FROM DBTN_CK.dbo.SINHVIEN WITH (NOLOCK)
GO

CREATE OR ALTER VIEW vw_List_GIAOVIEN
AS
SELECT *
FROM DBTN_CNTT.dbo.GIAOVIEN WITH (NOLOCK)
UNION ALL
SELECT *
FROM DBTN_CK.dbo.GIAOVIEN WITH (NOLOCK)
GO

CREATE OR ALTER VIEW vw_List_HOIDONG
AS
SELECT *
FROM DBTN_CNTT.dbo.HOIDONG WITH (NOLOCK)
UNION ALL
SELECT *
FROM DBTN_CK.dbo.HOIDONG WITH (NOLOCK)
GO

CREATE OR ALTER PROC usp_reportFaculty
    @limit INT = 10,
    @skip INT = 0,
    @year VARCHAR(20) = null 
AS
BEGIN
    SET NOCOUNT ON;
    ---------------------------------------------------------------------
    -- 3️⃣ Lấy điểm trung bình mới nhất theo từng sinh viên
    ---------------------------------------------------------------------
    ;WITH LatestResult AS (
        SELECT 
            SV.MaKhoa,
            KBV.MaSV,
            KBV.MaDT,
            CAST(KBV.DiemTrungBinh AS DECIMAL(4,2)) AS DiemTrungBinh
        FROM vw_List_DETAI_SINHVIEN KBV
        JOIN vw_List_SINHVIEN SV ON KBV.MaSV = SV.MaSV 
        WHERE KBV.DiemTrungBinh IS NOT NULL
    )

    ---------------------------------------------------------------------
    -- 4️⃣ Gom thống kê theo KHOA (theo sinh viên)
    ---------------------------------------------------------------------
    SELECT 
        K.MaKhoa,
        K.TenKhoa,
        MIN(LR.DiemTrungBinh) AS DiemMin,
        MAX(LR.DiemTrungBinh) AS DiemMax,
        AVG(LR.DiemTrungBinh) AS DiemTB,
        COUNT(DISTINCT LR.MaDT) AS SoDeTai,
        COUNT(DISTINCT LR.MaSV) AS SoSV,
        SUM(CASE WHEN LR.DiemTrungBinh >=5 THEN 1 ELSE 0 END) AS SoSVDau,
        SUM(CASE WHEN LR.DiemTrungBinh <5 THEN 1 ELSE 0 END) AS SoSVRot
    INTO #FacultyStats
    FROM KHOA_MAP K
    LEFT JOIN LatestResult LR ON LR.MaKhoa = k.MaKhoa
    LEFT JOIN vw_List_DETAI DT ON LR.MaDT = DT.MaDT
    WHERE (@year IS NULL OR DT.MaNamHoc = @year)
    GROUP BY K.MaKhoa, K.TenKhoa;

    ---------------------------------------------------------------------
    -- 5️⃣ Phân trang kết quả
    ---------------------------------------------------------------------
    SELECT 
        MaKhoa,
        TenKhoa,
        ROUND(ISNULL(DiemMin, 0), 2) AS DiemMin,
        ROUND(ISNULL(DiemMax, 0), 2) AS DiemMax,
        ROUND(ISNULL(DiemTB, 0), 2) AS DiemTB,
        ISNULL(SoDeTai, 0) AS SoDeTai,
        ISNULL(SoSV, 0) AS SoSV,
        CAST(ISNULL(ROUND(SoSVDau * 100.0 / NULLIF(SoSV, 0), 2), 0) AS DECIMAL(5,2)) AS TiLeDau,
        CAST(ISNULL(ROUND(SoSVRot * 100.0 / NULLIF(SoSV, 0), 2), 0) AS DECIMAL(5,2)) AS TiLeRot
    FROM #FacultyStats
    ORDER BY DiemTB DESC
    OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY;

    ---------------------------------------------------------------------
    -- 6️⃣ Tổng số dòng
    ---------------------------------------------------------------------
    SELECT COUNT(*) AS TotalCount
    FROM #FacultyStats;

    ---------------------------------------------------------------------
    -- 7️⃣ Dọn dẹp bảng tạm
    ---------------------------------------------------------------------
    DROP TABLE #FacultyStats;
END;
GO

CREATE OR ALTER PROC usp_reportTeacher
    @limit INT = 10,
    @skip INT = 0,
    @deCode INT = null,        -- Mã khoa bắt buộc
    @year VARCHAR(20) = null   -- Năm học bắt buộc
AS
BEGIN
    SET NOCOUNT ON;
    ;WITH LatestResult AS (
        SELECT 
            KBV.MaDT,
            KBV.MaSV,
            KBV.DiemTrungBinh
        FROM vw_List_DETAI_SINHVIEN KBV
        WHERE KBV.DiemTrungBinh IS NOT NULL
    )
    SELECT 
        GV.MaGV,
        GV.TenGV,
        K.TenKhoa,
        COUNT(DISTINCT LR.MaDT) AS SoDeTai,
        COUNT(DISTINCT LR.MaSV) AS SoSV,
        ISNULL(AVG(LR.DiemTrungBinh), 0) AS DiemTB,
        ISNULL(MIN(LR.DiemTrungBinh), 0) AS DiemMin,
        ISNULL(MAX(LR.DiemTrungBinh), 0) AS DiemMax,
        ISNULL(
            CAST(SUM(CASE WHEN LR.DiemTrungBinh >= 5 THEN 1 ELSE 0 END) * 100.0 /
                 NULLIF(COUNT(LR.DiemTrungBinh), 0) AS DECIMAL(5,2)), 0
        ) AS TiLeDau,
        ISNULL(
            CAST(SUM(CASE WHEN LR.DiemTrungBinh < 5 THEN 1 ELSE 0 END) * 100.0 /
                 NULLIF(COUNT(LR.DiemTrungBinh), 0) AS DECIMAL(5,2)), 0
        ) AS TiLeRot
    INTO #TeacherStats
    FROM LatestResult LR 
            INNER JOIN vw_List_DETAI DT ON DT.MaDT = LR.MaDT
            INNER JOIN vw_List_GIAOVIEN GV ON GV.MaGV = DT.MaGVHuongDan
            INNER JOIN KHOA_MAP K ON DT.MaKhoa = K.MaKhoa
    WHERE (@deCode IS NULL OR GV.MaKhoa = @deCode)
      AND (@year IS NULL OR DT.MaNamHoc = @year)
    GROUP BY GV.MaGV, GV.TenGV, K.TenKhoa;

    -- 2. Phân trang nhanh
    SELECT * 
    FROM #TeacherStats
    ORDER BY DiemTB DESC, TenGV ASC
    OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY;

    -- 3. Tổng dòng
    SELECT COUNT(*) AS TotalCount FROM #TeacherStats;

    DROP TABLE #TeacherStats;
END;
GO

CREATE OR ALTER PROC usp_reportTeacherMarking
    @limit INT = 10,
    @skip INT = 0,
    @deCode INT = NULL,        -- Mã khoa (lọc theo khoa giảng viên)
    @year VARCHAR(20) = NULL   -- Năm học
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH MarkingData AS (
        SELECT 
            D.MaGV,
            D.MaDT,
            D.MaSV,
            DT.MaNamHoc,
            DT.MaKhoa,
            D.DiemSo
        FROM DIEM D
        INNER JOIN DETAI DT ON DT.MaDT = D.MaDT
    )
    SELECT 
        GV.MaGV,
        GV.TenGV,
        K.TenKhoa,
        COUNT(DISTINCT M.MaDT) AS SoDeTaiCham,
        COUNT(DISTINCT M.MaSV) AS SoSVCham,
        ISNULL(AVG(M.DiemSo), 0) AS DiemTB,
        ISNULL(MIN(M.DiemSo), 0) AS DiemMin,
        ISNULL(MAX(M.DiemSo), 0) AS DiemMax,
        ISNULL(
            CAST(SUM(CASE WHEN M.DiemSo >= 5 THEN 1 ELSE 0 END) * 100.0 /
                 NULLIF(COUNT(M.DiemSo), 0) AS DECIMAL(5,2)), 0
        ) AS TiLeDau,
        ISNULL(
            CAST(SUM(CASE WHEN M.DiemSo < 5 THEN 1 ELSE 0 END) * 100.0 /
                 NULLIF(COUNT(M.DiemSo), 0) AS DECIMAL(5,2)), 0
        ) AS TiLeRot
    INTO #TeacherMarkingStats
    FROM MarkingData M
    INNER JOIN vw_List_GIAOVIEN GV ON GV.MaGV = M.MaGV
    INNER JOIN KHOA_MAP K ON K.MaKhoa = GV.MaKhoa
    WHERE (@deCode IS NULL OR GV.MaKhoa = @deCode)
      AND (@year IS NULL OR M.MaNamHoc = @year)
    GROUP BY GV.MaGV, GV.TenGV, K.TenKhoa;

    -- ✅ Phân trang
    SELECT *
    FROM #TeacherMarkingStats
    ORDER BY DiemTB DESC, TenGV ASC
    OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY;

    -- ✅ Tổng dòng
    SELECT COUNT(*) AS TotalCount FROM #TeacherMarkingStats;

    DROP TABLE #TeacherMarkingStats;
END;
GO

INSERT INTO KHOA(TenKhoa)
SELECT TenKhoa
FROM KHOA_MAP

INSERT INTO SINHVIEN
SELECT * FROM vw_List_SINHVIEN

INSERT INTO GIAOVIEN
SELECT * FROM vw_List_GIAOVIEN

INSERT INTO HOIDONG
SELECT * FROM vw_List_HOIDONG

INSERT INTO DETAI
SELECT * FROM vw_List_DETAI

INSERT INTO DETAI_SINHVIEN
SELECT * FROM vw_List_DETAI_SINHVIEN

INSERT INTO HOIDONG_DETAI
SELECT * FROM vw_List_HOIDONG_DETAI

INSERT INTO KETQUA_BAOVE
SELECT * FROM vw_List_KETQUA_BAOVE
GO

CREATE OR ALTER PROC usp_Login
    @username VARCHAR(100),
    @password VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE 
        @Role VARCHAR(20), 
        @MaKhoa INT, 
        @Code VARCHAR(20),
        @TenNguoiDung NVARCHAR(100),
        @Salt VARCHAR(50),
        @TenKhoa NVARCHAR(50);

    -- 🔹 Lấy Salt của user
    SELECT @Salt = Salt
    FROM USERS
    WHERE Username = @username;

    -- ❌ Nếu không có user
    IF @Salt IS NULL
    BEGIN
        RAISERROR(N'Tài khoản không tồn tại', 16, 1);
        RETURN;
    END

    -- 🔹 Hash lại mật khẩu nhập vào (phải giống công thức khi tạo user)
    DECLARE @ComputedHash VARCHAR(64);
    SET @ComputedHash = CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', @password + @Salt), 2);

    -- 🔹 Kiểm tra user + password
    SELECT 
        @Role = U.Role,
        @MaKhoa = U.MaKhoa,
        @Code = 
            CASE 
                WHEN U.Role = 'SinhVien' THEN U.MaSV
                WHEN U.Role = 'GiaoVien' THEN U.MaGV
                WHEN U.Role = 'Admin' THEN NULL
            END,
        @TenKhoa = K.TenKhoa
    FROM USERS U
        LEFT JOIN KHOA_MAP K ON K.MaKhoa = U.MaKhoa
    WHERE U.Username = @username 
      AND U.PasswordHash = @ComputedHash;

    -- ❌ Sai mật khẩu
    IF @Role IS NULL
    BEGIN
        RAISERROR(N'Mật khẩu hoặc tài khoản không đúng', 16, 1);
        RETURN;
    END

    -- 🔹 Lấy tên người dùng theo vai trò
    SELECT 
        @TenNguoiDung = 
            CASE 
                WHEN @Role = 'SinhVien' THEN (SELECT TenSV FROM SINHVIEN WHERE MaSV = @Code)
                WHEN @Role = 'GiaoVien' THEN (SELECT TenGV FROM GIAOVIEN WHERE MaGV = @Code)
                WHEN @Role = 'Admin' THEN N'Quản trị viên hệ thống'
                ELSE N'Người dùng không xác định'
            END;

    -- ✅ Trả kết quả cuối
    SELECT 
        @username AS Username,
        @Role AS Role,
        @Code AS Code,
        @TenNguoiDung AS TenNguoiDung,
        @MaKhoa AS MaKhoa,
        @TenKhoa AS TenKhoa;
END;
GO


INSERT INTO USERS (Username, PasswordHash, Role, MaKhoa, MaSV, Salt)
SELECT 
    SV.MaSV AS Username,
    CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', CAST(SV.MaSV AS VARCHAR(100)) + CAST(S.Salt AS VARCHAR(100))), 2) AS PasswordHash,
    'SinhVien' AS Role,
    SV.MaKhoa,
    SV.MaSV,
    S.Salt
FROM SINHVIEN SV
CROSS APPLY (SELECT CONVERT(VARCHAR(36), NEWID()) AS Salt) S
WHERE NOT EXISTS (
    SELECT 1 FROM USERS U WHERE U.Username = SV.MaSV
);
GO

INSERT INTO USERS (Username, PasswordHash, Role, MaKhoa, MaGV, Salt)
SELECT 
    SV.MaGV AS Username,
    CONVERT(VARCHAR(64), HASHBYTES('SHA2_256', CAST(SV.MaGV AS VARCHAR(100)) + CAST(S.Salt AS VARCHAR(100))), 2) AS PasswordHash,
    'GiaoVien' AS Role,
    SV.MaKhoa,
    SV.MaGV,
    S.Salt
FROM GIAOVIEN SV
CROSS APPLY (SELECT CONVERT(VARCHAR(36), NEWID()) AS Salt) S
WHERE NOT EXISTS (
    SELECT 1 FROM USERS U WHERE U.Username = SV.MaGV
);
GO


CREATE TABLE Report_QueryPerformance (
    ReportID INT IDENTITY PRIMARY KEY,
    QueryType NVARCHAR(50),          -- 'Local' hoặc 'Global'
    SystemType NVARCHAR(50),         -- 'Centralized' hoặc 'Distributed'
    QueryName NVARCHAR(100),         -- Ví dụ: 'ListProjects', 'JoinTeacherStudent'
    ExecutionTimeMs DECIMAL(10, 2),  -- Thời gian chạy (ms)
    RunDate DATETIME DEFAULT GETDATE()
);

