"use client";
import React from "react";
import CouncilDetail from "@/components/council/CouncilDetail";

interface PageProps {
  params: Promise<{ id: string }>;
}
export default function Page({ params }: PageProps) {
  const { id } = React.use(params);

  return (
    <>
      <CouncilDetail MaHD={id} />
    </>
  );
}
