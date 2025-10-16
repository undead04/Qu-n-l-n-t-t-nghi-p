import express, { Request, Response } from "express";
import sql from "mssql";
import { getConnectionByKhoa } from "../db/dbRouter";

const router = express.Router();
router.get("/report/project", async (req, res) => {
  try {
    const pool = await getConnectionByKhoa();
    const result = await pool
      .request()
      .input("limit", sql.Int, parseInt(req.query.limit as string) || 10)
      .input("skip", sql.Int, parseInt(req.query.skip as string) || 0)
      .input("year", sql.VarChar(20), req.query.year || null)
      .input(
        "deCode",
        sql.Int,
        req.query.deCode ? parseInt(req.query.deCode as string) : null
      )
      .execute("usp_reportTopic");
    const recordsets = result.recordsets as sql.IRecordSet<any>[];
    res.json({
      data: recordsets[0],
      pagination: recordsets[1][0], // an toàn hơn vì giờ TS biết đây là array
    });
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_reportTopic:", err);
    res.status(500).json({ error: err.message });
  }
});
router.get("/report/teacher", async (req, res) => {
  try {
    const pool = await getConnectionByKhoa();
    const result = await pool
      .request()
      .input("limit", sql.Int, parseInt(req.query.limit as string) || 10)
      .input("skip", sql.Int, parseInt(req.query.skip as string) || 0)
      .input("year", sql.VarChar(20), req.query.year || null)
      .input(
        "deCode",
        sql.Int,
        req.query.deCode ? parseInt(req.query.deCode as string) : null
      )
      .execute("usp_reportTeacher");
    const recordsets = result.recordsets as sql.IRecordSet<any>[];
    res.json({
      data: recordsets[0],
      pagination: recordsets[1][0], // an toàn hơn vì giờ TS biết đây là array
    });
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_reportTeacher:", err);
    res.status(500).json({ error: err.message });
  }
});
router.get("/report/faculty", async (req, res) => {
  try {
    const pool = await getConnectionByKhoa();
    const result = await pool
      .request()
      .input("limit", sql.Int, parseInt(req.query.limit as string) || 10)
      .input("skip", sql.Int, parseInt(req.query.skip as string) || 0)
      .input("year", sql.VarChar(20), req.query.year || null)
      .execute("usp_reportFaculty");
    const recordsets = result.recordsets as sql.IRecordSet<any>[];
    res.json({
      data: recordsets[0],
      pagination: recordsets[1][0], // an toàn hơn vì giờ TS biết đây là array
    });
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_reportFaculty:", err);
    res.status(500).json({ error: err.message });
  }
});
export default router;
