"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { IPagination, Pagination } from "@/components/ui/Pagination";
import { ICouncil } from "@/components/council/CouncilList";
import { IInputCouncil, initCouncil } from "@/components/council/CouncilForm";
import SelectBox, { Option } from "@/components/ui/SelectBox";
import { ROLES, useUser } from "@/context/UserContext";
import SearchBox from "@/components/ui/SearchBox";
import { formatDate } from "@/utils/formatDate";
import { Button } from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ProtectedRoute from "@/components/ProtectedRoute";
export default function Page() {
  const [records, setRecords] = useState<ICouncil[]>([]);
  const { user } = useUser();
  const [pagination, setPagination] = useState<IPagination>({
    TotalRecords: 0,
    TotalPages: 0,
    PageSize: 10,
    CurrentPage: 1,
  });
  const [input, setInput] = useState<IInputCouncil>(initCouncil);
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
    year: string | null;
  }>({
    search: null,
    limit: 10,
    skip: 0,
    sortBy: "MaHD",
    sortOrder: "DESC",
    year: null,
  });
  const [listYear, setListYear] = useState<Option[]>([]);
  const sortOptions = [
    { label: "MaHD giảm dần", value: 1 },
    { label: "MaHD tăng dần", value: 2 },
    { label: "Mới nhất", value: 3 }, // sắp xếp theo CreatedAt DESC
    { label: "Lâu nhất", value: 4 },
  ];
  // 🚀 Fetch API dựa trên URL query
  const loadData = async () => {
    try {
      if (user) {
        const [yearsRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/years`, {
            params: { Role: user.MaKhoa },
          }),
        ]);
        setListYear(
          yearsRes.data.map((item: any) => ({
            label: item.MaNamHoc,
            value: item.MaNamHoc,
          }))
        );
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadData();
  }, [user?.MaKhoa]);
  const fetchData = async () => {
    const skip = parseInt(searchParams.get("skip") || "0");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || null;
    const sortBy = searchParams.get("sortBy") || "MaHD";
    const sortOrder = searchParams.get("sortOrder") || "DESC";
    const year = searchParams.get("year") || null;
    setParam({
      skip,
      limit,
      search,
      sortBy,
      sortOrder,
      year,
    });
    setLoadingData(true);
    try {
      if (user != null) {
        const res = await axios.get("http://localhost:4000/councils", {
          params: {
            search,
            limit,
            skip,
            sortBy,
            sortOrder,
            MaGV: user.Username,
            MaKhoa: user.MaKhoa,
            Role: user.MaKhoa,
            year,
          },
        });
        setRecords(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      alert("⚠️ Lỗi khi lấy dữ liệu hội đồng");
    } finally {
      setLoadingData(false);
    }
  };
  // 🔄 Fetch mỗi khi URL thay đổi
  useEffect(() => {
    fetchData();
  }, [searchParams, user]);

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
        newParams.set("sortBy", "MaHD");
        break;
      case 2:
        newParams.set("sortOrder", "ASC");
        newParams.set("sortBy", "MaHD");
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
  const handleNavigate = (id: string, MaKhoa: number) => {
    router.push(`/council/${id}?MaKhoa=${MaKhoa}`);
  };
  const handleConvert = () => {
    const SortOrder = param.sortOrder;
    const sortBy = param.sortBy;
    if (sortBy == "MaHD" && SortOrder == "DESC") {
      return sortOptions.find((op) => op.value == 1) || null;
    } else if (sortBy == "MaHD" && SortOrder == "ASC") {
      return sortOptions.find((op) => op.value == 2) || null;
    } else if (sortBy == "UpdatedAt" && SortOrder == "DESC") {
      return sortOptions.find((op) => op.value == 3) || null;
    } else if (sortBy == "UpdatedAt" && SortOrder == "ASC") {
      return sortOptions.find((op) => op.value == 4) || null;
    } else {
      return null;
    }
  };
  if (!user && loading) return <LoadingSpinner />;
  return (
    <ProtectedRoute allowedRoles={[ROLES.GIAO_VIEN]}>
      <div className="px-6 py-6 bg-gradient-to-tr from-purple-50 to-white rounded-2xl shadow-lg border space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-purple-700 flex items-center gap-2">
              📊 Danh sách hội đồng
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Quản lý & theo dõi các hội đồng
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center border-b pb-4">
          {/* Search box */}
          <div className="md:col-span-3">
            <SearchBox
              placeholder="🔎 Tìm theo mã hoặc tên đề tài..."
              valueSearch={param.search || ""}
              onSearch={(query) => handleSearch(query)}
            />
          </div>

          {/* Bộ lọc */}
          <div className="md:col-span-2">
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
              options={sortOptions}
              opt={handleConvert()}
              onChange={(value) => handleSelectSort(value)}
              placeholder="↕️ Sắp xếp"
            />
          </div>

          {/* Actions */}
        </div>
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-purple-100 text-left">
                <th className="p-3">Mã hội đồng</th>
                <th className="p-3">Địa chỉ</th>
                <th className="p-3">Ngày bảo vệ</th>
                <th className="p-3">Chủ tịch</th>
                <th className="p-3">Thư kí</th>
                <th className="p-3">Phản biện</th>
                <th className="p-3">Khóa</th>
                <th className="p-3">Số DT</th>
                <th className="p-3">Trạng thái</th>
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
                      {row.MaHD}
                    </td>
                    <td className="p-3">{row.DiaChiBaoVe}</td>
                    <td className="p-3">{formatDate(row.NgayBaoVe)}</td>
                    <td className="p-3">{row.TenGVChuTich}</td>
                    <td className="p-3">{row.TenGVThuKy}</td>
                    <td className="p-3">{row.TenGVPhanBien}</td>
                    <td className="p-3">{row.MaNamHoc}</td>
                    <td className="p-3">{row.SoDT}</td>
                    <td className="p-3 text-center font-medium">
                      {(() => {
                        const today = new Date();
                        const ngayBV = new Date(row.NgayBaoVe);

                        if (
                          ngayBV.getFullYear() === today.getFullYear() &&
                          ngayBV.getMonth() === today.getMonth() &&
                          ngayBV.getDate() === today.getDate()
                        ) {
                          return (
                            <span className="text-green-600 bg-green-100 px-2 py-1 rounded inline-block">
                              Đang diễn ra
                            </span>
                          );
                        } else if (ngayBV > today) {
                          return (
                            <span className="text-yellow-700 bg-yellow-100 px-2 py-1 rounded inline-block">
                              Chưa diễn ra
                            </span>
                          );
                        } else {
                          return (
                            <span className="text-red-700 bg-red-100 px-2 py-1 rounded inline-block">
                              Quá hạn
                            </span>
                          );
                        }
                      })()}
                    </td>

                    <td className="p-3">
                      <div className="flex gap-2 justify-center">
                        <Button
                          className="bg-blue-500 text-white hover:bg-blue-600"
                          onClick={() => handleNavigate(row.MaHD!, row.MaKhoa)}
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
    </ProtectedRoute>
  );
}
