"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ReportFaculty } from "@/components/reports/reportFaculty";
import { Option } from "@/components/ui/SelectBox";
import { ROLES } from "@/context/UserContext";
import axios from "axios";
import React, { useEffect } from "react";

export default function Page() {
  const [listYear, setListYear] = React.useState<Option[]>([]);

  const loadData = async () => {
    try {
      const [yearsRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/years`),
      ]);
      setListYear(
        yearsRes.data.map((item: any) => ({
          label: item.MaNamHoc,
          value: item.MaNamHoc,
        }))
      );
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    loadData();
  }, []);
  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
      <div className="space-y-6">
        <ReportFaculty yearOption={listYear} />
      </div>
    </ProtectedRoute>
  );
}
