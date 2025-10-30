import { Request, Response, Router } from "express";
import sql from "mssql";
import { getConnectionByKhoa } from "../db/dbRouter";

const router = Router();

// ========================
// Danh sách giảng viên
// ========================
router.get("/teachers", async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = parseInt(req.query.skip as string) || 0;
    const sortBy = (req.query.sortBy as string) || "TenGV";
    const sortOrder = (req.query.sortOrder as string) || "ASC";
    const MaKhoa = req.query.MaKhoa ? Number(req.query.MaKhoa) : null;
    const Role = req.query.Role ? Number(req.query.Role) : null;
    const pool = await getConnectionByKhoa(Role);
    const request = pool
      .request()
      .input("search", sql.NVarChar(250), search || null)
      .input("limit", sql.Int, limit)
      .input("skip", sql.Int, skip)
      .input("SortBy", sql.NVarChar(50), sortBy)
      .input("SortOrder", sql.NVarChar(4), sortOrder);

    // Chỉ truyền MaKhoa nếu có
    if (Role == null) {
      request.input("MaKhoa", sql.Int, MaKhoa);
    }

    const result = await request.execute("usp_listTeacher");
    const recordsets = result.recordsets as sql.IRecordSet<any>[];

    res.json({
      data: recordsets[0],
      pagination: recordsets[1]?.[0] || null,
    });
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_listTeacher:", err);
    res.status(500).json({ error: err.message });
  }
});

// ========================
// Chi tiết giảng viên theo ID
// ========================
router.get("/teachers/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const MaKhoa = req.query.MaKhoa ? Number(req.query.MaKhoa) : null;
    const Role = req.query.Role ? Number(req.query.Role) : null;
    const pool = await getConnectionByKhoa(Role);
    const request = pool.request().input("MaGV", sql.VarChar(20), id);

    // Chỉ truyền MaKhoa nếu có
    if (MaKhoa !== null) {
      request.input("MaKhoa", sql.Int, MaKhoa);
    }

    const result = await request.execute("usp_getTeacher");
    res.json(result.recordset);
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_getTeacher:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
