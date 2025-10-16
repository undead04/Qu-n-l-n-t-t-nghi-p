"use client";
import { Pagination } from "../ui/Pagination";
import SelectBox, { Option } from "../ui/SelectBox";
import { convertSelectBox } from "@/utils/convertSelectBox";
import { useEffect, useState } from "react";
import axios from "axios";
import { ITeacher } from "../teacher/TeacherList";

interface Props {
  yearOption: Option[];
  facultyOption: Option[];
}
export interface TeacherReport {
  MaGV: string; // Mã giáo viên
  TenGV: string; // Tên giáo viên
  TenKhoa: string; // Tên khoa
  MaNamHoc: string; // Niên khóa (vd: "2024-2025")

  SoDeTai: number; // Số lượng đề tài hướng dẫn
  SoSV: number; // Tổng số sinh viên tham gia
  DiemMin: number; // Điểm thấp nhất
  DiemMax: number; // Điểm cao nhất
  DiemTB: number; // Điểm trung bình

  TiLeDau: number; // Tỷ lệ sinh viên đậu (%)
  TiLeRot: number; // Tỷ lệ sinh viên rớt (%)
}

export function ReportTeacher({ yearOption, facultyOption }: Props) {
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
  const [data, setData] = useState<TeacherReport[]>([]);
  const [totalRecords, setTotalReocrds] = useState<number>();
  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get("http://localhost:4000/report/teacher", {
        params: {
          skip: param.skip,
          limit: param.limit,
          year: param.year,
          deCode: param.deCode,
        },
      });
      setData(res.data.data);
      setTotalReocrds(res.data.pagination.TotalCount);
    } catch (err) {
      alert("⚠️ Lỗi khi lấy dữ liệu báo cáo giáo viên");
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
              📊 Danh sách điểm theo giáo viên
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Thống kê và báo cáo điểm theo giáo viên
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <SelectBox
              opt={convertSelectBox(facultyOption, param.deCode)}
              options={facultyOption}
              onChange={(opt) =>
                setParam({ ...param, deCode: Number(opt.value) })
              }
              placeholder="Chọn khoa"
            />
          </div>
          <div className="md:col-span-1">
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
                <th className="p-3">Mã giáo viên</th>
                <th className="p-3">Tên giáo viên</th>
                <th className="p-3">Số SV</th>
                <th className="p-3">Số đề tài</th>
                <th className="p-3">Điểm Min</th>
                <th className="p-3">Điểm Max</th>
                <th className="p-3">Điểm TB</th>
                <th className="p-3">TL Đậu</th>
                <th className="p-3">TL Rớt</th>
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
                      {row.MaGV}
                    </td>
                    <td className="p-3">{row.TenGV}</td>
                    <td className="p-3">{row.SoSV}</td>
                    <td className="p-3">{row.SoDeTai}</td>
                    <td className="p-3">{row.DiemMin}</td>
                    <td className="p-3">{row.DiemMax}</td>
                    <td className="p-3">{row.DiemTB.toFixed(2)}</td>
                    <td className="p-3">{`${row.TiLeDau}%`}</td>
                    <td className="p-3">{`${row.TiLeRot}%`}</td>
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
        <div className="flex justify-end items-center mt-6 pt-4  text-sm text-gray-600">
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
