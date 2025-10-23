import express, { Request, Response } from "express";
import sql from "mssql";
import { getConnectionByKhoa } from "../db/dbRouter";
const router = express.Router();
router.get("/councils", async (req, res) => {
  try {
    const MaKhoa = Number(req.query.MaKhoa);
    const pool = await getConnectionByKhoa(MaKhoa);
    const result = await pool
      .request()
      .input("search", sql.NVarChar(250), req.query.search || null)
      .input("limit", sql.Int, parseInt(req.query.limit as string) || 10)
      .input("skip", sql.Int, parseInt(req.query.skip as string) || 0)
      .input("MaNamHoc", sql.VarChar(20), (req.query.year as string) || null)
      .input("MaGV", sql.VarChar(20), req.query.MaGV)
      .input(
        "SortBy",
        sql.NVarChar(250),
        (req.query.sortBy as string) || "DESC"
      )
      .input(
        "SortOrder",
        sql.NVarChar(250),
        (req.query.sortOrder as string) || "MaHD"
      )
      .execute("usp_listHoiDong");
    const recordsets = result.recordsets as sql.IRecordSet<any>[];
    res.json({
      data: recordsets[0],
      pagination: recordsets[1][0], // an toàn hơn vì giờ TS biết đây là array
    });
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_listHoiDong:", err);
    res.status(500).json({ error: err.message });
  }
});
router.post("/councils", async (req, res) => {
  try {
    const {
      MaGVChuTich,
      MaGVThuKy,
      DiaChiBaoVe,
      NgayBaoVe,
      MaKhoa,
      MaGVPhanBien,
      MaNamHoc,
    } = req.body;
    const pool = await getConnectionByKhoa(MaKhoa);
    const result = await pool
      .request()
      .input("MaGVChuTich", sql.NVarChar(250), MaGVChuTich || null)
      .input("MaGVThuKy", sql.NVarChar(250), MaGVThuKy || null)
      .input("MaGVPhanBien", sql.NVarChar(250), MaGVPhanBien || null)
      .input("DiaChiBaoVe", sql.NVarChar(250), DiaChiBaoVe || null)
      .input("NgayBaoVe", sql.Date, NgayBaoVe ? new Date(NgayBaoVe) : null)
      .input("MaKhoa", sql.Int, MaKhoa || null)
      .input("MaNamHoc", sql.VarChar(20), MaNamHoc || null)
      .execute("usp_createHoiDong");

    res.json({
      success: true,
      data: result.recordset, // nếu SP trả về danh sách
    });
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_addCouncil:", err);
    res.status(500).json({ error: err.message });
  }
});
router.put("/councils/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { MaGVChuTich, MaGVThuKy, DiaChiBaoVe, NgayBaoVe, MaKhoa } = req.body;
    const pool = await getConnectionByKhoa(MaKhoa);
    const result = await pool
      .request()
      .input("MaHD", sql.NVarChar(50), id)
      .input("MaGVChuTich", sql.NVarChar(250), MaGVChuTich || null)
      .input("MaGVThuKy", sql.NVarChar(250), MaGVThuKy || null)
      .input("DiaChiBaoVe", sql.NVarChar(250), DiaChiBaoVe || null)
      .input("NgayBaoVe", sql.Date, NgayBaoVe ? new Date(NgayBaoVe) : null)
      .execute("usp_updateHoiDong");

    res.json({ success: true, data: result.recordset });
  } catch (err: any) {
    console.error("❌ Lỗi update council:", err);
    res.status(500).json({ error: err.message });
  }
});
router.delete("/councils/:MaHD", async (req, res) => {
  try {
    const { MaHD } = req.params;
    const MaKhoa = Number(req.query.MaKhoa);
    const pool = await getConnectionByKhoa(MaKhoa);
    const result = await pool
      .request()
      .input("MaHD", sql.NVarChar(50), MaHD)
      .execute("usp_deleteHoiDong");

    res.json({ success: true, message: "Xóa hội đồng thành công" });
  } catch (err: any) {
    console.error("❌ Lỗi delete council:", err);
    res.status(500).json({ error: err.message });
  }
});
router.get("/councils/:MaHD", async (req, res) => {
  try {
    const { MaHD } = req.params;
    const MaKhoa = Number(req.query.MaKhoa);
    const pool = await getConnectionByKhoa(MaKhoa);
    const result = await pool
      .request()
      .input("MaHD", sql.NVarChar(50), MaHD)
      .execute("usp_getHoiDong");
    res.json(result.recordset);
  } catch (err: any) {
    console.error("❌ Lỗi usp_getHoiDong:", err);
    res.status(500).json({ error: err.message });
  }
});
router.get("/councils/topics/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const MaKhoa = Number(req.query.MaKhoa);
    const pool = await getConnectionByKhoa(MaKhoa);
    const result = await pool
      .request()
      .input("MaHD", sql.VarChar(20), id)
      .input("limit", sql.Int, req.query.limit)
      .input("skip", sql.Int, req.query.skip)
      .execute("usp_listDoanInHoiDong");
    const data = result.recordset;
    return res.json(data);
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_listDetai:", err);
    res.status(500).json({ error: err.message });
  }
});
export default router;
