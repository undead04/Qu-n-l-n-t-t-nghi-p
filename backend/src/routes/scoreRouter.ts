import express, { Request, Response } from "express";
import sql from "mssql";
import { getConnectionByKhoa } from "../db/dbRouter";

const router = express.Router();
router.post("/projects/addStudent/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { MaSV, MaKhoa, MaGV } = req.body;
    const pool = await getConnectionByKhoa(MaKhoa);
    const table = new sql.Table("dbo.StudentListType");
    table.columns.add("MaSV", sql.VarChar(20));
    const maSVArr = MaSV.split(",");
    maSVArr.forEach((masv: any) => {
      table.rows.add(masv);
    });
    const result = await pool
      .request()
      .input("MaDoAn", sql.VarChar(20), id)
      .input("Students", table)
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
    const { scores, MaDoAn, MaGV, MaKhoa } = req.body;
    const pool = await getConnectionByKhoa(MaKhoa);
    const table = new sql.Table();
    table.columns.add("MaSV", sql.VarChar(20));
    table.columns.add("Diem", sql.Float());
    scores.forEach((s: any) => table.rows.add(s.MaSV, s.Diem));
    const result = await pool
      .request()
      .input("MaDoAn", sql.VarChar(20), MaDoAn)
      .input("Scores", table)
      .input("MaGV", sql.VarChar(20), MaGV)
      .execute("usp_updateStudentScores");
    res.json({ success: true, data: result.recordset });
  } catch (err: any) {
    console.error("❌ Lỗi chấm điểm:", err);
    res.status(500).json({ error: err.message });
  }
});
router.get("/scores", async (req: Request, res: Response) => {
  try {
    const { MaDoAn } = req.query;
    const Role = req.query.Role ? Number(req.query.Role) : null;
    const MaKhoa = req.query.MaKhoa ? Number(req.query.MaKhoa) : null;

    const pool = await getConnectionByKhoa(Role);
    const request = pool.request().input("MaDoAn", sql.VarChar(20), MaDoAn);

    // Chỉ thêm input MaKhoa nếu Role null
    if (Role === null && MaKhoa !== null) {
      request.input("MaKhoa", sql.Int, MaKhoa);
    }

    const result = await request.execute("usp_listScoreInDoAn");
    res.json({ success: true, data: result.recordset });
  } catch (err: any) {
    console.error("❌ Lỗi danh sách điểm:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
