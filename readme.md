# Hướng dẫn chạy dự án Backend

## 1. Cài đặt môi trường

- **Node.js**: Cài đặt Node.js (khuyên dùng bản LTS).
- **SQL Server**: Đảm bảo đã cài đặt SQL Server và tạo database `DBTN` với các stored procedure cần thiết.

## 2. Cài đặt package

Mở terminal tại thư mục `backend` và chạy: npm install


## 3. Cấu hình kết nối database

Kiểm tra file `src/db`:
- Sửa thông tin user, password, server, port, database cho phù hợp với SQL Server của bạn.

## 5. Chạy server cd backend npm run start

- Server chạy tại: [http://localhost:4000](http://localhost:4000)

## 6. API chính

- `/faculties` - Danh sách khoa
- `/students` - Danh sách sinh viên
- `/teachers` - Danh sách giáo viên
- `/councils` - Danh sách hội đồng
- `/projects` - Danh sách đề tài/đồ án
- `/scores` - Chấm điểm
- `/report/project` - Báo cáo đề tài sinh viên
- ...và các API khác (xem trong `src/app.ts`)

## 7. Lưu ý

- Đảm bảo SQL Server đã mở port và cho phép kết nối từ Node.js.
- Nếu lỗi kết nối, kiểm tra lại thông tin cấu hình và trạng thái SQL Server.

---
## 8 frontend
-- tương tự như backend cd frontend npm install npm run dev để chạy
**Chúc bạn thành công!**

## 9. Phân quyền Frontend
# 🧠 UserContext – Quản lý phân quyền Frontend (Next.js / React)

## 🎯 Mục đích
Dùng để quản lý thông tin người dùng và phân quyền hiển thị giao diện ở **frontend**.
---

## ⚙️ Cài đặt & Cấu trúc
File: `context/UserContext.tsx`

Chức năng chính:
- `user`: Lưu thông tin người dùng hiện tại.
- `setUser()`: Cập nhật user sau khi đăng nhập.
- `logout()`: Xóa thông tin người dùng và chuyển về `/login`.
- `hasRole(role)`: Kiểm tra người dùng có quyền hay không.

---

## 🧩 Sử dụng

### 1️⃣ Bọc ứng dụng
```tsx
<UserProvider>
  <App />
</UserProvider>
```
# 🔒 ProtectedRoute – Bảo vệ route theo quyền (Frontend Only)

## 🎯 Mục đích  
Giúp **chặn truy cập** vào các trang không phù hợp với vai trò người dùng (role), chỉ xử lý ở **frontend**.

---

## ⚙️ Cấu trúc  
File: `components/ProtectedRoute.tsx`

### Chức năng chính:
- Kiểm tra `localStorage.user`
- Nếu **chưa đăng nhập** → chuyển hướng `/login`
- Nếu **role không hợp lệ** → `router.back()` (quay lại trang trước)
- Nếu hợp lệ → render nội dung (`children`)

---

## 🧩 Sử dụng

### 1️⃣ Import & Bao quanh component cần bảo vệ
```tsx
import ProtectedRoute from "@/components/ProtectedRoute";
import { ROLES } from "@/context/UserContext";

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
      <h1>Trang dành cho Admin</h1>
    </ProtectedRoute>
  );
}
```
# 📘 Mô tả chuyển đổi CSDL quan hệ sang CSDL phân tán (Phân mảnh ngang)

## 🎯 1. Mục tiêu
Hệ thống ban đầu sử dụng cơ sở dữ liệu tập trung, lưu toàn bộ dữ liệu cho mọi khoa trong cùng một máy chủ.  
Để tăng hiệu năng và khả năng mở rộng, hệ thống được chuyển sang mô hình **CSDL phân tán theo kiểu phân mảnh ngang**, trong đó:
- Mỗi khoa có một CSDL riêng (site cục bộ).  
- CSDL trung tâm lưu thông tin dùng chung như **KHOA** và **NAMHOC**.

---
## 2. Giải thích
Tất cả code của phần DB đều cở trong config
DBTT: database tập trung
DBPT:database phân tán
trong DBPT cái nào có chữ M có nghĩa là db chung còn có chử K có nghĩa là DB Khoa
Trong mỗi folder đã chia làm 4 cái là func,proc,trigger,table nhớ đọc nha mấy pro
---
## 🗺️ 3. Mô hình logic ban đầu
Hệ thống gồm các bảng chính:
- **SINHVIEN**, **GIAOVIEN**, **DETAI**, **DETAI_SINHVIEN**, **DIEM**, **HOIDONG**, **TAILIEU**
- Các bảng dùng chung: **KHOA**, **NAMHOC**

---

## ⚙️ 3. Thiết kế phân tán (Phân mảnh ngang)

### 3.1. Nguyên tắc phân mảnh
- Dữ liệu được chia **theo MaKhoa** (mỗi khoa tương ứng một site).  
- Mỗi site chỉ chứa dữ liệu liên quan đến khoa của mình.  
- Các bảng dùng chung (`KHOA`, `NAMHOC`) được lưu tập trung tại **DBMain** và có thể được truy cập qua Linked Server.

---

### 3.2. Bảng phân mảnh cụ thể

| Tên bảng | Kiểu phân mảnh | Điều kiện phân mảnh | Vị trí lưu trữ |
|-----------|----------------|----------------------|----------------|
| SINHVIEN | Ngang | MaKhoa = 1 / 2 / ... | Server theo khoa |
| GIAOVIEN | Ngang | MaKhoa = 1 / 2 / ... | Server theo khoa |
| DETAI | Ngang | MaKhoa = 1 / 2 / ... | Server theo khoa |
| DETAI_SINHVIEN | Ngang | Theo MaKhoa của DETAI | Server theo khoa |
| DIEM | Ngang | Theo MaKhoa của DETAI_SINHVIEN | Server theo khoa |
| HOIDONG | Ngang | Theo MaKhoa | Server theo khoa |
| TAILIEU | Ngang | Theo MaDT thuộc site | Server theo khoa |
| KHOA | Tập trung | Toàn bộ | DBMain |
| NAMHOC | Tập trung | Toàn bộ | DBMain |

---

## 🧩 4. Mô hình vật lý phân tán


---

## 🔗 5. Truy vấn hợp nhất & liên kết site

### Tạo Linked Server (kết nối các site)
```sql
EXEC sp_addlinkedserver 
    @server     = N'DBTN_CNTT',
    @srvproduct = N'',               
    @provider   = N'SQLNCLI',      
    @datasrc    = N'VANAN\SQLEXPRESS',
    @catalog    = N'DBTN_CNTT' ;
GO

EXEC sp_addlinkedsrvlogin 
    @rmtsrvname = N'DBTN_CNTT', 
    @useself    = N'False',              
    @locallogin = NULL, 
    @rmtuser    = N'sa', 
    @rmtpassword= N'123456';
GO

CREATE OR ALTER PROC usp_listHoiDong
    @search NVARCHAR(250) = NULL,
    @limit INT = 10,
    @MaKhoa INT = NULL,
    @skip INT = 0,
    @MaGV VARCHAR(20) = NULL,
    @MaNamHoc NVARCHAR(20) = NULL,
    @SortBy NVARCHAR(50) = 'NgayBaoVe',
    @SortOrder NVARCHAR(4) = 'ASC'
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @LinkedServer NVARCHAR(100),
            @SQL NVARCHAR(MAX);

    -- 🔹 1. Chọn linked server tương ứng
    SET @LinkedServer = CASE @MaKhoa
        WHEN 1 THEN 'DBTN_CNTT'
        WHEN 2 THEN 'DBTN_CK'
        ELSE NULL
    END;

    IF @LinkedServer IS NULL
    BEGIN
        RETURN;
    END;
    -- 🔹 2. Gọi proc qua linked server
    SET @SQL = N'
        EXEC [' + @LinkedServer + N'].[DBTN_' + 
            CASE @MaKhoa WHEN 1 THEN 'CNTT' WHEN 2 THEN 'CK' WHEN 3 THEN 'KT' ELSE 'CNTT' END + 
        N'].[dbo].[usp_listHoiDong]
            @search = @search,
            @limit = @limit,
            @skip = @skip,
            @MaGV = @MaGV,
            @MaNamHoc = @MaNamHoc,
            @SortBy = @SortBy,
            @SortOrder = @SortOrder;';

    EXEC sp_executesql @SQL, 
        N'@search NVARCHAR(250), @limit INT, @skip INT, @MaGV VARCHAR(20), @MaNamHoc NVARCHAR(20), @SortBy NVARCHAR(50), @SortOrder NVARCHAR(4)',
        @search, @limit, @skip, @MaGV, @MaNamHoc, @SortBy, @SortOrder;
END;
GO




