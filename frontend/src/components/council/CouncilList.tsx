"use client";
import { formatDate } from "@/utils/formatDate";
import { Button } from "../ui/Button";
import { IPagination, Pagination } from "../ui/Pagination";
import SearchBox from "../ui/SearchBox";
import SelectBox, { Option } from "../ui/SelectBox";
import { IInputCouncil, initCouncil } from "./CouncilForm";
import { useRouter } from "next/navigation";
import LoadingSpinner from "../ui/LoadingSpinner";

export interface ICouncil {
  MaHD: string;
  MaNamHoc: string;
  MaKhoa: number;
  TenKhoa: string;
  NgayBaoVe: Date;
  DiaChiBaoVe: string;
  MaGVChuTich: string;
  TenGVChuTich: string;
  MaGVThuKy: string;
  TenGVThuKy: string;
  MaGVPhanBien: string;
  TenGVPhanBien: string;
  SoDT: number;
}

interface CouncilListProps {
  data: ICouncil[];
  facultyOptions: Option[];
  pagination: IPagination;
  onSearch: (keyword: string) => void;
  onPageChange: (page: number) => void;
  onSelectFaculty: (name: string, otp: any) => void;
  handleOpen: (input: IInputCouncil) => void;
  params: {
    search: string | null;
    limit: number;
    deCode: number | null;
    skip: number;
    sortOrder: string;
    sortBy: string;
    year: string | null;
  };
  disable?: boolean;
  handleOpenDelete: (input: any) => void;
  sortOptions: Option[];
  onSelectSort: (otp: any) => void;
  isLoading: boolean;
  listYear: Option[];
}

export function CouncilList({
  sortOptions,
  onSelectSort,
  data,
  facultyOptions,
  disable,
  pagination,
  onSearch,
  onPageChange,
  onSelectFaculty,
  handleOpen,
  params,
  listYear,
  handleOpenDelete,
  isLoading,
}: CouncilListProps) {
  const router = useRouter();
  const handleNavigate = (id: string, MaKhoa: number) => {
    router.push(`/admin/council/${id}?MaKhoa=${MaKhoa}`);
  };
  const handleConvert = () => {
    const SortOrder = params.sortOrder;
    const sortBy = params.sortBy;
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
  if (isLoading) return <LoadingSpinner />;
  return (
    <>
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
              valueSearch={params.search || ""}
              onSearch={(query) => onSearch(query)}
            />
          </div>

          {/* Bộ lọc */}
          {disable && (
            <div className="md:col-span-3">
              <SelectBox
                options={facultyOptions}
                opt={
                  facultyOptions.find((op) => op.value == params.deCode) || null
                }
                onChange={(otp: Option) => onSelectFaculty("deCode", otp.value)}
                placeholder="🏫 Chọn khoa"
              />
            </div>
          )}
          <div className="md:col-span-2">
            <SelectBox
              options={listYear}
              opt={listYear.find((op) => op.value == params.year) || null}
              onChange={(opt) => onSelectFaculty("year", opt.value)}
              placeholder="Chọn khóa"
            />
          </div>
          {/* Sắp xếp */}
          <div className="md:col-span-3">
            <SelectBox
              options={sortOptions}
              opt={handleConvert()}
              onChange={(value) => onSelectSort(value)}
              placeholder="↕️ Sắp xếp"
            />
          </div>

          {/* Actions */}
          {disable && (
            <div className="md:col-span-1 justify-self-end">
              <Button onClick={() => handleOpen(initCouncil)}>➕ Tạo</Button>
            </div>
          )}
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
                <th className="p-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data && data.length > 0 ? (
                data.map((row, index) => (
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
                    <td className="p-3">
                      <div className="flex gap-2 justify-center">
                        <Button
                          className="bg-blue-500 text-white hover:bg-blue-600"
                          onClick={() => handleNavigate(row.MaHD!, row.MaKhoa)}
                        >
                          👁 Xem
                        </Button>
                        {disable && (
                          <>
                            <Button
                              className="bg-yellow-300 hover:bg-yellow-400"
                              onClick={() =>
                                handleOpen({
                                  MaKhoa: row.MaKhoa,
                                  MaHD: row.MaHD,
                                  MaGVChuTich: row.MaGVChuTich,
                                  MaGVPhanBien: row.MaGVPhanBien,
                                  MaGVThuKy: row.MaGVThuKy,
                                  MaNamHoc: row.MaNamHoc,
                                  DiaChiBaoVe: row.DiaChiBaoVe,
                                  NgayBaoVe:
                                    row.NgayBaoVe.toString().split("T")[0],
                                } as IInputCouncil)
                              }
                            >
                              ✏️ Edit
                            </Button>
                            <Button
                              className="bg-red-500 text-white hover:bg-red-600"
                              onClick={() =>
                                handleOpenDelete({
                                  MaHD: row.MaHD,
                                  MaKhoa: row.MaKhoa,
                                })
                              }
                            >
                              🗑️ Xóa
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  {params.deCode == null ? (
                    <td colSpan={9} className="p-6 text-center text-gray-500">
                      📭 Vui lòng chọn khoa
                    </td>
                  ) : (
                    <td colSpan={9} className="p-6 text-center text-gray-500">
                      📭 Không có dữ liệu
                    </td>
                  )}
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
            onPageChange={onPageChange}
          />
        </div>
      </div>
    </>
  );
}
