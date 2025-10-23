import express, { Request, Response } from "express";
import sql from "mssql";
import { getConnectionByKhoa } from "../db/dbRouter";

const router = express.Router();
router.post("/projects/addStudent/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { MaSV, MaKhoa, MaGV } = req.body;
    const pool = await getConnectionByKhoa(MaKhoa);
    const result = await pool
      .request()
      .input("MaDoAn", sql.VarChar(20), id)
      .input("MaSV", sql.VarChar(20), MaSV)
      .input("MaGV", sql.VarChar(20), MaGV)
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
    const { MaSV, MaKhoa, MaGV } = req.query;
    const pool = await getConnectionByKhoa(Number(MaKhoa));
    const result = await pool
      .request()
      .input("MaDoAn", sql.VarChar(20), id)
      .input("MaSV", sql.VarChar(20), MaSV)
      .input("MaGV", sql.VarChar(20), MaGV)
      .execute("usp_deleteStudentFromDoAn");

    res.json({ success: true, data: result.recordset });
  } catch (err: any) {
    console.error("❌ Lỗi thêm sinh viên vào đồ án:", err);
    res.status(500).json({ error: err.message });
  }
});
router.put("/scores", async (req, res) => {
  try {
    const { MaSV, MaDoAn, MaGV, Diem, MaKhoa } = req.body;
    const pool = await getConnectionByKhoa(MaKhoa);
    const result = await pool
      .request()
      .input("MaDoAn", sql.VarChar(20), MaDoAn)
      .input("MaSV", sql.VarChar(20), MaSV)
      .input("MaGV", sql.VarChar(20), MaGV)
      .input("Diem", sql.Float(), Diem)
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
