"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { IPagination, Pagination } from "@/components/ui/Pagination";
import SelectBox, { Option } from "@/components/ui/SelectBox";
import DeleteModal from "@/components/ui/DeleteModal";
import { IProject } from "@/components/project/ProjectList";
import ProjectForm, { IInputProject } from "@/components/project/ProjectForm";
import SearchBox from "@/components/ui/SearchBox";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/utils/formatDate";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { IFaculty } from "@/components/faculty/FacultyList";

export default function Page() {
  const [records, setRecords] = useState<IProject[]>([]);
  const [pagination, setPagination] = useState<IPagination>({
    TotalRecords: 0,
    TotalPages: 0,
    PageSize: 10,
    CurrentPage: 1,
  });
  const [listYear, setListYear] = useState<Option[]>([]);
  const [listFaculty, setListFaculty] = useState<IFaculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [param, setParam] = useState<{
    search: string | null;
    limit: number;
    skip: number;
    sortOrder: string;
    sortBy: string;
    deCode: number | null;
    year: string | null;
  }>({
    search: null,
    limit: 10,
    skip: 0,
    sortBy: "TenDT",
    sortOrder: "DESC",
    year: null,
    deCode: null,
  });
  const sortOptions = [
    { label: "TenDT giảm dần", value: 1 },
    { label: "TenDT tăng dần", value: 2 },
    { label: "Mới nhất", value: 3 }, // sắp xếp theo CreatedAt DESC
    { label: "Lâu nhất", value: 4 },
  ];
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isOpenDel, setIsOpenDel] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const [yearsRes, facultyRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/years`),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/faculties`),
      ]);
      setListYear(
        yearsRes.data.map((item: any) => ({
          label: item.MaNamHoc,
          value: item.MaNamHoc,
        }))
      );
      setListFaculty(facultyRes.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadData();
  }, []);
  // 🚀 Fetch API dựa trên URL query
  const fetchData = async () => {
    const skip = parseInt(searchParams.get("skip") || "0");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || null;
    const sortBy = searchParams.get("sortBy") || "TenDT";
    const sortOrder = searchParams.get("sortOrder") || "DESC";
    const year = searchParams.get("year") || null;
    const deCode = Number(searchParams.get("deCode")) || null;
    setParam({ skip, limit, search, sortBy, sortOrder, year, deCode });
    setLoadingData(true);
    try {
      if (deCode) {
        const response = await axios.get("http://localhost:4000/projects", {
          params: {
            skip,
            limit,
            search,
            sortBy,
            sortOrder,
            MaKhoa: deCode,
            year,
          },
        });
        setRecords(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      alert("⚠️ Lỗi khi lấy dữ liệu đồ án");
    } finally {
      setLoadingData(false);
    }
  };
  // 🔄 Fetch mỗi khi URL thay đổi
  useEffect(() => {
    fetchData();
  }, [searchParams]);

  // 🔍 Search khi nhấn Enter
  const handleSearch = (query: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (query) newParams.set("search", query);
    else newParams.delete("search");
    newParams.set("skip", "0"); // reset về trang đầu
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
  // 📄 Phân trang
  const handlePageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams.toString());
    const limit = parseInt(searchParams.get("limit") || "10");
    newParams.set("limit", limit.toString());
    newParams.set("skip", ((page - 1) * limit).toString());
    router.push(`?${newParams.toString()}`);
  };

  const handleSelectSort = (otp: Option) => {
    const newParams = new URLSearchParams(searchParams.toString());
    const value = otp.value;
    switch (value) {
      case 1:
        newParams.set("sortOrder", "DESC");
        newParams.set("sortBy", "TenDT");
        break;
      case 2:
        newParams.set("sortOrder", "ASC");
        newParams.set("sortBy", "TenDT");
        break;
      case 3:
        newParams.set("sortOrder", "DESC");
        newParams.set("sortBy", "UpdatedAt");
        break;
      case 4:
        newParams.set("sortOrder", "ASC");
        newParams.set("sortBy", "UpdatedAt");
        break;
    }
    newParams.set("skip", "0"); // reset về trang đầu
    router.push(`?${newParams.toString()}`);
  };
  const handleConvert = () => {
    const SortOrder = param.sortOrder;
    const sortBy = param.sortBy;
    if (sortBy == "TenDT" && SortOrder == "DESC") {
      return sortOptions.find((op) => op.value == 1) || null;
    } else if (sortBy == "TenDT" && SortOrder == "ASC") {
      return sortOptions.find((op) => op.value == 2) || null;
    } else if (sortBy == "UpdatedAt" && SortOrder == "DESC") {
      return sortOptions.find((op) => op.value == 3) || null;
    } else if (sortBy == "UpdatedAt" && SortOrder == "ASC") {
      return sortOptions.find((op) => op.value == 4) || null;
    } else {
      return null;
    }
  };
  const handleNavigate = (id: string, MaKhoa: number) => {
    router.push(`/admin/project/${id}?MaKhoa=${MaKhoa}`);
  };

  if (loading) return <LoadingSpinner />;
  return (
    <>
      <div className="px-6 py-6 bg-gradient-to-tr from-purple-50 to-white rounded-2xl shadow-lg border space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-purple-700 flex items-center gap-2">
              Danh sách đồ án
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Quản lý & theo dõi các đồ án
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center border-b pb-4">
          {/* Search box */}
          <div className="md:col-span-3">
            <SearchBox
              placeholder="🔎 Tìm theo mã hoặc tên đồ án..."
              valueSearch={param.search || ""}
              onSearch={(query) => handleSearch(query)}
            />
          </div>
          <div className="md:col-span-3">
            <SelectBox
              options={listFaculty.map((item) => ({
                label: item.TenKhoa,
                value: item.MaKhoa,
              }))}
              opt={
                listFaculty
                  .map((item) => ({
                    label: item.TenKhoa,
                    value: item.MaKhoa,
                  }))
                  .find((op) => op.value == param.deCode) || null
              }
              onChange={(opt) => handleSelect("deCode", opt.value)}
              placeholder="Chọn khoa"
            />
          </div>
          <div className="md:col-span-3">
            <SelectBox
              options={listYear}
              opt={listYear.find((op) => op.value == param.year) || null}
              onChange={(opt) => handleSelect("year", opt.value)}
              placeholder="Chọn khóa"
            />
          </div>
          {/* Sắp xếp */}
          <div className="md:col-span-3">
            <SelectBox
              opt={handleConvert()}
              options={sortOptions}
              onChange={(value) => handleSelectSort(value)}
              placeholder="↕️ Sắp xếp"
            />
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
                <th className="p-3">Số SV</th>
                <th className="p-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {!loadingData && records && records.length > 0 ? (
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
                    <td className="p-3">{row.SoSV}</td>
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
    </>
  );
}
