"use client";
import { ReportFaculty } from "@/components/reports/reportFaculty";
import { ReportTeacher } from "@/components/reports/reportTeacher";
import { ReportTopic } from "@/components/reports/reportTopic";
import { Option } from "@/components/ui/SelectBox";
import React from "react";

export default function Page() {
  const facultyOptions = [
    { label: "Công nghệ thông tin", value: 1 },
    { label: "Cơ khí", value: 2 },
  ];
  const listYear: Option[] = [
    {
      label: "2024-2025",
      value: "2024-2025",
    },
    {
      label: "2025-2026",
      value: "2025-2026",
    },
  ];
  return (
    <>
      <div className="space-y-6">
        <ReportTopic yearOption={listYear} facultyOption={facultyOptions} />
        <ReportTeacher yearOption={listYear} facultyOption={facultyOptions} />
        <ReportFaculty yearOption={listYear} />
      </div>
    </>
  );
}
