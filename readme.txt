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
### UserContext

File `frontend/src/contexts/UserContext.tsx` quản lý trạng thái đăng nhập và thông tin người dùng:

- Cung cấp context để lưu trữ:
  - Thông tin user đang đăng nhập
  - Token xác thực
  - Role người dùng (ADMIN/TEACHER/STUDENT)
- Các method chính:
  - `login()`: Xử lý đăng nhập và lưu thông tin user
  - `logout()`: Đăng xuất và xóa thông tin user
  - `isAuthenticated()`: Kiểm tra trạng thái đăng nhập

Ví dụ sử dụng:
```tsx
const { user, login, logout } = useUserContext();