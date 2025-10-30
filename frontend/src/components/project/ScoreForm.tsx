"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import axios from "axios";
import { useUser } from "@/context/UserContext";

export interface IScoreForm {
  MaDoAn: string;
  scores: {
    MaSV: string;
    TenSV: string;
    Diem: number;
  }[];
  MaGV: string;
}
interface pageProp {
  MaDoAn: string;
  isOpen: boolean;
  onClose: () => void;
  form: IScoreForm;
  onChange: (MaSV: string, value: string) => void;
  onLoad: () => Promise<void>;
  MaKhoa: number;
}
export const initScore: IScoreForm = {
  MaDoAn: "",
  scores: [
    {
      MaSV: "",
      TenSV: "",
      Diem: 0,
    },
  ],
  MaGV: "",
};
export default function ScoreForm({
  isOpen,
  onClose,
  form,
  onChange,
  onLoad,
  MaKhoa,
}: pageProp) {
  const { user } = useUser();
  const handleSubmit = async () => {
    try {
      await axios.put("http://localhost:4000/scores", {
        ...form,
        MaKhoa,
      });
      alert("Nhập điểm thành công");
      onClose();
      await onLoad();
    } catch (err: any) {
      alert(err.response?.data?.error || "Có lỗi xảy ra");
    }
  };
  
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl animate-fadeIn ">
        <CardHeader>
          <CardTitle>📝 Nhập điểm sinh viên</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Bảng danh sách sinh viên */}
            <table className="min-w-full border border-gray-300 rounded-lg">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left w-[25%]">Mã SV</th>
                  <th className="px-4 py-2 text-left w-[45%]">Tên sinh viên</th>
                  <th className="px-4 py-2 text-left w-[30%]">Điểm</th>
                </tr>
              </thead>
              <tbody>
                {form.scores.map((sv, index) => (
                  <tr
                    key={index}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-2">{sv.MaSV}</td>
                    <td className="px-4 py-2">{sv.TenSV}</td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min={0}
                        max={10}
                        step={0.25}
                        value={sv.Diem ?? 0}
                        onChange={(e) =>
                          onChange(sv.MaSV, e.currentTarget.value)
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Huỷ
            </Button>
            <Button
              type="button"
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={handleSubmit}
            >
              Lưu điểm
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
