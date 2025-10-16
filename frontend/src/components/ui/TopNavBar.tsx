"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./Button";

export default function TopNavBar() {
  const pathname = usePathname();

  const menus = [
    { id: "sinhvien", label: "Sinh viên", path: "/student" },
    { id: "giaovien", label: "Giáo viên", path: "/teacher" },
    { id: "hoidong", label: "Hội đồng", path: "/council" },
    { id: "doan", label: "Đồ án", path: "/project" },
    { id: "khoa", label: "Khoa", path: "/faculty" },
  ];

  return (
    <div className="sticky top-0 z-50 w-full bg-white shadow px-4 py-2 flex gap-2 items-center">
      {/* Các menu còn lại */}
      {menus.map((menu) => {
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
  );
}
