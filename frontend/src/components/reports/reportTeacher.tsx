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
interface ITeacherSummary {
  GiaoVienDiemCaoNhat: string;
  DiemCaoNhat: number;
  GiaoVienDiemThapNhat: string;
  DiemThapNhat: number;
  DiemTrungBinhChung: number;
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
  const [data, setData] = useState<ITeacher[]>([]);
  const [teacherSummary, setTeacherSummary] = useState<ITeacherSummary>();
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
      setTotalReocrds(res.data.pagination.TotalRecords);
    } catch (err) {
      alert("⚠️ Lỗi khi lấy dữ liệu báo cáo giáo viên");
    } finally {
      setIsLoading(false);
    }
  };
  const fetchTeacherSummary = async () => {
    try {
      const res = await axios.get(
        "http://localhost:4000/report/teacherSummarys",
        {
          params: {
            maKhoa: param.year,
            deCode: param.deCode,
          },
        }
      );
      setTeacherSummary(res.data[0]);
    } catch (err) {
      alert("⚠️ Lỗi khi lấy dữ liệu teacher summary");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    loadData();
  }, [JSON.stringify(param)]);
  useEffect(() => {
    fetchTeacherSummary();
  }, [param.year, param.deCode]);
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
                <th className="p-3">Niên khóa</th>
                <th className="p-3">Khoa</th>
                <th className="p-3">Số đề tài</th>
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
                      {row.MaGV}
                    </td>
                    <td className="p-3">{row.TenGV}</td>
                    <td className="p-3">{row.MaNamHoc}</td>
                    <td className="p-3">{row.TenKhoa}</td>
                    <td className="p-3">{row.SoDeTai}</td>
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
      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-100 p-4 rounded-xl shadow text-center">
          <h3 className="text-sm font-semibold text-green-700">
            Điểm cao nhất
          </h3>
          <p className="text-2xl font-bold mt-1">{`${teacherSummary?.GiaoVienDiemCaoNhat} - ${teacherSummary?.DiemCaoNhat}`}</p>
        </div>

        <div className="bg-red-100 p-4 rounded-xl shadow text-center">
          <h3 className="text-sm font-semibold text-red-700">Điểm thấp nhất</h3>
          <p className="text-2xl font-bold mt-1">{`${teacherSummary?.GiaoVienDiemThapNhat} - ${teacherSummary?.DiemThapNhat}`}</p>
        </div>

        <div className="bg-blue-100 p-4 rounded-xl shadow text-center">
          <h3 className="text-sm font-semibold text-blue-700">
            Điểm trung bình
          </h3>
          <p className="text-2xl font-bold mt-1">
            {teacherSummary?.DiemTrungBinhChung}
          </p>
        </div>
      </div>
    </>
  );
}
