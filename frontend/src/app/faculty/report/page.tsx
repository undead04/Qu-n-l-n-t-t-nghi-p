"use client";
import { ReportFaculty } from "@/components/reports/reportFaculty";
import { Option } from "@/components/ui/SelectBox";
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
    <>
      <div className="space-y-6">
        <ReportFaculty yearOption={listYear} />
      </div>
    </>
  );
}
