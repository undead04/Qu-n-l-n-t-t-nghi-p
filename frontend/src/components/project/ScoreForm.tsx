"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/Button";
import axios from "axios";
import { useUser } from "@/context/UserContext";

export interface IScoreForm {
  MaDoAn: string;
  MaSV: string;
  TenSV: string;
  Diem: number;
  MaGV: string;
}
interface pageProp {
  MaDoAn: string;
  isOpen: boolean;
  onClose: () => void;
  form: IScoreForm;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  onLoad: () => Promise<void>;
  MaKhoa: number;
}
export const initScore: IScoreForm = {
  MaDoAn: "",
  MaSV: "",
  TenSV: "",
  MaGV: "",
  Diem: 0,
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
        MaGV: user?.Code,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <Card className="w-full max-w-xl animate-fadeIn scale-95">
        <CardHeader>
          <CardTitle>📝 Nhập điểm sinh viên</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Mã & tên SV */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="MaSV">Mã SV</Label>
                <Input
                  disabled={true}
                  id="MaSV"
                  placeholder="VD: SV001"
                  value={form.MaSV || ""}
                />
              </div>
              <div>
                <Label htmlFor="TenSV">Tên SV</Label>
                <Input
                  disabled={true}
                  id="TenSV"
                  placeholder="VD: Nguyễn Văn A"
                  value={form.TenSV || ""}
                />
              </div>
              <div>
                <Label htmlFor="DiemGVHuongDan">Điểm</Label>
                <Input
                  id="DiemGVHuongDan"
                  name="Diem"
                  type="number"
                  min={0}
                  max={10}
                  step={0.25}
                  value={form.Diem}
                  onChange={onChange}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              ❌ Huỷ
            </Button>
            <Button
              type="button"
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={handleSubmit}
            >
              💾 Lưu điểm
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
