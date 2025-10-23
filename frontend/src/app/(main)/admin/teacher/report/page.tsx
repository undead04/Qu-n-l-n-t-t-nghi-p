"use client";
import { ReportTeacher } from "@/components/reports/reportTeacher";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Option } from "@/components/ui/SelectBox";
import axios from "axios";
import React, { useEffect } from "react";

export default function Page() {
  const [listYear, setListYear] = React.useState<Option[]>([]);
  const [facultyOptions, setFacultyOptions] = React.useState<Option[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const loadData = async () => {
    try {
      const [yearsRes, facultiesRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/years`),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/faculties`),
      ]);
      setListYear(
        yearsRes.data.map((item: any) => ({
          label: item.MaNamHoc,
          value: item.MaNamHoc,
        }))
      );
      setFacultyOptions(
        facultiesRes.data.map((item: any) => ({
          label: item.TenKhoa,
          value: item.MaKhoa,
        }))
      );
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    loadData();
  }, []);
  return (
    <>
      <div className="space-y-6">
        {!isLoading ? (
          <ReportTeacher yearOption={listYear} facultyOption={facultyOptions} />
        ) : (
          <LoadingSpinner />
        )}
      </div>
    </>
  );
}
