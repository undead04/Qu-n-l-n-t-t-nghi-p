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