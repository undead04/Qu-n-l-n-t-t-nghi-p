import express, { Request, Response } from "express";
import sql from "mssql";
import { getConnectionByKhoa } from "../db/dbRouter";

const router = express.Router();
router.post("/projects/council", async (req, res) => {
  try {
    const { MaDoAn, MaHoiDong, MaKhoa } = req.body;
    const pool = await getConnectionByKhoa(MaKhoa);
    const table = new sql.Table("dbo.DoAnList");
    table.columns.add("MaDoAn", sql.VarChar(20));
    const doAnArr = (MaDoAn as string).split(",");
    doAnArr.forEach((a) => table.rows.add(a));
    const result = await pool
      .request()
      .input("ListDoAn", table)
      .input("MaHoiDong", sql.VarChar(20), MaHoiDong)
      .execute("usp_AddDoAnHoiDong");

    res.json({ success: true, data: result.recordset });
  } catch (err: any) {
    console.error("❌ Lỗi thêm đồ án vào hội đồng:", err);
    res.status(500).json({ error: err.message });
  }
});
router.delete("/projects/council", async (req, res) => {
  try {
    const { MaDoAn, MaHoiDong, MaKhoa } = req.body;
    const pool = await getConnectionByKhoa(Number(req.query.Role) || null);
    const result = await pool
      .request()
      .input("MaDoAn", sql.VarChar(20), MaDoAn)
      .input("MaHoiDong", sql.VarChar(20), MaHoiDong)
      .input("MaKhoa", sql.Int, MaKhoa)
      .execute("usp_RemoveDoAnHoiDong");

    res.json({ success: true, data: result.recordset });
  } catch (err: any) {
    console.error("❌ Lỗi delete usp_RemoveDoAnHoiDong:", err);
    res.status(500).json({ error: err.message });
  }
});
router.get("/projects/council", async (req: Request, res: Response) => {
  try {
    const { MaDoAn } = req.query;
    const Role = req.query.Role ? Number(req.query.Role) : null;
    const MaKhoa = req.query.MaKhoa ? Number(req.query.MaKhoa) : null;

    const pool = await getConnectionByKhoa(Role);
    const request = pool.request().input("MaDT", sql.VarChar(20), MaDoAn);

    if (Role === null && MaKhoa !== null) {
      request.input("MaKhoa", sql.Int, MaKhoa);
    }

    const result = await request.execute("usp_getCouncilInProject");
    res.json(result.recordset);
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_getCouncilInProject:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/projects", async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = parseInt(req.query.skip as string) || 0;
    const sortBy = (req.query.sortBy as string) || "MaHD";
    const sortOrder = (req.query.sortOrder as string) || "DESC";
    const year = req.query.year as string | null;
    const User = req.query.User as string | null;
    const GV = req.query.MaGVHuongDan as string | null;
    const Role = req.query.Role ? Number(req.query.Role) : null;
    const MaKhoa = req.query.MaKhoa ? Number(req.query.MaKhoa) : null;

    const pool = await getConnectionByKhoa(Role);
    const request = pool
      .request()
      .input("search", sql.NVarChar(250), search || null)
      .input("limit", sql.Int, limit)
      .input("skip", sql.Int, skip)
      .input("MaNamHoc", sql.VarChar(20), year || null)
      .input("User", sql.VarChar(20), User || null)
      .input("SortBy", sql.NVarChar(250), sortBy)
      .input("SortOrder", sql.NVarChar(250), sortOrder)
      .input("MaGV", sql.VarChar(20), GV || null);

    if (Role === null) {
      request.input("MaKhoa", sql.Int, MaKhoa);
    }

    const result = await request.execute("usp_listDoan");
    const recordsets = result.recordsets as sql.IRecordSet<any>[];

    res.json({
      data: recordsets[0],
      pagination: recordsets[1]?.[0] || null,
    });
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_listDoan:", err);
    res.status(500).json({ error: err.message });
  }
});
router.post("/projects", async (req, res) => {
  try {
    const {
      MaKhoa,
      TenDT,
      MaNamHoc,
      MaGVHuongDan,
      ThoiGianBatDau,
      ThoiGianKetThuc,
    } = req.body;
    const pool = await getConnectionByKhoa(MaKhoa);
    const result = await pool
      .request()
      .input("MaKhoa", sql.Int(), MaKhoa || null)
      .input("TenDT", sql.NVarChar(250), TenDT || "")
      .input("MaNamHoc", sql.VarChar(250), MaNamHoc || null)
      .input("MaGVHuongDan", sql.VarChar(250), MaGVHuongDan || null)
      .input(
        "ThoiGianBatDau",
        sql.Date,
        ThoiGianBatDau ? new Date(ThoiGianBatDau) : null
      )
      .input(
        "ThoiGianKetThuc",
        sql.Date,
        ThoiGianKetThuc ? new Date(ThoiGianKetThuc) : null
      )
      .execute("usp_createDoan");

    res.json({
      success: true,
      data: result.recordset, // nếu SP trả về danh sách
    });
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_addCouncil:", err);
    res.status(500).json({ error: err.message });
  }
});
router.put("/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { TenDT, MaGVHuongDan, ThoiGianBatDau, ThoiGianKetThuc, MaKhoa } =
      req.body;
    const pool = await getConnectionByKhoa(MaKhoa);

    const result = await pool
      .request()
      .input("MaDT", sql.VarChar(20), id)
      .input("TenDT", sql.NVarChar(250), TenDT || null)
      .input("MaGVHuongDan", sql.NVarChar(250), MaGVHuongDan || null)
      .input(
        "ThoiGianBatDau",
        sql.Date,
        ThoiGianBatDau ? new Date(ThoiGianBatDau) : null
      )
      .input(
        "ThoiGianKetThuc",
        sql.Date,
        ThoiGianKetThuc ? new Date(ThoiGianKetThuc) : null
      )
      .execute("usp_updateDoan");

    res.json({ success: true, data: result.recordset });
  } catch (err: any) {
    console.error("❌ Lỗi update usp_updateDoan:", err);
    res.status(500).json({ error: err.message });
  }
});
router.delete("/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await getConnectionByKhoa(Number(req.query.MaKhoa));
    const result = await pool
      .request()
      .input("MaDoAn", sql.NVarChar(50), id)
      .input("MaGV", sql.VarChar(20), req.query.MaGV)
      .execute("usp_deleteDoan");

    res.json({ success: true, message: "Xóa đồ án thành công" });
  } catch (err: any) {
    console.error("❌ Lỗi delete usp_deleteDoan:", err);
    res.status(500).json({ error: err.message });
  }
});
router.get("/projects/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const Role = req.query.Role ? Number(req.query.Role) : null;
    const MaKhoa = req.query.MaKhoa ? Number(req.query.MaKhoa) : null;

    const pool = await getConnectionByKhoa(Role);
    const request = pool.request().input("MaDT", sql.VarChar(20), id);

    if (Role === null && MaKhoa !== null) {
      request.input("MaKhoa", sql.Int, MaKhoa);
    }

    const result = await request.execute("usp_getDoan");
    res.json(result.recordset);
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_getDoan:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
