import express, { Request, Response } from "express";
import sql from "mssql";
import { getConnectionByKhoa } from "../db/dbRouter";

const router = express.Router();
router.get("/years", async (req, res) => {
  try {
    const Role = req.query.Role ? Number(req.query.Role) : null;
    const pool = await getConnectionByKhoa(Role);
    const result = await pool
      .request()
      .input("search", sql.NVarChar(250), req.query.search || null)
      .input("limit", sql.Int, parseInt(req.query.limit as string) || 10)
      .input("skip", sql.Int, parseInt(req.query.skip as string) || 0)
      .execute("usp_getListNamHoc");
    res.status(200).json(result.recordset);
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_getListNamHoc:", err);
    res.status(500).json({ error: err.message });
  }
});
export default router;
