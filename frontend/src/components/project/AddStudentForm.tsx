"use client";
import { useState } from "react";
import Select from "react-select";
import { Label } from "../ui/label";
import { Input } from "../ui/Input";
import { Option } from "../ui/SelectBox";
import axios from "axios";
import { Button } from "../ui/Button";
import { IStudent } from "../student/StudentList";

interface Prop {
  onClose: () => void;
  isOpen: boolean;
  MaDA: string;
  MaKhoa: number;
  onLoad: () => void;
  MaGV: string;
}
interface Student {
  MaSV: string;
  TenSV: string;
  DiaChi: string;
  TenKhoa?: string;
}
export default function AddStudentModal({
  onClose,
  isOpen,
  MaDA,
  onLoad,
  MaKhoa,
  MaGV,
}: Prop) {
  const [searchText, setSearchText] = useState("");
  const [options, setOptions] = useState<Option[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);

  // Hàm gọi API search SV
  async function fetchStudents(inputValue: string) {
    if (inputValue.length < 5) return;
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:4000/students", {
        params: { search: inputValue, MaKhoa },
      });
      const data = res.data.data;
      return data.map((sv: any) => ({
        label: `${sv.TenSV} - ${sv.MaSV}`,
        value: sv.MaSV,
        display: sv.MaSV,
      }));
    } finally {
      setLoading(false);
    }
  }

  // Hàm gọi API lấy chi tiết SV theo MaSV
  async function fetchStudentDetail(maSV: string) {
    const res = await axios.get(`http://localhost:4000/students/${maSV}`, {
      params: { MaKhoa },
    });
    const data = await res.data[0];
    setStudent(data);
  }
  const handleAdd = async () => {
    await axios
      .post(`http://localhost:4000/projects/addStudent/${MaDA}`, {
        MaSV: selected.value,
        MaKhoa,
        MaGV,
      })
      .then((res) => {
        alert("✅ Thêm sinh viên thành công");
        onLoad();
        onClose();
      })
      .catch((err) => {
        alert(err.response.data.error);
      });
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-[700px] rounded-2xl shadow-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Thêm sinh viên vào đồ án</h2>

        {/* Select Search */}
        <Select
          placeholder="Nhập ít nhất 5 ký tự để tìm SV..."
          value={selected}
          onChange={(opt) => {
            setSelected(opt);
            if (opt?.value) {
              fetchStudentDetail(opt.value);
            } else {
              setStudent(null);
            }
          }}
          isClearable
          isLoading={loading}
          onInputChange={(val) => {
            setSearchText(val);
            if (val.length >= 5) {
              fetchStudents(val).then((result) => setOptions(result));
            } else {
              setOptions([]);
            }
          }}
          options={options}
          formatOptionLabel={(opt, { context }) =>
            context === "menu" ? (
              // 👇 Khi hiển thị trong dropdown
              <div className="flex justify-between">
                <span>{opt.label}</span>
              </div>
            ) : (
              // 👇 Khi hiển thị sau khi chọn
              <span>{opt.value}</span>
            )
          }
        />

        {/* Grid form 3 cột */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Tên sinh viên</Label>
            <Input disabled value={student?.TenSV || ""} />
          </div>

          <div>
            <Label>Địa chỉ</Label>
            <Input disabled value={student?.DiaChi || ""} />
          </div>

          <div>
            <Label>Khoa</Label>
            <Input disabled value={student?.TenKhoa || ""} />
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onClose();
              setStudent(null);
              setSelected(null);
            }}
          >
            ❌ Huỷ
          </Button>
          <Button
            type="button"
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => {
              handleAdd();
              setStudent(null);
              setSelected(null);
            }}
          >
            💾 Thêm
          </Button>
        </div>
      </div>
    </div>
  );
}
