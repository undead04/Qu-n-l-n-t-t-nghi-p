import SearchBox from "../ui/SearchBox";
import { Button } from "../ui/Button";
import { useRouter } from "next/navigation";
export interface IFaculty {
  MaKhoa: number;
  TenKhoa: string;
  DiemTrungBinh: number;
  SoDeTai: number;
  MaNamHoc: number;
  DiemCaoNhat: number;
  DiemThapNhat: number;
}
interface FacultyListProps {
  data: IFaculty[];
  onSearch: (keyword: string) => void;
  onPageChange: (page: number) => void;
  params: {
    search: string | null;
    limit: number;
    skip: number;
  };
  isLoadingData: boolean;
}
export function FacultyList({
  data,
  onSearch,
  params,
  isLoadingData,
}: FacultyListProps) {
  const router = useRouter();
  const handleNavigation = () => {
    router.push(`/admin/faculty/report`);
  };
  return (
    <div className="px-6 py-6 bg-gradient-to-tr from-green-50 to-white rounded-2xl shadow-lg border space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-green-700 flex items-center gap-2">
            🎓 Danh sách khoa
          </h3>
          <p className="text-sm text-gray-500 mt-1">Quản lý & theo dõi khoa</p>
        </div>
      </div>

      {/* Filter */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center border-b pb-4">
        {/* Search box */}
        <div className="md:col-span-4">
          <SearchBox
            placeholder="🔎 Tìm theo tên khoa..."
            valueSearch={params.search || ""}
            onSearch={(query) => onSearch(query)}
          />
        </div>
        <div className="md:col-span-8 flex justify-end gap-2">
          <Button variant="default" onClick={handleNavigation}>
            Báo cáo
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-green-100 text-left">
              <th className="p-3">Mã Khoa</th>
              <th className="p-3">Tên Khoa</th>
            </tr>
          </thead>
          <tbody>
            {!isLoadingData && data && data.length > 0 ? (
              data.map((row, index) => (
                <tr
                  key={index}
                  className="border-b hover:bg-green-50 transition"
                >
                  <td className="p-3 font-medium text-gray-700">
                    {row.MaKhoa}
                  </td>
                  <td className="p-3">{row.TenKhoa}</td>
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
  );
}
