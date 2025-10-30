"use client";
import { formatDate } from "@/utils/formatDate";
import { IProject } from "./ProjectList";

interface Props {
  project: IProject | null;
}
export default function ProjectDetail({ project }: Props) {
  return (
    <>
      {project && (
        <>
          <div className="bg-white shadow rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-2">
              Đồ án: {project?.TenDT}
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Mã đề tài:</span> {project.MaDT}
              </div>
              <div>
                <span className="font-medium">Khóa:</span> {project.MaNamHoc}
              </div>
              <div>
                <span className="font-medium">Khoa:</span> {project.TenKhoa}
              </div>
              <div>
                <span className="font-medium">Giáo viên hướng dẫn:</span>{" "}
                {project.TenGVHuongDan}
              </div>
              <div>
                <span className="font-medium">Ngày bắt đầu:</span>{" "}
                {formatDate(project?.ThoiGianBatDau)}
              </div>
              <div>
                <span className="font-medium">Ngày kết thúc:</span>{" "}
                {formatDate(project?.ThoiGianKetThuc)}
              </div>
              {project.MaHD ? (
                <>
                  <div>
                    <span className="font-medium">Hội đồng:</span>{" "}
                    {project.MaHD}
                  </div>
                  <div>
                    <span className="font-medium">Địa điểm:</span>{" "}
                    {project.DiaChiBaoVe}
                  </div>
                  <div>
                    <span className="font-medium">Ngày bào vệ:</span>{" "}
                    {formatDate(project.NgayBaoVe)}
                  </div>
                  <div>
                    <span className="font-medium">Giáo viên phản biện:</span>{" "}
                    {project.TenGVPhanBien}
                  </div>
                  <div>
                    <span className="font-medium">Chủ tịch:</span>{" "}
                    {project.TenGVChuTich}
                  </div>
                  <div>
                    <span className="font-medium">Thư ký:</span>{" "}
                    {project.TenGVThuKy}
                  </div>
                </>
              ) : (
                <div>
                  <span className="font-medium">
                    Hội đồng:{" "}
                    <span className="text-red-600">Chưa có hội đồng</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
