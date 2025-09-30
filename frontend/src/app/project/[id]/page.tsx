"use client";
import ProjectDetail from "@/components/project/ProjectDetail";
import React from "react";
interface PageProps {
  params: Promise<{ id: string }>;
}
export default function Page({ params }: PageProps) {
  const { id } = React.use(params);
  return <ProjectDetail MaDA={id} />;
}
