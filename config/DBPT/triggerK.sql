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
    JOIN [DBTN].dbo.NAMHOC n WITH (NOLOCK) ON i.MaNamHoc = n.MaNamHoc
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
    JOIN [DBTN].dbo.NAMHOC n WITH(NOLOCK) ON i.MaNamHoc = n.MaNamHoc
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