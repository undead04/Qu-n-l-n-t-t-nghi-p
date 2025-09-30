"use client";
import { useState } from "react";
import Select from "react-select";
import { Label } from "../ui/label";
import { Input } from "../ui/Input";
import { Option } from "../ui/SelectBox";
import axios from "axios";
import { Button } from "../ui/Button";

interface Student {
  MaSV: string;
  TenSV: string;
  DiaChi: string;
  TenKhoa?: string;
}
interface Prop {
  onClose: () => void;
  isOpen: boolean;
  MaDA: string;
  onLoad: () => void;
}
export default function AddStudentModal({
  onClose,
  isOpen,
  MaDA,
  onLoad,
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
        params: { search: inputValue },
      });
      const data = res.data.data;
      return data.map((sv: any) => ({
        label: sv.MaSV,
        value: sv.MaSV,
      }));
    } finally {
      setLoading(false);
    }
  }

  // Hàm gọi API lấy chi tiết SV theo MaSV
  async function fetchStudentDetail(maSV: string) {
    const res = await axios.get(`http://localhost:4000/students/${maSV}`);
    const data = await res.data[0];
    setStudent(data);
  }
  const handleAdd = async () => {
    await axios
      .post(`http://localhost:4000/projects/addStudent/${MaDA}`, {
        MaSV: selected.value,
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
      <div className="bg-white w-[550px] rounded-2xl shadow-lg p-6">
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
              // gọi async ở ngoài
              fetchStudents(val).then((result) => setOptions(result));
            } else {
              setOptions([]); // clear nếu gõ <5 ký tự
            }
          }}
          options={options}
        />

        <div className="mt-4 space-y-3">
          <div>
            <Label>Tên sinh viên</Label>
            <Input disabled={true} value={student?.TenSV || ""} />
          </div>

          <div>
            <Label>Địa chỉ</Label>
            <Input disabled={true} value={student?.DiaChi || ""} />
          </div>

          <div>
            <Label>Khoa</Label>
            <Input disabled={true} value={student?.TenKhoa || ""} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            ❌ Huỷ
          </Button>
          <Button
            type="button"
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={handleAdd}
          >
            💾 Thêm
          </Button>
        </div>
      </div>
    </div>
  );
}
