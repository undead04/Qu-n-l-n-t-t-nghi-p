"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./Button";
import { useUser } from "@/context/UserContext";

export default function TopNavBar() {
  const pathname = usePathname();
  const { user, logout } = useUser();
  const menus = [
    {
      id: "sinhvien",
      label: "Sinh viên",
      path: "/admin/student",
      allowedRoles: ["Admin"],
    },
    {
      id: "giaovien",
      label: "Giáo viên",
      path: "/admin/teacher",
      allowedRoles: ["Admin"],
    },
    {
      id: "hoidong",
      label: "Hội đồng",
      path: "/admin/council",
      allowedRoles: ["Admin"],
    },
    {
      id: "hoidonggiaovien",
      label: "Hội đồng",
      path: "/council",
      allowedRoles: ["GiaoVien"],
    },
    {
      id: "doan",
      label: "Đồ án",
      path: "/admin/project",
      allowedRoles: ["Admin"],
    },
    {
      id: "doanhocsinh",
      label: "Đồ án",
      path: "/student/project",
      allowedRoles: ["SinhVien"],
    },
    {
      id: "doanGV",
      label: "Đồ án",
      path: "/project",
      allowedRoles: ["GiaoVien"],
    },
    {
      id: "khoa",
      label: "Khoa",
      path: "/admin/faculty",
      allowedRoles: ["Admin"],
    },
  ];
  console.log(user);
  return (
    <div className="sticky top-0 z-50 w-full bg-white shadow px-4 py-2 flex justify-between items-center">
      {/* 🔹 Menu bên trái */}
      <div className="flex gap-2 items-center">
        {menus
          .filter((menu) => user && menu.allowedRoles.includes(user.Role))
          .map((menu) => {
            const isActive =
              (menu.id === "sinhvien" &&
                (pathname === "/" || pathname.startsWith("/student"))) ||
              pathname === menu.path ||
              pathname.startsWith(menu.path + "/");

            return (
              <Link key={menu.id} href={menu.path}>
                <Button variant={isActive ? "default" : "outline"}>
                  {menu.label}
                </Button>
              </Link>
            );
          })}
      </div>

      {/* 🔹 Nút Logout bên phải */}
      {user && (
        <div className="flex items-center gap-3">
          <span className="text-gray-600 text-sm">
            Xin chào, <b>{user.TenNguoiDung || user.Username}</b>
          </span>
          <Button variant="destructive" onClick={logout}>
            Đăng xuất
          </Button>
        </div>
      )}
    </div>
  );
}
