"use client";
import { useEffect, useState } from "react";
import React from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { IProject } from "@/components/project/ProjectList";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

import ProjectDetail from "@/components/project/ProjectDetail";
import { ScoreList } from "@/components/project/ScoreList";
import ProjectSubmission from "@/components/uploadFile";
interface PageProps {
  params: Promise<{ id: string }>;
}
export default function AssignmentPage({ params }: PageProps) {
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<IProject | null>(null);
  const { id } = React.use(params);
  const searchParams = useSearchParams();
  const MaKhoa = Number(searchParams.get("MaKhoa")) || 1;
  const loadData = async () => {
    try {
      const res = await axios.get(`http://localhost:4000/projects/${id}`, {
        params: { MaKhoa: MaKhoa },
      });
      setRecord(res.data[0]);
    } catch (error) {
      console.error("Fetch History error:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadData();
  }, []);
  if (record == null && loading) return <LoadingSpinner />;
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <ProjectDetail MaDA={id} MaKhoa={MaKhoa} />;
      <ScoreList MaDA={id} MaKhoa={MaKhoa} />
      <ProjectSubmission MaDT={id} MaKhoa={MaKhoa.toString()} disable={false} />
    </div>
  );
}
