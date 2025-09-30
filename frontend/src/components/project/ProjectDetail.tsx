"use client";
import { useEffect, useState } from "react";
import { formatDate } from "@/utils/formatDate";
import axios from "axios";
import DeleteModal from "../ui/DeleteModal";
import { IProject } from "./ProjectList";
import ScoreForm, { IScoreForm } from "./ScoreForm";
import { useRouter, useSearchParams } from "next/navigation";
import { Option } from "../ui/SelectBox";
import { TableStudent } from "./TableStudent";
import { ScoreList } from "./ScoreList";

interface Props {
  MaDA: string;
}
export default function ProjectDetail({ MaDA }: Props) {
  const [project, setProject] = useState<IProject>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const fetchProjects = async () => {
    try {
      const res = await axios.get(`http://localhost:4000/projects/${MaDA}`);
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

  return (
    <>
      {!isLoading && project && (
        <div className="w-full max-w-5xl mx-auto space-y-6">
          {/* Thông tin đề tài */}
          <div className="bg-white shadow rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-2">{project?.TenDT}</h2>
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
            </div>
          </div>

          {/* Bảng sinh viên */}
          <TableStudent MaDA={MaDA} />
          <ScoreList MaDA={MaDA} />
        </div>
      )}
    </>
  );
}
