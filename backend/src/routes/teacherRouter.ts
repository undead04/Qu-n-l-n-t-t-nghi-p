import express, { Request, Response } from "express";
import sql from "mssql";
import { getConnectionByKhoa } from "../db/dbRouter";
const router = express.Router();
router.get("/teachers", async (req, res) => {
  try {
    const MaKhoa = Number(req.query.MaKhoa);
    const pool = await getConnectionByKhoa(MaKhoa);
    const result = await pool
      .request()
      .input("search", sql.NVarChar(250), req.query.search || null)
      .input("limit", sql.Int, parseInt(req.query.limit as string) || 10)
      .input("skip", sql.Int, parseInt(req.query.skip as string) || 0)
      .input("SortBy", sql.NVarChar(50), req.query.sortBy || "TenGV")
      .input("SortOrder", sql.NVarChar(4), req.query.sortOrder || "ASC")
      .execute("usp_listTeacher");
    const recordsets = result.recordsets as sql.IRecordSet<any>[];

    res.json({
      data: recordsets[0],
      pagination: recordsets[1][0], // an toàn hơn vì giờ TS biết đây là array
    });
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_listStudent:", err);
    res.status(500).json({ error: err.message });
  }
});
router.get("/teachers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const MaKhoa = Number(req.query.MaKhoa);
    const pool = await getConnectionByKhoa(MaKhoa);
    const result = await pool
      .request()
      .input("MaGV", sql.VarChar(20), id)
      .execute("usp_getTeacher");
    res.json(result.recordset);
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_getTeacher:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
