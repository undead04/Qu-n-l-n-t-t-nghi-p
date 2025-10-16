import express, { Request, Response } from "express";
import sql from "mssql";
import { getConnectionByKhoa } from "../db/dbRouter";

const router = express.Router();

router.get("/students", async (req: Request, res: Response) => {
  const MaKhoa = Number(req.query.MaKhoa);

  try {
    const pool = await getConnectionByKhoa(MaKhoa);
    const result = await pool
      .request()
      .input("search", sql.NVarChar(250), req.query.search || null)
      .input("limit", sql.Int, parseInt(req.query.limit as string) || 10)
      .input("skip", sql.Int, parseInt(req.query.skip as string) || 0)
      .input("SortBy", sql.NVarChar(50), req.query.sortBy || "TenSV")
      .input("SortOrder", sql.NVarChar(4), req.query.sortOrder || "ASC")
      .execute("usp_listStudent");
    const recordsets = result.recordsets as sql.IRecordSet<any>[];
    res.json({
      data: recordsets[0],
      pagination: recordsets[1][0], // an toàn hơn vì giờ TS biết đây là array
    });
  } catch (err: any) {
    console.error(err, "Lỗi khi gọi usp_listStudent:");
    res.status(500).json({ error: err.message });
  }
});

router.get("/students/history/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const MaKhoa = Number(req.query.MaKhoa);
    const pool = await getConnectionByKhoa(MaKhoa);
    const result = await pool
      .request()
      .input("MaSV", sql.VarChar(20), id)
      .execute("usp_getCouncilInStudent");
    res.json(result.recordset);
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_getCouncilInStudent:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/students/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const MaKhoa = Number(req.query.MaKhoa);
    const pool = await getConnectionByKhoa(MaKhoa);
    const result = await pool
      .request()
      .input("MaSV", sql.VarChar(20), id)
      .execute("usp_getStudent");
    res.json(result.recordset);
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_getStudent:", err);
    res.status(500).json({ error: err.message });
  }
});
export default router;
