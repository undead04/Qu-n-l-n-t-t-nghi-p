"use client";
import { formatDate } from "@/utils/formatDate";
import { Button } from "../ui/Button";
import { IPagination, Pagination } from "../ui/Pagination";
import SearchBox from "../ui/SearchBox";
import SelectBox, { Option } from "../ui/SelectBox";
import { useRouter } from "next/navigation";
import { IInputProject, initProject } from "./ProjectForm";
import { convertSelectBox } from "@/utils/convertSelectBox";

export interface IProject {
  MaKhoa: number;
  TenKhoa: string;
  MaDT: string;
  TenDT: string;
  MaNamHoc: string;
  MaGVHuongDan: string;
  TenGVHuongDan: string;
  ThoiGianBatDau: Date;
  ThoiGianKetThuc: Date;
  SoSV: number;
  DiemTrungBinh?: number;
  KetQua: string;
}

interface ProjectListProps {
  data: IProject[];
  isLoading: boolean;
  facultyOptions: Option[];
  pagination: IPagination;
  onSearch: (keyword: string) => void;
  onPageChange: (page: number) => void;
  onSelectFaculty: (name: string, value: any) => void;
  handleOpen: (input: IInputProject) => void;
  params: {
    search: string | null;
    limit: number;
    deCode: number | null;
    skip: number;
    sortOrder: string;
    sortBy: string;
    year: string | null;
  };
  listYear: Option[];
  handleOpenDelete: (input: IInputProject) => void;
  sortOptions: Option[];
  onSelectSort: (otp: any) => void;
}

export function ProjectList({
  sortOptions,
  onSelectSort,
  data,
  pagination,
  onSearch,
  onPageChange,
  onSelectFaculty,
  handleOpen,
  facultyOptions,
  params,
  isLoading,
  listYear,
  handleOpenDelete,
}: ProjectListProps) {
  const router = useRouter();
  const handleNavigate = (id: string, MaKhoa: number) => {
    router.push(`/project/${id}?MaKhoa=${MaKhoa}`);
  };
  const handleConvert = () => {
    const SortOrder = params.sortOrder;
    const sortBy = params.sortBy;
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
  return (
    <>
      <div className="px-6 py-6 bg-gradient-to-tr from-purple-50 to-white rounded-2xl shadow-lg border space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-purple-700 flex items-center gap-2">
              📊 Danh sách đồ án
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
              valueSearch={params.search || ""}
              onSearch={(query) => onSearch(query)}
            />
          </div>
          <div className="md:col-span-3">
            <SelectBox
              opt={convertSelectBox(facultyOptions, params.deCode)}
              options={facultyOptions}
              onChange={(opt) => onSelectFaculty("deCode", opt.value)}
              placeholder="Chọn khoa"
            />
          </div>
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
              opt={handleConvert()}
              options={sortOptions}
              onChange={(value) => onSelectSort(value)}
              placeholder="↕️ Sắp xếp"
            />
          </div>

          {/* Actions */}
          <div className="md:col-span-1 justify-self-end">
            <Button onClick={() => handleOpen(initProject)}>➕ Tạo</Button>
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
              {!isLoading && data && data.length > 0 ? (
                data.map((row, index) => (
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
                          className="bg-yellow-300 hover:bg-yellow-400"
                          onClick={() =>
                            handleOpen({
                              MaDT: row.MaDT,
                              TenDT: row.TenDT,
                              MaNamHoc: row.MaNamHoc,
                              MaKhoa: row.MaKhoa,
                              MaGVHuongDan: row.MaGVHuongDan,
                              ThoiGianBatDau:
                                row.ThoiGianBatDau.toString().split("T")[0],
                              ThoiGianKetThuc:
                                row.ThoiGianKetThuc.toString().split("T")[0],
                            } as IInputProject)
                          }
                        >
                          ✏️ Edit
                        </Button>
                        <Button
                          className="bg-blue-500 text-white hover:bg-blue-600"
                          onClick={() => handleNavigate(row.MaDT!, row.MaKhoa!)}
                        >
                          👁 Xem
                        </Button>
                        <Button
                          className="bg-red-500 text-white hover:bg-red-600"
                          onClick={() =>
                            handleOpenDelete({
                              MaDT: row.MaDT,
                            } as IInputProject)
                          }
                        >
                          🗑️ Xóa
                        </Button>
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
