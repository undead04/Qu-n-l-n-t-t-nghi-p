"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { IProject } from "@/components/project/ProjectList";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/utils/formatDate";
import { useUser } from "@/context/UserContext";

import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function Page() {
  const { user } = useUser();
  const [records, setRecords] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  // 🚀 Fetch API dựa trên URL query
  const fetchData = async () => {
    setLoading(true);
    try {
      if (user) {
        try {
          const res = await axios.get(
            `http://localhost:4000/students/project/${user.Username}`,
            { params: { MaKhoa: user.MaKhoa, Role: user.MaKhoa } }
          );
          setRecords(res.data);
        } catch (error) {
          console.error("Fetch History error:", error);
        }
      }
    } catch (err) {
      alert("⚠️ Lỗi khi lấy dữ liệu đồ án");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, [user]);

  const handleNavigate = (id: string, MaKhoa: number) => {
    router.push(`/student/project/${id}?MaKhoa=${MaKhoa}`);
  };

  if (!user && loading) return <LoadingSpinner />;
  return (
    <>
      <div className="px-6 py-6 bg-gradient-to-tr from-purple-50 to-white rounded-2xl shadow-lg border space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-purple-700 flex items-center gap-2">
              Danh sách đồ án của sinh viên {user?.TenNguoiDung}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Quản lý & theo dõi các đồ án
            </p>
          </div>
        </div>
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-purple-100 text-left">
                <th className="p-3">Mã đồ án</th>
                <th className="p-3">Tên đề tài</th>
                <th className="p-3">Niên khóa</th>
                <th className="p-3">Giáo viên</th>
                <th className="p-3">Bắt đầu</th>
                <th className="p-3">Kết thúc</th>
                <th className="p-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {records && records.length > 0 ? (
                records.map((row, index) => (
                  <tr
                    key={index}
                    className="border-b hover:bg-purple-50 transition"
                  >
                    <td className="p-3 font-medium text-gray-700">
                      {row.MaDT}
                    </td>
                    <td className="p-3">{row.TenDT}</td>
                    <td className="p-3">{row.MaNamHoc}</td>

                    <td className="p-3">{row.TenGVHuongDan}</td>
                    <td className="p-3">{formatDate(row.ThoiGianBatDau)}</td>
                    <td className="p-3">{formatDate(row.ThoiGianKetThuc)}</td>
                    <td className="p-3">
                      <div className="flex gap-2 justify-center">
                        <Button
                          className="bg-blue-500 text-white hover:bg-blue-600"
                          onClick={() => handleNavigate(row.MaDT!, row.MaKhoa!)}
                        >
                          👁 Xem
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-gray-500">
                    📭 Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
