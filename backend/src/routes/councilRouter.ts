import express, { Request, Response } from "express";
import sql from "mssql";
import { getConnectionByKhoa } from "../db/dbRouter";

const router = express.Router();

// ========================
// Danh sách hội đồng với pagination
// ========================
router.get("/councils", async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = parseInt(req.query.skip as string) || 0;
    const sortBy = (req.query.sortBy as string) || "MaHD";
    const sortOrder = (req.query.sortOrder as string) || "DESC";
    const year = req.query.year as string | null;
    const GV = req.query.MaGV as string | null;
    const Role = req.query.Role ? Number(req.query.Role) : null;
    const MaKhoa = req.query.MaKhoa ? Number(req.query.MaKhoa) : null;

    const pool = await getConnectionByKhoa(Role);
    const request = pool
      .request()
      .input("search", sql.NVarChar(250), search || null)
      .input("limit", sql.Int, limit)
      .input("skip", sql.Int, skip)
      .input("MaNamHoc", sql.VarChar(20), year)
      .input("MaGV", sql.VarChar(20), GV)
      .input("SortBy", sql.NVarChar(250), sortBy)
      .input("SortOrder", sql.NVarChar(250), sortOrder);

    if (Role === null && MaKhoa !== null) {
      request.input("MaKhoa", sql.Int, MaKhoa);
    }

    const result = await request.execute("usp_listHoiDong");
    const recordsets = result.recordsets as sql.IRecordSet<any>[];

    res.json({
      data: recordsets[0],
      pagination: recordsets[1]?.[0] || null,
    });
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_listHoiDong:", err);
    res.status(500).json({ error: err.message });
  }
});

// ========================
// Tạo hội đồng
// ========================
router.post("/councils", async (req: Request, res: Response) => {
  try {
    const {
      MaGVChuTich,
      MaGVThuKy,
      MaGVPhanBien,
      DiaChiBaoVe,
      NgayBaoVe,
      MaNamHoc,
      MaKhoa,
    } = req.body;

    const Role = req.query.Role ? Number(req.query.Role) : null;

    const pool = await getConnectionByKhoa(Role);
    const request = pool
      .request()
      .input("MaGVChuTich", sql.VarChar(250), MaGVChuTich || null)
      .input("MaGVThuKy", sql.VarChar(250), MaGVThuKy || null)
      .input("MaGVPhanBien", sql.VarChar(250), MaGVPhanBien || null)
      .input("DiaChiBaoVe", sql.NVarChar(250), DiaChiBaoVe || null)
      .input("NgayBaoVe", sql.Date, NgayBaoVe ? new Date(NgayBaoVe) : null)
      .input("MaNamHoc", sql.VarChar(20), MaNamHoc || null);

    if (Role === null && MaKhoa !== null) {
      request.input("MaKhoa", sql.Int, Number(MaKhoa));
    }

    const result = await request.execute("usp_createHoiDong");
    res.json({ success: true, data: result.recordset });
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_createHoiDong:", err);
    res.status(500).json({ error: err.message });
  }
});

// ========================
// Cập nhật hội đồng
// ========================
router.put("/councils/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      MaGVChuTich,
      MaGVThuKy,
      MaGVPhanBien,
      MaKhoa,
      DiaChiBaoVe,
      NgayBaoVe,
    } = req.body;

    const Role = req.query.Role ? Number(req.query.Role) : null;

    const pool = await getConnectionByKhoa(Role);
    const request = pool
      .request()
      .input("MaHD", sql.NVarChar(50), id)
      .input("MaGVChuTich", sql.NVarChar(250), MaGVChuTich || null)
      .input("MaGVThuKy", sql.NVarChar(250), MaGVThuKy || null)
      .input("MaGVPhanBien", sql.NVarChar(250), MaGVPhanBien || null)
      .input("DiaChiBaoVe", sql.NVarChar(250), DiaChiBaoVe || null)
      .input("NgayBaoVe", sql.Date, NgayBaoVe ? new Date(NgayBaoVe) : null);

    if (Role === null && MaKhoa !== null) {
      request.input("MaKhoa", sql.Int, MaKhoa);
    }

    const result = await request.execute("usp_updateHoiDong");
    res.json({ success: true, data: result.recordset });
  } catch (err: any) {
    console.error("❌ Lỗi update council:", err);
    res.status(500).json({ error: err.message });
  }
});

// ========================
// Xóa hội đồng
// ========================
router.delete("/councils/:MaHD", async (req: Request, res: Response) => {
  try {
    const { MaHD } = req.params;
    const Role = req.query.Role ? Number(req.query.Role) : null;
    const MaKhoa = req.query.MaKhoa ? Number(req.query.MaKhoa) : null;

    const pool = await getConnectionByKhoa(Role);
    const request = pool.request().input("MaHD", sql.NVarChar(50), MaHD);

    if (Role === null && MaKhoa !== null) {
      request.input("MaKhoa", sql.Int, MaKhoa);
    }

    await request.execute("usp_deleteHoiDong");
    res.json({ success: true, message: "Xóa hội đồng thành công" });
  } catch (err: any) {
    console.error("❌ Lỗi delete council:", err);
    res.status(500).json({ error: err.message });
  }
});

// ========================
// Lấy chi tiết hội đồng
// ========================
router.get("/councils/:MaHD", async (req: Request, res: Response) => {
  try {
    const { MaHD } = req.params;
    const Role = req.query.Role ? Number(req.query.Role) : null;
    const MaKhoa = req.query.MaKhoa ? Number(req.query.MaKhoa) : null;

    const pool = await getConnectionByKhoa(Role);
    const request = pool.request().input("MaHD", sql.NVarChar(50), MaHD);

    if (Role === null && MaKhoa !== null) {
      request.input("MaKhoa", sql.Int, MaKhoa);
    }

    const result = await request.execute("usp_getHoiDong");
    res.json(result.recordset);
  } catch (err: any) {
    console.error("❌ Lỗi usp_getHoiDong:", err);
    res.status(500).json({ error: err.message });
  }
});

// ========================
// Lấy danh sách đồ án trong hội đồng
// ========================
router.get("/councils/topics/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = parseInt(req.query.skip as string) || 0;
    const Role = req.query.Role ? Number(req.query.Role) : null;
    const MaKhoa = req.query.MaKhoa ? Number(req.query.MaKhoa) : null;

    const pool = await getConnectionByKhoa(Role);
    const request = pool
      .request()
      .input("MaHD", sql.VarChar(20), id)
      .input("limit", sql.Int, limit)
      .input("skip", sql.Int, skip);

    if (Role === null && MaKhoa !== null) {
      request.input("MaKhoa", sql.Int, MaKhoa);
    }

    const result = await request.execute("usp_listDoanInHoiDong");
    res.json(result.recordset);
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_listDoanInHoiDong:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
