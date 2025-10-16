"use client";
import { useEffect, useState } from "react";
import { formatDate } from "@/utils/formatDate";
import axios from "axios";
import { Button } from "../ui/Button";
import { useRouter, useSearchParams } from "next/navigation";
import { ITeacher } from "./TeacherList";
import { IProject } from "../project/ProjectList";
import { IPagination, Pagination } from "../ui/Pagination";
import SearchBox from "../ui/SearchBox";
import SelectBox, { Option } from "../ui/SelectBox";
import { convertSelectBox } from "@/utils/convertSelectBox";

interface Props {
  id: string;
  MaKhoa: number;
}

export default function HistoryTeacher({ id, MaKhoa }: Props) {
  const [teacher, setTeacher] = useState<ITeacher>();
  const [topic, setTopic] = useState<IProject[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [pagination, setPagination] = useState<IPagination>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [param, setParam] = useState<{
    search: string | null;
    skip: number;
    year: string | null;
  }>({
    search: null,
    skip: 0,
    year: null,
  });
  const listYear: Option[] = [
    {
      label: "2024-2025",
      value: "2024-2025",
    },
    {
      label: "2025-2026",
      value: "2025-2026",
    },
  ];
  const fetchTeacher = async () => {
    try {
      const res = await axios.get(`http://localhost:4000/teachers/${id}`,{
        params: { MaKhoa },
      });
      setTeacher(res.data[0]);
    } catch (error) {
      console.error("Fetch Teacher error:", error);
    }
  };
  const fetchTopics = async () => {
    const skip = parseInt(searchParams.get("skip") || "0");
    const year = searchParams.get("year") || null;
    const search = searchParams.get("search") || null;
    setParam({ skip, year, search });
    try {
      const res = await axios.get(`http://localhost:4000/projects`, {
        params: { MaGVHuongDan: id, skip, year, search, MaKhoa },
      });
      setTopic(res.data.data);
      setPagination(res.data.pagination);
    } catch (error) {
      console.error("Fetch fetchTopics error:", error);
    }
  };
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchTeacher()]);
      setIsLoading(false);
    };

    loadData();
  }, []);
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      await Promise.all([fetchTopics()]);
      setIsLoadingData(false);
    };
    loadData();
  }, [searchParams]);

  const handleNavigate = (id: string) => {
    router.push(`/project/${id}`);
  };

  const handlePageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams.toString());
    const limit = parseInt(searchParams.get("limit") || "10");
    newParams.set("limit", limit.toString());
    newParams.set("skip", ((page - 1) * limit).toString());
    router.push(`?${newParams.toString()}`);
  };
  const handleSelect = (name: string, value: any) => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (value !== null) {
      newParams.set(name, value.toString());
    } else {
      newParams.delete(name);
    }
    newParams.set("skip", "0"); // reset về trang đầu
    router.push(`?${newParams.toString()}`);
  };
  const handleSearch = (query: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (query) newParams.set("search", query);
    else newParams.delete("search");
    newParams.set("skip", "0"); // reset về trang đầu
    router.push(`?${newParams.toString()}`);
  };
  return (
    <>
      {!isLoading && teacher && (
        <div className="w-full max-w-5xl mx-auto space-y-6">
          {/* Thông tin đề tài */}
          <div className="bg-white shadow rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-2">{teacher.TenGV}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Mã GV:</span> {teacher.TenGV}
              </div>
              <div>
                <span className="font-medium">Khoa:</span> {teacher.TenKhoa}
              </div>
              <div>
                <span className="font-medium">Số điện thoại:</span>{" "}
                {teacher.SoDienThoai}
              </div>
              <div>
                <span className="font-medium">Địa chỉ:</span> {teacher.DiaChi}
              </div>
              <div>
                <span className="font-medium">Học vị:</span> {teacher.HocVi}
              </div>
              <div>
                <span className="font-medium">Chuyên nghành::</span>{" "}
                {teacher.ChuyenNganh}
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6 border">
            <h3 className="text-lg font-semibold mb-4">
              Đề tài của giáo viên hướng dẫn
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center border-b pb-4">
              {/* Search box */}
              <div className="md:col-span-4">
                <SearchBox
                  placeholder="🔎 Tìm theo mã hoặc tên đề tài..."
                  valueSearch={param.search || ""}
                  onSearch={(query) => handleSearch(query)}
                />
              </div>

              {/* Bộ lọc Khoa */}
              <div className="md:col-span-3">
                <SelectBox
                  options={listYear}
                  opt={convertSelectBox(listYear, param.year)}
                  onChange={(opt: Option) => handleSelect("year", opt.value)}
                  placeholder="🏫 Chọn Khóa"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-purple-100 text-left">
                    <th className="p-3">Mã DT</th>
                    <th className="p-3">Tên DT</th>
                    <th className="p-3">Niên khóa</th>
                    <th className="p-3">Bắt đầu</th>
                    <th className="p-3">Kết thúc</th>
                    <th className="p-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {topic && topic.length > 0 ? (
                    topic.map((row, index) => (
                      <tr
                        key={index}
                        className="border-b hover:bg-purple-50 transition"
                      >
                        <td className="p-3 font-medium text-gray-700">
                          {row.MaDT}
                        </td>
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
            {/* Pagination */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t text-sm text-gray-600">
              <span>{pagination?.TotalRecords || 0} bản ghi</span>
              <Pagination
                currentPage={pagination?.CurrentPage || 1}
                totalLength={pagination?.TotalRecords || 0}
                pageSize={pagination?.PageSize || 10}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
