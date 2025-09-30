import express from "express";
import sql, { VarChar } from "mssql";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Cấu hình kết nối SQL Server
const config: sql.config = {
  user: "sa",
  password: "123456",
  server: "localhost", // hoặc "127.0.0.1"
  port: 60429, // <-- QUAN TRỌNG: đúng port mà bạn vừa test
  database: "DBTN",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

const pool = new sql.ConnectionPool(config);

pool
  .connect()
  .then(() => console.log("✅ Kết nối thành công SQL Server"))
  .catch((err) => console.error("❌ Lỗi kết nối DB:", err));

// router cho khoa
app.get("/faculties", async (req, res) => {
  try {
    const result = await pool
      .request()
      .input("search", sql.NVarChar(250), req.query.search || null)
      .input("limit", sql.Int, parseInt(req.query.limit as string) || 10)
      .input("skip", sql.Int, parseInt(req.query.skip as string) || 0)
      .input("SortBy", sql.NVarChar(50), req.query.sortBy || "TenKhoa")
      .input("SortOrder", sql.NVarChar(4), req.query.sortOrder || "TenKhoa")
      .execute("usp_listKhoa");
    const recordsets = result.recordsets as sql.IRecordSet<any>[];

    res.json({
      data: recordsets[0],
      pagination: recordsets[1][0], // an toàn hơn vì giờ TS biết đây là array
    });
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_listFaculty:", err);
    res.status(500).json({ error: err.message });
  }
});
// router cho học sinh
app.get("/students", async (req, res) => {
  try {
    const result = await pool
      .request()
      .input("search", sql.NVarChar(250), req.query.search || null)
      .input("limit", sql.Int, parseInt(req.query.limit as string) || 10)
      .input("skip", sql.Int, parseInt(req.query.skip as string) || 0)
      .input(
        "DeCode",
        sql.Int,
        req.query.deCode ? parseInt(req.query.deCode as string) : null
      )
      .input("SortBy", sql.NVarChar(50), req.query.sortBy || "TenSV")
      .input("SortOrder", sql.NVarChar(4), req.query.sortOrder || "ASC")
      .execute("usp_listStudent");
    const recordsets = result.recordsets as sql.IRecordSet<any>[];

    res.json({
      data: recordsets[0],
      pagination: recordsets[1][0], // an toàn hơn vì giờ TS biết đây là array
    });
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_listStudent:", err);
    res.status(500).json({ error: err.message });
  }
});
app.get("/students/:id", async (req, res) => {
  try {
    const { id } = req.params;
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

// router cho giáo viên
app.get("/teachers", async (req, res) => {
  try {
    const result = await pool
      .request()
      .input("search", sql.NVarChar(250), req.query.search || null)
      .input("limit", sql.Int, parseInt(req.query.limit as string) || 10)
      .input("skip", sql.Int, parseInt(req.query.skip as string) || 0)
      .input(
        "DeCode",
        sql.Int,
        req.query.deCode ? parseInt(req.query.deCode as string) : null
      )
      .input("SortBy", sql.NVarChar(50), req.query.sortBy || "TenGV")
      .input("SortOrder", sql.NVarChar(4), req.query.sortOrder || "ASC")
      .execute("usp_listTeacher");
    const recordsets = result.recordsets as sql.IRecordSet<any>[];

    res.json({
      data: recordsets[0],
      pagination: recordsets[1][0], // an toàn hơn vì giờ TS biết đây là array
    });
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_listStudent:", err);
    res.status(500).json({ error: err.message });
  }
});

// Router cho hội đồng
app.get("/councils", async (req, res) => {
  try {
    const result = await pool
      .request()
      .input("search", sql.NVarChar(250), req.query.search || null)
      .input("limit", sql.Int, parseInt(req.query.limit as string) || 10)
      .input("skip", sql.Int, parseInt(req.query.skip as string) || 0)
      .input("MaNamHoc", sql.VarChar(20), (req.query.year as string) || null)
      .input(
        "SortBy",
        sql.NVarChar(250),
        (req.query.sortBy as string) || "DESC"
      )
      .input(
        "SortOrder",
        sql.NVarChar(250),
        (req.query.sortOrder as string) || "MaHD"
      )
      .input(
        "MaKhoa",
        sql.Int,
        req.query.deCode ? parseInt(req.query.deCode as string) : null
      )
      .execute("usp_listHoiDong");
    const recordsets = result.recordsets as sql.IRecordSet<any>[];
    res.json({
      data: recordsets[0],
      pagination: recordsets[1][0], // an toàn hơn vì giờ TS biết đây là array
    });
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_listHoiDong:", err);
    res.status(500).json({ error: err.message });
  }
});
app.post("/councils", async (req, res) => {
  try {
    const {
      MaGVChuTich,
      MaGVThuKy,
      DiaChiBaoVe,
      NgayBaoVe,
      MaKhoa,
      MaGVPhanBien,
      MaNamHoc,
    } = req.body;

    const result = await pool
      .request()
      .input("MaGVChuTich", sql.NVarChar(250), MaGVChuTich || null)
      .input("MaGVThuKy", sql.NVarChar(250), MaGVThuKy || null)
      .input("MaGVPhanBien", sql.NVarChar(250), MaGVPhanBien || null)
      .input("DiaChiBaoVe", sql.NVarChar(250), DiaChiBaoVe || null)
      .input("NgayBaoVe", sql.Date, NgayBaoVe ? new Date(NgayBaoVe) : null)
      .input("MaKhoa", sql.Int, MaKhoa || null)
      .input("MaNamHoc", sql.VarChar(20), MaNamHoc || null)
      .execute("usp_createHoiDong");

    res.json({
      success: true,
      data: result.recordset, // nếu SP trả về danh sách
    });
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_addCouncil:", err);
    res.status(500).json({ error: err.message });
  }
});
app.put("/councils/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { MaGVChuTich, MaGVThuKy, DiaChiBaoVe, NgayBaoVe } = req.body;

    const result = await pool
      .request()
      .input("MaHD", sql.NVarChar(50), id)
      .input("MaGVChuTich", sql.NVarChar(250), MaGVChuTich || null)
      .input("MaGVThuKy", sql.NVarChar(250), MaGVThuKy || null)
      .input("DiaChiBaoVe", sql.NVarChar(250), DiaChiBaoVe || null)
      .input("NgayBaoVe", sql.Date, NgayBaoVe ? new Date(NgayBaoVe) : null)
      .execute("usp_updateHoiDong");

    res.json({ success: true, data: result.recordset });
  } catch (err: any) {
    console.error("❌ Lỗi update council:", err);
    res.status(500).json({ error: err.message });
  }
});
app.delete("/councils/:MaHD", async (req, res) => {
  try {
    const { MaHD } = req.params;
    console.log(MaHD);
    const result = await pool
      .request()
      .input("MaHD", sql.NVarChar(50), MaHD)
      .execute("usp_deleteHoiDong");

    res.json({ success: true, message: "Xóa hội đồng thành công" });
  } catch (err: any) {
    console.error("❌ Lỗi delete council:", err);
    res.status(500).json({ error: err.message });
  }
});
app.get("/councils/:MaHD", async (req, res) => {
  try {
    const { MaHD } = req.params;
    const result = await pool
      .request()
      .input("MaHD", sql.NVarChar(50), MaHD)
      .execute("usp_getHoiDong");
    res.json(result.recordset);
  } catch (err: any) {
    console.error("❌ Lỗi usp_getHoiDong:", err);
    res.status(500).json({ error: err.message });
  }
});
app.get("/councils/topics/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool
      .request()
      .input("MaHD", sql.VarChar(20), id)
      .execute("usp_listDoanInHoiDong");
    const data = result.recordset;
    return res.json(data);
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_listDetai:", err);
    res.status(500).json({ error: err.message });
  }
});
// Router Chấm điểm
app.post("/projects/addStudent/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { MaSV } = req.body;
    const result = await pool
      .request()
      .input("MaDoAn", sql.VarChar(20), id)
      .input("MaSV", sql.VarChar(20), MaSV)
      .execute("usp_addStudentToDoAn");

    res.json({ success: true, data: result.recordset });
  } catch (err: any) {
    console.error("❌ Lỗi thêm sinh viên vào đồ án:", err);
    res.status(500).json({ error: err.message });
  }
});
app.delete("/projects/delStudent/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { MaSV } = req.query;
    console.log(MaSV);
    const result = await pool
      .request()
      .input("MaDoAn", sql.VarChar(20), id)
      .input("MaSV", sql.VarChar(20), MaSV)
      .execute("usp_deleteStudentFromDoAn");

    res.json({ success: true, data: result.recordset });
  } catch (err: any) {
    console.error("❌ Lỗi thêm sinh viên vào đồ án:", err);
    res.status(500).json({ error: err.message });
  }
});
app.put("/scores", async (req, res) => {
  try {
    const {
      MaSV,
      MaDoAn,
      MaHD,
      DiemGVChuTich,
      DiemGVPhanBien,
      DiemGVHuongDan,
    } = req.body;
    const result = await pool
      .request()
      .input("MaDoAn", sql.VarChar(20), MaDoAn)
      .input("MaSV", sql.VarChar(20), MaSV)
      .input("MaHD", sql.VarChar(20), MaHD)
      .input("DiemGVChuTich", sql.Float(), DiemGVChuTich)
      .input("DiemGVPhanBien", sql.Float(), DiemGVPhanBien)
      .input("DiemGVHuongDan", sql.Float(), DiemGVHuongDan)
      .execute("usp_updateStudentScore");

    res.json({ success: true, data: result.recordset });
  } catch (err: any) {
    console.error("❌ Lỗi chấm điểm:", err);
    res.status(500).json({ error: err.message });
  }
});
app.get("/scores", async (req, res) => {
  try {
    const { MaDoAn, MaHD } = req.query;
    const result = await pool
      .request()
      .input("MaDoAn", sql.VarChar(20), MaDoAn)
      .input("MaHD", sql.VarChar(20), MaHD)
      .execute("usp_listScoreInDoAn");

    res.json({ success: true, data: result.recordset });
  } catch (err: any) {
    console.error("❌ Lỗi danh sách điểm:", err);
    res.status(500).json({ error: err.message });
  }
});
// năm
app.get("/years", async (req, res) => {
  try {
    const result = await pool.request().execute("usp_listNamHoc");
    res.json({ success: true, data: result.recordset });
  } catch (err: any) {
    console.error("❌ Lỗi chấm điểm:", err);
    res.status(500).json({ error: err.message });
  }
});
// router cho đồ án
app.post("/projects/council", async (req, res) => {
  try {
    const { MaDoAn, MaHoiDong } = req.body;
    const result = await pool
      .request()
      .input("MaDoAn", sql.VarChar(20), MaDoAn)
      .input("MaHoiDong", sql.VarChar(20), MaHoiDong)
      .execute("usp_AddDoAnHoiDong");

    res.json({ success: true, data: result.recordset });
  } catch (err: any) {
    console.error("❌ Lỗi thêm đồ án vào hội đồng:", err);
    res.status(500).json({ error: err.message });
  }
});
app.delete("/projects/council", async (req, res) => {
  try {
    const { MaDoAn, MaHoiDong } = req.body;
    const result = await pool
      .request()
      .input("MaDoAn", sql.VarChar(20), MaDoAn)
      .input("MaHoiDong", sql.VarChar(20), MaHoiDong)
      .execute("usp_RemoveDoAnHoiDong");

    res.json({ success: true, data: result.recordset });
  } catch (err: any) {
    console.error("❌ Lỗi delete usp_RemoveDoAnHoiDong:", err);
    res.status(500).json({ error: err.message });
  }
});
app.get("/projects/council", async (req, res) => {
  try {
    const { MaDoAn } = req.query;
    const result = await pool
      .request()
      .input("MaDT", sql.VarChar(20), MaDoAn)
      .execute("usp_getCouncilInProject");

    res.json(result.recordset);
  } catch (err: any) {
    console.error("❌ Lỗi usp_getCouncilInProject:", err);
    res.status(500).json({ error: err.message });
  }
});
app.get("/projects/students", async (req, res) => {
  try {
    const { MaDoAn } = req.query;
    const result = await pool
      .request()
      .input("MaDoAn", sql.VarChar(20), MaDoAn)
      .execute("usp_listStudentInDoAn");

    res.json(result.recordset);
  } catch (err: any) {
    console.error("❌ Lỗi usp_getCouncilInProject:", err);
    res.status(500).json({ error: err.message });
  }
});
app.get("/projects", async (req, res) => {
  try {
    const result = await pool
      .request()
      .input("search", sql.NVarChar(250), req.query.search || null)
      .input("limit", sql.Int, parseInt(req.query.limit as string) || 10)
      .input("skip", sql.Int, parseInt(req.query.skip as string) || 0)
      .input("MaNamHoc", sql.VarChar(20), req.query.year || null)
      .input(
        "SortBy",
        sql.NVarChar(250),
        (req.query.sortBy as string) || "DESC"
      )
      .input(
        "SortOrder",
        sql.NVarChar(250),
        (req.query.sortOrder as string) || "MaHD"
      )
      .input(
        "MaKhoa",
        sql.Int,
        req.query.deCode ? parseInt(req.query.deCode as string) : null
      )
      .execute("usp_listDoan");
    const recordsets = result.recordsets as sql.IRecordSet<any>[];
    res.json({
      data: recordsets[0],
      pagination: recordsets[1][0], // an toàn hơn vì giờ TS biết đây là array
    });
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_listStudent:", err);
    res.status(500).json({ error: err.message });
  }
});
app.post("/projects", async (req, res) => {
  try {
    const {
      MaKhoa,
      TenDT,
      MaNamHoc,
      MaGVHuongDan,
      ThoiGianBatDau,
      ThoiGianKetThuc,
    } = req.body;

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
app.put("/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { TenDT, MaGVHuongDan, ThoiGianBatDau, ThoiGianKetThuc } = req.body;
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
        ThoiGianKetThuc ? new Date(ThoiGianBatDau) : null
      )
      .execute("usp_updateDoan");

    res.json({ success: true, data: result.recordset });
  } catch (err: any) {
    console.error("❌ Lỗi update usp_updateDoan:", err);
    res.status(500).json({ error: err.message });
  }
});
app.delete("/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool
      .request()
      .input("MaDoAn", sql.NVarChar(50), id)
      .execute("usp_deleteDoan");

    res.json({ success: true, message: "Xóa đồ án thành công" });
  } catch (err: any) {
    console.error("❌ Lỗi delete usp_deleteDoan:", err);
    res.status(500).json({ error: err.message });
  }
});
app.get("/projects/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool
      .request()
      .input("MaDT", sql.VarChar(20), id)
      .execute("usp_getDoan");
    res.json(result.recordset);
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_getDoan:", err);
    res.status(500).json({ error: err.message });
  }
});
// report
app.get("/report/project", async (req, res) => {
  try {
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
app.get("/report/teacher", async (req, res) => {
  try {
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
    console.error("❌ Lỗi khi gọi usp_reportTopic:", err);
    res.status(500).json({ error: err.message });
  }
});
app.get("/report/teacherSummarys", async (req, res) => {
  try {
    const result = await pool
      .request()
      .input("year", sql.VarChar(20), req.query.year || null)
      .input(
        "maKhoa",
        sql.Int,
        req.query.deCode ? parseInt(req.query.deCode as string) : null
      )
      .execute("usp_reportTeacherSummary");
    res.json(result.recordset);
  } catch (err: any) {
    console.error("❌ Lỗi khi gọi usp_reportTeacherSummary:", err);
    res.status(500).json({ error: err.message });
  }
});
app.get("/report/faculty", async (req, res) => {
  try {
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
app.listen(4000, () => console.log("Server chạy ở http://localhost:4000"));
