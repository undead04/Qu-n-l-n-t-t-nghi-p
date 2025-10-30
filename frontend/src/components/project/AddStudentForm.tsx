"use client";
import { useEffect, useState } from "react";
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
  students: Student[];
}
export interface Student {
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
  students,
}: Prop) {
  const [options, setOptions] = useState<Option[]>([]);
  const [selected, setSelected] = useState<Option | null>(null);
  const [loading, setLoading] = useState(false);
  const [addedStudents, setAddedStudents] = useState<Student[]>(students || []);
  useEffect(() => {
    setAddedStudents(students);
  }, [students.length]);
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

  const handleSave = async () => {
    await axios
      .post(`http://localhost:4000/projects/addStudent/${MaDA}`, {
        MaSV: addedStudents.map((i) => i.MaSV).join(","),
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
  const handleAdd = () => {
    if (selected) {
      const [TenSV, MaSV] = selected.label.split("-").map((i) => i.trim());

      // Kiểm tra trùng mã SV
      const isExist = addedStudents.some((s) => s.MaSV === MaSV);
      if (isExist) {
        alert("Sinh viên này đã được thêm!");
        return;
      }

      setAddedStudents([...addedStudents, { TenSV, MaSV } as Student]);
      setSelected(null);
    }
  };
  const handleDelete = (id: string) => {
    setAddedStudents(addedStudents.filter((i) => i.MaSV != id));
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        className="bg-white w-full max-w-[900px] rounded-2xl shadow-2xl p-6 animate-fadeIn flex flex-col
                min-h-[70vh] max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Thêm sinh viên vào đồ án
          </h2>
        </div>

        {/* Select + Button */}
        <div className="flex gap-3 items-center mb-4">
          <div className="flex-1">
            <Select
              placeholder="Nhập ít nhất 5 ký tự để tìm SV..."
              value={selected}
              onChange={(opt) => {
                setSelected(opt);
              }}
              isClearable
              isLoading={loading}
              onInputChange={(val) => {
                if (val.length >= 5)
                  fetchStudents(val).then((res) => setOptions(res));
                else setOptions([]);
              }}
              options={options}
              className="rounded-lg"
              formatOptionLabel={(opt, { context }) =>
                context === "menu" ? (
                  <div>{opt.label}</div>
                ) : (
                  <span>{opt.value}</span>
                )
              }
            />
          </div>
          <Button
            type="button"
            className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-4 py-2"
            onClick={handleAdd}
          >
            Thêm
          </Button>
        </div>

        {/* Table */}
        {addedStudents.length > 0 && (
          <div className="overflow-auto mb-4 rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full text-left">
              <thead className="bg-gray-100 text-center">
                <tr>
                  <th className="px-4 py-2 border-b">Mã SV</th>
                  <th className="px-4 py-2 border-b">Tên sinh viên</th>
                  <th className="px-4 py-2 border-b"></th>
                </tr>
              </thead>
              <tbody>
                {addedStudents.map((s) => (
                  <tr
                    key={s.MaSV}
                    className="hover:bg-gray-50 transition-colors text-center"
                  >
                    <td className="px-4 py-2 border-b">{s.MaSV}</td>
                    <td className="px-4 py-2 border-b">{s.TenSV}</td>
                    <td className="px-4 py-2 border-b">
                      <Button
                        className="bg-red-500 text-white hover:bg-red-600"
                        onClick={() => handleDelete(s.MaSV)}
                      >
                        Xóa
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-auto">
          <Button
            type="button"
            variant="outline"
            className="px-4 py-2"
            onClick={() => {
              onClose?.();
              setSelected(null);
              setAddedStudents(students);
            }}
          >
            Huỷ
          </Button>
          <Button
            type="button"
            className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg"
            onClick={handleSave}
          >
            Lưu
          </Button>
        </div>
      </div>
    </div>
  );
}
