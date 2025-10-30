import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/Button";
import ScoreForm, { initScore, IScoreForm } from "./ScoreForm";
import { useUser } from "@/context/UserContext";
import { getScore } from "@/utils/mergeClassname";
import AddStudentModal, { Student } from "./AddStudentForm";
import DeleteModal from "../ui/DeleteModal";
import { IStudent } from "../student/StudentList";
import LoadingSpinner from "../ui/LoadingSpinner";
import { IProject } from "./ProjectList";
interface Prop {
  MaDA: string;
  MaKhoa: number;
  project: IProject | null;
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
  KetQua: string | null;
  MaHD: string;
}

export function ScoreList({ MaDA, MaKhoa, project }: Prop) {
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
          params: { MaDoAn: MaDA, MaKhoa, Role: user.MaKhoa },
        });
        setScores(res.data.data);
      } catch (error) {
        console.error("Fetch score error:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current && user?.Username) {
      hasFetched.current = true;
      fetchScores();
    }
  }, []);

  const handleChange = (MaSV: string, value: string) => {
    setScore((prev) => ({
      ...prev,
      scores: prev.scores.map((sv) =>
        sv.MaSV === MaSV
          ? { ...sv, Diem: value === "" ? 0 : parseFloat(value) }
          : sv
      ),
    }));
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
  const formatResults = (ketQua: string | null) => {
    switch (ketQua) {
      case "Đậu":
        return <span className="text-green-500 font-medium">{ketQua}</span>;
      case "Rớt":
        return <span className="text-red-500 font-medium">{ketQua}</span>;
    }
  };
  if (isLoading) return <LoadingSpinner />;
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
        students={scores.map(
          (i) => ({ TenSV: i.TenSV, MaSV: i.MaSV } as Student)
        )}
      />
      <div className="bg-white shadow rounded-lg p-6 border">
        <h3 className="text-lg font-semibold">Danh sách điểm</h3>
        {user?.Role == "GiaoVien" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center border-b pb-4">
            <div className="md:col-span-12 justify-self-end">
              <Button
                className="bg-blue-500 text-white hover:bg-blue-600 mr-4"
                onClick={() => {
                  setIsOpenScore(true);
                  setScore({
                    scores: scores.map((i) => ({
                      TenSV: i.TenSV,
                      MaSV: i.MaSV,
                      Diem: getScore(i, user),
                    })),
                    MaDoAn: MaDA,
                    MaGV: user!.Username,
                  });
                }}
              >
                Chấm
              </Button>
              {project?.MaGVHuongDan == user?.Username && (
                <Button className="" onClick={() => setIsOpen(true)}>
                  ➕ Tạo
                </Button>
              )}
            </div>
          </div>
        )}
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-purple-50 text-center">
              <th className="p-3">Mã SV</th>
              <th className="p-3">Tên SV</th>
              {user?.Role == "Admin" || user?.Role == "SinhVien" ? (
                <>
                  <th className="p-3">Điểm CT</th>
                  <th className="p-3">Điểm HD</th>
                  <th className="p-3">Điểm PB</th>
                  <th className="p-3">Điểm TB</th>
                  <th className="p-3">Kết quả</th>
                </>
              ) : (
                <th className="p-3">Điểm</th>
              )}
              {project?.MaGVHuongDan == user?.Username && (
                <th className="p-3">Thao tác</th>
              )}
            </tr>
          </thead>
          <tbody>
            {!isLoading ? (
              scores && scores.length > 0 ? (
                scores.map((row, index) => (
                  <tr
                    key={index}
                    className="border-b hover:bg-purple-50 transition text-center"
                  >
                    <td className="p-3 font-medium text-gray-700">
                      {row.MaSV}
                    </td>
                    <td className="p-3">{row.TenSV}</td>
                    {user?.Role == "Admin" || user?.Role == "SinhVien" ? (
                      <>
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
                        <td className="p-3">{formatResults(row.KetQua)}</td>
                      </>
                    ) : (
                      <td className="p-3">
                        {formatScore(getScore(row, user))}
                      </td>
                    )}
                    {project?.MaGVHuongDan == user?.Username && (
                      <td className="p-3">
                        <div className="flex gap-2 justify-center">
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
