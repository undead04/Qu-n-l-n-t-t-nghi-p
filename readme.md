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
Hệ thống ban đầu sử dụng cơ sở dữ liệu tập trung, lưu toàn bộ dữ liệu cho tất cả các khoa trong một server duy nhất.  
Việc này khiến truy vấn chậm và khó mở rộng khi số lượng sinh viên, giáo viên tăng cao.  
Vì vậy, hệ thống được chuyển sang **mô hình cơ sở dữ liệu phân tán theo kiểu phân mảnh ngang**, giúp:
- Giảm tải truy cập lên server trung tâm  
- Tối ưu truy vấn cục bộ tại từng khoa  
- Dễ dàng mở rộng quy mô khi thêm khoa mới  

---

## 🗺️ 2. Mô hình logic ban đầu
CSDL tập trung bao gồm các bảng chính:
- **SINHVIEN**, **GIAOVIEN**, **DETAI**, **DETAI_SINHVIEN**, **DIEM**, **HOIDONG**, **TAILIEU**, **NAMHOC**, **KHOA**

Tất cả các bảng đều có thuộc tính **MaKhoa**, dùng để xác định khoa mà bản ghi thuộc về.

---

## ⚙️ 3. Thiết kế phân tán (Phân mảnh ngang)

### 3.1. Nguyên tắc phân mảnh
- Mỗi **khoa** sẽ có một **site CSDL riêng**, lưu trữ toàn bộ dữ liệu của khoa đó.  
- Dữ liệu được chia **theo điều kiện MaKhoa**, đảm bảo **các mảnh không giao nhau và đầy đủ dữ liệu**.  
- Ví dụ:
  - `DBTN_CNTT`: chứa dữ liệu của **Khoa Công Nghệ Thông Tin (MaKhoa = 1)**  
  - `DBTN_CK`: chứa dữ liệu của **Khoa Cơ Khí (MaKhoa = 2)**

---

### 3.2. Bảng phân mảnh cụ thể

| Tên bảng | Kiểu phân mảnh | Điều kiện phân mảnh | Vị trí lưu trữ |
|-----------|----------------|----------------------|----------------|
| SINHVIEN | Ngang | MaKhoa = 1 / 2 / ... | Site tương ứng với khoa |
| GIAOVIEN | Ngang | MaKhoa = 1 / 2 / ... | Site tương ứng với khoa |
| DETAI | Ngang | MaKhoa = 1 / 2 / ... | Site tương ứng |
| DETAI_SINHVIEN | Ngang | Theo MaKhoa của DETAI | Site tương ứng |
| DIEM | Ngang | Theo MaKhoa của DETAI_SINHVIEN | Site tương ứng |
| HOIDONG | Ngang | Theo MaKhoa | Site tương ứng |
| TAILIEU | Ngang | Theo MaDT thuộc site | Site tương ứng |
| KHOA | Sao chép | Toàn bộ | Tất cả các site |
| NAMHOC | Sao chép | Toàn bộ | Tất cả các site |

---

## 🔗 4. Mô hình vật lý phân tán


