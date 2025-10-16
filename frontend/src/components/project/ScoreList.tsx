import axios from "axios";
import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import ScoreForm, { initScore, IScoreForm } from "./ScoreForm";
import { ICouncil } from "../council/CouncilList";
import { formatDate } from "@/utils/formatDate";
interface Prop {
  MaDA: string;
  MaKhoa: number;
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
  MaHD: string;
}

export function ScoreList({ MaDA, MaKhoa }: Prop) {
  const [scores, setScores] = useState<IScore[]>([]);
  const [score, setScore] = useState<IScoreForm>(initScore);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [councils, setCouncils] = useState<ICouncil[]>([]);
  const [openCouncil, setOpenCouncil] = useState<string | null>(null);
  const fetchCouncils = async () => {
    try {
      const res = await axios.get(`http://localhost:4000/projects/council`, {
        params: { MaDoAn: MaDA, MaKhoa },
      });
      const datas = res.data;
      setCouncils(datas);
      console.log("Councils:", datas);
    } catch (error) {
      console.error("Fetch council error:", error);
    }
  };
  const fetchScores = async () => {
    if (MaDA) {
      setIsLoading(true);
      try {
        const res = await axios.get(`http://localhost:4000/scores`, {
          params: { MaDoAn: MaDA, MaKhoa },
        });
        setScores(res.data.data);
      } catch (error) {
        console.error("Fetch score error:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchScores(), fetchCouncils()]);
      setIsLoading(false);
    };

    loadData();
  }, []);
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setScore((prev) => ({ ...prev, [name]: value }));
  };

  const toggleCouncil = (id: string) => {
    setOpenCouncil(openCouncil === id ? null : id);
  };

  const formatScore = (score: number | null) => {
    score != null ? score.toFixed(2) : "-";
    if (score == null) {
      return <span className="text-red-500 font-medium">chưa chấm</span>;
    }
    return score;
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
        MaKhoa={MaKhoa}
      />
      <div className="bg-white shadow rounded-lg p-6 border">
        <h3 className="text-lg font-semibold mb-4">
          Danh sách hội đồng & điểm
        </h3>

        {(!councils || councils.length === 0) && (
          <p className="text-center text-gray-500">📭 Không có hội đồng nào</p>
        )}

        {councils.map((council, index) => (
          <div key={index} className="border rounded-lg mb-4 overflow-hidden">
            {/* Header hội đồng */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-purple-100 p-4 rounded-t-lg border-b gap-4">
              {/* Thông tin hội đồng */}
              <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm text-gray-700">
                <p>
                  <span className="font-medium text-gray-600">
                    Mã hội đồng:
                  </span>{" "}
                  {council.MaHD}
                </p>
                <p>
                  <span className="font-medium text-gray-600">
                    Ngày bảo vệ:
                  </span>{" "}
                  {formatDate(council.NgayBaoVe)}
                </p>
                <p>
                  <span className="font-medium text-gray-600">Địa điểm:</span>{" "}
                  {council.DiaChiBaoVe || "Chưa có"}
                </p>
                <p>
                  <span className="font-medium text-gray-600">
                    Giáo viên chấm:
                  </span>{" "}
                  {council.TenGVChuTich &&
                  council.TenGVPhanBien &&
                  council.TenGVThuKy ? (
                    <>
                      {council.TenGVChuTich} (Chủ tịch), {council.TenGVPhanBien}{" "}
                      (Phản biện), {council.TenGVThuKy} (Thư ký)
                    </>
                  ) : (
                    "Chưa có thông tin"
                  )}
                </p>
              </div>

              {/* Nút hiển thị điểm */}
              <Button
                className="bg-purple-500 text-white hover:bg-purple-600 whitespace-nowrap"
                onClick={() => toggleCouncil(council.MaHD)}
              >
                {openCouncil === council.MaHD
                  ? "Ẩn danh sách"
                  : "Hiển thị điểm"}
              </Button>
            </div>

            {/* Danh sách điểm */}
            {openCouncil === council.MaHD && (
              <div className="overflow-x-auto p-4 animate-fadeIn">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-purple-50 text-left">
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
                    {!isLoading ? (
                      scores && scores.length > 0 ? (
                        scores
                          .filter(
                            (row) =>
                              row.MaHD.toLowerCase() ===
                              council.MaHD.toLowerCase()
                          )
                          .map((row, index) => (
                            <tr
                              key={index}
                              className="border-b hover:bg-purple-50 transition"
                            >
                              <td className="p-3 font-medium text-gray-700">
                                {row.MaSV}
                              </td>
                              <td className="p-3">{row.TenSV}</td>
                              <td className="p-3">
                                {formatScore(row.DiemGVChuTich)}
                              </td>
                              <td className="p-3">
                                {formatScore(row.DiemGVHuongDan)}
                              </td>
                              <td className="p-3">
                                {formatScore(row.DiemGVPhanBien)}
                              </td>
                              <td className="p-3">
                                {formatScore(row.DiemTrungBinh)}
                              </td>
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
                                      MaHD: council.MaHD,
                                    });
                                  }}
                                >
                                  👁 Chấm
                                </Button>
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td
                            colSpan={8}
                            className="p-6 text-center text-gray-500"
                          >
                            📭 Không có dữ liệu điểm
                          </td>
                        </tr>
                      )
                    ) : (
                      <tr>
                        <td
                          colSpan={8}
                          className="p-6 text-center text-gray-500"
                        >
                          ⏳ Đang tải dữ liệu...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
