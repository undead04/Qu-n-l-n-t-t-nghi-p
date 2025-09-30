"use client";
import { Pagination } from "../ui/Pagination";
import SelectBox, { Option } from "../ui/SelectBox";
import { convertSelectBox } from "@/utils/convertSelectBox";
import { useEffect, useState } from "react";
import axios from "axios";
import { IFaculty } from "../faculty/FacultyList";

interface Props {
  yearOption: Option[];
}
export function ReportFaculty({ yearOption }: Props) {
  const [param, setParam] = useState<{
    limit: number;
    skip: number;
    year: string | null;
  }>({
    limit: 10,
    skip: 0,
    year: null,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [data, setData] = useState<IFaculty[]>([]);
  const [totalRecords, setTotalReocrds] = useState<number>();
  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get("http://localhost:4000/report/faculty", {
        params: {
          skip: param.skip,
          limit: param.limit,
          year: param.year,
        },
      });
      setData(res.data.data);
      setTotalReocrds(res.data.pagination.TotalRecords);
    } catch (err) {
      alert("⚠️ Lỗi khi lấy dữ liệu báo cáo khoa");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    loadData();
  }, [JSON.stringify(param)]);
  return (
    <>
      {/* Report Section */}
      <div className="bg-white rounded-2xl shadow-lg border p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h3 className="text-xl font-semibold text-purple-700 flex items-center gap-2">
              📊 Danh sách điểm theo khoa
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Thống kê và báo cáo điểm theo khoa
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <SelectBox
              options={yearOption}
              opt={convertSelectBox(yearOption, param.year)}
              onChange={(opt) =>
                setParam({ ...param, year: opt.value?.toString() || null })
              }
              placeholder="Chọn khóa"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-purple-100 text-left">
                <th className="p-3">Mã khoa</th>
                <th className="p-3">Tên khoa</th>
                <th className="p-3">Niên khóa</th>
                <th className="p-3">Số đề tài</th>
                <th className="p-3">Điểm cao nhất</th>
                <th className="p-3">Điểm thấp nhất</th>
                <th className="p-3">Điểm trung bình</th>
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
                      {row.MaKhoa}
                    </td>
                    <td className="p-3">{row.TenKhoa}</td>
                    <td className="p-3">{row.MaNamHoc}</td>
                    <td className="p-3">{row.SoDeTai}</td>
                    <td className="p-3">{row.DiemCaoNhat}</td>
                    <td className="p-3">{row.DiemThapNhat}</td>
                    <td className="p-3">{row.DiemTrungBinh}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-500">
                    📭 Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center mt-6 pt-4  text-sm text-gray-600">
          <Pagination
            currentPage={param.skip / param.limit + 1 || 1}
            totalLength={totalRecords || 0}
            pageSize={param.limit}
            onPageChange={(page: number) =>
              setParam({ ...param, skip: (page - 1) * param.limit })
            }
          />
        </div>
      </div>
      
    </>
  );
}
