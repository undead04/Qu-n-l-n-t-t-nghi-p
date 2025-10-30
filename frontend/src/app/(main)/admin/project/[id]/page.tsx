"use client";
import ProjectDetail from "@/components/project/ProjectDetail";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/dist/client/components/navigation";
import { ScoreList } from "@/components/project/ScoreList";
import ProjectSubmission from "@/components/uploadFile";
import { IProject } from "@/components/project/ProjectList";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import axios from "axios";
interface PageProps {
  params: Promise<{ id: string }>;
}
export default function Page({ params }: PageProps) {
  const { id } = React.use(params);
  const searchParams = useSearchParams();
  const MaKhoa = Number(searchParams.get("MaKhoa")) || 1;
  const [project, setProject] = useState<IProject | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const fetchProjects = async () => {
    try {
      const res = await axios.get(`http://localhost:4000/projects/${id}`, {
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
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <ProjectDetail project={project} />;
      <ScoreList MaDA={id} MaKhoa={MaKhoa} project={project} />
      <ProjectSubmission
        MaDT={id}
        MaKhoa={MaKhoa.toString()}
        project={project}
      />
    </div>
  );
}
