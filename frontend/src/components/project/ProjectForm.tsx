"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Input } from "@/components/ui/Input";
import SelectBox, { Option } from "../ui/SelectBox";
import { Button } from "../ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Label } from "../ui/label";
import { ITeacher } from "../teacher/TeacherList";
import { IFaculty } from "../faculty/FacultyList";
import { convertSelectBox } from "@/utils/convertSelectBox";
export interface IInputProject {
  MaDT?: string;
  TenDT: string;
  MaNamHoc: string;
  ThoiGianBatDau: string;
  ThoiGianKetThuc: string;
  MaGVHuongDan: string;
  MaKhoa: number | null;
}

interface Prop {
  handleClose: () => void;
  isOpen: boolean;
  input: IInputProject;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  onChangeSelect: (name: string, opt: Option) => void;
  onSubmit: (e: React.FormEvent) => void;
  listYear: Option[];
  listTeacher: ITeacher[];
  listFaculty: IFaculty[];
  onSetInput: (input: IInputProject) => void;
}

export default function ProjectForm({
  input,
  onSubmit,
  onChange,
  handleClose,
  onChangeSelect,
  isOpen,
  listYear,
  listTeacher,
  listFaculty,
  onSetInput,
}: Prop) {
  const [dataOption, setDataOption] = useState<Option[]>([]);
  const [facultyOption, setFacultyOption] = useState<Option[]>([]);
  // Khi thay đổi khoa thì lọc lại giáo viên
  useEffect(() => {
    const teacherOptions = listTeacher.map((item) => ({
      label: `${item.MaGV} - ${item.TenGV}`,
      value: item.MaGV,
    }));
    setDataOption(teacherOptions);
    const facultyOptions = listFaculty.map((item) => ({
      label: `${item.TenKhoa}`,
      value: item.MaKhoa,
    }));
    setFacultyOption(facultyOptions);
  }, [listTeacher, listFaculty]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <Card className="w-full max-w-4xl animate-fadeIn scale-95">
        {/* Header */}
        <CardHeader>
          <CardTitle>
            🎓 {input.MaDT == null ? "Thêm" : "Chỉnh sửa"} đề tài
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
                  isDisabled
                  opt={convertSelectBox(facultyOption, input.MaKhoa)}
                  options={facultyOption}
                  onChange={(opt) => onChangeSelect("MaKhoa", opt)}
                />
              </div>

              {/* Giáo viên hướng dẫn */}
              <div>
                <Label htmlFor="MaGVHuongDan">Giáo viên hướng dẫn</Label>
                <SelectBox
                  isDisabled
                  opt={convertSelectBox(dataOption, input.MaGVHuongDan)}
                  options={dataOption}
                  placeholder="Chọn giáo viên"
                  onChange={(opt) => onChangeSelect("MaGVHuongDan", opt)}
                />
              </div>

              {/* Năm học */}
              <div>
                <Label htmlFor="MaNamHoc">Khóa</Label>
                <SelectBox
                  isDisabled={!!input.MaDT}
                  opt={convertSelectBox(listYear, input.MaNamHoc)}
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
