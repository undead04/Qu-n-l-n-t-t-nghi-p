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


-- =============================================
-- Trigger để kiểm tra điểm hợp lệ (từ 0 đến 10) trước khi chèn/cập nhật
-- =============================================
CREATE OR ALTER TRIGGER tr_checkScore
ON KETQUA_BAOVE
FOR INSERT, UPDATE
AS
BEGIN
    IF EXISTS (
        SELECT 1
        FROM inserted
        WHERE (DiemGVHuongDan IS NOT NULL AND (DiemGVHuongDan < 0 OR DiemGVHuongDan > 10))
           OR (DiemGVPhanBien IS NOT NULL AND (DiemGVPhanBien < 0 OR DiemGVPhanBien > 10))
           OR (DiemGVChuTich IS NOT NULL AND (DiemGVChuTich < 0 OR DiemGVChuTich > 10))
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
ON KETQUA_BAOVE
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- Xác định các (MaDoAn, MaSV) bị ảnh hưởng
    ;WITH Affected AS (
        SELECT DISTINCT MaDT, MaSV,MaHD
        FROM (
            SELECT MaDT, MaSV,MaHD FROM inserted
            UNION
            SELECT MaDT, MaSV,MaHD FROM deleted
        ) t
    )
    -- Cập nhật kết quả cho sinh viên trong đồ án
    UPDATE ds
    SET KetQua = CASE 
                    WHEN agg.AvgScore >= 5 THEN N'Đậu' 
                    ELSE N'Rớt' 
                 END,
        DiemTrungBinh = ROUND(agg.AvgScore,1)
    FROM KETQUA_BAOVE ds
    JOIN (
        SELECT d.MaDT, d.MaSV,d.MaHD, (d.DiemGVChuTich+d.DiemGVHuongDan+d.DiemGVPhanBien)/3 AS AvgScore
        FROM KETQUA_BAOVE d
    ) agg ON ds.MaDT = agg.MaDT AND ds.MaSV = agg.MaSV AND ds.MaHD = agg.MaHD
    WHERE EXISTS (
        SELECT 1 
        FROM Affected a 
        WHERE a.MaDT = ds.MaDT AND a.MaSV = ds.MaSV AND a.MaHD = ds.MaHD
    );

    -- NOTE: Nếu sinh viên chưa có đủ điểm (vd thiếu giảng viên chấm) thì giữ NULL
END
GO
-- =============================================
-- TRIGGER KIỂM TRA NGAY BAT DAU NHO HON NGAY KET THUC DOAN VA NAMHOC
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

CREATE OR ALTER TRIGGER trg_checkDate_NAMHOC
ON NAMHOC
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
-- TRIGGER KIỂM TRA NGAY NGÀY KẾT THÚC PHẢI NHỎ HƠN HOẶC BẰNG NGÀY BẮT ĐẦU
-- =============================================
CREATE OR ALTER TRIGGER trg_CheckAddProjectInCouncil
ON HOIDONG_DETAI
AFTER INSERT
AS
BEGIN
    IF EXISTS (
            SELECT 1
            FROM INSERTED I
                JOIN HOIDONG H ON I.MaHD = H.MaHD
                JOIN DETAI D ON I.MaDT = D.MaDT
            WHERE D.ThoiGianKetThuc > H.NgayBaoVe
        )
        BEGIN
            RAISERROR(
                N'Ngày kết thúc phải nhỏ hơn hoặc bằng ngày bảo vệ hội đồng', 
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

    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN NAMHOC n ON i.MaNamHoc = n.MaNamHoc
        WHERE
            (i.ThoiGianBatDau IS NOT NULL AND (i.ThoiGianBatDau < n.ThoiGianBatDau OR i.ThoiGianBatDau > n.ThoiGianKetThuc))
            OR
            (i.ThoiGianKetThuc IS NOT NULL AND (i.ThoiGianKetThuc < n.ThoiGianBatDau OR i.ThoiGianKetThuc > n.ThoiGianKetThuc))
    )
    BEGIN
        RAISERROR(N'Thời gian DOAN phải nằm trong khoảng NAMHOC tương ứng!', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END
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

    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN NAMHOC n ON i.MaNamHoc = n.MaNamHoc
        WHERE i.NgayBaoVe IS NOT NULL
          AND (i.NgayBaoVe < n.ThoiGianBatDau OR i.NgayBaoVe > n.ThoiGianKetThuc)
    )
    BEGIN
        RAISERROR(N'Ngày bảo vệ phải nằm trong khoảng thời gian của Năm học tương ứng!', 16, 1);
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
-- TRIGGER: Kiểm tra sinh viên với đề tài cùng khoa
-- ===============================
CREATE OR ALTER TRIGGER trg_CheckSinhVienDeTaiCungKhoa
ON DETAI_SINHVIEN
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN SINHVIEN sv ON sv.MaSV = i.MaSV
        JOIN DETAI dt ON dt.MaDT = i.MaDT
        WHERE sv.MaKhoa <> dt.MaKhoa
    )
    BEGIN
        RAISERROR(N'Sinh viên chỉ được tham gia đề tài trong cùng khoa!', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END
GO
-- ===============================
-- TRIGGER: Kiểm tra hồi đồng với đề tài cùng khoa
-- ===============================
CREATE OR ALTER TRIGGER trg_CheckDeTaiHoiDongCungKhoa
ON HOIDONG_DETAI
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN HOIDONG hd ON hd.MaHD = i.MaHD
        JOIN DETAI DT ON DT.MaDT = I.MaDT
        WHERE i.MaHD IS NOT NULL
          AND DT.MaKhoa <> hd.MaKhoa
    )
    BEGIN
        RAISERROR(N'Đề tài và Hội đồng phải cùng khoa!', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END
GO
-- ===============================
-- TRIGGER: Kiểm tra giáo viên hướng dẫn phải cùng khoa với đề tài
-- ===============================
CREATE OR ALTER TRIGGER trg_CheckGVHuongDanCungKhoa
ON DETAI
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN GIAOVIEN gv ON gv.MaGV = i.MaGVHuongDan
        JOIN DETAI DT ON DT.MaDT = I.MaDT
        WHERE gv.MaKhoa <> DT.MaKhoa
    )
    BEGIN
        RAISERROR(N'Giáo viên hướng dẫn phải cùng khoa với đề tài!', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
END
GO
-- ===============================
-- TRIGGER: Kiểm tra giáo viên cùng khoa với hội đồng
-- ===============================
CREATE OR ALTER TRIGGER trg_CheckHoiDongGV_CungKhoa
ON HOIDONG
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN GIAOVIEN gvCT ON gvCT.MaGV = i.MaGVChuTich
        WHERE gvCT.MaKhoa <> i.MaKhoa
    )
    OR EXISTS (
        SELECT 1
        FROM inserted i
        JOIN GIAOVIEN gvTK ON gvTK.MaGV = i.MaGVThuKy
        WHERE gvTK.MaKhoa <> i.MaKhoa
    )
    OR EXISTS (
        SELECT 1
        FROM inserted i
        JOIN GIAOVIEN gvPB ON gvPB.MaGV = i.MaGVPhanBien
        WHERE gvPB.MaKhoa <> i.MaKhoa
    )
    BEGIN
        RAISERROR(N'Các giáo viên trong hội đồng phải cùng khoa với hội đồng!', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
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
-- KHOA
CREATE OR ALTER TRIGGER trg_UpdateAt_KHOA
ON KHOA
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE KHOA
    SET UpdatedAt = GETDATE()
    FROM KHOA K
    INNER JOIN inserted i ON K.MaKhoa = i.MaKhoa;
END
GO
CREATE TRIGGER trg_LimitHoiDongForDeTai
ON HOIDONG_DETAI
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra số hội đồng mà 1 đề tài đã tham gia
    IF EXISTS (
        SELECT MaDT
        FROM HOIDONG_DETAI
        GROUP BY MaDT
        HAVING COUNT(DISTINCT MaHD) > 2
    )
    BEGIN
        RAISERROR(N'Mỗi đề tài chỉ được tham gia tối đa 2 hội đồng!', 16, 1);
        ROLLBACK TRANSACTION;
    END
END
GO


