import axios from "axios";
import { useEffect, useState } from "react";
import { IStudent } from "../student/StudentList";
import { Button } from "../ui/Button";
import AddStudentModal from "./AddStudentForm";
import DeleteModal from "../ui/DeleteModal";
interface Prop {
  MaDA: string;
}
export function TableStudent({ MaDA }: Prop) {
  const [students, setStudents] = useState<IStudent[]>([]);
  const [student, setStudent] = useState<IStudent>();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isOpenDel, setIsOpenDel] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`http://localhost:4000/projects/students`, {
        params: { MaDoAn: MaDA },
      });
      setStudents(res.data);
    } catch (error) {
      console.error("Fetch score error:", error);
    } finally {
      setIsLoading(false);
    }
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
        params: { MaSV: student?.MaSV },
      })
      .then((res) => {
        alert("Xóa sinh viên thành công");
        fetchStudents();
        handleCloseDel();
      })
      .catch((err) => {
        alert(err.response.data.error);
      });
  };
  useEffect(() => {
    fetchStudents();
  }, []);
  return (
    <>
      <DeleteModal
        open={isOpenDel}
        onClose={() => setIsOpenDel(false)}
        onConfirm={handleDelete}
      />
      <AddStudentModal
        onClose={() => setIsOpen(false)}
        isOpen={isOpen}
        MaDA={MaDA}
        onLoad={fetchStudents}
      />
      <div className="bg-white shadow rounded-lg p-6 border">
        <h3 className="text-lg font-semibold mb-4">Danh sách sinh viên</h3>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center border-b pb-4">
          <div className="md:col-span-12 justify-self-end">
            <Button onClick={() => setIsOpen(true)}>➕ Tạo</Button>
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
                <th className="p-3">Địa chỉ</th>
                <th className="p-3">Số điện thoại</th>
                <th className="p-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {!isLoading && students && students.length > 0 ? (
                students.map((row, index) => (
                  <tr
                    key={index}
                    className="border-b hover:bg-purple-50 transition"
                  >
                    <td className="p-3 font-medium text-gray-700">
                      {row.MaSV}
                    </td>
                    <td className="p-3">{row.TenSV}</td>
                    <td className="p-3">{row.DiaChi}</td>
                    <td className="p-3">{row.SoDienThoai}</td>
                    <td className="p-3">
                      <Button
                        onClick={() =>
                          handleOpenDel({
                            TenSV: row.TenSV,
                            MaSV: row.MaSV,
                          } as any)
                        }
                        className="bg-red-500 text-white hover:bg-red-600"
                      >
                        🗑️ Xóa
                      </Button>
                    </td>
                    {/* {/* <td className="p-3">
                      {" "}
                      {row.DiemGVChuTich == null ? 0 : row.DiemGVChuTich}
                    </td>
                    <td className="p-3">
                      {row.DiemGVHuongDan == null ? 0 : row.DiemGVHuongDan}
                    </td>
                    <td className="p-3 text-center">
                      {row.DiemGVPhanBien == null ? 0 : row.DiemGVPhanBien}
                    </td>
                    <td className="p-3 text-center">
                      {row.DiemTrungBinh == null
                        ? 0
                        : row.DiemTrungBinh.toFixed(1)}
                    </td>
                    <td className="p-3 text-center">{row.KetQua}</td>
                    <td className="p-3">
                      <div className="flex gap-2 justify-center">
                        <Button
                          className="bg-blue-500 text-white hover:bg-blue-600"
                          onClick={() => {
                            setIsOpen(true);
                            setScoreDel({
                              TenSV: row.TenSV,
                              MaSV: row.MaSV,
                              MaDoAn: MaDA,
                              DiemGVChuTich: row.DiemGVChuTich,
                              DiemGVHuongDan: row.DiemGVHuongDan,
                              DiemGVPhanBien: row.DiemGVPhanBien,
                            } as IScoreForm);
                          }}
                        >
                          👁 Chấm
                        </Button>
                        
                      </div> 
                    </td> */}
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
