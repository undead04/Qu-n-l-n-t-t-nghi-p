-- ===============================
-- Hàm sinh Mã tự động
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
        WHERE Nam=@Nam AND LOAI = @Loai
    )
    BEGIN
        INSERT INTO Dem(Nam, STT,LOAI) 
        VALUES(@Nam,0,@Loai);
    END

    -- Tăng STT
    UPDATE Dem
    SET STT = STT + 1
    WHERE Nam=@Nam AND LOAI = @Loai

    SELECT @NewSTT = STT 
    FROM Dem 
    WHERE Nam=@Nam AND LOAI = @Loai

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
    @search NVARCHAR(250) = NULL,    
    @limit INT = 10,
    @MaKhoa INT = NULL,                 
    @skip INT = 0,                   
    @SortBy NVARCHAR(50) = 'TenSV',  
    @SortOrder NVARCHAR(4) = 'ASC'   
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
        WHERE 
                ( @search IS NULL 
                OR TenSV LIKE N''%'' + @search + N''%'' 
                OR SV.MaSV LIKE N''%'' + @search + N''%'' )
                AND (@MaKhoa IS NULL OR SV.MaKhoa = @MaKhoa)
    ';

    CREATE TABLE #CountResult (TotalRecords INT);

    INSERT INTO #CountResult
    EXEC sp_executesql @sqlCount,
        N'@search NVARCHAR(250),@MaKhoa INT',
        @search,@MaKhoa;

    -- 2️⃣ Query dữ liệu phân trang
    SET @sql = N'
    SELECT  
        SV.MaSV, 
        SV.TenSV, 
        SV.MaKhoa,
        DiaChi,
        SoDienThoai,
        COUNT(DS.MaSV) AS SoLanBaoVe
    FROM SINHVIEN AS SV
    LEFT JOIN DETAI_SINHVIEN DS ON SV.MaSV = DS.MaSV
    WHERE 
          ( @search IS NULL 
            OR TenSV LIKE N''%'' + @search + N''%'' 
            OR SV.MaSV LIKE N''%'' + @search + N''%'' )
            AND (@MaKhoa IS NULL OR SV.MaKhoa = @MaKhoa)
    GROUP BY SV.MaSV, SV.TenSV, SV.MaKhoa, DiaChi, SoDienThoai
    ORDER BY SV.' + QUOTENAME(@SortBy) + ' ' + @SortOrder + '
    OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY;
';


    EXEC sp_executesql @sql,
        N'@search NVARCHAR(250), @skip INT, @limit INT,@MaKhoa INT',
        @search, @skip, @limit,@MaKHoa;

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
        SV.MaKhoa,
        SV.SoDienThoai,
        K.TenKhoa
    FROM SINHVIEN AS SV
            INNER JOIN Khoa  AS K
                ON SV.MaKhoa = k.MaKhoa
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
    @search NVARCHAR(250)       = NULL,    -- từ khóa tìm kiếm TenGV hoặc MaGV
    @MaKhoa INT                 = NULL,    -- lọc theo khoa (MaKhoa)
    @limit INT                 = 10,       -- số bản ghi mỗi trang
    @skip INT                  = 0,        -- số bản ghi bỏ qua
    @SortBy NVARCHAR(50)       = 'TenGV',  -- cột sort
    @SortOrder NVARCHAR(4)      = 'ASC'     -- ASC | DESC
AS
BEGIN
    SET NOCOUNT ON;

    -- Validate sort input
    IF @SortBy NOT IN ('TenGV','MaGV','HocVi','ChuyenNganh','UpdatedAt')
        SET @SortBy = 'TenGV';

    IF UPPER(@SortOrder) NOT IN ('ASC','DESC')
        SET @SortOrder = 'ASC';

    -- 1️⃣ Tính tổng số bản ghi
    DECLARE @TotalRecords INT;

    SELECT @TotalRecords = COUNT(*)
    FROM GIAOVIEN AS GV
    WHERE 
        ( @search IS NULL
          OR GV.TenGV LIKE N'%' + @search + N'%'
          OR GV.MaGV  LIKE N'%' + @search + N'%' )
      AND ( @MaKhoa IS NULL OR GV.MaKhoa = @MaKhoa );

    DECLARE @TotalPages INT = CEILING(@TotalRecords * 1.0 / NULLIF(@limit,0));

    -- 2️⃣ Trả dữ liệu phân trang
    DECLARE @sql NVARCHAR(MAX) = N'
        SELECT 
            GV.MaGV,
            GV.TenGV,
            GV.DiaChi,
            GV.SoDienThoai,
            GV.HocVi,
            GV.ChuyenNganh,
            GV.MaKhoa
        FROM GIAOVIEN AS GV
        WHERE 
              ( @search IS NULL
                OR GV.TenGV LIKE N''%'' + @search + N''%''
                OR GV.MaGV  LIKE N''%'' + @search + N''%'')
          AND ( @MaKhoa IS NULL OR GV.MaKhoa = @MaKhoa )
        ORDER BY ' + QUOTENAME(@SortBy) + ' ' + @SortOrder + '
        OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY;
    ';

    EXEC sp_executesql @sql,
        N'@search NVARCHAR(250), @MaKhoa INT, @skip INT, @limit INT',
        @search, @MaKhoa, @skip, @limit;

    -- 3️⃣ Trả bảng metadata
    SELECT 
        @TotalRecords AS TotalRecords,
        @TotalPages   AS TotalPages,
        @limit        AS PageSize,
        ( @skip / NULLIF(@limit,0) + 1 ) AS CurrentPage;
END
GO


CREATE OR ALTER PROC usp_getTeacher
    @MaGV NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    -- Nếu không tồn tại SV thì báo lỗi
    IF NOT EXISTS (SELECT 1 FROM GIAOVIEN WHERE MaGV = @MaGV)
    BEGIN
        RAISERROR(N'Giáo viên với mã %s không tồn tại!', 16, 1, @MaGV);
        RETURN;
    END

    -- Nếu tồn tại thì trả về thông tin
    SELECT 
       GV.MaGV,
       GV.TenGV,
       GV.DiaChi,
       GV.SoDienThoai,
       GV.HocVi,
       GV.ChuyenNganh,
       GV.MaKhoa,
       k.TenKhoa
    FROM GIAOVIEN GV
            INNER JOIN Khoa k
                on GV.MaKhoa = k.MaKhoa
    WHERE GV.MaGV = @MaGV;
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
    @MaKhoa INT = NULL,
    @MaGV VARCHAR(20) = NULL,            -- mã giáo viên lọc
    @MaNamHoc NVARCHAR(20) = NULL,       -- lọc theo năm học
    @SortBy NVARCHAR(50) = 'NgayBaoVe',  -- cột sort (MaHD | NgayBaoVe | UpdatedAt)
    @SortOrder NVARCHAR(4) = 'ASC'       -- ASC | DESC
AS
BEGIN
    SET NOCOUNT ON;

    -------------------------------------------------------
    -- 1️⃣ Validate sort column và order
    -------------------------------------------------------
    IF @SortBy NOT IN ('MaHD', 'NgayBaoVe', 'UpdatedAt')
        SET @SortBy = 'NgayBaoVe';

    IF UPPER(@SortOrder) NOT IN ('ASC', 'DESC')
        SET @SortOrder = 'ASC';

    -------------------------------------------------------
    -- 2️⃣ Query đếm tổng số bản ghi
    -------------------------------------------------------
    DECLARE @sqlCount NVARCHAR(MAX) = N'
        SELECT COUNT(*) AS TotalRecords
        FROM HOIDONG AS HD
        INNER JOIN GIAOVIEN AS GVCT ON HD.MaGVChuTich = GVCT.MaGV
        INNER JOIN GIAOVIEN AS GVTK ON HD.MaGVThuKy = GVTK.MaGV
        INNER JOIN GIAOVIEN AS GVPB ON HD.MaGVPhanBien = GVPB.MaGV
        WHERE 
            (@MaGV IS NULL OR HD.MaGVChuTich = @MaGV OR HD.MaGVThuKy = @MaGV OR HD.MaGVPhanBien = @MaGV)
            AND (@MaNamHoc IS NULL OR HD.MaNamHoc = @MaNamHoc)
            AND (@MaKhoa IS NULL OR HD.MaKhoa = @MaKhoa)
            AND (
                @search IS NULL OR
                HD.MaHD LIKE N''%'' + @search + N''%'' OR
                HD.DiaChiBaoVe LIKE N''%'' + @search + N''%'' OR
                GVCT.TenGV LIKE N''%'' + @search + N''%'' OR
                GVTK.TenGV LIKE N''%'' + @search + N''%'' OR
                GVPB.TenGV LIKE N''%'' + @search + N''%''
            );
    ';

    CREATE TABLE #CountResult (TotalRecords INT);

    INSERT INTO #CountResult
    EXEC sp_executesql 
        @sqlCount,
        N'@MaGV VARCHAR(20), @MaNamHoc NVARCHAR(20), @search NVARCHAR(250),@MaKhoa INT',
        @MaGV = @MaGV, @MaNamHoc = @MaNamHoc, @search = @search,@MaKhoa = @MaKhoa;

    -------------------------------------------------------
    -- 3️⃣ Query lấy dữ liệu phân trang
    -------------------------------------------------------
    DECLARE @sql NVARCHAR(MAX) = N'
        SELECT 
            HD.MaHD,
            HD.MaNamHoc,
            HD.MaKhoa,
            HD.NgayBaoVe,
            HD.DiaChiBaoVe,
            HD.MaGVChuTich,
            GVCT.TenGV AS TenGVChuTich,
            HD.MaGVThuKy,
            GVTK.TenGV AS TenGVThuKy,
            HD.MaGVPhanBien,
            GVPB.TenGV AS TenGVPhanBien,
            COUNT(D.MaDT) AS SoDT,
            HD.UpdatedAt
        FROM HOIDONG AS HD
        LEFT JOIN DETAI AS D ON D.MaHD = HD.MaHD
        INNER JOIN GIAOVIEN AS GVCT ON HD.MaGVChuTich = GVCT.MaGV
        INNER JOIN GIAOVIEN AS GVTK ON HD.MaGVThuKy = GVTK.MaGV
        INNER JOIN GIAOVIEN AS GVPB ON HD.MaGVPhanBien = GVPB.MaGV
        WHERE 
            (@MaGV IS NULL OR HD.MaGVChuTich = @MaGV OR HD.MaGVThuKy = @MaGV OR HD.MaGVPhanBien = @MaGV)
            AND (@MaNamHoc IS NULL OR HD.MaNamHoc = @MaNamHoc)
            AND (@MaKhoa IS NULL OR HD.MaKhoa = @MaKhoa)
            AND (
                @search IS NULL OR
                HD.MaHD LIKE N''%'' + @search + N''%'' OR
                HD.DiaChiBaoVe LIKE N''%'' + @search + N''%'' OR
                GVCT.TenGV LIKE N''%'' + @search + N''%'' OR
                GVTK.TenGV LIKE N''%'' + @search + N''%'' OR
                GVPB.TenGV LIKE N''%'' + @search + N''%''
            )
        GROUP BY 
            HD.MaHD, HD.MaNamHoc, HD.MaKhoa, HD.NgayBaoVe, HD.DiaChiBaoVe,
            HD.MaGVChuTich, GVCT.TenGV,
            HD.MaGVThuKy, GVTK.TenGV,
            HD.MaGVPhanBien, GVPB.TenGV,
            HD.UpdatedAt
        ORDER BY HD.' + QUOTENAME(@SortBy) + ' ' + @SortOrder + '
        OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY;
    ';

    EXEC sp_executesql 
        @sql,
        N'@MaGV VARCHAR(20), @MaNamHoc NVARCHAR(20), @search NVARCHAR(250), @skip INT, @limit INT,
        @MaKhoa INT',
        @MaGV = @MaGV, @MaNamHoc = @MaNamHoc, @search = @search, @skip = @skip, @limit = @limit,
        @MaKhoa = @MaKhoa;

    -------------------------------------------------------
    -- 4️⃣ Trả thêm thông tin phân trang
    -------------------------------------------------------
    DECLARE @TotalRecords INT = (SELECT TOP 1 TotalRecords FROM #CountResult);
    DECLARE @TotalPages INT = CEILING(1.0 * @TotalRecords / NULLIF(@limit, 0));
    DECLARE @CurrentPage INT = (@skip / NULLIF(@limit, 1)) + 1;

    SELECT 
        @TotalRecords AS TotalRecords,
        @TotalPages AS TotalPages,
        @CurrentPage AS CurrentPage;

    DROP TABLE #CountResult;
END;
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

        -- 1️⃣ Kiểm tra tồn tại dữ liệu tham chiếu
        IF NOT EXISTS(SELECT 1 FROM NAMHOC  WHERE MaNamHoc = @MaNamHoc)
        BEGIN
            RAISERROR(N'Không tồn tại năm học %s', 16, 1, @MaNamHoc);
            RETURN;
        END

        IF NOT EXISTS(SELECT 1 FROM Khoa  WHERE MaKhoa = @MaKhoa)
        BEGIN
            RAISERROR(N'Không tồn tại khoa %s', 16, 1, @MaKhoa);
            RETURN;
        END

        IF NOT EXISTS(SELECT 1 FROM GIAOVIEN WHERE MaGV = @MaGVChuTich)
        BEGIN
            RAISERROR(N'Không tồn tại GV Chủ tịch: %s', 16, 1, @MaGVChuTich);
            RETURN;
        END

        IF NOT EXISTS(SELECT 1 FROM GIAOVIEN WHERE MaGV = @MaGVThuKy)
        BEGIN
            RAISERROR(N'Không tồn tại GV Thư ký: %s', 16, 1, @MaGVThuKy);
            RETURN;
        END

        IF NOT EXISTS(SELECT 1 FROM GIAOVIEN WHERE MaGV = @MaGVPhanBien)
        BEGIN
            RAISERROR(N'Không tồn tại GV Phản biện: %s', 16, 1, @MaGVPhanBien);
            RETURN;
        END

        -- 2️⃣ Kiểm tra trùng mã GV
        IF (
            @MaGVChuTich = @MaGVThuKy OR 
            @MaGVChuTich = @MaGVPhanBien OR 
            @MaGVThuKy = @MaGVPhanBien
        )
        BEGIN
            RAISERROR(N'Ba giảng viên trong hội đồng (Chủ tịch, Thư ký, Phản biện) phải khác nhau.', 16, 1);
            RETURN;
        END

        -- 3️⃣ Sinh mã hội đồng
        DECLARE @MaHD VARCHAR(20);
        EXEC usp_GetCode
            @KhoaCode = @MaKhoa,
            @Loai = 'HD',
            @NewCode = @MaHD OUTPUT;

        -- 4️⃣ Thêm dữ liệu
        INSERT INTO HOIDONG (
            MaHD, MaNamHoc, MaKhoa, NgayBaoVe, DiaChiBaoVe, 
            MaGVChuTich, MaGVThuKy, MaGVPhanBien
        )
        VALUES (
            @MaHD, @MaNamHoc, @MaKhoa, @NgayBaoVe, @DiaChiBaoVe, 
            @MaGVChuTich, @MaGVThuKy, @MaGVPhanBien
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

        -- 1️⃣ Kiểm tra hội đồng tồn tại
        IF NOT EXISTS (SELECT 1 FROM HOIDONG WHERE MaHD = @MaHD)
        BEGIN
            RAISERROR(N'Mã hội đồng "%s" không tồn tại.', 16, 1, @MaHD);
            RETURN;
        END

        -- 2️⃣ Kiểm tra giáo viên hợp lệ (nếu có)
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
        -- 2️⃣ Kiểm tra trùng mã GV
        IF (
            @MaGVChuTich = @MaGVThuKy OR 
            @MaGVChuTich = @MaGVPhanBien OR 
            @MaGVThuKy = @MaGVPhanBien
        )
        BEGIN
            RAISERROR(N'Ba giảng viên trong hội đồng (Chủ tịch, Thư ký, Phản biện) phải khác nhau.', 16, 1);
            RETURN;
        END
        -- 3️⃣ Validate ngày bảo vệ
        IF @NgayBaoVe IS NOT NULL
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM DETAI D
                WHERE D.MaHD = @MaHD
                  AND D.ThoiGianKetThuc IS NOT NULL
                  AND @NgayBaoVe < D.ThoiGianKetThuc
            )
            BEGIN
                ROLLBACK TRANSACTION;
                RAISERROR(
                    N'Ngày bảo vệ không hợp lệ: có đề tài gắn với hội đồng "%s" có thời gian kết thúc lớn hơn ngày bảo vệ.',
                    16, 1, @MaHD
                );
                RETURN;
            END
        END

        -- 4️⃣ Cập nhật dữ liệu
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
        IF EXISTS (SELECT 1 FROM DETAI WHERE MaHD = @MaHD)
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
-- =============================================
-- GET HOI DONG
-- =============================================
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
            HD.MaKhoa,
            K.TenKhoa,
            HD.NgayBaoVe,
            HD.DiaChiBaoVe,
            GVCT.TenGV AS TenGVChuTich,
            GVTK.TenGV AS TenGVThuKy,
            HD.MaGVPhanBien,
            GVPB.TenGV AS TenGVPhanBien
        FROM HOIDONG AS HD
        INNER JOIN GIAOVIEN AS GVCT ON HD.MaGVChuTich = GVCT.MaGV
        INNER JOIN GIAOVIEN AS GVTK ON HD.MaGVThuKy = GVTK.MaGV
        INNER JOIN GIAOVIEN AS GVPB ON HD.MaGVPhanBien = GVPB.MaGV
        INNER JOIN KHOA AS K ON K.MaKhoa = HD.MaKhoa
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
    @MaKhoa INT = NULL,
    @MaHD VARCHAR(20) = NULL,
    @MaNamHoc VARCHAR(20) = NULL,
    @MaGV VARCHAR(20) = NULL,
    @User VARCHAR(20) = NULL,
    @SortBy NVARCHAR(50) = 'ThoiGianBatDau',
    @SortOrder NVARCHAR(4) = 'ASC'
AS
BEGIN
    SET NOCOUNT ON;

    -- Validate Sort
    IF @SortBy NOT IN ('ThoiGianBatDau','ThoiGianKetThuc','TenDT','UpdatedAt')
        SET @SortBy = 'TenDT';
    IF UPPER(@SortOrder) NOT IN ('ASC','DESC')
        SET @SortOrder = 'ASC';

    DECLARE @searchPattern NVARCHAR(255) = 
        CASE WHEN @search IS NULL OR LEN(@search)=0 THEN NULL ELSE N'%' + @search + N'%' END;

    DECLARE @TotalRecords INT;
    DECLARE @sqlCount NVARCHAR(MAX) = N'
        SELECT @TotalRecordsOut = COUNT(DISTINCT D.MaDT)
        FROM DETAI AS D
        INNER JOIN GIAOVIEN AS GV ON D.MaGVHuongDan = GV.MaGV
        LEFT JOIN HOIDONG AS HD ON D.MaHD = HD.MaHD
        WHERE
              (@MaHD IS NULL OR D.MaHD = @MaHD)
          AND (@MaNamHoc IS NULL OR D.MaNamHoc = @MaNamHoc)
          AND (@MaKhoa IS NULL OR HD.MaKhoa = @MaKhoa)
          AND (@MaGV IS NULL OR D.MaGVHuongDan = @MaGV OR HD.MaGVPhanBien = @MaGV OR HD.MaGVChuTich = @MaGV)
          AND (@searchPattern IS NULL
               OR D.MaDT LIKE @searchPattern
               OR D.TenDT LIKE @searchPattern
               OR GV.TenGV LIKE @searchPattern)
    ';

    EXEC sp_executesql 
        @sqlCount,
        N'@MaHD VARCHAR(20), @MaNamHoc VARCHAR(20), @MaGV VARCHAR(20), @searchPattern NVARCHAR(255),
         @MaKhoa INT,@TotalRecordsOut INT OUTPUT',
        @MaHD, @MaNamHoc, @MaGV, @searchPattern,@MaKhoa, @TotalRecords OUTPUT;

    -------------------------------
    -- 4. Lấy dữ liệu chính
    -------------------------------
    DECLARE @sql NVARCHAR(MAX) = N'
    SELECT 
        D.MaDT,
        D.TenDT,
        D.MaNamHoc,
        D.MaGVHuongDan, 
        GV.TenGV AS TenGVHuongDan,
        D.ThoiGianBatDau,
        D.ThoiGianKetThuc,
        D.MaKhoa,
        D.MaHD,
        COUNT(DV.MaSV) AS SoSV,
        D.UpdatedAt
        ';
        
    -- 👉 Nếu có User, thêm cột trạng thái chấm điểm
    IF @User IS NOT NULL
        SET @sql += N',
        CASE 
            WHEN DI.MaDT IS NOT NULL THEN N''Đã chấm''
            ELSE N''Chưa chấm''
        END AS TrangThaiChamDiem';

    SET @sql += N'
    FROM DETAI AS D
    INNER JOIN GIAOVIEN AS GV ON D.MaGVHuongDan = GV.MaGV
    LEFT JOIN DETAI_SINHVIEN AS DV ON DV.MaDT = D.MaDT
    LEFT JOIN HOIDONG AS HD ON D.MaHD = HD.MaHD';

    -- 👉 Nếu có User, join thêm DIEM để check chấm điểm (tối ưu hơn EXISTS)
    IF @User IS NOT NULL
        SET @sql += N' 
        LEFT JOIN DIEM AS DI ON DI.MaDT = D.MaDT AND DI.MaGV = @User';

    SET @sql += N'
    WHERE (@MaHD IS NULL OR D.MaHD = @MaHD)
      AND (@MaNamHoc IS NULL OR D.MaNamHoc = @MaNamHoc)
      AND (@MaKhoa IS NULL OR HD.MaKhoa = @MaKhoa)
      AND (@MaGV IS NULL OR D.MaGVHuongDan = @MaGV OR HD.MaGVPhanBien = @MaGV OR HD.MaGVChuTich = @MaGV)
      AND (@searchPattern IS NULL
           OR D.MaDT LIKE @searchPattern
           OR D.TenDT LIKE @searchPattern
           OR GV.TenGV LIKE @searchPattern)
    GROUP BY  
        D.MaDT,
        D.TenDT,
        D.MaNamHoc,
        D.MaGVHuongDan, 
        GV.TenGV,
        D.ThoiGianBatDau,
        D.ThoiGianKetThuc,
        D.MaKhoa,
        D.MaHD,
        D.UpdatedAt';

    IF @User IS NOT NULL
        SET @sql += N', Di.MaDT';

    SET @sql += N'
    ORDER BY ' + QUOTENAME(@SortBy) + ' ' + @SortOrder + '
    OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY;';

    -- Thực thi
    EXEC sp_executesql @sql,
        N'@MaHD VARCHAR(20), @MaNamHoc VARCHAR(20), @MaGV VARCHAR(20), 
        @searchPattern NVARCHAR(255), @skip INT, @limit INT, @User VARCHAR(20),
        @MaKhoa INT',
        @MaHD, @MaNamHoc, @MaGV, @searchPattern, @skip, @limit, @User,@MaKhoa;

    -------------------------------
    -- 5. Thông tin phân trang
    -------------------------------
    DECLARE @TotalPages INT = CEILING(1.0 * @TotalRecords / NULLIF(@limit,0));
    DECLARE @CurrentPage INT = (@skip / NULLIF(@limit,1)) + 1;

    SELECT 
        @TotalRecords AS TotalRecords,
        @TotalPages AS TotalPages,
        @CurrentPage AS CurrentPage;
END
GO
-- =============================================
-- CREATE DO AN
-- =============================================
CREATE OR ALTER PROC usp_createDoan
    @TenDT NVARCHAR(150),
    @MaNamHoc VARCHAR(20),
    @MaGVHuongDan VARCHAR(20),
    @ThoiGianBatDau DATE,
    @ThoiGianKetThuc DATE,
    @MaKhoa INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1️⃣ Kiểm tra năm học tồn tại
        IF NOT EXISTS(SELECT 1 FROM NAMHOC WHERE MaNamHoc = @MaNamHoc)
        BEGIN
            RAISERROR(N'Năm học "%s" không tồn tại.', 16, 1, @MaNamHoc);
            RETURN;
        END

        IF NOT EXISTS(SELECT 1 FROM Khoa  WHERE MaKhoa = @MaKhoa)
        BEGIN
            RAISERROR(N'Không tồn tại khoa %s', 16, 1, @MaKhoa);
            RETURN;
        END

        -- 2️⃣ Kiểm tra giáo viên hướng dẫn tồn tại
        IF NOT EXISTS(SELECT 1 FROM GIAOVIEN WHERE MaGV = @MaGVHuongDan)
        BEGIN
            RAISERROR(N'Giáo viên hướng dẫn "%s" không tồn tại.', 16, 1, @MaGVHuongDan);
            RETURN;
        END

        -- 3️⃣ Kiểm tra logic thời gian
        IF @ThoiGianKetThuc < @ThoiGianBatDau
        BEGIN
            RAISERROR(
                N'Thời gian kết thúc không được nhỏ hơn thời gian bắt đầu.',
                16, 1);
            RETURN;
        END

        -- 4️⃣ Sinh mã đồ án mới
        DECLARE @MaDT VARCHAR(20);
        EXEC usp_GetCode
            @KhoaCode = @MaKhoa,
            @Loai = 'DT',
            @NewCode = @MaDT OUTPUT;

        -- 5️⃣ Thêm dữ liệu vào bảng DETAI
        INSERT INTO DETAI (
            MaDT, TenDT, MaKhoa, MaNamHoc, MaGVHuongDan,
            ThoiGianBatDau, ThoiGianKetThuc
        )
        VALUES (
            @MaDT, @TenDT, @MaKhoa, @MaNamHoc, @MaGVHuongDan,
            @ThoiGianBatDau, @ThoiGianKetThuc
        );

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
            RETURN;
        END

        IF @MaGVHuongDan IS NOT NULL AND NOT EXISTS(SELECT 1 FROM GIAOVIEN WHERE MaGV = @MaGVHuongDan)
        BEGIN
            RAISERROR(N'Giáo viên hướng dẫn "%s" không tồn tại.', 16, 1, @MaGVHuongDan);
            RETURN;
        END
        IF NOT EXISTS (
            SELECT 1 
            FROM DETAI 
            WHERE MaDT = @MaDT 
              AND MaGVHuongDan = @MaGVHuongDan
        )
        BEGIN
            RAISERROR(N'❌ Chỉ giảng viên hướng dẫn mới được phép cập nhập đồ án.', 16, 1);
            RETURN;
        END
        -- 3️⃣ Kiểm tra logic thời gian
        IF @ThoiGianKetThuc < @ThoiGianBatDau
        BEGIN
            RAISERROR(
                N'Thời gian kết thúc không được nhỏ hơn thời gian bắt đầu.',
                16, 1);
            RETURN;
        END
        -- Update dữ liệu
        UPDATE DETAI
        SET
            TenDT = ISNULL(@TenDT, TenDT),
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
        DA.MaKhoa,
        K.TenKhoa,
        DA.MaHD,
        HD.NgayBaoVe,
        HD.DiaChiBaoVe,
        CT.TenGV AS TenGVChuTich,
        PB.TenGV AS TenGVPhanBien,
        TK.TenGV AS TenGVThuKy
    FROM DETAI AS DA
        INNER JOIN GIAOVIEN AS GV
            ON GV.MaGV = DA.MaGVHuongDan
        INNER JOIN KHOA K
            ON K.MaKhoa = DA.MaKhoa
        LEFT JOIN HOIDONG HD ON HD.MaHD = DA.MaHD
        LEFT JOIN GIAOVIEN CT ON CT.MaGV = HD.MaGVChuTich
        LEFT JOIN GIAOVIEN PB ON PB.MaGV = HD.MaGVPhanBien
        LEFT JOIN GIAOVIEN TK ON TK.MaGV = HD.MaGVThuKy
    WHERE DA.MaDT = @MaDT
    
END
GO
-- =============================================
-- DELETE DO AN
-- =============================================
CREATE OR ALTER PROC usp_deleteDoan
    @MaDoAn VARCHAR(20),
    @MaGV VARCHAR(20)
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

        IF NOT EXISTS (
            SELECT 1 
            FROM DETAI 
            WHERE MaDT = @MaDoAn 
              AND MaGVHuongDan = @MaGV
        )
        BEGIN
            RAISERROR(N'❌ Chỉ giảng viên hướng dẫn mới được phép xóa đồ án.', 16, 1);
            ROLLBACK TRANSACTION;
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
-- Bảng type dùng để truyền danh sách mã đồ án
CREATE TYPE dbo.DoAnList AS TABLE
(
    MaDoAn VARCHAR(20) PRIMARY KEY
);
GO

CREATE OR ALTER PROC usp_AddDoAnHoiDong
    @ListDoAn dbo.DoAnList READONLY,  -- Danh sách đồ án cần thêm
    @MaHoiDong VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 🧠 1️⃣. Kiểm tra hội đồng tồn tại + lấy thông tin
        DECLARE 
            @NgayBaoVe DATE, 
            @MaNamHocHD VARCHAR(20),
            @MaGVChuTich VARCHAR(20),
            @MaGVThuKy VARCHAR(20),
            @MaGVPhanBien VARCHAR(20),
            @MaKhoa INT;

        SELECT 
            @NgayBaoVe = NgayBaoVe,
            @MaNamHocHD = MaNamHoc,
            @MaGVChuTich = MaGVChuTich,
            @MaGVThuKy = MaGVThuKy,
            @MaGVPhanBien = MaGVPhanBien,
            @MaKhoa = MaKhoa
        FROM HOIDONG 
        WHERE MaHD = @MaHoiDong;

        IF @NgayBaoVe IS NULL
        BEGIN
            RAISERROR(N'❌ Hội đồng không tồn tại.', 16, 1);
            RETURN;
        END;

        -- 🧠 2️⃣. Kiểm tra đồ án hợp lệ
        IF EXISTS (
            SELECT 1 
            FROM @ListDoAn d
            WHERE NOT EXISTS (SELECT 1 FROM DETAI WHERE MaDT = d.MaDoAn)
        )
        BEGIN
            RAISERROR(N'❌ Một hoặc nhiều đồ án không tồn tại trong hệ thống.', 16, 1);
            RETURN;
        END;

        -- 🧠 3️⃣. Kiểm tra đồ án đã có hội đồng chưa
        IF EXISTS (
            SELECT 1
            FROM DETAI dt
            JOIN @ListDoAn da ON dt.MaDT = da.MaDoAn
            WHERE dt.MaHD IS NOT NULL AND dt.MaHD <> @MaHoiDong
        )
        BEGIN
            RAISERROR(N'⚠️ Có đồ án đã được gán vào hội đồng khác, không thể thêm nữa.', 16, 1);
            RETURN;
        END;

        -- 🧠 4️⃣. Kiểm tra cùng niên khóa
        IF EXISTS (
            SELECT 1
            FROM DETAI dt
            JOIN @ListDoAn da ON dt.MaDT = da.MaDoAn
            WHERE dt.MaNamHoc <> @MaNamHocHD
        )
        BEGIN
            RAISERROR(N'⚠️ Có đồ án không cùng niên khóa với hội đồng.', 16, 1);
            RETURN;
        END;

        -- 🧠 5️⃣. Kiểm tra ngày bảo vệ >= ngày kết thúc đồ án
        IF EXISTS (
            SELECT 1
            FROM DETAI dt
            JOIN @ListDoAn da ON dt.MaDT = da.MaDoAn
            WHERE @NgayBaoVe < dt.ThoiGianKetThuc
        )
        BEGIN
            RAISERROR(N'⚠️ Ngày bảo vệ của hội đồng phải lớn hơn hoặc bằng ngày kết thúc đồ án.', 16, 1);
            RETURN;
        END;

        -- 🧠 6️⃣. Kiểm tra GVHD của đồ án không trùng với GV trong hội đồng
        IF EXISTS (
            SELECT 1
            FROM DETAI dt
            JOIN @ListDoAn da ON dt.MaDT = da.MaDoAn
            WHERE dt.MaGVHuongDan IN (@MaGVChuTich, @MaGVThuKy, @MaGVPhanBien)
        )
        BEGIN
            RAISERROR(N'⚠️ Giáo viên hướng dẫn của một số đồ án trùng với giáo viên trong hội đồng (Chủ tịch, Thư ký hoặc Phản biện).', 16, 1);
            RETURN;
        END;

        -- 🧠 6️⃣. Kiểm tra có cùng khoa không
        IF EXISTS (
            SELECT 1
            FROM DETAI dt
            JOIN @ListDoAn da ON dt.MaDT = da.MaDoAn
            WHERE dt.MaKhoa <> @MaKhoa
        )
        BEGIN
            RAISERROR(N'⚠️ Có đề tài không cùng khoa với hội đồng).', 16, 1);
            RETURN;
        END;

        -- 🧠 7️⃣. Reset đồ án cũ thuộc hội đồng này (nếu có)
        UPDATE DETAI
        SET MaHD = NULL
        WHERE MaHD = @MaHoiDong;

        -- 🧠 8️⃣. Gán danh sách đồ án vào hội đồng
        UPDATE dt
        SET dt.MaHD = @MaHoiDong
        FROM DETAI dt
        JOIN @ListDoAn da ON dt.MaDT = da.MaDoAn;

        COMMIT TRANSACTION;
        PRINT N'✔ Gán danh sách đồ án vào hội đồng thành công.';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
    END CATCH;
END;
GO


-- =============================================
-- XÓA DO AN VAO HOI DONG
-- =============================================
CREATE OR ALTER PROC usp_RemoveDoAnHoiDong
    @MaDoAn VARCHAR(20),           
    @MaHoiDong VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        -- 3️⃣ Kiểm tra đồ án này đã có hội đồng chưa
        IF NOT EXISTS(SELECT 1 FROM DETAI WHERE MaDT = @MaDoAn AND MaHD = @MaHoiDong)
        BEGIN
            RAISERROR(N'⚠️ Đồ án này không có trong hội đồng này.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END
        -- Kiểm tra đề tài có chấm điểm chưa
        IF EXISTS (SELECT 1 FROM Diem WHERE MaDT = @MaDoAn)
        BEGIN
            RAISERROR(N'⚠️ Đã chấm điểm cho đồ án này rồi không thể xóa',16,1)
            ROLLBACK TRANSACTION;
            RETURN;
        END
        UPDATE DETAI
        SET MaHD = Null
        WHERE MaDT = @MaDoAn
        

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
CREATE TYPE dbo.StudentListType AS TABLE
(
    MaSV VARCHAR(20) NOT NULL
);
GO
CREATE OR ALTER PROC usp_addStudentToDoAn
    @MaDoAn VARCHAR(20),
    @MaGV VARCHAR(20),
    @Students dbo.StudentListType READONLY
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @MaKhoa INT,@MaGVHuongDan VARCHAR(20);
        SELECT @MaKhoa = MaKhoa,@MaGVHuongDan=MaGVHuongDan
        FROM DETAI
        WHERE MaDT = @MaDoAn


        -- 1️⃣ Kiểm tra đồ án tồn tại
        IF NOT EXISTS(SELECT 1 FROM DETAI WHERE MaDT = @MaDoAn)
        BEGIN
            RAISERROR(N'❌ Đồ án không tồn tại.', 16, 1);
            RETURN;
        END

        -- 0️⃣ Kiểm tra quyền giảng viên hướng dẫn
        IF @MaGV <> @MaGVHuongDan
        BEGIN
            RAISERROR(N'❌ Chỉ giảng viên hướng dẫn mới được phép thêm sinh viên vào đồ án này.', 16, 1);
            RETURN;
        END

        -- 3️⃣ Kiểm tra sinh viên có cùng khoa với đề tài không
        IF EXISTS (
            SELECT 1
            FROM @Students s
            JOIN SINHVIEN sv ON s.MaSV = sv.MaSV
            WHERE sv.MaKhoa <> @MaKhoa
        )
        BEGIN
            RAISERROR(N'❌ Có sinh viên không cùng khoa với đề tài.', 16, 1);
            RETURN;
        END


        -- 2️⃣ Kiểm tra số lượng sinh viên <= 3
        DECLARE @count INT = (SELECT COUNT(*) FROM @Students);
        IF @count > 3
        BEGIN
            RAISERROR(N'⚠️ Mỗi đồ án chỉ được tối đa 3 sinh viên.', 16, 1);
            RETURN;
        END

        -- 3️⃣ Kiểm tra sinh viên tồn tại
        IF EXISTS (
            SELECT 1
            FROM @Students s
            WHERE NOT EXISTS (SELECT 1 FROM SINHVIEN WHERE MaSV = s.MaSV)
        )
        BEGIN
            RAISERROR(N'❌ Có sinh viên không tồn tại trong hệ thống.', 16, 1);
            RETURN;
        END

        -- 4️⃣ Kiểm tra sinh viên đã có đồ án khác cùng năm học
        IF EXISTS (
            SELECT 1
            FROM @Students s
            INNER JOIN DETAI d_new ON d_new.MaDT = @MaDoAn
            INNER JOIN DETAI_SINHVIEN ds ON s.MaSV = ds.MaSV
            INNER JOIN DETAI d_old ON ds.MaDT = d_old.MaDT
            WHERE d_old.MaNamHoc = d_new.MaNamHoc
              AND ds.MaDT <> @MaDoAn
        )
        BEGIN
            RAISERROR(N'⚠️ Có sinh viên đã tham gia đồ án khác trong cùng năm học.', 16, 1);
            RETURN;
        END

        -- 5️⃣ Xóa danh sách cũ
        DELETE FROM DETAI_SINHVIEN WHERE MaDT = @MaDoAn;

        -- 6️⃣ Thêm danh sách mới
        INSERT INTO DETAI_SINHVIEN(MaDT, MaSV)
        SELECT @MaDoAn, MaSV FROM @Students;

        COMMIT TRANSACTION;
        PRINT N'✔ Cập nhật danh sách sinh viên cho đồ án thành công.';
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
    @MaSV VARCHAR(20),
    @MaGV VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (
            SELECT 1 
            FROM DETAI 
            WHERE MaDT = @MaDoAn 
              AND MaGVHuongDan = @MaGV
        )
        BEGIN
            RAISERROR(N'❌ Chỉ giảng viên hướng dẫn mới được phép xóa sinh viên khỏi đồ án.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END
        -- Kiểm tra sinh viên có trong đồ án không
        IF NOT EXISTS(
            SELECT 1 
            FROM DETAI_SINHVIEN 
            WHERE MaDT = @MaDoAn AND MaSV = @MaSV
        )
            RAISERROR(N'❌ Sinh viên không tồn tại trong đồ án.', 16, 1);
        IF EXISTS(
            SELECT 1
            FROM Diem
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
CREATE TYPE StudentScoreType AS TABLE
(
    MaSV VARCHAR(20),
    Diem FLOAT NULL
);
GO

CREATE OR ALTER PROC usp_updateStudentScores
    @MaDoAn VARCHAR(20),
    @MaGV   VARCHAR(20),
    @Scores StudentScoreType READONLY
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1️⃣ Kiểm tra đồ án có hợp lệ không
        IF NOT EXISTS (SELECT 1 FROM DETAI WHERE MaDT = @MaDoAn)
        BEGIN
            RAISERROR(N'❌ Mã đồ án không hợp lệ.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- 2️⃣ Kiểm tra có hội đồng chưa
        IF EXISTS (
            SELECT 1
            FROM DETAI
            WHERE MaDT = @MaDoAn AND MaHD IS NULL
        )
        BEGIN
            RAISERROR(N'❌ Đồ án này chưa có hội đồng nên chưa cho chấm điểm.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- 🧩 3.5 Kiểm tra sinh viên có đề tài mới hơn (niên khóa cao hơn)
        IF EXISTS (
            SELECT 1
            FROM @Scores s
            JOIN DETAI_SINHVIEN ds_old ON ds_old.MaSV = s.MaSV         -- đề tài cũ
            JOIN DETAI dt_old ON dt_old.MaDT = ds_old.MaDT
            JOIN DETAI_SINHVIEN ds_new ON ds_new.MaSV = s.MaSV          -- đề tài khác
            JOIN DETAI dt_new ON dt_new.MaDT = ds_new.MaDT
            WHERE dt_old.MaDT = @MaDoAn
            AND dt_new.MaDT <> dt_old.MaDT
            AND dt_new.MaNamHoc > dt_old.MaNamHoc                     -- có đề tài niên khóa cao hơn
        )
        BEGIN
            RAISERROR(N'⚠️ Một hoặc nhiều sinh viên đã có đề tài mới (niên khóa cao hơn), không được cập nhật điểm cho đề tài cũ.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- 5️⃣ Cập nhật hoặc thêm mới điểm từng sinh viên
        MERGE Diem AS target
        USING (
            SELECT MaSV, Diem FROM @Scores
        ) AS src
        ON target.MaDT = @MaDoAn 
           AND target.MaSV = src.MaSV
           AND target.MaGV = @MaGV
        WHEN MATCHED THEN
            UPDATE SET target.Diem = ISNULL(src.Diem, target.Diem)
        WHEN NOT MATCHED THEN
            INSERT (MaDT, MaSV, Diem, MaGV)
            VALUES (@MaDoAn, src.MaSV, src.Diem, @MaGV);

        COMMIT TRANSACTION;
        PRINT N'✔ Cập nhật điểm sinh viên hàng loạt thành công.';

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrMsg, 16, 1);
    END CATCH
END;
GO
-- =============================================
-- Tìm vai trò của giảng viên trong đề tài
-- =============================================
CREATE OR ALTER FUNCTION fn_GetVaiTroGiangVien
(
    @MaDT VARCHAR(20),
    @MaGV VARCHAR(20)
)
RETURNS NVARCHAR(10)
AS
BEGIN
    DECLARE @VaiTro NVARCHAR(10);

    SELECT @VaiTro =
        CASE 
            WHEN D.MaGVHuongDan = @MaGV THEN N'GVHD'
            WHEN HD.MaGVChuTich = @MaGV THEN N'GVCT'
            WHEN HD.MaGVPhanBien = @MaGV THEN N'GVPB'
            ELSE N'Không xác định'
        END
    FROM DETAI D
    LEFT JOIN HOIDONG HD ON D.MaHD = HD.MaHD
    WHERE D.MaDT = @MaDT;

    RETURN @VaiTro;
END
GO
-- =============================================
-- DANH SÁCH ĐIỂM trong đề tài
-- =============================================
CREATE OR ALTER PROC usp_listScoreInDoAn
    @MaDoAn VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH KETQUA_BAOVE AS (
        SELECT
            d.MaDT,
            d.MaSV,
            MAX(CASE WHEN dbo.fn_GetVaiTroGiangVien(d.MaDT, d.MaGV) = 'GVHD' THEN d.Diem END) AS DiemGVHuongDan,
            MAX(CASE WHEN dbo.fn_GetVaiTroGiangVien(d.MaDT, d.MaGV) = 'GVCT' THEN d.Diem END) AS DiemGVChuTich,
            MAX(CASE WHEN dbo.fn_GetVaiTroGiangVien(d.MaDT, d.MaGV) = 'GVPB' THEN d.Diem END) AS DiemGVPhanBien
        FROM Diem AS d
        WHERE d.MaDT = @MaDoAn
        GROUP BY d.MaDT, d.MaSV
    )

    SELECT 
        SV.MaSV,
        SV.TenSV,
        SV.DiaChi,
        SV.SoDienThoai,
        KB.DiemGVHuongDan,
        KB.DiemGVChuTich,
        KB.DiemGVPhanBien,
        MaGVHuongDan,
        MaGVChuTich,
        MaGVPhanBien,
        DS.DiemTrungBinh,
        DS.KetQua
    FROM DETAI_SINHVIEN AS DS
    INNER JOIN SINHVIEN AS SV
        ON DS.MaSV = SV.MaSV
    INNER JOIN DETAI D ON D.MaDT = DS.MaDT
    LEFT JOIN HOIDONG HD ON D.MaHD = HD.MaHD
    LEFT JOIN KETQUA_BAOVE AS KB
        ON DS.MaDT = KB.MaDT AND DS.MaSV = KB.MaSV
    WHERE DS.MaDT = @MaDoAn;
END
GO

-- =============================================
-- Lấy danh sách đề tài trong một hồi đồng
-- =============================================
CREATE OR ALTER PROC usp_listDoanInHoiDong
    @MaHD VARCHAR(20),
    @limit INT = 10,
    @skip INT = 0
AS
BEGIN
    SET NOCOUNT ON;

    -- Biến tổng bản ghi
    DECLARE @TotalRecords INT;

    -- 1️⃣ Đếm tổng số đề tài trong hội đồng
    SELECT @TotalRecords = COUNT(*)
    FROM DETAI
    WHERE MaHD = @MaHD;

    -- 2️⃣ Lấy dữ liệu đề tài theo hội đồng với phân trang
    SELECT 
        D.MaDT,
        D.TenDT,
        D.MaNamHoc,
        D.MaGVHuongDan,
        GV.TenGV AS TenGVHuongDan,
        D.ThoiGianBatDau,
        D.ThoiGianKetThuc,
        D.MaKhoa,
        COUNT(DV.MaSV) AS SoSV,
        D.UpdatedAt
    FROM DETAI AS D
    INNER JOIN GIAOVIEN AS GV ON D.MaGVHuongDan = GV.MaGV
    LEFT JOIN DETAI_SINHVIEN AS DV ON DV.MaDT = D.MaDT
    WHERE D.MaHD = @MaHD
    GROUP BY 
        D.MaDT,
        D.TenDT,
        D.MaNamHoc,
        D.MaGVHuongDan,
        GV.TenGV,
        D.ThoiGianBatDau,
        D.ThoiGianKetThuc,
        D.MaKhoa,
        D.UpdatedAt
    ORDER BY D.ThoiGianBatDau ASC
    OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY;

    -- 3️⃣ Thông tin phân trang
    DECLARE @TotalPages INT = CEILING(1.0 * @TotalRecords / NULLIF(@limit,0));
    DECLARE @CurrentPage INT = (@skip / NULLIF(@limit,1)) + 1;

    SELECT 
        @TotalRecords AS TotalRecords,
        @TotalPages AS TotalPages,
        @CurrentPage AS CurrentPage;
END
GO

-- Kiểu dữ liệu dạng bảng chứa nhiều file
CREATE TYPE FileListType AS TABLE
(
    TenTL NVARCHAR(500),
    Url NVARCHAR(250)
);
GO

CREATE TYPE FileUrlListType AS TABLE (
    Url NVARCHAR(250)
)
GO
-- =============================================
-- Thêm tài liệu vào đề tài
-- =============================================
CREATE OR ALTER PROC usp_addFile
    @MaDT VARCHAR(20),
    @FileList FileListType READONLY
AS
BEGIN
    SET NOCOUNT ON;

    -- 🔍 Kiểm tra xem đề tài có tồn tại không
    IF NOT EXISTS (SELECT 1 FROM DETAI WHERE MaDT = @MaDT)
    BEGIN
        RAISERROR(N'❌ Mã đề tài không tồn tại trong hệ thống.', 16, 1);
        RETURN;
    END;

    DELETE FROM TAILIEU
    WHERE MaDT = @MaDT
    -- ✅ Thêm danh sách file vào bảng TAILIEU
    INSERT INTO TAILIEU (MaDT, TenTL,Url)
    SELECT @MaDT, TenTL,Url
    FROM @FileList;

    PRINT N'✅ Thêm file thành công cho đề tài ' + @MaDT;
END;
GO
-- =============================================
-- Lấy thông tin tài liệu
-- =============================================
CREATE OR ALTER PROC usp_getFile
    @MaDT VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    -- ✅ Lấy danh sách file
    SELECT *
    FROM TAILIEU
    WHERE MaDT = @MaDT
    ORDER BY MaTL DESC;
END;
GO
-- =============================================
-- Xóa tài liệu
-- =============================================
CREATE OR ALTER PROC usp_deleteFile
    @MaDT VARCHAR(20),
    @FileUrl FileUrlListType READONLY
AS
BEGIN
    SET NOCOUNT ON;

    -- 🔍 Kiểm tra đề tài
    IF NOT EXISTS (SELECT 1 FROM DETAI WHERE MaDT = @MaDT)
    BEGIN
        RAISERROR(N'❌ Mã đề tài không tồn tại.', 16, 1);
        RETURN;
    END;

   -- 🔍 Kiểm tra file tồn tại trong đề tài
    IF EXISTS (
        SELECT 1
        FROM @FileUrl f
        WHERE NOT EXISTS (
            SELECT 1
            FROM TAILIEU t
            WHERE t.MaDT = @MaDT
              AND t.Url = f.Url
        )
    )
    BEGIN
        RAISERROR(N'❌ Một hoặc nhiều file không tồn tại hoặc không thuộc đề tài này.', 16, 1);
        RETURN;
    END;


  -- Xóa file nếu hợp lệ
    DELETE FROM TAILIEU
    WHERE MaDT = @MaDT
      AND Url IN (SELECT Url FROM @FileUrl);

    PRINT N'✅ Đã xóa file thành công.';
END;
GO
-- =============================================
-- Lấy danh sách đề tài theo học sinh
-- =============================================
CREATE OR ALTER PROC usp_getProjectStudent
    @MaSV VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra sinh viên có tồn tại không
    IF NOT EXISTS (SELECT 1 FROM SINHVIEN WHERE MaSV = @MaSV)
    BEGIN
        RAISERROR(N'Sinh viên không tồn tại.', 16, 1);
        RETURN;
    END

    SELECT 
        DS.MaSV,
        D.MaDT,
        D.TenDT,
        D.MaKhoa,
        G.TenGV AS TenGVHuongDan,
        D.ThoiGianBatDau,
        D.ThoiGianKetThuc,
        D.MaNamHoc
    FROM DETAI_SINHVIEN DS
    INNER JOIN DETAI D ON DS.MaDT = D.MaDT
    INNER JOIN GIAOVIEN G ON D.MaGVHuongDan = G.MaGV
    WHERE DS.MaSV = @MaSV;
END
GO
-- =============================================
-- Lấy danh sách khoa
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
    FROM KHOA
    WHERE 
        (@search IS NULL OR TenKhoa LIKE N'%' + @search + N'%')
    ORDER BY TenKhoa
    OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY;
END;
GO
-- =============================================
-- Lấy danh sách năm học
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
-- Thống kê điểm theo khoa
-- =============================================
CREATE OR ALTER PROC usp_reportFaculty
    @year VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH FacultyStats AS (
        SELECT
            DT.MaKhoa,
            MIN(KBV.DiemTrungBinh) AS DiemMin,
            MAX(KBV.DiemTrungBinh) AS DiemMax,
            AVG(KBV.DiemTrungBinh) AS DiemTB,
            COUNT(DISTINCT KBV.MaDT) AS SoDeTai,
            COUNT(DISTINCT KBV.MaSV) AS SoSV,
            SUM(CASE WHEN KBV.DiemTrungBinh >= 5 THEN 1 ELSE 0 END) AS SoSVDau,
            SUM(CASE WHEN KBV.DiemTrungBinh < 5 THEN 1 ELSE 0 END) AS SoSVRot
        FROM DETAI_SINHVIEN AS KBV
        JOIN DETAI AS DT ON KBV.MaDT = DT.MaDT
        WHERE KBV.DiemTrungBinh IS NOT NULL
          AND (@year IS NULL OR DT.MaNamHoc = @year)
        GROUP BY DT.MaKhoa
    )
    SELECT 
        F.MaKhoa,
        K.TenKhoa,
        CAST(ROUND(ISNULL(DiemMin, 0), 2) AS DECIMAL(5,2)) AS DiemMin,
        CAST(ROUND(ISNULL(DiemMax, 0), 2) AS DECIMAL(5,2)) AS DiemMax,
        CAST(ROUND(ISNULL(DiemTB, 0), 2) AS DECIMAL(5,2)) AS DiemTB,
        ISNULL(SoDeTai, 0) AS SoDeTai,
        ISNULL(SoSV, 0) AS SoSV,
        CAST(ISNULL(ROUND(SoSVDau * 100.0 / NULLIF(SoSV, 0), 2), 0) AS DECIMAL(5,2)) AS TiLeDau,
        CAST(ISNULL(ROUND(SoSVRot * 100.0 / NULLIF(SoSV, 0), 2), 0) AS DECIMAL(5,2)) AS TiLeRot
    FROM FacultyStats AS F
    JOIN KHOA AS K ON F.MaKhoa = K.MaKhoa
    ORDER BY DiemTB DESC;
END;
GO
-- =============================================
-- Thông kê điểm theo giáo viên hướng dẫn
-- =============================================
CREATE OR ALTER PROC usp_reportTeacher
    @limit INT = 10,
    @skip INT = 0,
    @year VARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH Stats AS (
        SELECT
            GV.MaGV,
            GV.TenGV,
            GV.MaKhoa,
            COUNT(DISTINCT LR.MaDT) AS SoDeTai,
            COUNT(DISTINCT LR.MaSV) AS SoSV,
            AVG(LR.DiemTrungBinh) AS DiemTB,
            MIN(LR.DiemTrungBinh) AS DiemMin,
            MAX(LR.DiemTrungBinh) AS DiemMax,
            SUM(CASE WHEN LR.DiemTrungBinh >= 5 THEN 1 ELSE 0 END) AS SoSVDau,
            SUM(CASE WHEN LR.DiemTrungBinh < 5 THEN 1 ELSE 0 END) AS SoSVRot
        FROM DETAI_SINHVIEN AS LR
        JOIN DETAI AS DT ON DT.MaDT = LR.MaDT
        JOIN GIAOVIEN AS GV ON GV.MaGV = DT.MaGVHuongDan
        WHERE LR.DiemTrungBinh IS NOT NULL
          AND (@year IS NULL OR DT.MaNamHoc = @year)
        GROUP BY GV.MaGV, GV.TenGV, GV.MaKhoa
    ),
    Ranked AS (
        SELECT
            *,
            CAST(ROUND(ISNULL(DiemTB, 0), 2) AS DECIMAL(5,2)) AS DiemTB_Rounded,
            CAST(ISNULL(ROUND(SoSVDau * 100.0 / NULLIF(SoSV, 0), 2), 0) AS DECIMAL(5,2)) AS TiLeDau,
            CAST(ISNULL(ROUND(SoSVRot * 100.0 / NULLIF(SoSV, 0), 2), 0) AS DECIMAL(5,2)) AS TiLeRot,
            COUNT(*) OVER() AS TotalCount,  -- Tổng số dòng (window function)
            ROW_NUMBER() OVER (ORDER BY AVG(LR.DiemTrungBinh) DESC, GV.TenGV ASC) AS RowNum
        FROM Stats
    )
    SELECT 
        MaGV, TenGV, K.MaKhoa,
        K.TenKhoa,
        SoDeTai, SoSV,
        DiemTB_Rounded AS DiemTB,
        DiemMin, DiemMax,
        TiLeDau, TiLeRot,
        TotalCount
    FROM Ranked R
    JOIN KHOA K ON R.MaKhoa = K.MaKhoa
    WHERE RowNum > @skip AND RowNum <= (@skip + @limit)
    ORDER BY RowNum;
END;
GO
-- =============================================
-- Chức năng đăng nhập
-- ==========================================
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
        LEFT JOIN KHOA K ON K.MaKhoa = U.MaKhoa
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
