-- =============================================
-- LẤY DANH SACH KHOA
-- =============================================
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
-- =============================================
-- LẤY DANH SACH Năm học
-- =============================================
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
-- =============================================
-- LẤY DANH SACH thống kê điểm theo khoa
-- =============================================
CREATE OR ALTER PROC usp_reportFaculty
    @limit INT = 10,
    @skip INT = 0,
    @year VARCHAR(20) = null 
AS
BEGIN
    SET NOCOUNT ON;
    CREATE TABLE #TempReport (
        MaKhoa INT,
        DiemMin FLOAT,
        DiemMax FLOAT,
        DiemTB FLOAT,
        SoDeTai INT,
        SoSV INT,
        TiLeDau DECIMAL(5,2),
        TiLeRot DECIMAL(5,2)
    );

    INSERT INTO #TempReport
    EXEC [DBTN_CNTT].dbo.usp_reportFaculty
        @year = @year;
    INSERT INTO #TempReport
    EXEC [DBTN_CK].dbo.usp_reportFaculty
        @year = @year;
    SELECT t.*,K.TenKhoa
    FROM #TempReport t JOIN KHOA_MAP K 
    ON T.MaKhoa = K.MaKhoa
    SELECT COUNT(*) AS TotalCount FROM #TempReport;
    DROP TABLE #TempReport;
END;
GO
-- =============================================
-- LẤY danh sách thống kê theo giáo viên
-- =============================================
CREATE OR ALTER PROC usp_reportTeacher
    @limit INT = 10,
    @skip INT = 0,
    @deCode INT = null,        -- Mã khoa bắt buộc
    @year VARCHAR(20) = null   -- Năm học bắt buộc
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @LinkedServer NVARCHAR(50);
    -- Xác định linked server theo mã khoa
    SET @LinkedServer = CASE 
        WHEN @deCode = 1 THEN 'DBTN_CNTT'
        WHEN @deCode = 2 THEN 'DBTN_CK'
        ELSE NULL
    END;
    IF @LinkedServer IS NULL
    BEGIN
        print(@LinkedServer)
        RAISERROR(N'Mã khoa không hợp lệ.', 16, 1);
        RETURN;
    END;
    -- Gọi procedure tương ứng trong DB con qua linked server
    DECLARE @sql NVARCHAR(MAX) = N'
        EXEC [' + @LinkedServer + '].dbo.usp_reportTeacher 
        @limit = @limit,
        @skip = @skip,
        @year = @year;
    ';

    EXEC sp_executesql @sql, N'@limit INT,
    @skip INT,@year VARCHAR(20) ', 
    @limit,@skip,@year;
   
END;
GO
-- =============================================
-- Đăng nhập
-- =============================================
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