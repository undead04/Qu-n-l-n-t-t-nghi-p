import { Button } from "../ui/Button";
import { IPagination, Pagination } from "../ui/Pagination";
import SearchBox from "../ui/SearchBox";
import SelectBox, { Option } from "../ui/SelectBox";
import { convertSelectBox } from "@/utils/convertSelectBox";
export interface IStudent {
  MaSV: string;
  TenSV: string;
  MaKhoa: number;
  TenKhoa: number;
  Nam: number;
  SoLanBaoVe: number;
  DiaChi: string;
  SoDienThoai: string;
}
interface StudentListProps {
  data: IStudent[];
  facultyOptions: Option[];
  handleView: (MaSV: string) => void;
  pagination: IPagination;
  onSearch: (keyword: string) => void;
  onPageChange: (page: number) => void;
  onSelectFaculty: (otp: any) => void;
  params: {
    search: string | null;
    limit: number;
    deCode: number | null;
    skip: number;
    sortOrder: string;
    sortBy: string;
  };
  sortOptions: Option[];
  onSelectSort: (otp: any) => void;
  isLoadingData: boolean;
}
export function StudentList({
  data,
  facultyOptions,
  pagination,
  onSearch,
  onPageChange,
  onSelectFaculty,
  params,
  sortOptions,
  onSelectSort,
  handleView,
  isLoadingData,
}: StudentListProps) {
  const handleConvert = () => {
    const sortOrder = params.sortOrder;
    const sortBy = params.sortBy;
    if (sortBy == "TenSV" && sortOrder == "ASC") {
      return convertSelectBox(sortOptions, 1);
    } else if (sortBy == "TenSV" && sortOrder == "DESC") {
      return convertSelectBox(sortOptions, 1);
    } else {
      return null;
    }
  };
  return (
    <div className="px-6 py-6 bg-gradient-to-tr from-green-50 to-white rounded-2xl shadow-lg border space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-green-700 flex items-center gap-2">
            🎓 Danh sách sinh viên
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý & theo dõi sinh viên theo khoa và lớp
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center border-b pb-4">
        {/* Search box */}
        <div className="md:col-span-3">
          <SearchBox
            placeholder="🔎 Tìm theo mã hoặc tên sinh viên..."
            valueSearch={params.search || ""}
            onSearch={(query) => onSearch(query)}
          />
        </div>

        {/* Bộ lọc Khoa */}
        <div className="md:col-span-3">
          <SelectBox
            options={facultyOptions}
            opt={convertSelectBox(facultyOptions, params.deCode)}
            onChange={(opt: Option) => onSelectFaculty(opt.value)}
            placeholder="🏫 Chọn khoa"
          />
        </div>

        {/* Bộ lọc Lớp */}
        <div className="md:col-span-3">
          <SelectBox
            options={sortOptions}
            opt={handleConvert()}
            onChange={(opt: Option) => onSelectSort(opt.value)}
            placeholder="Chon"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-green-100 text-left">
              <th className="p-3">Mã SV</th>
              <th className="p-3">Họ tên</th>
              <th className="p-3">Khoa</th>
              <th className="p-3">Địa chỉ</th>
              <th className="p-3">Số điện thoại</th>
              <th className="p-3">Số lần bảo vệ</th>
              <th className="p-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {!isLoadingData && data && data.length > 0 ? (
              data.map((row, index) => (
                <tr
                  key={index}
                  className="border-b hover:bg-green-50 transition"
                >
                  <td className="p-3 font-medium text-gray-700">{row.MaSV}</td>
                  <td className="p-3">{row.TenSV}</td>
                  <td className="p-3">{row.TenKhoa}</td>
                  <td className="p-3">{row.DiaChi}</td>
                  <td className="p-3">{row.SoDienThoai}</td>
                  <td className="p-3">{row.SoLanBaoVe}</td>
                  <td className="p-3">
                    <div className="flex gap-2 justify-center">
                      <Button
                        className="bg-blue-500 text-white hover:bg-blue-600"
                        onClick={() => handleView(row.MaSV)}
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
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}
