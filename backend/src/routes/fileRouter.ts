import express from "express";
import sql from "mssql";
import { getConnectionByKhoa } from "../db/dbRouter";
import { AWSBucketService } from "../services/AWSBucket.service";
import { uploadMemory } from "../middleware/multer.middleware";

const router = express.Router();
router.post("/files", uploadMemory.array("files"), async (req, res) => {
  try {
    const { MaDT, Role, oldUrl, MaKhoa } = req.body;
    const files = req.files as Express.Multer.File[];
    if (!files.length || !MaDT) {
      return res
        .status(400)
        .json({ error: "Thiếu thông tin hoặc file upload" });
    }
    const nameFiles = files.map((item) => item.originalname);
    const service = new AWSBucketService();
    if (oldUrl) {
      if (oldUrl.length > 0) {
        await service.deleteImagesByUrl(oldUrl);
      }
    }
    const uploadResult = await service.uploadImagesFromLocal(files, MaDT);
    const table = new sql.Table();
    table.columns.add("Url", sql.NVarChar(250));
    table.columns.add("TenTL", sql.NVarChar(500));

    uploadResult.forEach((item, index) => {
      table.rows.add(nameFiles[index], item.key);
    });
    const pool = await getConnectionByKhoa(MaKhoa);
    await pool
      .request()
      .input("MaDT", sql.VarChar(20), MaDT)
      .input("FileList", table)
      .execute("usp_addFile");
    res.status(200).json("thanh cong");
  } catch (err) {
    console.error("❌ Lỗi khi upload file:", err);
    res.status(500).json({ error: err });
  }
});
router.get("/files", async (req, res) => {
  try {
    const { MaDT, MaKhoa } = req.query;
    const Role = req.query.Role ? Number(req.query.Role) : null;

    const service = new AWSBucketService();
    const pool = await getConnectionByKhoa(Number(MaKhoa));

    // 🧩 Khởi tạo request
    const request = pool.request();

    // Luôn có MaDT
    request.input("MaDT", sql.VarChar(20), MaDT);

    // 🧠 Gọi procedure
    const results = await request.execute("usp_getFile");

    const datas = results.recordset || [];

    if (datas.length === 0) {
      return res.status(200).json([]); // Không có file
    }

    // 🪣 Map dữ liệu với link S3
    const newData = datas.map((f) => ({
      ...f,
      files: service.getImageByUrl(f.Url),
    }));

    res.status(200).json(newData);
  } catch (err) {
    console.error("❌ Lỗi khi usp_getFile:", err);
    res.status(500).json({ err });
  }
});

router.delete("/files", async (req, res) => {
  try {
    const { MaDT, urls, MaKhoa } = req.query;
    if (!urls || !MaDT) {
      res.status(400).json({ error: "Thiếu thông tin hoặc URL" });
      return;
    }

    // Xử lý tiếp nếu urls rỗng...
    const service = new AWSBucketService();
    const urlArr = (urls as string).split(",");
    await service.deleteImagesByUrl(urlArr);

    const pool = await getConnectionByKhoa(Number(MaKhoa));
    const table = new sql.Table();
    table.columns.add("Url", sql.NVarChar(250));

    urlArr.forEach((item) => {
      table.rows.add(item);
    });
    await pool
      .request()
      .input("FileUrl", table)
      .input("MaDT", sql.VarChar(20), MaDT)
      .execute("usp_deleteFile");
    res.status(200).json();
  } catch (err) {
    console.error("❌ Lỗi khi xóa file:", err);
    res.status(500).json({ error: err });
  }
});
export default router;
