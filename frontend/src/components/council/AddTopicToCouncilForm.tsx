"use client";
import { useState } from "react";
import Select from "react-select";
import { Label } from "../ui/label";
import { Input } from "../ui/Input";
import { Option } from "../ui/SelectBox";
import axios from "axios";
import { Button } from "../ui/Button";
import { ICouncil } from "./CouncilList";
import { IProject } from "../project/ProjectList";

interface Prop {
  onClose: () => void;
  isOpen: boolean;
  MaHD: string;
  onLoad: () => void;
}
export default function AddCouncilModal({
  onClose,
  isOpen,
  MaHD,
  onLoad,
}: Prop) {
  const [searchText, setSearchText] = useState("");
  const [options, setOptions] = useState<Option[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [topic, setTopic] = useState<IProject | null>(null);
  const [loading, setLoading] = useState(false);

  // Hàm gọi API search SV
  async function fetchTopic(inputValue: string) {
    if (inputValue.length < 5) return;
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:4000/projects", {
        params: { search: inputValue },
      });
      const data = res.data.data;
      console.log(data);
      return data.map((sv: any) => ({
        label: sv.MaDT,
        value: sv.MaDT,
      }));
    } finally {
      setLoading(false);
    }
  }

  // Hàm gọi API lấy chi tiết SV theo MaSV
  async function fetchTopicDetail(id: string) {
    const res = await axios.get(`http://localhost:4000/projects/${id}`);
    const data = await res.data[0];
    setTopic(data);
  }
  const handleAdd = async () => {
    await axios
      .post(`http://localhost:4000/projects/council`, {
        MaDoAn: selected.value,
        MaHoiDong: MaHD,
      })
      .then((res) => {
        alert("✅ Thêm đề tài thành công");
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
        <h2 className="text-lg font-semibold mb-4">Thêm đề tài vào hội đòng</h2>
        {/* Select Search */}
        <Select
          placeholder="Nhập ít nhất 5 ký tự mã để tìm đề tài..."
          value={selected}
          onChange={(opt) => {
            setSelected(opt);
            if (opt?.value) {
              fetchTopicDetail(opt.value);
            } else {
              setTopic(null);
            }
          }}
          isClearable
          isLoading={loading}
          onInputChange={(val) => {
            setSearchText(val);
            if (val.length >= 5) {
              // gọi async ở ngoài
              fetchTopic(val).then((result) => setOptions(result));
            } else {
              setOptions([]); // clear nếu gõ <5 ký tự
            }
          }}
          options={options}
        />

        <div className="mt-4 space-y-3">
          <div>
            <Label>Tên đề tài</Label>
            <Input disabled={true} value={topic?.TenDT || ""} />
          </div>

          <div>
            <Label>Khoa</Label>
            <Input disabled={true} value={topic?.TenKhoa || ""} />
          </div>

          <div>
            <Label>Niên khóa</Label>
            <Input disabled={true} value={topic?.MaNamHoc || ""} />
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
