"use client";
import { useEffect, useState } from "react";
import { formatDate } from "@/utils/formatDate";
import axios from "axios";
import { IProject } from "./ProjectList";
import LoadingSpinner from "../ui/LoadingSpinner";

interface Props {
  MaDA: string;
  MaKhoa: number;
}
export default function ProjectDetail({ MaDA, MaKhoa }: Props) {
  const [project, setProject] = useState<IProject>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const fetchProjects = async () => {
    try {
      const res = await axios.get(`http://localhost:4000/projects/${MaDA}`, {
        params: { MaKhoa },
      });
      setProject(res.data[0]);
    } catch (error) {
      console.error("Fetch council error:", error);
    }
  };
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchProjects()]);
      setIsLoading(false);
    };

    loadData();
  }, []);
  if (isLoading) return <LoadingSpinner />;
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
                <span className="font-medium">Tên GV:</span>{" "}
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
