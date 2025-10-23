import axios from "axios";
import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import ScoreForm, { initScore, IScoreForm } from "./ScoreForm";
import { useUser } from "@/context/UserContext";
import { getScore } from "@/utils/mergeClassname";
import AddStudentModal from "./AddStudentForm";
import DeleteModal from "../ui/DeleteModal";
import { IStudent } from "../student/StudentList";
import LoadingSpinner from "../ui/LoadingSpinner";
interface Prop {
  MaDA: string;
  MaKhoa: number;
  disable?: boolean;
}
interface IScore {
  MaSV: string;
  MaDA: string;
  TenSV: string;
  TenKhoa: string;
  MaGVHuongDan: string;
  MaGVChuTich: string;
  MaGVPhanBien: string;
  DiemGVHuongDan: number;
  DiemGVChuTich: number;
  DiemGVPhanBien: number;
  DiemTrungBinh: number;
  KetQua: number;
  MaHD: string;
}

export function ScoreList({ MaDA, MaKhoa, disable }: Prop) {
  const [scores, setScores] = useState<IScore[]>([]);
  const [isOpenDel, setIsOpenDel] = useState<boolean>(false);
  const [isOpenScore, setIsOpenScore] = useState<boolean>(false);
  const [student, setStudent] = useState<IStudent>();
  const [score, setScore] = useState<IScoreForm>(initScore);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { user } = useUser();
  const fetchScores = async () => {
    if (MaDA && user) {
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
      await Promise.all([fetchScores()]);
    };

    loadData();
  }, [user]);
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setScore((prev) => ({ ...prev, [name]: value }));
  };

  const formatScore = (score: number | null) => {
    score != null ? score.toFixed(2) : "-";
    if (score == null) {
      return <span className="text-red-500 font-medium">chưa chấm</span>;
    }
    return score;
  };
  const handleOpenDel = (input: any) => {
    setIsOpenDel(true);
    setStudent(input);
  };
  const handleCloseDel = () => {
    setIsOpenDel(false);
  };
  const handleDelete = async () => {
    await axios
      .delete(`http://localhost:4000/projects/delStudent/${MaDA}`, {
        params: { MaSV: student?.MaSV, MaKhoa, MaGV: user?.Username },
      })
      .then((res) => {
        alert("Xóa sinh viên thành công");
        fetchScores();
        handleCloseDel();
      })
      .catch((err) => {
        alert(err.response.data.error);
      });
  };
  useEffect(() => {
    fetchScores();
  }, []);
  if (isLoading) <LoadingSpinner />;
  return (
    <>
      <ScoreForm
        onChange={handleChange}
        form={score}
        isOpen={isOpenScore}
        onClose={() => setIsOpenScore(false)}
        MaDoAn={MaDA}
        onLoad={() => fetchScores()}
        MaKhoa={MaKhoa}
      />
      <DeleteModal
        open={isOpenDel}
        onClose={() => setIsOpenDel(false)}
        onConfirm={handleDelete}
      />
      <AddStudentModal
        onClose={() => setIsOpen(false)}
        isOpen={isOpen}
        MaDA={MaDA}
        onLoad={fetchScores}
        MaKhoa={MaKhoa}
        MaGV={user?.Username || ""}
      />
      <div className="bg-white shadow rounded-lg p-6 border">
        <h3 className="text-lg font-semibold">Danh sách điểm</h3>
        {disable && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center border-b pb-4">
            <div className="md:col-span-12 justify-self-end">
              <Button onClick={() => setIsOpen(true)}>➕ Tạo</Button>
            </div>
          </div>
        )}
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
              {disable && <th className="p-3">Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {!isLoading ? (
              scores && scores.length > 0 ? (
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
                    {disable && (
                      <td className="p-3">
                        <div className="flex gap-2 justify-center">
                          <Button
                            className="bg-blue-500 text-white hover:bg-blue-600"
                            onClick={() => {
                              setIsOpenScore(true);
                              setScore({
                                TenSV: row.TenSV,
                                MaSV: row.MaSV,
                                MaDoAn: MaDA,
                                Diem: getScore(row, user),
                                MaGV: user!.Username,
                              });
                            }}
                          >
                            👁 Chấm
                          </Button>
                          <Button
                            className="bg-red-500 text-white hover:bg-red-600"
                            onClick={() => handleOpenDel(row)}
                          >
                            🗑️ Xóa
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-gray-500">
                    📭 Không có dữ liệu điểm
                  </td>
                </tr>
              )
            ) : (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500">
                  ⏳ Đang tải dữ liệu...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
