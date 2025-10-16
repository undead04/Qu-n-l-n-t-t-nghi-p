import express, { Request, Response } from "express";
import sql from "mssql";
import { getConnectionByKhoa } from "../db/dbRouter";

const router = express.Router();
router.post("/projects/addStudent/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { MaSV, MaKhoa } = req.body;
    const pool = await getConnectionByKhoa(MaKhoa);
    const result = await pool
      .request()
      .input("MaDoAn", sql.VarChar(20), id)
      .input("MaSV", sql.VarChar(20), MaSV)
      .execute("usp_addStudentToDoAn");

    res.json({ success: true, data: result.recordset });
  } catch (err: any) {
    console.error("❌ Lỗi thêm sinh viên vào đồ án:", err);
    res.status(500).json({ error: err.message });
  }
});
router.delete("/projects/delStudent/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { MaSV, MaKhoa } = req.query;
    const pool = await getConnectionByKhoa(Number(MaKhoa));
    const result = await pool
      .request()
      .input("MaDoAn", sql.VarChar(20), id)
      .input("MaSV", sql.VarChar(20), MaSV)
      .execute("usp_deleteStudentFromDoAn");

    res.json({ success: true, data: result.recordset });
  } catch (err: any) {
    console.error("❌ Lỗi thêm sinh viên vào đồ án:", err);
    res.status(500).json({ error: err.message });
  }
});
router.put("/scores", async (req, res) => {
  try {
    const {
      MaSV,
      MaDoAn,
      MaHD,
      DiemGVChuTich,
      DiemGVPhanBien,
      DiemGVHuongDan,
      MaKhoa,
    } = req.body;
    const pool = await getConnectionByKhoa(MaKhoa);
    const result = await pool
      .request()
      .input("MaDoAn", sql.VarChar(20), MaDoAn)
      .input("MaSV", sql.VarChar(20), MaSV)
      .input("MaHD", sql.VarChar(20), MaHD)
      .input("DiemGVChuTich", sql.Float(), DiemGVChuTich)
      .input("DiemGVPhanBien", sql.Float(), DiemGVPhanBien)
      .input("DiemGVHuongDan", sql.Float(), DiemGVHuongDan)
      .execute("usp_updateStudentScore");

    res.json({ success: true, data: result.recordset });
  } catch (err: any) {
    console.error("❌ Lỗi chấm điểm:", err);
    res.status(500).json({ error: err.message });
  }
});
router.get("/scores", async (req, res) => {
  try {
    const { MaDoAn, MaKhoa } = req.query;
    const pool = await getConnectionByKhoa(Number(MaKhoa));
    const result = await pool
      .request()
      .input("MaDoAn", sql.VarChar(20), MaDoAn)
      .execute("usp_listScoreInDoAn");

    res.json({ success: true, data: result.recordset });
  } catch (err: any) {
    console.error("❌ Lỗi danh sách điểm:", err);
    res.status(500).json({ error: err.message });
  }
});
export default router;
