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
-- Hàm sinh khoa tự động
-- ===============================
CREATE OR ALTER PROC usp_GetCode
    @KhoaCode INT,
    @Loai CHAR(2),      -- SV / GV / DT
    @NewCode VARCHAR(20) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Nam CHAR(2) = RIGHT(CAST(YEAR(GETDATE()) AS CHAR(4)),2);
    DECLARE @NewSTT INT;

    -- Nếu chưa có counter thì thêm mới
    IF NOT EXISTS (
        SELECT 1 FROM Dem 
        WHERE Nam=@Nam AND KhoaCode=@KhoaCode AND Loai=@Loai
    )
    BEGIN
        INSERT INTO Dem(Nam, KhoaCode, Loai, STT) 
        VALUES(@Nam,@KhoaCode,@Loai,0);
    END

    -- Tăng STT
    UPDATE Dem
    SET STT = STT + 1
    WHERE Nam=@Nam AND KhoaCode=@KhoaCode AND Loai=@Loai;

    SELECT @NewSTT = STT 
    FROM Dem 
    WHERE Nam=@Nam AND KhoaCode=@KhoaCode AND Loai=@Loai;

    -- Sinh mã
    SET @NewCode = CONCAT(
        @Loai, 
        @Nam, 
        @KhoaCode, 
        RIGHT('000' + CAST(@NewSTT AS VARCHAR(3)),3)
    );
END
GO
-- =============================================
-- SINH VIÊN
-- =============================================
-- =============================================
-- VIEW DANH SACH SINH VIEN
-- =============================================
CREATE OR ALTER PROC usp_listStudent
    @search NVARCHAR(250) = NULL,    -- từ khóa tìm kiếm
    @limit INT = 10,                 -- số bản ghi cần lấy
    @skip INT = 0,                   -- số bản ghi bỏ qua
    @DeCode INT = NULL,              -- lọc theo khoa
    @SortBy NVARCHAR(50) = 'TenSV',  -- cột sort (TenSV | DiemTB)
    @SortOrder NVARCHAR(4) = 'ASC'   -- ASC | DESC
AS
BEGIN
    SET NOCOUNT ON;

    -- Validate sort
    IF @SortBy NOT IN ('TenSV','UpdatedAt')
        SET @SortBy = 'TenSV';

    IF UPPER(@SortOrder) NOT IN ('ASC','DESC')
        SET @SortOrder = 'ASC';

    DECLARE @sql NVARCHAR(MAX);

    -- 1️⃣ Query đếm tổng số
    DECLARE @sqlCount NVARCHAR(MAX) = N'
        SELECT COUNT(DISTINCT SV.MaSV) AS TotalRecords
        FROM SINHVIEN AS SV
        INNER JOIN KHOA AS K ON SV.MaKhoa = K.MaKhoa
        WHERE ( @DeCode IS NULL OR K.MaKhoa = @DeCode )
          AND ( @search IS NULL 
                OR TenSV LIKE N''%'' + @search + N''%'' 
                OR SV.MaSV LIKE N''%'' + @search + N''%'' )
    ';

    CREATE TABLE #CountResult (TotalRecords INT);

    INSERT INTO #CountResult
    EXEC sp_executesql @sqlCount,
        N'@DeCode INT ,@search NVARCHAR(250)',
        @DeCode,@search;

    -- 2️⃣ Query dữ liệu phân trang
    SET @sql = N'
        SELECT  
            SV.MaSV, 
            SV.TenSV, 
            K.MaKhoa,
            DiaChi,
            SoDienThoai,
            COUNT(KB.MaSV) AS SoLanBaoVe,
            K.TenKhoa
        FROM SINHVIEN AS SV
        INNER JOIN KHOA AS K ON SV.MaKhoa = K.MaKhoa
        LEFT JOIN KETQUA_BAOVE AS KB ON SV.MaSV = KB.MaSV
        WHERE ( @DeCode IS NULL OR K.MaKhoa = @DeCode )
          AND ( @search IS NULL 
                OR TenSV LIKE N''%'' + @search + N''%'' 
                OR SV.MaSV LIKE N''%'' + @search + N''%'' )
        GROUP BY SV.MaSV, SV.TenSV, K.MaKhoa, K.TenKhoa,DiaChi,
            SoDienThoai
        ORDER BY ' + QUOTENAME(@SortBy) + ' ' + @SortOrder + '
        OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY;
    ';

    EXEC sp_executesql @sql,
        N'@DeCode INT, @search NVARCHAR(250), @skip INT, @limit INT',
        @DeCode, @search, @skip, @limit;

    -- 3️⃣ Trả thêm thông tin phân trang
    DECLARE @TotalRecords INT = (SELECT TOP 1 TotalRecords FROM #CountResult);
    DECLARE @TotalPages INT = CEILING(1.0 * @TotalRecords / NULLIF(@limit,0));
    DECLARE @CurrentPage INT = (@skip / @limit) + 1;

    SELECT 
        @TotalRecords AS TotalRecords,
        @TotalPages AS TotalPages,
        @CurrentPage AS CurrentPage;

    DROP TABLE #CountResult;
END
GO
CREATE OR ALTER PROC usp_getStudent
    @MaSV NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    -- Nếu không tồn tại SV thì báo lỗi
    IF NOT EXISTS (SELECT 1 FROM SINHVIEN WHERE MaSV = @MaSV)
    BEGIN
        RAISERROR(N'Sinh viên với mã %s không tồn tại!', 16, 1, @MaSV);
        RETURN;
    END

    -- Nếu tồn tại thì trả về thông tin
    SELECT 
        SV.MaSV,
        SV.TenSV,
        SV.DiaChi,
        K.TenKhoa
    FROM SINHVIEN AS SV
    INNER JOIN KHOA AS K ON SV.MaKhoa = K.MaKhoa
    WHERE SV.MaSV = @MaSV;
END
GO

-- =============================================
-- GIAO VIEN
-- =============================================
-- =============================================
-- VIEW DANH SACH VIAO VIEN
-- =============================================
CREATE OR ALTER PROC usp_listTeacher
    @search NVARCHAR(250) = NULL,    -- từ khóa tìm kiếm
    @limit INT = 10,                 -- số bản ghi mỗi trang
    @skip INT = 0,                   -- số bản ghi bỏ qua
    @DeCode INT = NULL,              -- lọc theo mã khoa
    @SortBy NVARCHAR(50) = 'TenGV',  -- cột sort
    @SortOrder NVARCHAR(4) = 'ASC'   -- ASC | DESC
AS
BEGIN
    SET NOCOUNT ON;

    -- Validate sort input
    IF @SortBy NOT IN ('TenGV','MaGV','HocVi','ChuyenNganh','UpdatedAt')
        SET @SortBy = 'TenGV';

    IF UPPER(@SortOrder) NOT IN ('ASC','DESC')
        SET @SortOrder = 'ASC';

    -- =======================
    -- 1️⃣ Tính tổng số bản ghi
    -- =======================
    DECLARE @TotalRecords INT;

    SELECT @TotalRecords = COUNT(*)
    FROM GIAOVIEN AS GV
    INNER JOIN KHOA AS KH ON GV.MaKhoa = KH.MaKhoa
    WHERE (@DeCode IS NULL OR GV.MaKhoa = @DeCode)
      AND (@search IS NULL 
           OR GV.TenGV LIKE N'%' + @search + N'%' 
           OR GV.MaGV LIKE N'%' + @search + N'%');

    DECLARE @TotalPages INT = CEILING(@TotalRecords * 1.0 / NULLIF(@limit,0));

    -- =======================
    -- 2️⃣ Trả dữ liệu phân trang
    -- =======================
    DECLARE @sql NVARCHAR(MAX) = N'
        SELECT 
            GV.MaGV,
            GV.TenGV,
            GV.DiaChi,
            GV.SoDienThoai,
            GV.HocVi,
            GV.ChuyenNganh,
            GV.MaKhoa,
            KH.TenKhoa
        FROM GIAOVIEN AS GV
        INNER JOIN KHOA AS KH ON GV.MaKhoa = KH.MaKhoa
        WHERE (@DeCode IS NULL OR GV.MaKhoa = @DeCode)
          AND (@search IS NULL 
               OR GV.TenGV LIKE N''%'' + @search + N''%'' 
               OR GV.MaGV LIKE N''%'' + @search + N''%'')
        ORDER BY ' + QUOTENAME(@SortBy) + ' ' + @SortOrder + '
        OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY;
    ';

    EXEC sp_executesql @sql,
        N'@DeCode INT, @search NVARCHAR(250), @skip INT, @limit INT',
        @DeCode, @search, @skip, @limit;

    -- =======================
    -- 3️⃣ Trả bảng metadata
    -- =======================
    SELECT 
        @TotalRecords AS TotalRecords,
        @TotalPages   AS TotalPages,
        @limit        AS PageSize,
        ( @skip / NULLIF(@limit,0) + 1 ) AS CurrentPage;
END
GO
-- =============================================
-- HOI DONG
-- =============================================
-- =============================================
-- VIEW HOI DONG
-- =============================================
CREATE OR ALTER PROC usp_listHoiDong
    @search NVARCHAR(250) = NULL,        -- từ khóa tìm kiếm (MaHD, DiaChiBaoVe, tên GV)
    @limit INT = 10,                     -- số bản ghi cần lấy
    @skip INT = 0,                       -- số bản ghi bỏ qua
    @MaKhoa INT = NULL,                  -- lọc theo khoa
    @MaNamHoc NVARCHAR(20) = NULL,       -- lọc theo năm học
    @SortBy NVARCHAR(50) = 'NgayBaoVe',  -- cột sort (MaHD | NgayBaoVe | UpdatedAt)
    @SortOrder NVARCHAR(4) = 'ASC'       -- ASC | DESC
AS
BEGIN
    SET NOCOUNT ON;

    -- Validate sort
    IF @SortBy NOT IN ('MaHD','NgayBaoVe','UpdatedAt')
        SET @SortBy = 'NgayBaoVe';

    IF UPPER(@SortOrder) NOT IN ('ASC','DESC')
        SET @SortOrder = 'ASC';

    DECLARE @sql NVARCHAR(MAX);

    -- 1️⃣ Query đếm tổng số
    DECLARE @sqlCount NVARCHAR(MAX) = N'
        SELECT COUNT(*) AS TotalRecords
        FROM HOIDONG AS HD
        INNER JOIN KHOA AS K ON HD.MaKhoa = K.MaKhoa
        INNER JOIN NAMHOC AS NH ON HD.MaNamHoc = NH.MaNamHoc
        INNER JOIN GIAOVIEN AS GVCT ON HD.MaGVChuTich = GVCT.MaGV
        INNER JOIN GIAOVIEN AS GVTK ON HD.MaGVThuKy = GVTK.MaGV
        INNER JOIN GIAOVIEN AS GVPB ON HD.MaGVPhanBien = GVPB.MaGV
        WHERE (@MaKhoa IS NULL OR HD.MaKhoa = @MaKhoa)
          AND (@MaNamHoc IS NULL OR HD.MaNamHoc = @MaNamHoc)
          AND (@search IS NULL 
               OR HD.MaHD LIKE N''%'' + @search + N''%''
               OR HD.DiaChiBaoVe LIKE N''%'' + @search + N''%''
               OR GVCT.TenGV LIKE N''%'' + @search + N''%''
               OR GVTK.TenGV LIKE N''%'' + @search + N''%''
               OR GVPB.TenGV LIKE N''%'' + @search + N''%'')
    ';

    CREATE TABLE #CountResult (TotalRecords INT);

    INSERT INTO #CountResult
    EXEC sp_executesql @sqlCount,
        N'@MaKhoa INT, @MaNamHoc NVARCHAR(20), @search NVARCHAR(250)',
        @MaKhoa, @MaNamHoc, @search;

    -- 2️⃣ Query dữ liệu phân trang
    SET @sql = N'
        SELECT 
            HD.MaHD,
            HD.MaNamHoc,
            HD.MaKhoa,
            K.TenKhoa,
            HD.NgayBaoVe,
            HD.DiaChiBaoVe,
            HD.MaGVChuTich,
            GVCT.TenGV AS TenGVChuTich,
            HD.MaGVThuKy,
            GVTK.TenGV AS TenGVThuKy,
            HD.MaGVPhanBien,
            GVPB.TenGV AS TenGVPhanBien,
            COUNT(HĐDT.MaDT) AS SoDT,
            HD.CreatedAt,
            HD.UpdatedAt
        FROM HOIDONG AS HD
        LEFT JOIN HOIDONG_DETAI AS HĐDT ON HĐDT.MaHD = HD.MaHD
        INNER JOIN KHOA AS K ON HD.MaKhoa = K.MaKhoa
        INNER JOIN GIAOVIEN AS GVCT ON HD.MaGVChuTich = GVCT.MaGV
        INNER JOIN GIAOVIEN AS GVTK ON HD.MaGVThuKy = GVTK.MaGV
        INNER JOIN GIAOVIEN AS GVPB ON HD.MaGVPhanBien = GVPB.MaGV
        WHERE (@MaKhoa IS NULL OR HD.MaKhoa = @MaKhoa)
          AND (@MaNamHoc IS NULL OR HD.MaNamHoc = @MaNamHoc)
          AND (@search IS NULL 
               OR HD.MaHD LIKE N''%'' + @search + N''%''
               OR HD.DiaChiBaoVe LIKE N''%'' + @search + N''%''
               OR GVCT.TenGV LIKE N''%'' + @search + N''%''
               OR GVTK.TenGV LIKE N''%'' + @search + N''%''
               OR GVPB.TenGV LIKE N''%'' + @search + N''%'')
        GROUP BY HD.MaHD,
            HD.MaNamHoc,
            HD.MaKhoa,
            K.TenKhoa,
            HD.NgayBaoVe,
            HD.DiaChiBaoVe,
            HD.MaGVChuTich,
            GVCT.TenGV ,
            HD.MaGVThuKy,
            GVTK.TenGV,
            HD.MaGVPhanBien,
            GVPB.TenGV ,
            HD.CreatedAt,
            HD.UpdatedAt
        ORDER BY ' + QUOTENAME(@SortBy) + ' ' + @SortOrder + '
        OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY;
    ';

    EXEC sp_executesql @sql,
        N'@MaKhoa INT, @MaNamHoc NVARCHAR(20), @search NVARCHAR(250), @skip INT, @limit INT',
        @MaKhoa, @MaNamHoc, @search, @skip, @limit;

    -- 3️⃣ Trả thêm thông tin phân trang
    DECLARE @TotalRecords INT = (SELECT TOP 1 TotalRecords FROM #CountResult);
    DECLARE @TotalPages INT = CEILING(1.0 * @TotalRecords / NULLIF(@limit,0));
    DECLARE @CurrentPage INT = (@skip / @limit) + 1;

    SELECT 
        @TotalRecords AS TotalRecords,
        @TotalPages AS TotalPages,
        @CurrentPage AS CurrentPage;

    DROP TABLE #CountResult;
END
GO


-- =============================================
-- CREATE HOI DONG
-- =============================================

CREATE OR ALTER PROC usp_createHoiDong
    @MaNamHoc VARCHAR(20),
    @MaKhoa INT,
    @NgayBaoVe DATE,
    @DiaChiBaoVe NVARCHAR(250) = NULL,
    @MaGVChuTich VARCHAR(20),
    @MaGVThuKy VARCHAR(20),
    @MaGVPhanBien VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Kiểm tra tồn tại
        IF NOT EXISTS(SELECT 1 FROM KHOA WHERE MaKhoa = @MaKhoa)
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR(N'Không tồn tại khoa %d', 16, 1, @MaKhoa);
            RETURN;
        END

        IF NOT EXISTS(SELECT 1 FROM NAMHOC WHERE MaNamHoc = @MaNamHoc)
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR(N'Không tồn tại năm học %s', 16, 1, @MaNamHoc);
            RETURN;
        END

        IF NOT EXISTS(SELECT 1 FROM GIAOVIEN WHERE MaGV = @MaGVChuTich)
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR(N'Không tồn tại GV Chủ tịch: %s', 16, 1, @MaGVChuTich);
            RETURN;
        END

        IF NOT EXISTS(SELECT 1 FROM GIAOVIEN WHERE MaGV = @MaGVThuKy)
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR(N'Không tồn tại GV Thư ký: %s', 16, 1, @MaGVThuKy);
            RETURN;
        END

        IF NOT EXISTS(SELECT 1 FROM GIAOVIEN WHERE MaGV = @MaGVPhanBien)
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR(N'Không tồn tại GV Phản biện: %s', 16, 1, @MaGVPhanBien);
            RETURN;
        END

        -- Sinh mã hội đồng
        DECLARE @MaHD VARCHAR(20);
        EXEC usp_GetCode
            @KhoaCode = @MaKhoa,
            @Loai = 'HD',
            @NewCode = @MaHD OUTPUT;

        -- Insert dữ liệu
        INSERT INTO HOIDONG (
            MaHD, MaNamHoc, MaKhoa, NgayBaoVe, DiaChiBaoVe, MaGVChuTich, MaGVThuKy, MaGVPhanBien
        )
        VALUES (
            @MaHD, @MaNamHoc, @MaKhoa, @NgayBaoVe, @DiaChiBaoVe, @MaGVChuTich, @MaGVThuKy, @MaGVPhanBien
        );

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
    END CATCH
END
GO

-- =============================================
-- UPDATE HOI DONG
-- =============================================
CREATE OR ALTER PROC usp_updateHoiDong
    @MaHD VARCHAR(20),
    @NgayBaoVe DATE = NULL,
    @DiaChiBaoVe NVARCHAR(250) = NULL,
    @MaGVChuTich VARCHAR(20) = NULL,
    @MaGVThuKy VARCHAR(20) = NULL,
    @MaGVPhanBien VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        -- Kiểm tra MaHD tồn tại
        IF NOT EXISTS (SELECT 1 FROM HOIDONG WHERE MaHD = @MaHD)
        BEGIN
            RAISERROR(N'Mã hội đồng "%s" không tồn tại.', 16, 1, @MaHD);
            RETURN;
        END

        -- Kiểm tra giáo viên
        IF @MaGVChuTich IS NOT NULL AND NOT EXISTS(SELECT 1 FROM GIAOVIEN WHERE MaGV = @MaGVChuTich)
        BEGIN
            RAISERROR(N'Giáo viên Chủ tịch "%s" không tồn tại.', 16, 1, @MaGVChuTich);
            RETURN;
        END

        IF @MaGVThuKy IS NOT NULL AND NOT EXISTS(SELECT 1 FROM GIAOVIEN WHERE MaGV = @MaGVThuKy)
        BEGIN
            RAISERROR(N'Giáo viên Thư ký "%s" không tồn tại.', 16, 1, @MaGVThuKy);
            RETURN;
        END

        IF @MaGVPhanBien IS NOT NULL AND NOT EXISTS(SELECT 1 FROM GIAOVIEN WHERE MaGV = @MaGVPhanBien)
        BEGIN
            RAISERROR(N'Giáo viên Phản biện "%s" không tồn tại.', 16, 1, @MaGVPhanBien);
            RETURN;
        END

        -- Update dữ liệu
        UPDATE HOIDONG
        SET
            NgayBaoVe = ISNULL(@NgayBaoVe, NgayBaoVe),
            DiaChiBaoVe = ISNULL(@DiaChiBaoVe, DiaChiBaoVe),
            MaGVChuTich = ISNULL(@MaGVChuTich, MaGVChuTich),
            MaGVThuKy = ISNULL(@MaGVThuKy, MaGVThuKy),
            MaGVPhanBien = ISNULL(@MaGVPhanBien, MaGVPhanBien)
        WHERE MaHD = @MaHD;
        COMMIT TRANSACTION;
        PRINT N'Cập nhật hội đồng thành công.';

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
    END CATCH
END
GO

-- =============================================
-- DELETE HOI DONG
-- =============================================
CREATE OR ALTER PROC usp_deleteHoiDong
    @MaHD VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Kiểm tra MaHD tồn tại
        IF NOT EXISTS (SELECT 1 FROM HOIDONG WHERE MaHD = @MaHD)
        BEGIN
            RAISERROR(N'Mã hội đồng "%s" không tồn tại.', 16, 1, @MaHD);
            RETURN;
        END
        -- Kiểm tra hội đồng có data chưa
        IF EXISTS (SELECT 1 FROM HOIDONG_DETAI WHERE MaHD = @MaHD)
        BEGIN
            RAISERROR(N'Hội động "%s" chứa nhiều dữ liệu quan trọng không thể xóa',16,1,@MaHD)
            RETURN
        END
        -- Delete dữ liệu
        DELETE FROM HOIDONG WHERE MaHD = @MaHD;
        COMMIT TRANSACTION;
        PRINT N'Xóa hội đồng thành công.';

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;

        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
    END CATCH
END
GO

CREATE OR ALTER PROC usp_getHoiDong
   @MaHD VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM HOIDONG WHERE MaHD = @MaHD)
    BEGIN
        RAISERROR(N'❌ Hội đồng "%s" không tồn tại.', 16, 1, @MaHD);
        RETURN;
    END

    -- Nếu có thì trả về dữ liệu
     SELECT 
            HD.MaHD,
            HD.MaNamHoc,
            K.TenKhoa,
            HD.NgayBaoVe,
            HD.DiaChiBaoVe,
            GVCT.TenGV AS TenGVChuTich,
            GVTK.TenGV AS TenGVThuKy,
            HD.MaGVPhanBien,
            GVPB.TenGV AS TenGVPhanBien,
            HD.CreatedAt,
            HD.UpdatedAt
        FROM HOIDONG AS HD
        INNER JOIN KHOA AS K ON HD.MaKhoa = K.MaKhoa
        INNER JOIN GIAOVIEN AS GVCT ON HD.MaGVChuTich = GVCT.MaGV
        INNER JOIN GIAOVIEN AS GVTK ON HD.MaGVThuKy = GVTK.MaGV
        INNER JOIN GIAOVIEN AS GVPB ON HD.MaGVPhanBien = GVPB.MaGV
        WHERE MaHD = @MaHD
END
GO
-- =============================================
-- DO AN
-- =============================================
-- =============================================
-- VIEW DO AN
-- =============================================
CREATE OR ALTER PROC usp_listDoan
    @search NVARCHAR(250) = NULL,
    @limit INT = 10,
    @skip INT = 0,
    @MaNamHoc VARCHAR(20) = NULL,
    @MaKhoa INT = NULL,
    @MaGVHuongDan VARCHAR(20) = NULL,
    @SortBy NVARCHAR(50) = 'ThoiGianBatDau',
    @SortOrder NVARCHAR(4) = 'ASC'
AS
BEGIN
    SET NOCOUNT ON;

    -- Validate sort
    IF @SortBy NOT IN ('ThoiGianBatDau','ThoiGianKetThuc','TenDT','UpdatedAt')
        SET @SortBy = 'TenDT';

    IF UPPER(@SortOrder) NOT IN ('ASC','DESC')
        SET @SortOrder = 'ASC';

    DECLARE @sql NVARCHAR(MAX);

    -- 1. Tổng bản ghi
    DECLARE @sqlCount NVARCHAR(MAX) = N'
        SELECT COUNT(*) AS TotalRecords
        FROM DETAI AS D
        INNER JOIN GIAOVIEN AS GV ON D.MaGVHuongDan = GV.MaGV
        INNER JOIN KHOA AS K ON D.MaKhoa = K.MaKhoa
        WHERE
          (@MaKhoa IS NULL OR K.MaKhoa = @MaKhoa)
          AND (@MaNamHoc IS NULL OR D.MaNamHoc = @MaNamHoc)
          AND (@MaGVHuongDan IS NULL OR D.MaGVHuongDan = @MaGVHuongDan)
          AND (@search IS NULL 
               OR D.MaDT LIKE @search + N''%''
               OR D.TenDT LIKE N''%'' + @search + N''%''
               OR GV.TenGV LIKE N''%'' + @search + N''%'')
    ';

    CREATE TABLE #CountResult (TotalRecords INT);
    INSERT INTO #CountResult
    EXEC sp_executesql @sqlCount,
        N'@MaNamHoc VARCHAR(20), @MaGVHuongDan VARCHAR(20), @search NVARCHAR(250), @MaKhoa INT',
        @MaNamHoc, @MaGVHuongDan, @search, @MaKhoa;

    -- 2. Dữ liệu phân trang
    SET @sql = N'
    SELECT 
        D.MaDT,
        D.TenDT,
        D.MaNamHoc,
        D.MaGVHuongDan, 
        GV.TenGV AS TenGVHuongDan,
        D.ThoiGianBatDau,
        D.ThoiGianKetThuc,
        K.MaKhoa,
        K.TenKhoa,
        COUNT(DV.MaSV) AS SoSV
    FROM DETAI AS D
    INNER JOIN GIAOVIEN AS GV ON D.MaGVHuongDan = GV.MaGV
    INNER JOIN KHOA AS K ON D.MaKhoa = K.MaKhoa
    LEFT JOIN DETAI_SINHVIEN AS DV ON DV.MaDT = D.MaDT
    WHERE 
      (@MaKhoa IS NULL OR K.MaKhoa = @MaKhoa)
      AND (@MaNamHoc IS NULL OR D.MaNamHoc = @MaNamHoc)
      AND (@MaGVHuongDan IS NULL OR D.MaGVHuongDan = @MaGVHuongDan)
      AND (@search IS NULL 
           OR D.MaDT LIKE @search + N''%''
           OR D.TenDT LIKE N''%'' + @search + N''%'' 
           OR GV.TenGV LIKE N''%'' + @search + N''%'')
    GROUP BY  
        D.MaDT,
        D.TenDT,
        D.MaNamHoc,
        D.MaGVHuongDan, 
        GV.TenGV,
        D.ThoiGianBatDau,
        D.ThoiGianKetThuc,
        K.MaKhoa,
        K.TenKhoa
    ORDER BY ' + QUOTENAME(@SortBy) + ' ' + @SortOrder + '
    OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY
';


    EXEC sp_executesql @sql,
        N'@MaNamHoc VARCHAR(20), @MaGVHuongDan VARCHAR(20), @search NVARCHAR(250), @skip INT, @limit INT, @MaKhoa INT',
        @MaNamHoc, @MaGVHuongDan, @search, @skip, @limit, @MaKhoa;

    -- 3. Trả thêm thông tin phân trang
    DECLARE @TotalRecords INT = (SELECT TOP 1 TotalRecords FROM #CountResult);
    DECLARE @TotalPages INT = CEILING(1.0 * @TotalRecords / NULLIF(@limit,0));
    DECLARE @CurrentPage INT = (@skip / @limit) + 1;

    SELECT 
        @TotalRecords AS TotalRecords,
        @TotalPages AS TotalPages,
        @CurrentPage AS CurrentPage;

    DROP TABLE #CountResult;
END
GO

CREATE OR ALTER PROC usp_listDoanInHoiDong
    @MaHD VARCHAR(20)
AS
BEGIN
    SELECT DT.MaDT,DT.TenDT,DT.MaGVHuongDan,GV.TenGV AS TenGVHuongDan,K.TenKhoa,DT.ThoiGianBatDau,DT.ThoiGianKetThuc
    FROM HOIDONG_DETAI AS HD
            INNER JOIN DETAI AS DT
                ON HD.MaDT = DT.MaDT
            INNER JOIN KHOA AS K    
                ON K.MaKhoa = DT.MaKhoa
            INNER JOIN GIAOVIEN AS GV
                ON GV.MaGV = DT.MaGVHuongDan
    WHERE MaHD = @MaHD
END
GO
-- =============================================
-- CREATE DO AN
-- =============================================
CREATE OR ALTER PROC usp_createDoan
    @TenDT NVARCHAR(150),
    @MaKhoa VARCHAR(20),
    @MaNamHoc VARCHAR(20),
    @MaGVHuongDan VARCHAR(20),
    @ThoiGianBatDau DATE,
    @ThoiGianKetThuc DATE
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS(SELECT 1 FROM KHOA WHERE MaKhoa = @MaKhoa)
        BEGIN
            RAISERROR(N'Khoa "%s" không tồn tại.', 16, 1, @MaKhoa);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        IF NOT EXISTS(SELECT 1 FROM NAMHOC WHERE MaNamHoc = @MaNamHoc)
        BEGIN
            RAISERROR(N'Năm học "%s" không tồn tại.', 16, 1, @MaNamHoc);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        IF NOT EXISTS(SELECT 1 FROM GIAOVIEN WHERE MaGV = @MaGVHuongDan)
        BEGIN
            RAISERROR(N'Giáo viên hướng dẫn "%s" không tồn tại.', 16, 1, @MaGVHuongDan);
            ROLLBACK TRANSACTION;
            RETURN;
        END
        Declare @MaDT VARCHAR(20)
        EXEC usp_GetCode
            @KhoaCode = @MaKhoa,
            @Loai = 'DT',
            @NewCode = @MaDT OUTPUT;

        -- 3. Insert dữ liệu
        INSERT INTO DETAI(MaDT,TenDT,MaKhoa, MaNamHoc, MaGVHuongDan, ThoiGianBatDau, ThoiGianKetThuc)
        VALUES (@MaDT,@TenDT,@MaKhoa, @MaNamHoc, @MaGVHuongDan, @ThoiGianBatDau, @ThoiGianKetThuc);

        COMMIT TRANSACTION;

        PRINT N'Tạo đồ án thành công.';

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
    END CATCH
END
GO
-- =============================================
-- UPDATE DO AN
-- =============================================
CREATE OR ALTER PROC usp_updateDoan
    @MaDT VARCHAR(20),
    @TenDT NVARCHAR(150),
    @MaGVHuongDan VARCHAR(20) = NULL,
    @ThoiGianBatDau DATE = NULL,
    @ThoiGianKetThuc DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Kiểm tra khóa ngoại nếu có update
        IF @MaDT IS NOT NULL AND NOT EXISTS(SELECT 1 FROM DETAI WHERE MaDT = @MaDT)
        BEGIN
            RAISERROR(N'Đề tài "%s" không tồn tại.', 16, 1, @MaDT);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        IF @MaGVHuongDan IS NOT NULL AND NOT EXISTS(SELECT 1 FROM GIAOVIEN WHERE MaGV = @MaGVHuongDan)
        BEGIN
            RAISERROR(N'Giáo viên hướng dẫn "%s" không tồn tại.', 16, 1, @MaGVHuongDan);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Update dữ liệu
        UPDATE DETAI
        SET
            TenDT = ISNULL(@TenDT, TenDT),
            MaGVHuongDan = ISNULL(@MaGVHuongDan, MaGVHuongDan),
            ThoiGianBatDau = ISNULL(@ThoiGianBatDau, ThoiGianBatDau),
            ThoiGianKetThuc = ISNULL(@ThoiGianKetThuc, ThoiGianKetThuc),
            UpdatedAt = GETDATE()
        WHERE MaDT = @MaDT;

        COMMIT TRANSACTION;

        PRINT N'Cập nhật đồ án thành công.';

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
    END CATCH
END
GO
-- =============================================
-- GET DO AN
-- =============================================
CREATE OR ALTER PROC usp_getDoan
    @MaDT VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        DA.MaDT,
        DA.MaNamHoc,
        DA.ThoiGianBatDau,
        DA.ThoiGianKetThuc,
        DA.MaGVHuongDan,
        GV.TenGV AS TenGVHuongDan,
        DA.TenDT,
        K.TenKhoa
    FROM DETAI AS DA
        INNER JOIN GIAOVIEN AS GV
            ON GV.MaGV = DA.MaGVHuongDan
        INNER JOIN KHOA AS K
            ON DA.MaKhoa = K.MaKhoa
    WHERE DA.MaDT = @MaDT;
END
GO

-- =============================================
-- DELETE DO AN
-- =============================================
CREATE OR ALTER PROC usp_deleteDoan
    @MaDoAn VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Kiểm tra tồn tại
        IF NOT EXISTS(SELECT 1 FROM DETAI WHERE MaDT = @MaDoAn)
        BEGIN
            RAISERROR(N'Đồ án "%s" không tồn tại.', 16, 1, @MaDoAn);
            RETURN;
        END
        -- Kiểm tra thử có nên xóa không
        IF EXISTS(
        SELECT 1 FROM DETAI_SINHVIEN WHERE MaDT=@MaDoAn)
        BEGIN
            RAISERROR(N'Đồ án "%s" chứa dữ liệu quan trọng.', 16, 1, @MaDoAn);
            RETURN;
        END

        -- Xóa dữ liệu
        DELETE FROM DETAI WHERE MaDT = @MaDoAn;

        COMMIT TRANSACTION;

        PRINT N'Xóa đồ án thành công.';

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
    END CATCH
END
GO

-- =============================================
-- THEM DO AN VAO HOI DONG
-- =============================================
CREATE OR ALTER PROC usp_AddDoAnHoiDong
    @MaDoAn VARCHAR(20),           -- Bắt buộc truyền MaDoAn để update
    @MaHoiDong VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1️⃣ Kiểm tra hội đồng có tồn tại
        IF NOT EXISTS(SELECT 1 FROM HOIDONG WHERE MaHD = @MaHoiDong)
        BEGIN
            RAISERROR(N'❌ Hội đồng không tồn tại.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- 2️⃣ Kiểm tra đồ án có tồn tại
        IF NOT EXISTS(SELECT 1 FROM DETAI WHERE MaDT = @MaDoAn)
        BEGIN
            RAISERROR(N'❌ Đồ án không tồn tại.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- 3️⃣ Kiểm tra đồ án này đã có hội đồng chưa
        IF EXISTS(SELECT 1 FROM HOIDONG_DETAI WHERE MaDT = @MaDoAn AND MaHD = @MaHoiDong)
        BEGIN
            RAISERROR(N'⚠️ Đồ án này đã được gán vào hội đồng rồi.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        DECLARE @LanBaoVe INT;
        IF EXISTS (
            SELECT 1 
            FROM HOIDONG_DETAI
            WHERE MaDT = @MaDoAn
        )
            SET @LanBaoVe = 2;
        ELSE
            SET @LanBaoVe = 1;


        INSERT INTO HOIDONG_DETAI(MaHD,MaDT,LanBaoVe)
        VALUES(@MaHoiDong,@MaDoAn,@LanBaoVe)

        COMMIT TRANSACTION;
        PRINT N'✔ Cập nhật đồ án hội đồng thành công.';

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
    END CATCH
END
GO

CREATE OR ALTER PROC usp_RemoveDoAnHoiDong
    @MaDoAn VARCHAR(20),           -- Bắt buộc truyền MaDoAn để update
    @MaHoiDong VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        -- 3️⃣ Kiểm tra đồ án này đã có hội đồng chưa
        IF NOT EXISTS(SELECT 1 FROM HOIDONG_DETAI WHERE MaDT = @MaDoAn AND MaHD = @MaHoiDong)
        BEGIN
            RAISERROR(N'⚠️ Đồ án này không có trong hội đồng này.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END
        -- Kiểm tra đề tài có chấm điểm chưa
        IF EXISTS (SELECT 1 FROM KETQUA_BAOVE WHERE MaDT = @MaDoAn AND MaHD = @MaHoiDong)
        BEGIN
            RAISERROR(N'⚠️ Đã chấm điểm cho đồ án này rồi không thể xóa',16,1)
            ROLLBACK TRANSACTION;
            RETURN;
        END

        DELETE FROM HOIDONG_DETAI
        WHERE MaDT = @MaDoAn AND @MaHoiDong = MaHD

        

        COMMIT TRANSACTION;
        PRINT N'✔ Xóa đồ án ra khỏi hội đồng thành công.';

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
    END CATCH
END
GO


-- =============================================
-- DO AN SINH VIEN
-- =============================================
-- =============================================
-- THEM SINH VIEN VAO DO AN
-- =============================================
CREATE OR ALTER PROC usp_addStudentToDoAn
    @MaDoAn VARCHAR(20),
    @MaSV VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1️⃣ Kiểm tra đồ án tồn tại
        IF NOT EXISTS(SELECT 1 FROM DETAI WHERE MaDT = @MaDoAn)
            RAISERROR(N'❌ Đồ án không tồn tại.', 16, 1);

        -- 2️⃣ Kiểm tra sinh viên tồn tại
        IF NOT EXISTS(SELECT 1 FROM SINHVIEN WHERE MaSV = @MaSV)
            RAISERROR(N'❌ Sinh viên không tồn tại.', 16, 1);

        -- 3️⃣ Kiểm tra sinh viên chưa tham gia đồ án này
        IF EXISTS(SELECT 1 FROM DETAI_SINHVIEN WHERE MaDT = @MaDoAn AND MaSV = @MaSV)
            RAISERROR(N'⚠️ Sinh viên đã có trong đồ án này.', 16, 1);

        -- 4️⃣ Kiểm tra sinh viên chưa tham gia đồ án khác trong cùng năm học
        IF EXISTS(
            SELECT 1
            FROM DETAI_SINHVIEN ds
            INNER JOIN DETAI d ON ds.MaDT = d.MaDT
            WHERE ds.MaSV = @MaSV
              AND d.MaNamHoc = (SELECT MaNamHoc FROM DETAI WHERE MaDT = @MaDoAn)
              AND ds.MaDT <> @MaDoAn
        )
            RAISERROR(N'⚠️ Sinh viên đã tham gia đồ án khác cùng năm học.', 16, 1);

        -- 5️⃣ Insert vào bảng liên kết
        INSERT INTO DETAI_SINHVIEN(MaDT, MaSV)
        VALUES (@MaDoAn, @MaSV);

        COMMIT TRANSACTION;

        PRINT N'✔ Thêm sinh viên vào đồ án thành công';
    END TRY
    BEGIN CATCH
       IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
    END CATCH
END
GO

-- =============================================
-- XOA SINH VIEN KHOI DO AN
-- =============================================
CREATE OR ALTER PROC usp_deleteStudentFromDoAn
    @MaDoAn VARCHAR(20),
    @MaSV VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Kiểm tra sinh viên có trong đồ án không
        IF NOT EXISTS(
            SELECT 1 
            FROM DETAI_SINHVIEN 
            WHERE MaDT = @MaDoAn AND MaSV = @MaSV
        )
            RAISERROR(N'❌ Sinh viên không tồn tại trong đồ án.', 16, 1);
        IF EXISTS(
            SELECT 1
            FROM KETQUA_BAOVE
             WHERE MaDT = @MaDoAn AND MaSV = @MaSV
        )
            RAISERROR(N'❌ Sinh viên đã có điểm không được xóa', 16, 1);
        -- Xóa sinh viên khỏi đồ án
        DELETE FROM DETAI_SINHVIEN
        WHERE MaDT = @MaDoAn AND MaSV = @MaSV;

        COMMIT TRANSACTION;

        PRINT N'✔ Xóa sinh viên khỏi đồ án thành công.';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
        -- Ném lỗi ra ngoài để ứng dụng/API bắt được
       
    END CATCH
END
GO

-- =============================================
-- CẬP NHẬP ĐIỂM
-- =============================================
CREATE OR ALTER PROC usp_updateStudentScore
    @MaDoAn VARCHAR(20),
    @MaSV VARCHAR(20),
    @MaHD VARCHAR(20),
    @DiemGVHuongDan FLOAT = NULL,
    @DiemGVPhanBien FLOAT = NULL,
    @DiemGVChuTich FLOAT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1️⃣ Kiểm tra sinh viên có trong đồ án
        IF NOT EXISTS (
            SELECT 1 
            FROM DETAI_SINHVIEN 
            WHERE MaDT = @MaDoAn AND MaSV = @MaSV
        )
            RAISERROR(N'❌ Sinh viên chưa được thêm vào đồ án.', 16, 1);
        -- Kiểm tra có mã hội đồng chưa
        IF NOT EXISTS (
            SELECT 1
            FROM HOIDONG_DETAI
            WHERE MaDT = @MaDoAn AND MaHD = @MaHD
        )
            RAISERROR(N'❌ Đồ án này chưa có hội đồng nên chưa cho chấm điểm.', 16, 1);
        -- Kiểm tra tới thời gian chấm điểm chưa
        IF EXISTS (
            SELECT 1
            FROM HOIDONG_DETAI d
                INNER JOIN HOIDONG h
                    ON d.MaHD = h.MaHD
            WHERE GETDATE() < h.NgayBaoVe AND MaDT = @MaDoAn
            
        )
        BEGIN
            RAISERROR(N'❌ Chưa tới thời gian bảo vệ, không được chấm điểm.', 16, 1);
        END
        -- 2️⃣ Update điểm (chỉ update khi có giá trị mới)
       IF EXISTS (
        SELECT 1 
        FROM KETQUA_BAOVE 
        WHERE MaDT = @MaDoAn AND MaSV = @MaSV AND MaHD = @MaHD
        )
        BEGIN
            -- update nếu đã có
            UPDATE KETQUA_BAOVE
            SET
                DiemGVHuongDan = ISNULL(@DiemGVHuongDan, DiemGVHuongDan),
                DiemGVPhanBien = ISNULL(@DiemGVPhanBien, DiemGVPhanBien),
                DiemGVChuTich = ISNULL(@DiemGVChuTich, DiemGVChuTich)
            WHERE MaDT = @MaDoAn AND MaSV = @MaSV AND MaHD = @MaHD;
        END
        ELSE
        BEGIN
        -- insert nếu chưa có
        INSERT INTO KETQUA_BAOVE (MaDT, MaSV, MaHD, DiemGVHuongDan, DiemGVPhanBien, DiemGVChuTich)
        VALUES (@MaDoAn, @MaSV, @MaHD, @DiemGVHuongDan, @DiemGVPhanBien, @DiemGVChuTich);
    END
        COMMIT TRANSACTION;
        PRINT N'✔ Cập nhật điểm sinh viên thành công.';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
    END CATCH
END
GO

-- =============================================
-- DANH SÁCH ĐIỂM
-- =============================================
CREATE OR ALTER PROC usp_listStudentInDoAn
    @MaDoAn VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT SV.TenSV,
    SV.MaSV,
    SV.DiaChi,
    sv.SoDienThoai
    FROM DETAI_SINHVIEN AS DS
            INNER JOIN SINHVIEN AS SV
                ON DS.MaSV = SV.MaSV
    WHERE @MaDoAn = DS.MaDT

END
GO

CREATE OR ALTER PROC usp_listScoreInDoAn
    @MaDoAn VARCHAR(20),
    @MaHD VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        SV.MaSV,
        SV.TenSV,
        SV.DiaChi,
        SV.SoDienThoai,
        KB.DiemGVHuongDan,
        KB.DiemGVChuTich,
        KB.DiemGVPhanBien,
        KB.DiemTrungBinh,
        KB.KetQua
    FROM DETAI_SINHVIEN AS DS
    INNER JOIN SINHVIEN AS SV
        ON DS.MaSV = SV.MaSV
    LEFT JOIN KETQUA_BAOVE AS KB
        ON DS.MaDT = KB.MaDT 
        AND DS.MaSV = KB.MaSV
        AND KB.MaHD = @MaHD   -- 👈 đưa điều kiện vào JOIN
    WHERE DS.MaDT = @MaDoAn; -- 👈 filter đúng chỗ
END
GO

CREATE OR ALTER PROC usp_listNamHoc
    @search NVARCHAR(50) = NULL,   -- từ khóa tìm kiếm MaNamHoc
    @limit INT = 10,                -- số bản ghi cần lấy
    @skip INT = 0,                  -- số bản ghi bỏ qua
    @SortBy NVARCHAR(50) = 'MaNamHoc', -- cột sort (MaNamHoc | ThoiGianBatDau)
    @SortOrder NVARCHAR(4) = 'ASC'      -- ASC | DESC
AS
BEGIN
    SET NOCOUNT ON;

    -- Validate sort
    IF @SortBy NOT IN ('MaNamHoc','ThoiGianBatDau','ThoiGianKetThuc')
        SET @SortBy = 'MaNamHoc';

    IF UPPER(@SortOrder) NOT IN ('ASC','DESC')
        SET @SortOrder = 'ASC';

    DECLARE @sql NVARCHAR(MAX);
    -- 1️⃣ Query tổng số bản ghi
    DECLARE @sqlCount NVARCHAR(MAX) = N'
        SELECT @TotalRecords = COUNT(*)
        FROM NAMHOC
        WHERE (@search IS NULL OR MaNamHoc LIKE N''%'' + @search + N''%'')
    ';

    DECLARE @TotalRecords INT;
    EXEC sp_executesql @sqlCount, 
    N'@search NVARCHAR(50), @TotalRecords INT OUTPUT', 
    @search, @TotalRecords OUTPUT;


    -- 2️⃣ Query dữ liệu phân trang
    SET @sql = N'
        SELECT MaNamHoc, ThoiGianBatDau, ThoiGianKetThuc
        FROM NAMHOC
        WHERE (@search IS NULL OR MaNamHoc LIKE N''%'' + @search + N''%'')
        ORDER BY ' + QUOTENAME(@SortBy) + ' ' + @SortOrder + '
        OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY;
    ';

    EXEC sp_executesql @sql,
        N'@search NVARCHAR(50), @skip INT, @limit INT',
        @search, @skip, @limit;

    -- 3️⃣ Trả thông tin phân trang
    DECLARE @TotalPages INT = CEILING(1.0 * @TotalRecords / NULLIF(@limit,0));
    DECLARE @CurrentPage INT = (@skip / @limit) + 1;

    SELECT @TotalRecords AS TotalRecords,
           @TotalPages AS TotalPages,
           @CurrentPage AS CurrentPage;
END
GO


CREATE OR ALTER PROC usp_listKhoa
    @search NVARCHAR(250) = NULL,     -- từ khóa tìm kiếm TenKhoa
    @limit INT = 10,                  -- số bản ghi cần lấy
    @skip INT = 0,                    -- số bản ghi bỏ qua
    @SortBy NVARCHAR(50) = 'TenKhoa', -- cột sort (TenKhoa | MaKhoa)
    @SortOrder NVARCHAR(4) = 'ASC'    -- ASC | DESC
AS
BEGIN
    SET NOCOUNT ON;

    -- Validate sort
    IF @SortBy NOT IN ('TenKhoa','MaKhoa')
        SET @SortBy = 'TenKhoa';

    IF UPPER(@SortOrder) NOT IN ('ASC','DESC')
        SET @SortOrder = 'ASC';

    DECLARE @sql NVARCHAR(MAX);
    DECLARE @sqlCount NVARCHAR(MAX);

    -- 1️⃣ Query tổng số bản ghi
    SET @sqlCount = N'
        SELECT @TotalRecords = COUNT(*)
        FROM KHOA
        WHERE (@search IS NULL OR TenKhoa LIKE N''%'' + @search + N''%'')
    ';

    DECLARE @TotalRecords INT;

    EXEC sp_executesql 
        @sqlCount,
        N'@search NVARCHAR(250), @TotalRecords INT OUTPUT',
        @search = @search,
        @TotalRecords = @TotalRecords OUTPUT;

    -- 2️⃣ Query dữ liệu phân trang
    SET @sql = N'
        SELECT MaKhoa, TenKhoa, CreatedAt, UpdatedAt
        FROM KHOA
        WHERE (@search IS NULL OR TenKhoa LIKE N''%'' + @search + N''%'')
        ORDER BY ' + QUOTENAME(@SortBy) + ' ' + @SortOrder + '
        OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY;
    ';

    EXEC sp_executesql 
        @sql,
        N'@search NVARCHAR(250), @skip INT, @limit INT',
        @search = @search,
        @skip = @skip,
        @limit = @limit;

    -- 3️⃣ Trả thông tin phân trang
    DECLARE @TotalPages INT = CEILING(1.0 * @TotalRecords / NULLIF(@limit,0));
    DECLARE @CurrentPage INT = (@skip / @limit) + 1;

    SELECT @TotalRecords AS TotalRecords,
           @TotalPages AS TotalPages,
           @CurrentPage AS CurrentPage;
END
GO

CREATE OR ALTER PROCEDURE usp_getCouncilInProject
    @MaDT VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT MaHD
    FROM HOIDONG_DETAI
    WHERE MaDT = @MaDT;
END
GO

CREATE OR ALTER PROC usp_reportTopic
    @limit INT = 10,
    @skip INT = 0,
    @deCode INT = NULL,       -- mã khoa hoặc mã đề tài
    @year VARCHAR(20) = NULL  -- năm học
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH LatestHoiDong AS (
        SELECT 
            HD.MaDT,
            HD.MaHD,
            HD.LanBaoVe,
            ROW_NUMBER() OVER (PARTITION BY HD.MaDT ORDER BY HD.LanBaoVe DESC) AS rn
        FROM HOIDONG_DETAI HD
    ),
    LatestResult AS (
        SELECT 
            LR.MaDT,
            LR.MaHD,
            KBV.DiemTrungBinh
        FROM LatestHoiDong LR
        LEFT JOIN KETQUA_BAOVE KBV 
            ON KBV.MaDT = LR.MaDT 
           AND KBV.MaHD = LR.MaHD
        WHERE LR.rn = 1
    ),
    TopicStats AS (
        SELECT 
            DT.MaDT,
            DT.TenDT,
            K.TenKhoa,
            DT.MaNamHoc,
            DT.ThoiGianBatDau,
            DT.ThoiGianKetThuc,
           AVG(LR.DiemTrungBinh) AS DiemTrungBinh
        FROM DETAI DT
        JOIN KHOA K ON DT.MaKhoa = K.MaKhoa
        LEFT JOIN LatestResult LR ON LR.MaDT = DT.MaDT
        WHERE (@deCode IS NULL OR DT.MaKhoa = @deCode)
          AND (@year IS NULL OR DT.MaNamHoc = @year)
        GROUP BY DT.MaDT,
                 DT.TenDT,
                 K.TenKhoa,
                 DT.MaNamHoc,
                 DT.ThoiGianBatDau,
                 DT.ThoiGianKetThuc
    )
    -- 1. Data phân trang
    SELECT *
    FROM TopicStats
    ORDER BY DiemTrungBinh DESC
    OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY;

    -- 2. Tổng số dòng
    SELECT COUNT(*) AS TotalRecords
    FROM (
        SELECT DT.MaDT
        FROM DETAI DT
        WHERE (@deCode IS NULL OR DT.MaKhoa = @deCode)
          AND (@year IS NULL OR DT.MaNamHoc = @year)
    ) X;
END
GO

CREATE OR ALTER PROC usp_reportTeacher
    @limit INT = 10,
    @skip INT = 0,
    @deCode INT = NULL,       -- mã khoa hoặc mã GV
    @year VARCHAR(20) = NULL  -- năm học
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH LatestHoiDong AS (
        SELECT 
            HD.MaDT,
            HD.MaHD,
            HD.LanBaoVe,
            ROW_NUMBER() OVER (PARTITION BY HD.MaDT ORDER BY HD.LanBaoVe DESC) AS rn
        FROM HOIDONG_DETAI HD
    ),
    LatestResult AS (
        SELECT 
            LR.MaDT,
            LR.MaHD,
            KBV.DiemTrungBinh
        FROM LatestHoiDong LR
        LEFT JOIN KETQUA_BAOVE KBV 
            ON KBV.MaDT = LR.MaDT 
           AND KBV.MaHD = LR.MaHD
        WHERE LR.rn = 1
    ),
    TeacherStats AS (
        SELECT 
            GV.MaGV,
            GV.TenGV,
            K.TenKhoa,
            DT.MaNamHoc,
            COUNT(DISTINCT DT.MaDT) AS SoDeTai,
            ISNULL(AVG(LR.DiemTrungBinh), 0) AS DiemTrungBinh
        FROM DETAI DT
        JOIN GIAOVIEN GV ON DT.MaGVHuongDan = GV.MaGV
        JOIN KHOA K ON GV.MaKhoa = K.MaKhoa
        LEFT JOIN LatestResult LR ON LR.MaDT = DT.MaDT
        WHERE (@deCode IS NULL OR DT.MaKhoa = @deCode)
          AND (@year IS NULL OR DT.MaNamHoc = @year)
        GROUP BY GV.MaGV, GV.TenGV, K.TenKhoa, DT.MaNamHoc
    )
    -- 1. Data phân trang
    SELECT *
    FROM TeacherStats
    ORDER BY DiemTrungBinh DESC
    OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY;

    -- 2. Tổng số dòng
    SELECT COUNT(*) AS TotalCount
    FROM (
        SELECT GV.MaGV
        FROM DETAI DT
        JOIN GIAOVIEN GV ON DT.MaGVHuongDan = GV.MaGV
        WHERE (@deCode IS NULL OR DT.MaKhoa = @deCode)
          AND (@year IS NULL OR DT.MaNamHoc = @year)
        GROUP BY GV.MaGV
    ) X;
END
GO
CREATE OR ALTER PROC usp_reportFaculty
    @limit INT = 10,
    @skip INT = 0,
    @year VARCHAR(20) = NULL  -- năm học
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH LatestHoiDong AS (
        SELECT 
            HD.MaDT,
            HD.MaHD,
            HD.LanBaoVe,
            ROW_NUMBER() OVER (PARTITION BY HD.MaDT ORDER BY HD.LanBaoVe DESC) AS rn
        FROM HOIDONG_DETAI HD
    ),
    LatestResult AS (
        SELECT 
            LR.MaDT,
            KBV.DiemTrungBinh
        FROM LatestHoiDong LR
        LEFT JOIN KETQUA_BAOVE KBV 
            ON KBV.MaDT = LR.MaDT AND KBV.MaHD = LR.MaHD
        WHERE LR.rn = 1
    ),
    FacultyStats AS (
        SELECT 
            K.MaKhoa,
            K.TenKhoa,
            DT.MaNamHoc,
            MIN(LR.DiemTrungBinh) AS DiemThapNhat,
            MAX(LR.DiemTrungBinh) AS DiemCaoNhat,
            COUNT(DISTINCT DT.MaDT) AS SoDeTai,
            ISNULL(AVG(LR.DiemTrungBinh), 0) AS DiemTrungBinh
        FROM DETAI DT
        JOIN KHOA K ON DT.MaKhoa = K.MaKhoa
        LEFT JOIN LatestResult LR ON LR.MaDT = DT.MaDT
        WHERE (@year IS NULL OR DT.MaNamHoc = @year)
        GROUP BY K.MaKhoa, K.TenKhoa, DT.MaNamHoc
    )
    -- 1. Data phân trang
    SELECT *
    FROM FacultyStats
    ORDER BY DiemTrungBinh DESC
    OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY;

    -- 2. Tổng số dòng
    SELECT COUNT(*) AS TotalCount
    FROM (
        SELECT K.MaKhoa
        FROM DETAI DT
        JOIN KHOA K ON DT.MaKhoa = K.MaKhoa
        WHERE (@year IS NULL OR DT.MaNamHoc = @year)
        GROUP BY K.MaKhoa
    ) X;
END
GO
CREATE OR ALTER PROC usp_reportTeacherSummary
    @year VARCHAR(20) = NULL,  -- lọc theo năm học
    @maKhoa INT = NULL         -- lọc theo khoa
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Lấy hội đồng mới nhất cho mỗi đề tài
    ;WITH LatestHoiDong AS (
        SELECT 
            HD.MaDT,
            HD.MaHD,
            ROW_NUMBER() OVER (PARTITION BY HD.MaDT ORDER BY HD.LanBaoVe DESC) AS rn
        FROM HOIDONG_DETAI HD
    ),
    -- 2. Lấy kết quả hội đồng mới nhất
    LatestResult AS (
        SELECT 
            LR.MaDT,
            KBV.DiemTrungBinh
        FROM LatestHoiDong LR
        LEFT JOIN KETQUA_BAOVE KBV 
            ON KBV.MaDT = LR.MaDT AND KBV.MaHD = LR.MaHD
        WHERE LR.rn = 1
    ),
    -- 3. Tính điểm trung bình theo giáo viên
    TeacherStats AS (
        SELECT 
            GV.MaGV,
            GV.TenGV,
            AVG(ISNULL(LR.DiemTrungBinh, 0)) AS DiemTrungBinh
        FROM DETAI DT
        JOIN GIAOVIEN GV ON DT.MaGVHuongDan = GV.MaGV
        LEFT JOIN LatestResult LR ON LR.MaDT = DT.MaDT
        WHERE (@maKhoa IS NULL OR GV.MaKhoa = @maKhoa)
          AND (@year IS NULL OR DT.MaNamHoc = @year)
        GROUP BY GV.MaGV, GV.TenGV
    )
    -- 4. Trả ra 1 dòng tổng hợp
    SELECT 
        (SELECT TOP 1 TenGV FROM TeacherStats ORDER BY DiemTrungBinh DESC) AS GiaoVienDiemCaoNhat,
        (SELECT TOP 1 DiemTrungBinh FROM TeacherStats ORDER BY DiemTrungBinh DESC) AS DiemCaoNhat,
        (SELECT TOP 1 TenGV FROM TeacherStats ORDER BY DiemTrungBinh ASC)  AS GiaoVienDiemThapNhat,
        (SELECT TOP 1 DiemTrungBinh FROM TeacherStats ORDER BY DiemTrungBinh ASC) AS DiemThapNhat,
        (SELECT AVG(DiemTrungBinh) FROM TeacherStats) AS DiemTrungBinhChung;
END
GO
