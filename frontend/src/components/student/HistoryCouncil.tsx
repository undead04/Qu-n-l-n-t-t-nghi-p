"use client";
import { use, useEffect, useState } from "react";
import { formatDate } from "@/utils/formatDate";
import axios from "axios";
import { IStudent } from "./StudentList";
import { Button } from "../ui/Button";
import { useRouter } from "next/navigation";
import { IProject } from "../project/ProjectList";
import LoadingSpinner from "../ui/LoadingSpinner";
import { useUser } from "@/context/UserContext";

interface Props {
  id: string;
  MaKhoa: Number;
}
export default function HistoryCouncil({ id, MaKhoa }: Props) {
  const [student, setStudent] = useState<IStudent>();
  const [history, setHistory] = useState<IProject[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const fetchStudents = async () => {
    try {
      const res = await axios.get(`http://localhost:4000/students/${id}`, {
        params: { MaKhoa: MaKhoa },
      });
      setStudent(res.data[0]);
    } catch (error) {
      console.error("Fetch students error:", error);
    }
  };
  const fetchHistorys = async () => {
    try {
      const res = await axios.get(
        `http://localhost:4000/students/project/${id}`,
        { params: { MaKhoa: MaKhoa } }
      );
      setHistory(res.data);
    } catch (error) {
      console.error("Fetch History error:", error);
    }
  };
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchStudents(), fetchHistorys()]);
      setIsLoading(false);
    };

    loadData();
  }, []);
  const router = useRouter();
  const handleNavigate = (id: string) => {
    router.push(`/admin/project/${id}`);
  };
  if (isLoading) return <LoadingSpinner />;
  return (
    <>
      {student && (
        <div className="w-full max-w-5xl mx-auto space-y-6">
          {/* Thông tin đề tài */}
          <div className="bg-white shadow rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-2">{student.TenSV}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Mã SV:</span> {student.MaSV}
              </div>
              <div>
                <span className="font-medium">Khoa:</span> {student.TenKhoa}
              </div>
              <div>
                <span className="font-medium">Số điện thoại:</span>{" "}
                {student.SoDienThoai}
              </div>
              <div>
                <span className="font-medium">Địa chỉ:</span> {student.DiaChi}
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6 border">
            <h3 className="text-lg font-semibold mb-4">Lịch sữ đồ án</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-purple-100 text-left">
                    <th className="p-3">Mã đề tài</th>
                    <th className="p-3">Tên đề tài</th>
                    <th className="p-3">Niên khóa</th>
                    <th className="p-3">Bắt đầu</th>
                    <th className="p-3">Kết thúc</th>
                    <th className="p-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {history && history.length > 0 ? (
                    history.map((row, index) => (
                      <tr
                        key={index}
                        className="border-b hover:bg-purple-50 transition"
                      >
                        <td className="p-3">{row.MaDT}</td>
                        <td className="p-3">{row.TenDT}</td>
                        <td className="p-3">{row.MaNamHoc}</td>
                        <td className="p-3">
                          {formatDate(row.ThoiGianBatDau)}
                        </td>
                        <td className="p-3">
                          {formatDate(row.ThoiGianKetThuc)}
                        </td>
                        <td className="p-3">
                          <Button
                            className="bg-blue-500 text-white hover:bg-blue-600"
                            onClick={() => handleNavigate(row.MaDT)}
                          >
                            👁 Xem
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-gray-500">
                        📭 Không có dữ liệu
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
