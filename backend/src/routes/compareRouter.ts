import express from "express";
import { getConnectionByKhoa } from "../db/dbRouter";

const router = express.Router();
router.get("/compare", async (req, res) => {
  try {
    const pool = await getConnectionByKhoa(null);
    const result = await pool
      .request()
      .execute("usp_ReportQueryPerformanceStats");
    res.status(200).json(result.recordset);
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_ReportQueryPerformanceStats:", err);
    res.status(500).json({ error: err.message });
  }
});
export default router;
