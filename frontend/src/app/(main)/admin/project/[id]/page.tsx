"use client";
import ProjectDetail from "@/components/project/ProjectDetail";
import React from "react";
import { useSearchParams } from "next/dist/client/components/navigation";
import { ScoreList } from "@/components/project/ScoreList";
import ProjectSubmission from "@/components/uploadFile";
interface PageProps {
  params: Promise<{ id: string }>;
}
export default function Page({ params }: PageProps) {
  const { id } = React.use(params);
  const searchParams = useSearchParams();
  const MaKhoa = Number(searchParams.get("MaKhoa")) || 1;
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <ProjectDetail MaDA={id} MaKhoa={MaKhoa} />;
      <ScoreList MaDA={id} MaKhoa={MaKhoa} />
      <ProjectSubmission MaDT={id} MaKhoa={MaKhoa.toString()} disable={true} />
    </div>
  );
}
