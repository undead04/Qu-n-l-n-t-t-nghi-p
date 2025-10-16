"use client";
import { useEffect, useState } from "react";
import { formatDate } from "@/utils/formatDate";
import axios from "axios";
import { IStudent } from "./StudentList";
import { Button } from "../ui/Button";
import { useRouter } from "next/navigation";

interface Props {
  id: string;
  MaKhoa: Number;
}
interface IHistory {
  MaHD: string;
  MaDT: string;
  TenDT: string;
  LanBaoVe: string;
  NgayBaoVe: Date;
  DiaChiBaoVe: string;
}
export default function HistoryCouncil({ id, MaKhoa }: Props) {
  const [student, setStudent] = useState<IStudent>();
  const [history, setHistory] = useState<IHistory[]>([]);
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
        `http://localhost:4000/students/history/${id}`,
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
    router.push(`/project/${id}`);
  };
  return (
    <>
      {!isLoading && student && (
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
            <h3 className="text-lg font-semibold mb-4">Lịch sữ bảo vệ đồ án</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-purple-100 text-left">
                    <th className="p-3">Mã HD</th>
                    <th className="p-3">Mã đề tài</th>
                    <th className="p-3">Tên đề tài</th>
                    <th className="p-3">Địa chỉ</th>
                    <th className="p-3">Ngày bảo vệ</th>
                    <th className="p-3">Lần bảo vệ</th>
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
                        <td className="p-3 font-medium text-gray-700">
                          {row.MaHD}
                        </td>
                        <td className="p-3">{row.MaDT}</td>
                        <td className="p-3">{row.TenDT}</td>
                        <td className="p-3">{row.DiaChiBaoVe}</td>
                        <td className="p-3">{formatDate(row.NgayBaoVe)}</td>
                        <td className="p-3">{`Lần ${row.LanBaoVe}`}</td>
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
