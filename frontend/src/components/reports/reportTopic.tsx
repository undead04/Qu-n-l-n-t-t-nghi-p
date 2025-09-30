"use client";
import { formatDate } from "@/utils/formatDate";
import { Pagination } from "../ui/Pagination";
import SelectBox, { Option } from "../ui/SelectBox";
import { convertSelectBox } from "@/utils/convertSelectBox";
import { useEffect, useState } from "react";
import { IProject } from "../project/ProjectList";
import axios from "axios";

interface Props {
  yearOption: Option[];
  facultyOption: Option[];
}

export function ReportTopic({ yearOption, facultyOption }: Props) {
  const [param, setParam] = useState<{
    limit: number;
    deCode: number | null;
    skip: number;
    year: string | null;
  }>({
    limit: 10,
    deCode: null,
    skip: 0,
    year: null,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [data, setData] = useState<IProject[]>([]);
  const [totalRecords, setTotalReocrds] = useState<number>();
  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get("http://localhost:4000/report/project", {
        params: {
          skip: param.skip,
          limit: param.limit,
          year: param.year,
          deCode: param.deCode,
        },
      });
      console.log(res.data);
      setData(res.data.data);
      setTotalReocrds(res.data.pagination.TotalRecords);
    } catch (err) {
      alert("⚠️ Lỗi khi lấy dữ liệu đồ án");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    loadData();
  }, [JSON.stringify(param)]);

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
              Thống kê và báo cáo đề tài
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center border-b pb-4">
          <div className="md:col-span-3">
            <SelectBox
              opt={convertSelectBox(facultyOption, param.deCode)}
              options={facultyOption}
              onChange={(opt) =>
                setParam({ ...param, deCode: Number(opt.value) })
              }
              placeholder="Chọn khoa"
            />
          </div>
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
                <th className="p-3">Mã đồ án</th>
                <th className="p-3">Tên đề tài</th>
                <th className="p-3">Niên khóa</th>
                <th className="p-3">Khoa</th>
                <th className="p-3">Bắt đầu</th>
                <th className="p-3">Kết thúc</th>
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
                      {row.MaDT}
                    </td>
                    <td className="p-3">{row.TenDT}</td>
                    <td className="p-3">{row.MaNamHoc}</td>
                    <td className="p-3">{row.TenKhoa}</td>
                    <td className="p-3">{formatDate(row.ThoiGianBatDau)}</td>
                    <td className="p-3">{formatDate(row.ThoiGianKetThuc)}</td>
                    <td className="p-3">{row.DiemTrungBinh}</td>
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
        <div className="flex justify-between items-center mt-4 pt-4  text-sm text-gray-600">
          <span>{totalRecords || 0} bản ghi</span>
          <Pagination
            currentPage={param.skip / param.limit + 1 || 1}
            totalLength={totalRecords || 0}
            pageSize={10}
            onPageChange={(page: number) =>
              setParam({ ...param, skip: (page - 1) * 10 })
            }
          />
        </div>
      </div>
    </>
  );
}
