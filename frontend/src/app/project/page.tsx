"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { IPagination } from "@/components/ui/Pagination";
import { Option } from "@/components/ui/SelectBox";
import DeleteModal from "@/components/ui/DeleteModal";
import { IProject, ProjectList } from "@/components/project/ProjectList";
import ProjectForm, {
  IInputProject,
  initProject,
} from "@/components/project/ProjectForm";

export default function Page() {
  const [records, setRecords] = useState<IProject[]>([]);
  const [pagination, setPagination] = useState<IPagination>({
    TotalRecords: 0,
    TotalPages: 0,
    PageSize: 10,
    CurrentPage: 1,
  });
  const [listYear, setListYear] = useState<Option[]>([]);
  const [facultyOptions, setFacultyOptions] = useState<Option[]>([]);
  const [input, setInput] = useState<IInputProject>(initProject);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [param, setParam] = useState<{
    search: string | null;
    limit: number;
    deCode: number | null;
    skip: number;
    sortOrder: string;
    sortBy: string;
    year: string | null;
  }>({
    search: null,
    limit: 10,
    deCode: null,
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
      const [yearsRes, facultiesRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/years`),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/faculties`),
      ]);
      setListYear(
        yearsRes.data.map((item: any) => ({
          label: item.MaNamHoc,
          value: item.MaNamHoc,
        }))
      );
      setFacultyOptions(
        facultiesRes.data.map((item: any) => ({
          label: item.TenKhoa,
          value: item.MaKhoa,
        }))
      );
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadData();
  }, []);
  // 🚀 Fetch API dựa trên URL query
  const fetchData = async () => {
    const skip = parseInt(searchParams.get("skip") || "0");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || null;
    const sortBy = searchParams.get("sortBy") || "TenDT";
    const sortOrder = searchParams.get("sortOrder") || "DESC";
    const deCode = searchParams.get("deCode")
      ? parseInt(searchParams.get("deCode")!)
      : null;
    const year = searchParams.get("year") || null;

    setParam({ skip, limit, search, deCode, sortBy, sortOrder, year });
    setLoadingData(true);
    try {
      if (deCode != null) {
        const response = await axios.get("http://localhost:4000/projects", {
          params: {
            skip,
            limit,
            search,
            sortBy,
            sortOrder,
            MaKhoa: deCode,
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
  }, [searchParams]);

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
    setIsOpen(true);
    if (input.MaDT != null) {
      setInput(input);
    } else {
      setInput(initProject);
    }
  };
  const handleConfirm = async () => {
    await axios
      .delete(`http://localhost:4000/projects/${input.MaDT}`)
      .then((res) => {
        alert("✅ Xóa thành công!");
        handleCloseDelete();
        fetchData();
      })
      .catch((err) => {
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
  return (
    <>
      {!loading && (
        <>
          <ProjectForm
            onSetInput={setInput}
            onChange={handleChange}
            onChangeSelect={handleChangeSelect}
            onSubmit={handleSubmit}
            isOpen={isOpen}
            facultyOptions={facultyOptions}
            input={input}
            handleClose={handleClose}
          />
          <DeleteModal
            onClose={handleCloseDelete}
            onConfirm={handleConfirm}
            open={isOpenDel}
            title="Xóa đề tài"
            description={`Bạn có muốn xóa đề tài này không ${input.MaDT}`}
          />

          <ProjectList
            listYear={listYear}
            sortOptions={sortOptions}
            onSelectSort={handleSelectSort}
            handleOpen={handleOpen}
            params={param}
            onSelectFaculty={handleSelect}
            facultyOptions={facultyOptions}
            data={records}
            isLoading={loadingData}
            pagination={pagination}
            onSearch={handleSearch}
            onPageChange={handlePageChange}
            handleOpenDelete={handleOpenDelete}
          />
        </>
      )}
    </>
  );
}
