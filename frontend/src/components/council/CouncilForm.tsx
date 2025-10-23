"use client";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/label";
import axios from "axios";
import SelectBox, { Option } from "../ui/SelectBox";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useEffect, useState } from "react";
import { ITeacher } from "../teacher/TeacherList";
import SelectSearch from "../ui/SelectSearch";

// Kiểu dữ liệu cho form hội đồng
export interface IInputCouncil {
  MaGVChuTich: string;
  MaGVThuKy: string;
  MaGVPhanBien: string;
  DiaChiBaoVe: string;
  NgayBaoVe: string;
  MaKhoa: number | null;
  MaHD?: string;
  MaNamHoc: string;
}

export const initCouncil: IInputCouncil = {
  MaGVChuTich: "",
  MaGVThuKy: "",
  MaGVPhanBien: "",
  DiaChiBaoVe: "",
  NgayBaoVe: new Date(Date.now()).toISOString().split("T")[0],
  MaKhoa: null,
  MaNamHoc: "",
};

interface IProp {
  handleClose: () => void;
  onSetInput: (value: IInputCouncil) => void;
  isOpen: boolean;
  facultyOptions: Option[];
  input: IInputCouncil;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  onChangeSelect: (name: string, opt: Option) => void;
  onSubmit: (e: React.FormEvent) => void;
  listYear: Option[];
}

export function AddCouncilForm({
  handleClose,
  isOpen,
  facultyOptions,
  input,
  onChange,
  onChangeSelect,
  onSubmit,
  onSetInput,
  listYear,
}: IProp) {
  const [listTeacher, setListTeacher] = useState<ITeacher[]>([]);
  const [dataOption, setDataOption] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // Lấy danh sách giáo viên
  const fetchTeachers = async () => {
    try {
      if (input.MaKhoa != null) {
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
    try {
      setIsLoading(true);
      const teachers = listTeacher.filter(
        (item) => item.MaKhoa === input.MaKhoa
      );
      const options = teachers.map((item) => ({
        label: `${item.MaGV} - ${item.TenGV}`,
        value: item.MaGV,
      }));
      setDataOption(options);
    } finally {
      setIsLoading(false);
      if (input.MaHD == null) {
        onSetInput({
          ...input,
          MaGVChuTich: "",
          MaGVPhanBien: "",
          MaGVThuKy: "",
        });
      }
    }
  }, [input.MaKhoa, listTeacher]);
  if (!isLoading && !isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <Card className="w-full max-w-2xl animate-fadeIn scale-95">
        {/* Header */}
        <CardHeader>
          <CardTitle>
            👥 {input.MaHD == null ? "Thêm" : "Chỉnh sửa"} hội đồng
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
                  isDisabled={!!input.MaHD}
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
                  isDisabled={!!input.MaHD}
                  opt={
                    listYear.find((op) => op.value == input.MaNamHoc) || null
                  }
                  options={listYear}
                  placeholder="Chọn năm học"
                  onChange={(opt) => onChangeSelect("MaNamHoc", opt)}
                />
              </div>

              {/* Chủ tịch */}
              <div>
                <Label htmlFor="ChuTich">Chủ tịch</Label>
                <SelectBox
                  isLoading={isLoading}
                  opt={
                    dataOption.find((op) => op.value == input.MaGVChuTich) ||
                    null
                  }
                  options={dataOption}
                  placeholder="Chọn Chủ tịch"
                  onChange={(opt) => onChangeSelect("MaGVChuTich", opt)}
                />
              </div>

              {/* Thư ký */}
              <div>
                <Label htmlFor="ThuKy">Thư ký</Label>
                <SelectBox
                  isLoading={isLoading}
                  opt={
                    dataOption.find((op) => op.value == input.MaGVThuKy) || null
                  }
                  options={dataOption}
                  placeholder="Chọn Thư ký"
                  onChange={(opt) => onChangeSelect("MaGVThuKy", opt)}
                />
              </div>

              {/* Phản biện */}
              <div>
                <Label htmlFor="PhanBien">Phản biện</Label>
                <SelectBox
                  isLoading={isLoading}
                  opt={
                    dataOption.find((op) => op.value == input.MaGVPhanBien) ||
                    null
                  }
                  options={dataOption}
                  placeholder="Chọn Phản biện"
                  onChange={(opt) => onChangeSelect("MaGVPhanBien", opt)}
                />
              </div>

              {/* Địa chỉ bảo vệ */}
              <div>
                <Label htmlFor="DiaChiBaoVe">Địa chỉ bảo vệ</Label>
                <Input
                  id="DiaChiBaoVe"
                  name="DiaChiBaoVe"
                  placeholder="Nhập địa chỉ bảo vệ"
                  value={input.DiaChiBaoVe}
                  onChange={onChange}
                />
              </div>

              {/* Ngày bảo vệ */}
              <div>
                <Label htmlFor="NgayBaoVe">Ngày bảo vệ</Label>
                <Input
                  type="date"
                  id="NgayBaoVe"
                  name="NgayBaoVe"
                  value={input.NgayBaoVe}
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
