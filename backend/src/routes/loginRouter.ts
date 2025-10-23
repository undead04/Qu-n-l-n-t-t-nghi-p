import express from "express";
import sql from "mssql";
import { getConnectionByKhoa } from "../db/dbRouter";

const router = express.Router();
router.post("/login", async (req, res) => {
  try {
    const pool = await getConnectionByKhoa();
    const result = await pool
      .request()
      .input("username", sql.NVarChar(250), req.body.username || null)
      .input("password", sql.NVarChar(250), req.body.password || null)
      .execute("usp_Login");
    res.status(200).json(result.recordset);
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_login:", err);
    res.status(500).json({ error: err.message });
  }
});
export default router;
