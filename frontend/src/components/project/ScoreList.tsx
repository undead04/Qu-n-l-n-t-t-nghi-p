import axios from "axios";
import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import ScoreForm, { initScore, IScoreForm } from "./ScoreForm";
import SelectBox, { Option } from "../ui/SelectBox";
interface Prop {
  MaDA: string;
}
interface IScore {
  MaSV: string;
  MaDA: string;
  TenSV: string;
  TenKhoa: string;
  DiemGVHuongDan: number;
  DiemGVChuTich: number;
  DiemGVPhanBien: number;
  DiemTrungBinh: number;
  KetQua: number;
}

export function ScoreList({ MaDA }: Prop) {
  const [scores, setScores] = useState<IScore[]>([]);
  const [score, setScore] = useState<IScoreForm>(initScore);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [councils, setCouncils] = useState<Option[]>([]);
  const [council, setCouncil] = useState<Option>();
  const fetchCouncils = async () => {
    try {
      const res = await axios.get(`http://localhost:4000/projects/council`, {
        params: { MaDoAn: MaDA },
      });
      const datas = res.data;
      setCouncils(
        datas.map((item: any) => ({
          label: item.MaHD,
          value: item.MaHD,
        }))
      );
    } catch (error) {
      console.error("Fetch council error:", error);
    }
  };
  const fetchScores = async () => {
    if (MaDA && council?.value) {
      setIsLoading(true);
      try {
        const res = await axios.get(`http://localhost:4000/scores`, {
          params: { MaDoAn: MaDA, MaHD: council?.value },
        });
        setScores(res.data.data);
      } catch (error) {
        console.error("Fetch score error:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };
  const handleOpen = (input: any) => {
    setIsOpen(true);
    setScore(input);
  };
  const handleClose = () => {
    setIsOpen(false);
  };
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchScores(), fetchCouncils()]);
      setIsLoading(false);
    };

    loadData();
  }, []);
  useEffect(() => {
    fetchScores();
  }, [council?.value]);
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setScore((prev) => ({ ...prev, [name]: value }));
  };
  const formatScore = (score: number | null) => {
    if (score == null) {
      return <span className="text-red-500 font-medium">chưa chấm</span>;
    }
    return score; // có thể thêm .toFixed(1) nếu muốn chuẩn định dạng
  };

  return (
    <>
      <ScoreForm
        onChange={handleChange}
        form={score}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        MaDoAn={MaDA}
        onLoad={() => fetchScores()}
      />
      <div className="bg-white shadow rounded-lg p-6 border">
        <h3 className="text-lg font-semibold mb-4">Danh sách điểm</h3>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center border-b pb-4">
          <div className="md:col-span-12 justify-self-start">
            {" "}
            <SelectBox
              options={councils}
              placeholder="Chọn hội đồng"
              onChange={(opt) => setCouncil(opt)}
              opt={council || null}
            />
          </div>
        </div>

        {/* Table danh sách + chấm điểm */}
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-purple-100 text-left">
                <th className="p-3">Mã SV</th>
                <th className="p-3">Tên SV</th>
                <th className="p-3">Điểm CT</th>
                <th className="p-3">Điểm HD</th>
                <th className="p-3">Điểm PB</th>
                <th className="p-3">Điểm TB</th>
                <th className="p-3">Kết quả</th>
                <th className="p-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {!isLoading &&
              councils &&
              councils.length > 0 &&
              scores &&
              scores.length > 0 ? (
                scores.map((row, index) => (
                  <tr
                    key={index}
                    className="border-b hover:bg-purple-50 transition"
                  >
                    <td className="p-3 font-medium text-gray-700">
                      {row.MaSV}
                    </td>
                    <td className="p-3">{row.TenSV}</td>
                    <td className="p-3">{formatScore(row.DiemGVChuTich)}</td>
                    <td className="p-3">{formatScore(row.DiemGVHuongDan)}</td>
                    <td className="p-3">{formatScore(row.DiemGVPhanBien)}</td>
                    <td className="p-3">{formatScore(row.DiemTrungBinh)}</td>

                    <td className="p-3">{row.KetQua}</td>
                    <td className="p-3">
                      <Button
                        className="bg-blue-500 text-white hover:bg-blue-600"
                        onClick={() => {
                          setIsOpen(true);
                          setScore({
                            TenSV: row.TenSV,
                            MaSV: row.MaSV,
                            MaDoAn: MaDA,
                            DiemGVChuTich: row.DiemGVChuTich,
                            DiemGVHuongDan: row.DiemGVHuongDan,
                            DiemGVPhanBien: row.DiemGVPhanBien,
                            MaHD: council?.value,
                          } as IScoreForm);
                        }}
                      >
                        👁 Chấm
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-gray-500">
                    📭 Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
