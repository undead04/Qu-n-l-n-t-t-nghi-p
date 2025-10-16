"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Input } from "@/components/ui/Input";
import SelectBox, { Option } from "../ui/SelectBox";
import { Button } from "../ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Label } from "../ui/label";
import { ITeacher } from "../teacher/TeacherList";

export interface IInputProject {
  MaDT?: string;
  TenDT: string;
  MaNamHoc: string;
  ThoiGianBatDau: string;
  ThoiGianKetThuc: string;
  MaGVHuongDan: string;
  MaKhoa: number | null;
}

export const initProject: IInputProject = {
  TenDT: "",
  MaKhoa: null,
  MaGVHuongDan: "",
  MaNamHoc: "",
  ThoiGianKetThuc: new Date().toISOString().split("T")[0],
  ThoiGianBatDau: new Date().toISOString().split("T")[0],
};

interface Prop {
  onSetInput: (value: IInputProject) => void;
  handleClose: () => void;
  isOpen: boolean;
  facultyOptions: Option[];
  input: IInputProject;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  onChangeSelect: (name: string, opt: Option) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function ProjectForm({
  input,
  facultyOptions,
  onSubmit,
  onChange,
  handleClose,
  onChangeSelect,
  onSetInput,
  isOpen,
}: Prop) {
  const [listTeacher, setListTeacher] = useState<ITeacher[]>([]);
  const [dataOption, setDataOption] = useState<Option[]>([]);
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

  // Lấy danh sách giáo viên
  const fetchTeachers = async () => {
    try {
      if (input.MaKhoa) {
        const res = await axios.get("http://localhost:4000/teachers", {
          params: { limit: 100, MaKhoa: input.MaKhoa },
        });
        setListTeacher(res.data.data);
      }
    } catch (err) {
      alert("⚠️ Lỗi khi lấy danh sách giáo viên");
    }
  };

  // Khi mount thì fetch data
  useEffect(() => {
    fetchTeachers();
  }, [input.MaKhoa]);

  // Khi thay đổi khoa thì lọc lại giáo viên
  useEffect(() => {
    // Lọc giáo viên theo khoa
    const teachers = listTeacher.filter((item) => item.MaKhoa === input.MaKhoa);
    const teacherOptions = teachers.map((item) => ({
      label: `${item.MaGV} - ${item.TenGV}`,
      value: item.MaGV,
    }));
    setDataOption(teacherOptions);
    if (input.MaDT == null) {
      // Reset lại các field liên quan
      onSetInput({ ...input, MaGVHuongDan: "" });
    }
  }, [input.MaKhoa, listTeacher]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <Card className="w-full max-w-4xl animate-fadeIn scale-95">
        {/* Header */}
        <CardHeader>
          <CardTitle>
            🎓 {input.MaDT == null ? "Thêm" : "Chỉnh sữa"} đồ án
          </CardTitle>
        </CardHeader>

        {/* Body */}
        <CardContent>
          <form
            onSubmit={onSubmit}
            className="space-y-6 max-h-[70vh] overflow-y-auto"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Khoa */}
              <div>
                <Label htmlFor="MaKhoa">Khoa</Label>
                <SelectBox
                  isDisabled={!!input.MaDT}
                  opt={
                    facultyOptions.find((op) => op.value == input.MaKhoa) ||
                    null
                  }
                  options={facultyOptions}
                  placeholder="Chọn khoa"
                  onChange={(opt) => onChangeSelect("MaKhoa", opt)}
                />
              </div>
              {/* Năm học */}
              <div>
                <Label htmlFor="MaNamHoc">Khóa</Label>
                <SelectBox
                  isDisabled={!!input.MaDT}
                  opt={
                    listYear.find((op) => op.value == input.MaNamHoc) || null
                  }
                  options={listYear}
                  placeholder="Chọn năm học"
                  onChange={(opt) => onChangeSelect("MaNamHoc", opt)}
                />
              </div>
              {/* Tên đề tài */}
              <div>
                <Label htmlFor="TenDT">Tên đề tài</Label>
                <Input
                  id="TenDT"
                  type="text"
                  name="TenDT"
                  value={input.TenDT}
                  onChange={onChange}
                />
              </div>
              {/* Giáo viên hướng dẫn */}
              <div>
                <Label htmlFor="MaGVHuongDan">Giáo viên hướng dẫn</Label>
                <SelectBox
                  opt={
                    dataOption.find((op) => op.value == input.MaGVHuongDan) ||
                    null
                  }
                  options={dataOption}
                  placeholder="Chọn giáo viên"
                  onChange={(opt) => onChangeSelect("MaGVHuongDan", opt)}
                />
              </div>

              {/* Ngày bắt đầu */}
              <div>
                <Label htmlFor="ThoiGianBatDau">Ngày bắt đầu</Label>
                <Input
                  id="ThoiGianBatDau"
                  type="date"
                  name="ThoiGianBatDau"
                  value={input.ThoiGianBatDau}
                  onChange={onChange}
                />
              </div>

              {/* Ngày kết thúc */}
              <div>
                <Label htmlFor="ThoiGianKetThuc">Ngày kết thúc</Label>
                <Input
                  id="ThoiGianKetThuc"
                  type="date"
                  name="ThoiGianKetThuc"
                  value={input.ThoiGianKetThuc}
                  onChange={onChange}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleClose}>
                ✖ Đóng
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                💾 Lưu lại
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
