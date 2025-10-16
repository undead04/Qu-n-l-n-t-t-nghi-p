import express, { Request, Response } from "express";
import sql from "mssql";
import { getConnectionByKhoa } from "../db/dbRouter";

const router = express.Router();
router.get("/faculties", async (req, res) => {
  try {
    const pool = await getConnectionByKhoa();
    const result = await pool
      .request()
      .input("search", sql.NVarChar(250), req.query.search || null)
      .input("limit", sql.Int, parseInt(req.query.limit as string) || 10)
      .input("skip", sql.Int, parseInt(req.query.skip as string) || 0)
      .execute("usp_getListKhoa");
    res.status(200).json(result.recordset);
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_getListKhoa:", err);
    res.status(500).json({ error: err.message });
  }
});
export default router;
