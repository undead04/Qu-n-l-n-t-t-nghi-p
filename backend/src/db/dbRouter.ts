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

/// 🔹 Hàm khởi tạo tất cả connection tới các khoa
export async function preloadAllKhoaConnections() {
  try {
    if (!mainPoolConnected) {
      await mainPool.connect();
      mainPoolConnected = true;
      console.log("✅ Connected to main DB (DBTN)");
    }

    // Lấy danh sách tất cả khoa trong bảng KHOA_MAP
    const result = await mainPool.query<KhoaMap>("SELECT * FROM KHOA_MAP");
    const khoaList = result.recordset;

    for (const khoa of khoaList) {
      if (!connectionPools[khoa.MaKhoa]) {
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
        console.log(`✅ Preloaded DB connection for ${khoa.TenKhoa}`);
      }
    }
  } catch (err) {
    console.error("❌ Error preloading khoa connections:", err);
  }
}
export async function getConnectionByKhoa(MaKhoa: number | null) {
  if (MaKhoa == null) return mainPool;

  const pool = connectionPools[MaKhoa];
  if (!pool)
    throw new Error(`Không tìm thấy connection cho MaKhoa = ${MaKhoa}`);
  return pool;
}
