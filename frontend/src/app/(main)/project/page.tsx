"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { IPagination, Pagination } from "@/components/ui/Pagination";
import SelectBox, { Option } from "@/components/ui/SelectBox";
import DeleteModal from "@/components/ui/DeleteModal";
import { IProject } from "@/components/project/ProjectList";
import ProjectForm, { IInputProject } from "@/components/project/ProjectForm";
import SearchBox from "@/components/ui/SearchBox";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/utils/formatDate";
import { ROLES, useUser } from "@/context/UserContext";
import { ITeacher } from "@/components/teacher/TeacherList";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { IFaculty } from "@/components/faculty/FacultyList";
import { Span } from "next/dist/trace";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function Page() {
  const { user } = useUser();
  const [records, setRecords] = useState<IProject[]>([]);
  const [pagination, setPagination] = useState<IPagination>({
    TotalRecords: 0,
    TotalPages: 0,
    PageSize: 10,
    CurrentPage: 1,
  });
  const initProject: IInputProject = {
    TenDT: "",
    MaKhoa: null,
    MaGVHuongDan: "",
    MaNamHoc: "",
    ThoiGianKetThuc: new Date().toISOString().split("T")[0],
    ThoiGianBatDau: new Date().toISOString().split("T")[0],
  };
  const [listYear, setListYear] = useState<Option[]>([]);
  const [listFaculty, setListFaculty] = useState<IFaculty[]>([]);
  const [listTeacher, setListTeacher] = useState<ITeacher[]>([]);
  const [input, setInput] = useState<IInputProject>(initProject);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [param, setParam] = useState<{
    search: string | null;
    limit: number;
    skip: number;
    sortOrder: string;
    sortBy: string;
    year: string | null;
  }>({
    search: null,
    limit: 10,
    skip: 0,
    sortBy: "TenDT",
    sortOrder: "DESC",
    year: null,
  });
  const sortOptions = [
    { label: "TenDT giảm dần", value: 1 },
    { label: "TenDT tăng dần", value: 2 },
    { label: "Mới nhất", value: 3 }, // sắp xếp theo CreatedAt DESC
    { label: "Lâu nhất", value: 4 },
  ];
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isOpenDel, setIsOpenDel] = useState<boolean>(false);

  const loadData = async () => {
    try {
      if (user) {
        const [yearsRes, teachersRes, facultyRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/years`, {
            params: { Role: user.MaKhoa },
          }),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/teachers`, {
            params: { limit: 100, MaKhoa: user.MaKhoa, Role: user.MaKhoa },
          }),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/faculties`, {
            params: { Role: user.MaKhoa },
          }),
        ]);
        setListYear(
          yearsRes.data.map((item: any) => ({
            label: item.MaNamHoc,
            value: item.MaNamHoc,
          }))
        );
        setListTeacher(teachersRes.data.data);
        setInput({
          TenDT: "",
          MaKhoa: user.MaKhoa,
          MaGVHuongDan: user.Username,
          MaNamHoc: "",
          ThoiGianKetThuc: new Date().toISOString().split("T")[0],
          ThoiGianBatDau: new Date().toISOString().split("T")[0],
        });
        setListFaculty(facultyRes.data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadData();
  }, [user?.MaKhoa]);
  // 🚀 Fetch API dựa trên URL query
  const fetchData = async () => {
    const skip = parseInt(searchParams.get("skip") || "0");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || null;
    const sortBy = searchParams.get("sortBy") || "TenDT";
    const sortOrder = searchParams.get("sortOrder") || "DESC";
    const year = searchParams.get("year") || null;

    setParam({ skip, limit, search, sortBy, sortOrder, year });
    setLoadingData(true);
    try {
      if (user) {
        const response = await axios.get("http://localhost:4000/projects", {
          params: {
            skip,
            limit,
            search,
            sortBy,
            sortOrder,
            MaKhoa: user.MaKhoa,
            MaGVHuongDan: user.Username,
            User: user.Username,
            Role: user.MaKhoa,
            year,
          },
        });
        setRecords(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      alert("⚠️ Lỗi khi lấy dữ liệu đồ án");
    } finally {
      setLoadingData(false);
    }
  };
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setInput((prev) => ({ ...prev, [name]: value }));
  };
  const handleChangeSelect = (name: string, opt: Option) => {
    const value = opt.value;
    setInput((prev) => ({ ...prev, [name]: value }));
  };
  // 🔄 Fetch mỗi khi URL thay đổi
  useEffect(() => {
    fetchData();
  }, [searchParams, user?.Role, user?.Username]);

  // 🔍 Search khi nhấn Enter
  const handleSearch = (query: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (query) newParams.set("search", query);
    else newParams.delete("search");
    newParams.set("skip", "0"); // reset về trang đầu
    router.push(`?${newParams.toString()}`);
  };

  const handleSelect = (name: string, value: any) => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (value !== null) {
      newParams.set(name, value.toString());
    } else {
      newParams.delete(name);
    }
    newParams.set("skip", "0"); // reset về trang đầu
    router.push(`?${newParams.toString()}`);
  };
  // 📄 Phân trang
  const handlePageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams.toString());
    const limit = parseInt(searchParams.get("limit") || "10");
    newParams.set("limit", limit.toString());
    newParams.set("skip", ((page - 1) * limit).toString());
    router.push(`?${newParams.toString()}`);
  };
  const handleOpenDelete = (input: IInputProject) => {
    setIsOpenDel(true);
    setInput(input);
  };
  const handleCloseDelete = () => {
    setIsOpenDel(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };
  const handleOpen = (input: IInputProject) => {
    if (user) {
      setIsOpen(true);
      if (input.MaDT != null) {
        setInput(input);
      } else {
        setInput({
          TenDT: "",
          MaKhoa: user.MaKhoa,
          MaGVHuongDan: user.Username,
          MaNamHoc: "",
          ThoiGianKetThuc: new Date().toISOString().split("T")[0],
          ThoiGianBatDau: new Date().toISOString().split("T")[0],
        });
      }
    }
  };
  const handleConfirm = async () => {
    await axios
      .delete(`http://localhost:4000/projects/${input.MaDT}`, {
        params: { MaKhoa: user?.MaKhoa, MaGV: user?.Username },
      })
      .then((res) => {
        alert("✅ Xóa thành công!");
        handleCloseDelete();
        fetchData();
      })
      .catch((err) => {
        console.log(err);
        alert(err.response.data.error);
      });
  };
  const handleSelectSort = (otp: Option) => {
    const newParams = new URLSearchParams(searchParams.toString());
    const value = otp.value;
    switch (value) {
      case 1:
        newParams.set("sortOrder", "DESC");
        newParams.set("sortBy", "TenDT");
        break;
      case 2:
        newParams.set("sortOrder", "ASC");
        newParams.set("sortBy", "TenDT");
        break;
      case 3:
        newParams.set("sortOrder", "DESC");
        newParams.set("sortBy", "UpdatedAt");
        break;
      case 4:
        newParams.set("sortOrder", "ASC");
        newParams.set("sortBy", "UpdatedAt");
        break;
    }
    newParams.set("skip", "0"); // reset về trang đầu
    router.push(`?${newParams.toString()}`);
  };
  const handleCreate = async () => {
    await axios
      .post("http://localhost:4000/projects", input)
      .then(() => {
        alert("✅ Thêm thành công!");
        handleClose();
        fetchData();
      })
      .catch((err) => {
        alert(err.response?.data?.error || "");
      });
  };
  const handleUpdate = async () => {
    await axios
      .put(`http://localhost:4000/projects/${input.MaDT}`, input)
      .then(() => {
        alert("✅ Cập nhập thành công thành công!");
        handleClose();
        fetchData();
      })
      .catch((err) => {
        alert(err.response?.data?.error || "");
      });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.MaDT == null) {
      await handleCreate();
    } else {
      await handleUpdate();
    }
  };
  const handleConvert = () => {
    const SortOrder = param.sortOrder;
    const sortBy = param.sortBy;
    if (sortBy == "TenDT" && SortOrder == "DESC") {
      return sortOptions.find((op) => op.value == 1) || null;
    } else if (sortBy == "TenDT" && SortOrder == "ASC") {
      return sortOptions.find((op) => op.value == 2) || null;
    } else if (sortBy == "UpdatedAt" && SortOrder == "DESC") {
      return sortOptions.find((op) => op.value == 3) || null;
    } else if (sortBy == "UpdatedAt" && SortOrder == "ASC") {
      return sortOptions.find((op) => op.value == 4) || null;
    } else {
      return null;
    }
  };
  const handleNavigate = (id: string, MaKhoa: number) => {
    router.push(`/project/${id}?MaKhoa=${MaKhoa}`);
  };

  if (!user && loading) return <LoadingSpinner />;
  return (
    <ProtectedRoute allowedRoles={[ROLES.GIAO_VIEN]}>
      <ProjectForm
        onSetInput={setInput}
        listFaculty={listFaculty}
        listTeacher={listTeacher}
        onChange={handleChange}
        onChangeSelect={handleChangeSelect}
        onSubmit={handleSubmit}
        isOpen={isOpen}
        input={input}
        handleClose={handleClose}
        listYear={listYear}
      />
      <DeleteModal
        onClose={handleCloseDelete}
        onConfirm={handleConfirm}
        open={isOpenDel}
        title="Xóa đề tài"
        description={`Bạn có muốn xóa đề tài này không ${input.MaDT}`}
      />

      <div className="px-6 py-6 bg-gradient-to-tr from-purple-50 to-white rounded-2xl shadow-lg border space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-purple-700 flex items-center gap-2">
              Danh sách đồ án của giáo viên quản lý
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Quản lý & theo dõi các đồ án
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center border-b pb-4">
          {/* Search box */}
          <div className="md:col-span-3">
            <SearchBox
              placeholder="🔎 Tìm theo mã hoặc tên đồ án..."
              valueSearch={param.search || ""}
              onSearch={(query) => handleSearch(query)}
            />
          </div>
          <div className="md:col-span-2">
            <SelectBox
              options={listYear}
              opt={listYear.find((op) => op.value == param.year) || null}
              onChange={(opt) => handleSelect("year", opt.value)}
              placeholder="Chọn khóa"
            />
          </div>
          {/* Sắp xếp */}
          <div className="md:col-span-3">
            <SelectBox
              opt={handleConvert()}
              options={sortOptions}
              onChange={(value) => handleSelectSort(value)}
              placeholder="↕️ Sắp xếp"
            />
          </div>

          {/* Actions */}
          <div className="md:col-span-1 justify-self-end">
            <Button onClick={() => handleOpen(initProject)}>➕ Tạo</Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-purple-100 text-left">
                <th className="p-3">Mã đồ án</th>
                <th className="p-3">Tên đề tài</th>
                <th className="p-3">Niên khóa</th>
                <th className="p-3">Giáo viên</th>
                <th className="p-3">Bắt đầu</th>
                <th className="p-3">Kết thúc</th>
                <th className="p-3">Số SV</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {!loadingData && records && records.length > 0 ? (
                records.map((row, index) => (
                  <tr
                    key={index}
                    className="border-b hover:bg-purple-50 transition"
                  >
                    <td className="p-3 font-medium text-gray-700">
                      {row.MaDT}
                    </td>
                    <td className="p-3">{row.TenDT}</td>
                    <td className="p-3">{row.MaNamHoc}</td>

                    <td className="p-3">{row.TenGVHuongDan}</td>
                    <td className="p-3">{formatDate(row.ThoiGianBatDau)}</td>
                    <td className="p-3">{formatDate(row.ThoiGianKetThuc)}</td>
                    <td className="p-3">{row.SoSV}</td>
                    <td className="p-3 text-center font-medium whitespace-nowrap">
                      {(() => {
                        if (row.TrangThaiChamDiem == "Đã chấm") {
                          return (
                            <span className="text-green-600 bg-green-100 px-2 py-1 rounded">
                              {row.TrangThaiChamDiem}
                            </span>
                          );
                        } else {
                          return (
                            <span className="text-red-700 bg-red-100 px-2 py-1 rounded">
                              {row.TrangThaiChamDiem}
                            </span>
                          );
                        }
                      })()}
                    </td>

                    <td className="p-3">
                      <div className="flex gap-2 justify-end">
                        {row.MaGVHuongDan == user?.Username && (
                          <Button
                            className="bg-yellow-300 hover:bg-yellow-400"
                            onClick={() =>
                              handleOpen({
                                MaDT: row.MaDT,
                                TenDT: row.TenDT,
                                MaNamHoc: row.MaNamHoc,
                                MaKhoa: row.MaKhoa,
                                MaGVHuongDan: row.MaGVHuongDan,
                                ThoiGianBatDau:
                                  row.ThoiGianBatDau.toString().split("T")[0],
                                ThoiGianKetThuc:
                                  row.ThoiGianKetThuc.toString().split("T")[0],
                              } as IInputProject)
                            }
                          >
                            ✏️ Edit
                          </Button>
                        )}
                        <Button
                          className="bg-blue-500 text-white hover:bg-blue-600"
                          onClick={() => handleNavigate(row.MaDT!, row.MaKhoa!)}
                        >
                          👁 Xem
                        </Button>
                        <Button
                          className="bg-red-500 text-white hover:bg-red-600"
                          onClick={() =>
                            handleOpenDelete({
                              MaDT: row.MaDT,
                            } as IInputProject)
                          }
                        >
                          🗑️ Xóa
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-gray-500">
                    📭 Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t text-sm text-gray-600">
          <span>{pagination?.TotalRecords || 0} bản ghi</span>
          <Pagination
            currentPage={pagination?.CurrentPage || 1}
            totalLength={pagination?.TotalRecords || 0}
            pageSize={pagination?.PageSize || 10}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
