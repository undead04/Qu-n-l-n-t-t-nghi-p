import express, { Request, Response } from "express";
import sql from "mssql";
import { getConnectionByKhoa } from "../db/dbRouter";

const router = express.Router();

// ========================
// Danh sách sinh viên
// ========================
router.get("/students", async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = parseInt(req.query.skip as string) || 0;
    const sortBy = (req.query.sortBy as string) || "TenSV";
    const sortOrder = (req.query.sortOrder as string) || "ASC";
    const Role = req.query.Role ? Number(req.query.Role) : null;
    const MaKhoa = req.query.MaKhoa ? Number(req.query.MaKhoa) : null;

    const pool = await getConnectionByKhoa(Role);
    const request = pool
      .request()
      .input("search", sql.NVarChar(250), search || null)
      .input("limit", sql.Int, limit)
      .input("skip", sql.Int, skip)
      .input("SortBy", sql.NVarChar(50), sortBy)
      .input("SortOrder", sql.NVarChar(4), sortOrder);

    // Chỉ truyền MaKhoa nếu Role null
    if (Role === null && MaKhoa !== null) {
      request.input("MaKhoa", sql.Int, MaKhoa);
    }

    const result = await request.execute("usp_listStudent");
    const recordsets = result.recordsets as sql.IRecordSet<any>[];

    res.json({
      data: recordsets[0],
      pagination: recordsets[1]?.[0] || null,
    });
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_listStudent:", err);
    res.status(500).json({ error: err.message });
  }
});

// ========================
// Thông tin đồ án sinh viên
// ========================
router.get("/students/project/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const Role = req.query.Role ? Number(req.query.Role) : null;
    const MaKhoa = req.query.MaKhoa ? Number(req.query.MaKhoa) : null;

    const pool = await getConnectionByKhoa(Role);
    const request = pool.request().input("MaSV", sql.VarChar(20), id);

    // Chỉ truyền MaKhoa nếu Role null
    if (Role === null && MaKhoa !== null) {
      request.input("MaKhoa", sql.Int, MaKhoa);
    }

    const result = await request.execute("usp_getProjectStudent");
    res.json(result.recordset);
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_getProjectStudent:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/students/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const MaKhoa = Number(req.query.MaKhoa);
    const Role = req.query.Role ? Number(req.query.Role) : null;

    const pool = await getConnectionByKhoa(Role);

    const request = pool.request().input("MaSV", sql.VarChar(20), id);

    // Chỉ thêm input MaKhoa nếu Role = null
    if (Role === null && !isNaN(MaKhoa)) {
      request.input("MaKhoa", sql.Int, MaKhoa);
    }

    const result = await request.execute("usp_getStudent");
    res.json(result.recordset);
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_getStudent:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
