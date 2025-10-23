-- SỮ LÍ DATABASE CƠ KHÍ --
IF NOT EXISTS (
    SELECT name 
    FROM sys.databases 
    WHERE name = N'DBTN_CK'
)
BEGIN
    CREATE DATABASE DBTN_CK;
END
GO


USE DBTN_CK-- Gỡ tất cả foreign key trước


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
        UpdatedAt DATETIME DEFAULT GETDATE()
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
        UpdatedAt DATETIME DEFAULT GETDATE()
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
        FOREIGN KEY (MaGVChuTich) REFERENCES GIAOVIEN(MaGV),
        FOREIGN KEY (MaGVThuKy)   REFERENCES GIAOVIEN(MaGV),
        FOREIGN KEY (MaGVPhanBien) REFERENCES GIAOVIEN(MaGV)
    );
END
GO
-- ===============================
-- 7. Bảng ĐỒ ÁN
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
-- 8. Bảng TÀI LIỆU
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
-- 8. Bảng Diem
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
        Nam CHAR(2),         -- Năm (2 số cuối)       -- SV / GV / DT
        STT INT NOT NULL,
        PRIMARY KEY(Nam)
    );
END
GO

-- ===============================
-- TẠO TRIGGER
-- ===============================
-- =============================================
-- Trigger để kiểm tra điểm hợp lệ (từ 0 đến 10) trước khi chèn/cập nhật
-- =============================================
CREATE OR ALTER TRIGGER tr_checkScore
ON Diem
FOR INSERT, UPDATE
AS
BEGIN
    IF EXISTS (
        SELECT 1
        FROM inserted
        WHERE Diem <0 OR Diem >10
    )
    BEGIN
        RAISERROR(N'Điểm phải nằm trong khoảng từ 0 đến 10.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END;
GO
-- ===============================
-- TRIGGER: Cập nhật KetQua trong DOAN_MEMBER sau khi có điểm (DIEM)
--  - KetQua = 'Đậu' nếu trung bình điểm tất cả GV cho (MaDoAn,MaSV) >= 5
--  - Ngược lại 'Rớt'
-- ===============================
CREATE OR ALTER TRIGGER trg_UpdateKetQuaAfterDiem
ON Diem
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Affected TABLE (MaDT VARCHAR(20), MaSV VARCHAR(20));

    INSERT INTO @Affected (MaDT, MaSV)
    SELECT DISTINCT MaDT, MaSV
    FROM (
        SELECT MaDT, MaSV FROM inserted
        UNION
        SELECT MaDT, MaSV FROM deleted
    ) t
    WHERE MaDT IS NOT NULL AND MaSV IS NOT NULL;

    -- Cập nhật khi đủ 3 điểm
    UPDATE ds
    SET 
        ds.DiemTrungBinh = agg.AvgScore,
        ds.KetQua = CASE 
                        WHEN agg.AvgScore >= 5 THEN N'Đậu'
                        ELSE N'Rớt'
                    END
    FROM DETAI_SINHVIEN ds
    INNER JOIN (
        SELECT 
            kq.MaDT, 
            kq.MaSV,
            ROUND(AVG(kq.Diem), 1) AS AvgScore
        FROM Diem kq
        GROUP BY kq.MaDT, kq.MaSV
        HAVING COUNT(kq.Diem) = 3
    ) agg ON ds.MaDT = agg.MaDT AND ds.MaSV = agg.MaSV
    INNER JOIN @Affected a ON a.MaDT = ds.MaDT AND a.MaSV = ds.MaSV;

    -- Cập nhật NULL nếu chưa đủ điểm
    UPDATE ds
    SET 
        ds.DiemTrungBinh = NULL,
        ds.KetQua = NULL
    FROM DETAI_SINHVIEN ds
    INNER JOIN @Affected a ON a.MaDT = ds.MaDT AND a.MaSV = ds.MaSV
    WHERE NOT EXISTS (
        SELECT 1 
        FROM Diem kq
        WHERE kq.MaDT = ds.MaDT AND kq.MaSV = ds.MaSV
    );
END
GO

-- =============================================
-- TRIGGER KIỂM TRA NGAY BAT DAU NHO HON NGAY KET THUC DOAN
-- =============================================
CREATE OR ALTER TRIGGER trg_checkDate_DOAN
ON DETAI
FOR INSERT, UPDATE
AS
BEGIN
    -- Kiểm tra ngày
    IF EXISTS (
        SELECT 1
        FROM inserted
        WHERE ThoiGianBatDau IS NOT NULL 
          AND ThoiGianKetThuc IS NOT NULL
          AND ThoiGianBatDau > ThoiGianKetThuc
    )
    BEGIN
        RAISERROR(N'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc!', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END;
GO
-- =============================================
-- TRIGGER KIỂM TRA NGAY NGÀY KẾT THÚC PHẢI NHỎ HƠN HOẶC BẰNG NGÀY BẢO VỆ
-- =============================================
CREATE OR ALTER TRIGGER trg_CheckAddProjectInCouncil
ON DETAI
AFTER INSERT,UPDATE
AS
BEGIN
    IF EXISTS (
            SELECT 1
            FROM INSERTED I
                JOIN HOIDONG H ON I.MaHD = H.MaHD
            WHERE I.ThoiGianKetThuc > H.NgayBaoVe OR i.MaNamHoc <> h.MaNamHoc
        )
        BEGIN
            RAISERROR(
                N'Ngày kết thúc phải nhỏ hơn hoặc bằng ngày bảo vệ hội đồng hoặc không cùng niên khóa', 
                16, 1
            )
            ROLLBACK TRANSACTION;
            RETURN;
        END
END
GO
-- ===============================
-- TRIGGER: kiểm tra ThoiGianBatDau/KetThuc của DOAN phù hợp NAMHOC
-- ===============================
CREATE OR ALTER TRIGGER trg_CheckThoiGianDoan
ON DETAI
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @TenNamHoc NVARCHAR(100),
            @BatDau DATE,
            @KetThuc DATE,
            @ErrMsg NVARCHAR(400);

    -- Kiểm tra có bản ghi nào sai phạm thời gian không
    SELECT TOP 1
        @TenNamHoc = n.MaNamHoc,
        @BatDau = n.ThoiGianBatDau,
        @KetThuc = n.ThoiGianKetThuc
    FROM inserted i
    JOIN DBTN.dbo.NAMHOC n WITH (NOLOCK) ON i.MaNamHoc = n.MaNamHoc
    WHERE
        (i.ThoiGianBatDau IS NOT NULL AND 
         (i.ThoiGianBatDau < n.ThoiGianBatDau OR i.ThoiGianBatDau > n.ThoiGianKetThuc))
        OR
        (i.ThoiGianKetThuc IS NOT NULL AND 
         (i.ThoiGianKetThuc < n.ThoiGianBatDau OR i.ThoiGianKetThuc > n.ThoiGianKetThuc));

    -- Nếu có vi phạm → báo lỗi chi tiết
    IF @TenNamHoc IS NOT NULL
    BEGIN
        SET @ErrMsg = N'Thời gian đề tài phải nằm trong khoảng [' 
                      + CONVERT(NVARCHAR(10), @BatDau, 23)
                      + N' → ' 
                      + CONVERT(NVARCHAR(10), @KetThuc, 23)
                      + N'] của năm học ' 
                      + @TenNamHoc + N'!';

        RAISERROR(@ErrMsg, 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END
GO

CREATE OR ALTER TRIGGER trg_Update_TAILIEU
ON TAILIEU
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE TAILIEU
    SET UpdatedAt = GETDATE()
    WHERE MaTL IN (SELECT DISTINCT MaTL FROM Inserted);
END;
GO

-- ===============================
-- TRIGGER: kiểm tra NgayBaoVe của HOIDONG phù hợp NAMHOC
-- ===============================
CREATE OR ALTER TRIGGER trg_CheckNgayBaoVeHoiDong
ON HOIDONG
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE 
        @TenNamHoc NVARCHAR(100),
        @BatDau DATE,
        @KetThuc DATE,
        @ErrMsg NVARCHAR(400);

    -- Kiểm tra có bản ghi nào có NgayBaoVe nằm ngoài thời gian của năm học
    SELECT TOP 1
        @TenNamHoc = n.Manamhoc,
        @BatDau = n.ThoiGianBatDau,
        @KetThuc = n.ThoiGianKetThuc
    FROM inserted i
    JOIN DBTN.dbo.NAMHOC n WITH(NOLOCK) ON i.MaNamHoc = n.MaNamHoc
    WHERE i.NgayBaoVe IS NOT NULL
      AND (i.NgayBaoVe < n.ThoiGianBatDau OR i.NgayBaoVe > n.ThoiGianKetThuc);

    -- Nếu có vi phạm → báo lỗi chi tiết
    IF @TenNamHoc IS NOT NULL
    BEGIN
        SET @ErrMsg = N'Ngày bảo vệ phải nằm trong khoảng [' 
                      + CONVERT(NVARCHAR(10), @BatDau, 23)
                      + N' → ' 
                      + CONVERT(NVARCHAR(10), @KetThuc, 23)
                      + N'] của năm học ' 
                      + @TenNamHoc + N'!';

        RAISERROR(@ErrMsg, 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END
GO

-- ===============================
-- TRIGGER: giới hạn tối đa 3 SV trên 1 DOAN
--   (sẽ rollback nếu sau insert số SV > 3)
-- ===============================
CREATE OR ALTER TRIGGER trg_DoAnMember_Limit3
ON DETAI_SINHVIEN
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT dm.MaDT
        FROM DETAI_SINHVIEN dm
        JOIN (
            SELECT MaDT, COUNT(*) AS Cnt FROM DETAI_SINHVIEN GROUP BY MaDT
        ) c ON dm.MaDT = c.MaDT
        WHERE c.Cnt > 3
    )
    BEGIN
        RAISERROR(N'Không được quá 3 sinh viên trên 1 đồ án!', 16, 1);
        ROLLBACK TRANSACTION;
    END
END
GO
-- ===============================
-- TRIGGER: Kiểm tra giáo viên trong hội đồng phải khác nhau
-- ===============================
CREATE OR ALTER TRIGGER trg_CheckHoiDongGV_KhacNhau
ON HOIDONG
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM inserted
        WHERE MaGVChuTich = MaGVThuKy
           OR MaGVChuTich = MaGVPhanBien
           OR MaGVThuKy = MaGVPhanBien
    )
    BEGIN
        RAISERROR(N'Chủ tịch, Thư ký, Phản biện phải là các giáo viên khác nhau!', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END
GO
-- ===============================
-- TRIGGERs tự động cập nhật UpdatedAt cho bảng DOAN, DETAI, SINHVIEN, GIAOVIEN, HOIDONG,,KHOA,HUONGDAN khi UPDATE
-- ===============================
-- DOAN
CREATE OR ALTER TRIGGER trg_UpdateAt_DOAN
ON DETAI
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE DETAI SET UpdatedAt = GETDATE() WHERE MaDT IN (SELECT MaDT FROM inserted);
END
GO
-- SINHVIEN
CREATE OR ALTER TRIGGER trg_UpdateAt_SINHVIEN
ON SINHVIEN
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE SINHVIEN SET UpdatedAt = GETDATE() WHERE MaSV IN (SELECT MaSV FROM inserted);
END
GO
-- GIAOVIEN
CREATE OR ALTER TRIGGER trg_UpdateAt_GIAOVIEN
ON GIAOVIEN
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE GIAOVIEN SET UpdatedAt = GETDATE() WHERE MaGV IN (SELECT MaGV FROM inserted);
END
GO
-- HOIDONG
CREATE OR ALTER TRIGGER trg_UpdateAt_HOIDONG
ON HOIDONG
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE HOIDONG SET UpdatedAt = GETDATE() WHERE MaHD IN (SELECT MaHD FROM inserted);
END
GO

-- ===============================
-- TRIGGERS Kiểm tra thêm sinh viên vào đồ án
-- ===============================

CREATE OR ALTER TRIGGER trg_DETAI_SINHVIEN_BlockPassedStudent
ON DETAI_SINHVIEN
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    -- ❌ 2️⃣ Kiểm tra sinh viên đã tham gia đủ 2 đề tài
    IF EXISTS (
        SELECT i.MaSV
        FROM inserted i
        JOIN DETAI_SINHVIEN ds ON i.MaSV = ds.MaSV
        GROUP BY i.MaSV
        HAVING COUNT(ds.MaDT) > 2
    )
    BEGIN
        RAISERROR(N'Sinh viên chỉ được tham gia tối đa 2 đề tài.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
    IF EXISTS (
        SELECT i.MaSV
        FROM inserted i
        JOIN DETAI_SINHVIEN ds ON ds.MaSV = i.MaSV
        WHERE ds.DiemTrungBinh >=5
    )
    BEGIN
        RAISERROR(N'Sinh viên đã đậu nên không thể thi nữa', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;

END;
GO

CREATE OR ALTER TRIGGER trg_BlockUpdateOldProject
ON Diem
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM deleted d
        JOIN DETAI oldDT ON d.MaDT = oldDT.MaDT
        JOIN DETAI_SINHVIEN ds_new ON ds_new.MaSV = d.MaSV
        JOIN DETAI newDT ON ds_new.MaDT = newDT.MaDT
        WHERE newDT.ThoiGianBatDau > oldDT.ThoiGianBatDau
    )
    BEGIN
        RAISERROR(N'Sinh viên đã có đề tài mới hơn, không được cập nhật kết quả đề tài cũ.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END
GO
-- ===============================
-- TRIGGER: Chặn thao tác sau khi hết hạn đề tài
-- ===============================
CREATE OR ALTER TRIGGER trg_BlockEditAfterDeadline
ON DIEM
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra xem có đề tài nào đã hết hạn mà vẫn bị thao tác
    IF EXISTS (
        SELECT 1
        FROM (
            SELECT MaDT FROM inserted
            UNION
            SELECT MaDT FROM deleted
        ) AS t
        JOIN DETAI d ON t.MaDT = d.MaDT
        WHERE GETDATE() > d.ThoiGianKetThuc
    )
    BEGIN
        RAISERROR(N'Không thể thêm, sửa hoặc xóa điểm vì đề tài đã quá hạn nộp!', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END
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
        WHERE Nam=@Nam 
    )
    BEGIN
        INSERT INTO Dem(Nam, STT) 
        VALUES(@Nam,0);
    END

    -- Tăng STT
    UPDATE Dem
    SET STT = STT + 1
    WHERE Nam=@Nam 

    SELECT @NewSTT = STT 
    FROM Dem 
    WHERE Nam=@Nam

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
        WHERE 
                ( @search IS NULL 
                OR TenSV LIKE N''%'' + @search + N''%'' 
                OR SV.MaSV LIKE N''%'' + @search + N''%'' )
    ';

    CREATE TABLE #CountResult (TotalRecords INT);

    INSERT INTO #CountResult
    EXEC sp_executesql @sqlCount,
        N'@search NVARCHAR(250)',
        @search;

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
    GROUP BY SV.MaSV, SV.TenSV, SV.MaKhoa, DiaChi, SoDienThoai
    ORDER BY SV.' + QUOTENAME(@SortBy) + ' ' + @SortOrder + '
    OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY;
';


    EXEC sp_executesql @sql,
        N'@search NVARCHAR(250), @skip INT, @limit INT',
        @search, @skip, @limit;

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
            INNER JOIN DBTN.dbo.KHOA_MAP  AS K WITH (NOLOCK)
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
    @search NVARCHAR(250) = NULL,    -- từ khóa tìm kiếm
    @limit INT = 10,                 -- số bản ghi mỗi trang
    @skip INT = 0,                   -- số bản ghi bỏ qua
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
    WHERE 
          (@search IS NULL 
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
            GV.MaKhoa
        FROM GIAOVIEN AS GV
        WHERE 
              (@search IS NULL 
               OR GV.TenGV LIKE N''%'' + @search + N''%'' 
               OR GV.MaGV LIKE N''%'' + @search + N''%'')
        ORDER BY ' + QUOTENAME(@SortBy) + ' ' + @SortOrder + '
        OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY;
    ';

    EXEC sp_executesql @sql,
        N'@search NVARCHAR(250), @skip INT, @limit INT',
        @search, @skip, @limit;

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
            INNER JOIN DBTN.dbo.KHOA_MAP k WITH (NOLOCK)
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
        N'@MaGV VARCHAR(20), @MaNamHoc NVARCHAR(20), @search NVARCHAR(250)',
        @MaGV = @MaGV, @MaNamHoc = @MaNamHoc, @search = @search;

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
        N'@MaGV VARCHAR(20), @MaNamHoc NVARCHAR(20), @search NVARCHAR(250), @skip INT, @limit INT',
        @MaGV = @MaGV, @MaNamHoc = @MaNamHoc, @search = @search, @skip = @skip, @limit = @limit;

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

        IF NOT EXISTS(SELECT 1 FROM DBTN.dbo.NAMHOC WITH (NOLOCK) WHERE MaNamHoc = @MaNamHoc)
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
        INNER JOIN DBTN.dbo.KHOA_MAP AS K WITH (NOLOCK) ON K.MaKhoa = HD.MaKhoa
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
    @MaHD VARCHAR(20) = NULL,
    @MaNamHoc VARCHAR(20) = NULL,
    @MaGV VARCHAR(20) = NULL,
    @SortBy NVARCHAR(50) = 'ThoiGianBatDau',
    @SortOrder NVARCHAR(4) = 'ASC'
AS
BEGIN
    SET NOCOUNT ON;

    -------------------------------
    -- 1. Validate Sort
    -------------------------------
    IF @SortBy NOT IN ('ThoiGianBatDau','ThoiGianKetThuc','TenDT','UpdatedAt')
        SET @SortBy = 'TenDT';

    IF UPPER(@SortOrder) NOT IN ('ASC','DESC')
        SET @SortOrder = 'ASC';

    -------------------------------
    -- 2. Chuẩn bị biến search
    -------------------------------
    DECLARE @searchPattern NVARCHAR(255) = 
        CASE WHEN @search IS NULL OR LEN(@search)=0 THEN NULL ELSE N'%' + @search + N'%' END;

    -------------------------------
    -- 3. Đếm tổng bản ghi
    -------------------------------
    DECLARE @TotalRecords INT;
    DECLARE @sqlCount NVARCHAR(MAX) = N'
        SELECT @TotalRecordsOut = COUNT(DISTINCT D.MaDT)
        FROM DETAI AS D
        INNER JOIN GIAOVIEN AS GV ON D.MaGVHuongDan = GV.MaGV
        LEFT JOIN HOIDONG AS HD ON D.MaHD = HD.MaHD
        WHERE
              (@MaHD IS NULL OR D.MaHD = @MaHD)
          AND (@MaNamHoc IS NULL OR D.MaNamHoc = @MaNamHoc)
          AND (@MaGV IS NULL OR D.MaGVHuongDan = @MaGV OR HD.MaGVPhanBien = @MaGV OR HD.MaGVThuKy = @MaGV)
          AND (@searchPattern IS NULL
               OR D.MaDT LIKE @searchPattern
               OR D.TenDT LIKE @searchPattern
               OR GV.TenGV LIKE @searchPattern)
    ';

    EXEC sp_executesql 
        @sqlCount,
        N'@MaHD VARCHAR(20), @MaNamHoc VARCHAR(20), @MaGV VARCHAR(20), @searchPattern NVARCHAR(255), @TotalRecordsOut INT OUTPUT',
        @MaHD, @MaNamHoc, @MaGV, @searchPattern, @TotalRecords OUTPUT;

    -------------------------------
    -- 4. Lấy dữ liệu phân trang
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
        COUNT(DV.MaSV) AS SoSV,
        D.UpdatedAt
    FROM DETAI AS D
    INNER JOIN GIAOVIEN AS GV ON D.MaGVHuongDan = GV.MaGV
    LEFT JOIN DETAI_SINHVIEN AS DV ON DV.MaDT = D.MaDT
    LEFT JOIN HOIDONG AS HD ON D.MaHD = HD.MaHD
    WHERE (@MaHD IS NULL OR D.MaHD = @MaHD)
      AND (@MaNamHoc IS NULL OR D.MaNamHoc = @MaNamHoc)
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
        D.UpdatedAt
    ORDER BY ' + QUOTENAME(@SortBy) + ' ' + @SortOrder + '
    OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY
    ';

    EXEC sp_executesql @sql,
        N'@MaHD VARCHAR(20), @MaNamHoc VARCHAR(20), @MaGV VARCHAR(20), @searchPattern NVARCHAR(255), @skip INT, @limit INT',
        @MaHD, @MaNamHoc, @MaGV, @searchPattern, @skip, @limit;

    -------------------------------
    -- 5. Trả thông tin phân trang
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

        IF NOT EXISTS(SELECT 1 FROM DBTN.dbo.NAMHOC WITH (NOLOCK) WHERE MaNamHoc = @MaNamHoc)
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

        DECLARE @MaDT VARCHAR(20)
        EXEC usp_GetCode
            @KhoaCode = @MaKhoa,
            @Loai = 'DT',
            @NewCode = @MaDT OUTPUT;

        -- Insert đồ án
        INSERT INTO DETAI(MaDT,TenDT,MaKhoa, MaNamHoc, MaGVHuongDan, ThoiGianBatDau, ThoiGianKetThuc)
        VALUES (@MaDT,@TenDT,@MaKhoa, @MaNamHoc, @MaGVHuongDan, @ThoiGianBatDau, @ThoiGianKetThuc);

        COMMIT TRANSACTION;
        PRINT N'Tạo đồ án và gán sinh viên thành công.';

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
        IF NOT EXISTS (
            SELECT 1 
            FROM DETAI 
            WHERE MaDT = @MaDT 
              AND MaGVHuongDan = @MaGVHuongDan
        )
        BEGIN
            RAISERROR(N'❌ Chỉ giảng viên hướng dẫn mới được phép cập nhập đồ án.', 16, 1);
            ROLLBACK TRANSACTION;
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
        HD.DiaChiBaoVe
    FROM DETAI AS DA
        INNER JOIN GIAOVIEN AS GV
            ON GV.MaGV = DA.MaGVHuongDan
        INNER JOIN DBTN.dbo.KHOA_MAP K WITH (NOLOCK)
            ON K.MaKhoa = DA.MaKhoa
        LEFT JOIN HOIDONG AS HD
            ON HD.MaHD = DA.MaHD
    WHERE DA.MaDT = @MaDT;
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
        IF EXISTS(SELECT 1 FROM DETAI WHERE MaDT = @MaDoAn AND MaHD = @MaHoiDong)
        BEGIN
            RAISERROR(N'⚠️ Đồ án này đã được gán vào hội đồng rồi.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        UPDATE DETAI
        SET MaHD = @MaHoiDong
        WHERE MaDT = @MaDoAn
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
CREATE OR ALTER PROC usp_addStudentToDoAn
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
            RAISERROR(N'❌ Chỉ giảng viên hướng dẫn mới được phép thêm sinh viên vào đồ án.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

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
CREATE OR ALTER PROC usp_updateStudentScore
    @MaDoAn VARCHAR(20),
    @MaSV VARCHAR(20),
    @Diem FLOAT = NULL,
    @MaGV VARCHAR(20)
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

        -- 2️⃣ Kiểm tra có hội đồng hợp lệ
        IF  EXISTS (
            SELECT 1
            FROM DETAI
            WHERE MaDT = @MaDoAn AND MaHD IS NULL
        )
            RAISERROR(N'❌ Đồ án này chưa có hội đồng nên chưa cho chấm điểm.', 16, 1);

        -- 3️⃣ Kiểm tra tới thời gian chấm điểm chưa
        IF EXISTS (
            SELECT 1
            FROM DETAI D
                    JOIN HOIDONG HD 
                        ON D.MaHD = HD.MaHD
            WHERE D.MaDT = @MaDoAn
              AND GETDATE() < HD.NgayBaoVe
        )
            RAISERROR(N'❌ Chưa tới thời gian bảo vệ, không được chấm điểm.', 16, 1);
        IF EXISTS (
            SELECT 1 
            FROM DETAI D
            WHERE D.MaDT = @MaDoAn AND D.MaHD IS NULL

        )
            RAISERROR(N'❌ Chưa có hội đồng, không được chấm điểm.', 16, 1);
        -- 6️⃣ Update hoặc Insert
        IF EXISTS (
            SELECT 1 
            FROM Diem 
            WHERE MaDT = @MaDoAn AND MaSV = @MaSV AND MaGV = @MaGV
        )
        BEGIN
            UPDATE Diem
            SET
                Diem = ISNULL(@Diem, Diem)
            WHERE MaDT = @MaDoAn AND MaSV = @MaSV AND MaGV = @MaGV
        END
        ELSE
        BEGIN
            INSERT INTO Diem(MaDT, MaSV, Diem,MaGV)
            VALUES (@MaDoAn, @MaSV, @Diem,@MaGV);
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

CREATE OR ALTER PROCEDURE usp_getCouncilInStudent
    @MaSV VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT D.MaDT,D.TenDT,D.ThoiGianBatDau,D.ThoiGianKetThuc,GV.TenGV AS TenGVHuongDan,D.MaNamHoc
    FROM DETAI_SINHVIEN DS
            INNER JOIN DETAI D
                ON DS.MaDT = D.MaDT
            INNER JOIN GIAOVIEN GV
                ON GV.MaGV = D.MaGVHuongDan
    WHERE DS.MaSV = @MaSV
END
GO

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

CREATE OR ALTER PROC usp_ListDoanInSinhVien
    @MaSV VARCHAR(20)
AS
BEGIN
    SELECT D.MaDT,TenDT
    FROM DETAI D
        INNER JOIN DETAI_SINHVIEN DS
            ON D.MaDT = DS.MaDT
    WHERE DS.MaSV = @MaSV
END
GO

CREATE OR ALTER PROC usp_getFile
    @MaDT VARCHAR(20)
AS
BEGIN
    SELECT *
    FROM TAILIEU
    WHERE MaDT = MaDT
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

