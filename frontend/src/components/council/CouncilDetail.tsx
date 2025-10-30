"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ICouncil } from "./CouncilList";
import axios from "axios";
import { formatDate } from "@/utils/formatDate";
import { IPagination, Pagination } from "../ui/Pagination";
import DeleteModal from "../ui/DeleteModal";
import { useRouter } from "next/navigation";
import { IProject } from "../project/ProjectList";
import { IInputProject } from "../project/ProjectForm";
import AddCouncilModal from "./AddTopicToCouncilForm";
import LoadingSpinner from "../ui/LoadingSpinner";
import { useUser } from "@/context/UserContext";
interface Props {
  MaHD: string;
  MaKhoa: number;
  disable?: boolean;
}
export default function CouncilDetail({ MaHD, MaKhoa, disable }: Props) {
  const initProject: IInputProject = {
    TenDT: "",
    MaNamHoc: "",
    ThoiGianBatDau: "",
    ThoiGianKetThuc: "",
    MaGVHuongDan: "",
    MaKhoa: 0 || null,
  };
  const { user } = useUser();
  const [council, setCouncil] = useState<ICouncil>();
  const [projects, setProjects] = useState<IProject[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState<IPagination>({
    TotalRecords: 0,
    TotalPages: 0,
    PageSize: 10,
    CurrentPage: 1,
  });
  const [topicDel, setTopicDel] = useState<IInputProject>(initProject);
  const [isOpenDelete, setIsOpenDelete] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const fetchCouncil = async () => {
    try {
      if (user) {
        const res = await axios.get(`http://localhost:4000/councils/${MaHD}`, {
          params: { MaKhoa, Role: user.MaKhoa },
        });
        setCouncil(res.data[0]);
      }
    } catch (error) {
      console.error("Fetch council error:", error);
    }
  };

  const fetchProjects = async (skip: number = 0, limit: number = 10) => {
    try {
      if (user) {
        const res = await axios.get(
          `http://localhost:4000/councils/topics/${MaHD}`,
          {
            params: { MaKhoa, limit: 10, skip, Role: user.MaKhoa },
          }
        );
        setProjects(res.data);
      }
    } catch (error) {
      console.error("Fetch project error:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchCouncil(), fetchProjects()]);
      setIsLoading(false);
    };
    loadData();
  }, [MaHD, user]);
  const handlePageChange = async (page: number) => {
    const skip = (page - 1) * 10;
    const limit = 10;
    await fetchProjects(skip, limit);
  };

  const handleOpenDelete = (input: IInputProject) => {
    setIsOpenDelete(true);
    setTopicDel(input);
  };
  const handleCloseDelete = () => {
    setIsOpenDelete(false);
  };
  const handleDelete = async () => {
    await axios
      .delete(`http://localhost:4000/projects/council`, {
        data: {
          MaDoAn: topicDel.MaDT,
          MaHoiDong: MaHD,
          MaKhoa: MaKhoa,
        },
      })
      .then((res) => {
        alert("Xóa đề tài thành công");
        fetchProjects();
        handleCloseDelete();
      })
      .catch((err) => {
        alert(err.response?.data?.error || "Có lỗi xảy ra");
      });
  };
  const router = useRouter();
  const handleNavigate = (id: string, MaKhoa: number) => {
    const basePath = user?.Role === "Admin" ? "/admin" : "";
    router.push(`${basePath}/project/${id}?MaKhoa=${MaKhoa}`);
  };

  if (isLoading) return <LoadingSpinner />;
  return (
    <>
      <DeleteModal
        open={isOpenDelete}
        onClose={handleCloseDelete}
        onConfirm={handleDelete}
      />
      {council && (
        <>
          <AddCouncilModal
            addTopic={projects}
            onClose={() => setIsOpen(false)}
            isOpen={isOpen}
            onLoad={fetchProjects}
            MaHD={MaHD}
            MaNamHoc={council!.MaNamHoc}
            MaKhoa={MaKhoa}
          />
          <div className="w-full max-w-5xl mx-auto space-y-6">
            {/* Thông tin đề tài */}
            <div className="bg-white shadow rounded-lg p-6 border">
              <h2 className="text-xl font-semibold mb-2">{council.MaHD}</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Địa chỉ:</span>{" "}
                  {council.DiaChiBaoVe}
                </div>
                <div>
                  <span className="font-medium">Ngày bảo vệ:</span>{" "}
                  {formatDate(council.NgayBaoVe)}
                </div>
                <div>
                  <span className="font-medium">Chủ tịch:</span>{" "}
                  {council.TenGVChuTich}
                </div>
                <div>
                  <span className="font-medium">Thư ký:</span>{" "}
                  {council?.TenGVThuKy}
                </div>
                <div>
                  <span className="font-medium">Phản biện:</span>{" "}
                  {council?.TenGVPhanBien}
                </div>
                <div>
                  <span className="font-medium">Tên Khoa:</span>{" "}
                  {council.TenKhoa}
                </div>
                <div>
                  <span className="font-medium">Niên khóa:</span>{" "}
                  {council.MaNamHoc}
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6 border">
              <h3 className="text-lg font-semibold mb-4">Danh sách đồ án</h3>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center border-b pb-4">
                <div className="md:col-span-12 justify-self-end">
                  {!disable && (
                    <Button onClick={() => setIsOpen(true)}>➕ Tạo</Button>
                  )}
                </div>
              </div>
              {/* Table danh sách + chấm điểm */}
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-purple-100 text-left">
                      <th className="p-3">Mã đề tài</th>
                      <th className="p-3">Tên đề tài</th>
                      <th className="p-3">Giáo viên</th>
                      <th className="p-3">Bắt đầu</th>
                      <th className="p-3">Kết thúc</th>
                      <th className="p-3">Số SV</th>
                      <th className="p-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!isLoading && projects && projects.length > 0 ? (
                      projects.map((row, index) => (
                        <tr
                          key={index}
                          className="border-b hover:bg-purple-50 transition"
                        >
                          <td className="p-3 font-medium text-gray-700">
                            {row.MaDT}
                          </td>
                          <td className="p-3">{row.TenDT}</td>
                          <td className="p-3">{row.TenGVHuongDan}</td>
                          <td className="p-3">
                            {formatDate(row.ThoiGianBatDau)}
                          </td>
                          <td className="p-3">
                            {formatDate(row.ThoiGianKetThuc)}
                          </td>
                          <td className="p-3">{row.SoSV}</td>
                          <td className="p-3">
                            <div className="flex gap-2 justify-center">
                              <Button
                                onClick={() =>
                                  handleNavigate(row.MaDT!, row.MaKhoa)
                                }
                                className="bg-blue-500 text-white hover:bg-blue-600"
                              >
                                👁 Xem
                              </Button>
                              {!disable && (
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
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={8}
                          className="p-6 text-center text-gray-500"
                        >
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
          </div>
        </>
      )}
    </>
  );
}
