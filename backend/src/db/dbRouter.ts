import sql, { ConnectionPool } from "mssql";
import { KhoaMap } from "../type";

// Cấu hình DB chính
const config: sql.config = {
  user: "sa",
  password: "123456",
  server: "localhost",
  port: 60429,
  database: "DBTN",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

// Tạo connection pool chính
const mainPool = new sql.ConnectionPool(config);
let mainPoolConnected = false;

// Cache các pool của từng khoa
const connectionPools: Record<number, ConnectionPool> = {};

/**
 * Hàm lấy connection theo mã khoa
 * Nếu không truyền MaKhoa -> dùng DB chính
 */
export async function getConnectionByKhoa(
  MaKhoa?: number
): Promise<ConnectionPool> {
  try {
    // 🔹 Đảm bảo mainPool luôn mở
    if (!mainPoolConnected) {
      await mainPool.connect();
      mainPoolConnected = true;
      console.log("✅ Connected to main DB (DBTN)");
    }

    // 🔹 Nếu không truyền MaKhoa => dùng mainPool
    if (MaKhoa == null) {
      return mainPool;
    }

    // 🔹 Tìm thông tin Khoa từ bảng KHOA_MAP
    const result = await mainPool
      .request()
      .input("MaKhoa", sql.Int, MaKhoa)
      .query<KhoaMap>("SELECT * FROM KHOA_MAP WHERE MaKhoa = @MaKhoa");

    const khoa = result.recordset[0];
    if (!khoa) {
      throw new Error(`Không tìm thấy MaKhoa = ${MaKhoa}`);
    }

    // 🔹 Nếu đã có cache thì trả lại ngay
    if (connectionPools[khoa.MaKhoa]?.connected) {
      return connectionPools[khoa.MaKhoa];
    }
    // 🔹 Nếu chưa có hoặc bị đóng → tạo mới
    const pool = new sql.ConnectionPool({
      user: khoa.UserName,
      password: khoa.Password,
      server: "localhost",
      port: 60429,
      database: khoa.DBName,
      options: { encrypt: false, trustServerCertificate: true },
    });

    await pool.connect();
    connectionPools[khoa.MaKhoa] = pool;
    console.log(`✅ Connected to DB of Khoa: ${khoa.TenKhoa} (${khoa.DBName})`);
    return connectionPools[khoa.MaKhoa];
  } catch (err) {
    console.error("❌ Error in getConnectionByKhoa:", err);
    throw err;
  }
}
