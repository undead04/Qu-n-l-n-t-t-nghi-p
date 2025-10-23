"use client";
import HistoryTeacher from "@/components/teacher/HistoryTeacher";
import { useSearchParams } from "next/dist/client/components/navigation";
import React from "react";
interface PageProps {
  params: Promise<{ id: string }>;
}
export default function Page({ params }: PageProps) {
  const searchParams = useSearchParams();
  const { id } = React.use(params);
  const MaKhoa = Number(searchParams.get("MaKhoa")) || 1;
  return <HistoryTeacher id={id} MaKhoa={MaKhoa} />;
}
