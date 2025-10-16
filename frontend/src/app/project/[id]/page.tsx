"use client";
import ProjectDetail from "@/components/project/ProjectDetail";
import React from "react";
import { useSearchParams } from "next/dist/client/components/navigation";
interface PageProps {
  params: Promise<{ id: string }>;
}
export default function Page({ params }: PageProps) {
  const { id } = React.use(params);
  const searchParams = useSearchParams();
  const MaKhoa = Number(searchParams.get("MaKhoa")) || 1;
  return <ProjectDetail MaDA={id} MaKhoa={MaKhoa} />;
}
  