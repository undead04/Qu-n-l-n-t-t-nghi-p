import express, { Request, Response } from "express";
import sql from "mssql";
import { getConnectionByKhoa } from "../db/dbRouter";

const router = express.Router();
router.post("/projects/council", async (req, res) => {
  try {
    const { MaDoAn, MaHoiDong, MaKhoa } = req.body;
    const pool = await getConnectionByKhoa(MaKhoa);
    const result = await pool
      .request()
      .input("MaDoAn", sql.VarChar(20), MaDoAn)
      .input("MaHoiDong", sql.VarChar(20), MaHoiDong)
      .execute("usp_AddDoAnHoiDong");

    res.json({ success: true, data: result.recordset });
  } catch (err: any) {
    console.error("❌ Lỗi thêm đồ án vào hội đồng:", err);
    res.status(500).json({ error: err.message });
  }
});
router.delete("/projects/council", async (req, res) => {
  try {
    const { MaDoAn, MaHoiDong, MaKhoa } = req.body;
    const pool = await getConnectionByKhoa(MaKhoa);
    const result = await pool
      .request()
      .input("MaDoAn", sql.VarChar(20), MaDoAn)
      .input("MaHoiDong", sql.VarChar(20), MaHoiDong)
      .execute("usp_RemoveDoAnHoiDong");

    res.json({ success: true, data: result.recordset });
  } catch (err: any) {
    console.error("❌ Lỗi delete usp_RemoveDoAnHoiDong:", err);
    res.status(500).json({ error: err.message });
  }
});
router.get("/projects/council", async (req, res) => {
  try {
    const { MaDoAn, MaKhoa } = req.query;
    const pool = await getConnectionByKhoa(Number(MaKhoa));

    const result = await pool
      .request()
      .input("MaDT", sql.VarChar(20), MaDoAn)
      .execute("usp_getCouncilInProject");

    res.json(result.recordset);
  } catch (err: any) {
    console.error("❌ Lỗi usp_getCouncilInProject:", err);
    res.status(500).json({ error: err.message });
  }
});
router.get("/projects/students", async (req, res) => {
  try {
    const { MaDoAn, MaKhoa } = req.query;
    const pool = await getConnectionByKhoa(Number(MaKhoa));

    const result = await pool
      .request()
      .input("MaDoAn", sql.VarChar(20), MaDoAn)
      .execute("usp_listStudentInDoAn");

    res.json(result.recordset);
  } catch (err: any) {
    console.error("❌ Lỗi usp_getCouncilInProject:", err);
    res.status(500).json({ error: err.message });
  }
});
router.get("/projects", async (req, res) => {
  try {
    const MaKhoa = Number(req.query.MaKhoa);
    const pool = await getConnectionByKhoa(MaKhoa);
    const result = await pool
      .request()
      .input("search", sql.NVarChar(250), req.query.search || null)
      .input("limit", sql.Int, parseInt(req.query.limit as string) || 10)
      .input("skip", sql.Int, parseInt(req.query.skip as string) || 0)
      .input("MaNamHoc", sql.VarChar(20), req.query.year || null)
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
      .input("MaGVHuongDan", sql.VarChar(20), req.query.MaGVHuongDan || null)
      .execute("usp_listDoan");
    const recordsets = result.recordsets as sql.IRecordSet<any>[];
    res.json({
      data: recordsets[0],
      pagination: recordsets[1][0], // an toàn hơn vì giờ TS biết đây là array
    });
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_listDoan:", err);
    res.status(500).json({ error: err.message });
  }
});
router.post("/projects", async (req, res) => {
  try {
    const {
      MaKhoa,
      TenDT,
      MaNamHoc,
      MaGVHuongDan,
      ThoiGianBatDau,
      ThoiGianKetThuc,
    } = req.body;
    const pool = await getConnectionByKhoa(MaKhoa);
    const result = await pool
      .request()
      .input("MaKhoa", sql.Int(), MaKhoa || null)
      .input("TenDT", sql.NVarChar(250), TenDT || "")
      .input("MaNamHoc", sql.VarChar(250), MaNamHoc || null)
      .input("MaGVHuongDan", sql.VarChar(250), MaGVHuongDan || null)
      .input(
        "ThoiGianBatDau",
        sql.Date,
        ThoiGianBatDau ? new Date(ThoiGianBatDau) : null
      )
      .input(
        "ThoiGianKetThuc",
        sql.Date,
        ThoiGianKetThuc ? new Date(ThoiGianKetThuc) : null
      )
      .execute("usp_createDoan");

    res.json({
      success: true,
      data: result.recordset, // nếu SP trả về danh sách
    });
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_addCouncil:", err);
    res.status(500).json({ error: err.message });
  }
});
router.put("/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { TenDT, MaGVHuongDan, ThoiGianBatDau, ThoiGianKetThuc, MaKhoa } =
      req.body;
    const pool = await getConnectionByKhoa(MaKhoa);
    const result = await pool
      .request()
      .input("MaDT", sql.VarChar(20), id)
      .input("TenDT", sql.NVarChar(250), TenDT || null)
      .input("MaGVHuongDan", sql.NVarChar(250), MaGVHuongDan || null)
      .input(
        "ThoiGianBatDau",
        sql.Date,
        ThoiGianBatDau ? new Date(ThoiGianBatDau) : null
      )
      .input(
        "ThoiGianKetThuc",
        sql.Date,
        ThoiGianKetThuc ? new Date(ThoiGianBatDau) : null
      )
      .execute("usp_updateDoan");

    res.json({ success: true, data: result.recordset });
  } catch (err: any) {
    console.error("❌ Lỗi update usp_updateDoan:", err);
    res.status(500).json({ error: err.message });
  }
});
router.delete("/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { MaKhoa } = req.body;
    const pool = await getConnectionByKhoa(MaKhoa);
    const result = await pool
      .request()
      .input("MaDoAn", sql.NVarChar(50), id)
      .execute("usp_deleteDoan");

    res.json({ success: true, message: "Xóa đồ án thành công" });
  } catch (err: any) {
    console.error("❌ Lỗi delete usp_deleteDoan:", err);
    res.status(500).json({ error: err.message });
  }
});
router.get("/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { MaKhoa } = req.query;
    const pool = await getConnectionByKhoa(Number(MaKhoa));
    const result = await pool
      .request()
      .input("MaDT", sql.VarChar(20), id)
      .execute("usp_getDoan");
    res.json(result.recordset);
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_getDoan:", err);
    res.status(500).json({ error: err.message });
  }
});
export default router;
