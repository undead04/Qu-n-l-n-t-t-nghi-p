"use client";
import { useEffect, useState } from "react";
import Select from "react-select";
import { Label } from "../ui/label";
import { Option } from "../ui/SelectBox";
import axios from "axios";
import { Button } from "../ui/Button";
import { IProject } from "../project/ProjectList";
import { formatDate } from "@/utils/formatDate";
import { Input } from "../ui/Input";
import { IPagination, Pagination } from "../ui/Pagination";
import { skip } from "node:test";

interface Prop {
  onClose: () => void;
  isOpen: boolean;
  MaHD: string;
  onLoad: () => void;
  MaKhoa: number;
  addTopic: IProject[];
  MaNamHoc: string;
}
export default function AddCouncilModal({
  onClose,
  isOpen,
  MaHD,
  onLoad,
  MaKhoa,
  addTopic,
  MaNamHoc,
}: Prop) {
  const [search, setSearch] = useState<string>("");
  const [topics, setTopics] = useState<IProject[]>(addTopic || []);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<IProject[]>([]);
  const [pagination, setPagination] = useState<IPagination>();
  const [filter, setFilter] = useState<{
    search: string;
    skip: number;
  }>({ search: "", skip: 0 });
  useEffect(() => {
    setTopics(addTopic);
  }, [addTopic]);
  const handlePageChange = (page: number) => {
    const skip = (page - 1) * 10;
    setFilter({ ...filter, skip });
  };
  // Hàm gọi API search SV
  async function fetchTopic(inputValue: string, skip: number) {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:4000/projects", {
        params: {
          search: inputValue,
          MaKhoa,
          year: MaNamHoc,
          limit: 10,
          skip: skip,
        },
      });
      const data = res.data.data;
      setSearchResults(data);
      setPagination(res.data.pagination);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    fetchTopic(search, 0);
  }, [search]);
  const handleSave = async () => {
    await axios
      .post(`http://localhost:4000/projects/council`, {
        MaDoAn: topics.map((t) => t.MaDT).join(","),
        MaHoiDong: MaHD,
        MaKhoa: MaKhoa,
      })
      .then((res) => {
        alert("✅ Cập nhập danh sách đề tài trong hội đồng thành công");
        onLoad();
        onClose();
      })
      .catch((err) => {
        alert(err.response.data.error);
      });
  };
  const handleAdd = (topic: IProject) => {
    if (topic) {
      // Kiểm tra trùng mã SV
      const isExist = topics.some((s) => s.MaDT === topic.MaDT);
      if (isExist) {
        alert("Đề tài này đã được thêm!");
        return;
      }
      setTopics([...topics, topic as IProject]);
    }
  };
  const handleDelete = (id: string) => {
    setTopics(topics.filter((i) => i.MaDT != id));
  };
  let timer: NodeJS.Timeout;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(timer);
    timer = setTimeout(() => {
      setFilter({ ...filter, search: val });
    }, 500);
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        className="bg-white w-full max-w-[1250px] rounded-2xl shadow-2xl p-6 animate-fadeIn flex flex-col
                min-h-[70vh] max-h-[95vh] overflow-hidden"
      >
        {/* --- Header --- */}
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            🧾 Thêm đề tài vào hội đồng
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            ✖
          </button>
        </div>

        {/* --- Content --- */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="grid grid-cols-2 gap-5 flex-1 overflow-hidden">
            {/* --- Bảng tìm kiếm --- */}
            <div className="border rounded-xl shadow-sm p-4 flex flex-col overflow-hidden">
              <h3 className="font-semibold text-gray-800 mb-3">
                🔍 Tìm đề tài
              </h3>
              <Input
                type="text"
                className="border rounded-lg px-3 py-2 text-sm mb-3 focus:ring-2 focus:ring-blue-500 outline-none"
                value={search}
                onChange={handleChange}
              />
              <div className="flex-1 overflow-y-auto border rounded-lg">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-gray-100 text-gray-700 sticky top-0">
                    <tr>
                      <th className="p-2 text-center">Mã</th>
                      <th className="p-2 text-left">Tên đề tài</th>
                      <th className="p-2 text-left">Bắt đầu</th>
                      <th className="p-2 text-left">Kết thúc</th>
                      <th className="p-2 text-left">Tên GV</th>
                      <th className="p-2 text-left">Trạng thái</th>
                      <th className="p-2 text-center">Thêm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.length > 0 ? (
                      searchResults.map((t) => (
                        <tr
                          key={t.MaDT}
                          className="hover:bg-gray-50 border-t transition"
                        >
                          <td className="p-2 text-center">{t.MaDT}</td>
                          <td className="p-2">{t.TenDT}</td>
                          <td className="p-2">
                            {formatDate(t.ThoiGianBatDau)}
                          </td>
                          <td className="p-2">
                            {formatDate(t.ThoiGianKetThuc)}
                          </td>
                          <td className="p-2">{t.TenGVHuongDan}</td>
                          <td
                            className={`p-2 font-semibold ${
                              t.MaHD == null ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            {t.MaHD == null ? "Ko có" : "Có"}
                          </td>

                          <td className="p-2 text-center">
                            <Button
                              className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1"
                              onClick={() => handleAdd(t)}
                            >
                              + Thêm
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          className="text-center text-gray-500 italic p-3"
                        >
                          {search.length < 5
                            ? "Nhập ít nhất 5 ký tự để tìm."
                            : "Không tìm thấy đề tài phù hợp."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <Pagination
                  currentPage={pagination?.CurrentPage || 1}
                  totalLength={pagination?.TotalRecords || 0}
                  pageSize={pagination?.PageSize || 10}
                  onPageChange={handlePageChange}
                />
              </div>
            </div>

            {/* --- Bảng đề tài đã thêm --- */}
            <div className="border rounded-xl shadow-sm p-4 flex flex-col overflow-hidden">
              <h3 className="font-semibold text-gray-800 mb-3">
                📋 Đề tài đã thêm
              </h3>
              {topics.length > 0 ? (
                <div className="flex-1 overflow-y-auto border rounded-lg">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-gray-100 text-gray-700 sticky top-0">
                      <tr>
                        <th className="p-2 text-center">Mã</th>
                        <th className="p-2 text-left">Tên đề tài</th>
                        <th className="p-2 text-left">Bắt đầu</th>
                        <th className="p-2 text-left">Kết thúc</th>
                        <th className="p-2 text-left">Tên GV</th>
                        <th className="p-2 text-center">Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topics.map((t, index) => (
                        <tr
                          key={index}
                          className="hover:bg-gray-50 border-t transition"
                        >
                          <td className="p-2 text-center">{t.MaDT}</td>
                          <td className="p-2">{t.TenDT}</td>
                          <td className="p-2">
                            {formatDate(t.ThoiGianBatDau)}
                          </td>
                          <td className="p-2">
                            {formatDate(t.ThoiGianKetThuc)}
                          </td>
                          <td className="p-2">{t.TenGVHuongDan}</td>
                          <td className="p-2 text-center">
                            <Button
                              variant="destructive"
                              className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1"
                              onClick={() => handleDelete(t.MaDT)}
                            >
                              Xóa
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-gray-500 italic text-center py-5">
                  Chưa có đề tài nào được thêm.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- Footer --- */}
        <div className="flex justify-end gap-3 pt-5 border-t mt-6">
          <Button
            type="button"
            variant="outline"
            className="px-5 py-2 border-gray-300"
            onClick={() => {
              onClose();
              setTopics(addTopic);
            }}
          >
            Hủy
          </Button>
          <Button
            type="button"
            className="bg-blue-600 text-white hover:bg-blue-700 px-5 py-2"
            onClick={handleSave}
          >
            Lưu thay đổi
          </Button>
        </div>
      </div>
    </div>
  );
}
