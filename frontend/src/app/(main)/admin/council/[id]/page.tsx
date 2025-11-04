"use client";
import React from "react";
import CouncilDetail from "@/components/council/CouncilDetail";
import { useSearchParams } from "next/dist/client/components/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ROLES } from "@/context/UserContext";
interface PageProps {
  params: Promise<{ id: string }>;
}
export default function Page({ params }: PageProps) {
  const { id } = React.use(params);
  const searchParams = useSearchParams();
  const MaKhoa = Number(searchParams.get("MaKhoa")) || 1;
  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
      <CouncilDetail MaHD={id} MaKhoa={MaKhoa} />
    </ProtectedRoute>
  );
}
