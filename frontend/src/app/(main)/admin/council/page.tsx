"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { IPagination } from "@/components/ui/Pagination";
import { CouncilList, ICouncil } from "@/components/council/CouncilList";
import {
  AddCouncilForm,
  IInputCouncil,
  initCouncil,
} from "@/components/council/CouncilForm";
import { Option } from "@/components/ui/SelectBox";
import DeleteModal from "@/components/ui/DeleteModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
export default function Page() {
  const [records, setRecords] = useState<ICouncil[]>([]);
  const [pagination, setPagination] = useState<IPagination>({
    TotalRecords: 0,
    TotalPages: 0,
    PageSize: 10,
    CurrentPage: 1,
  });
  const [input, setInput] = useState<IInputCouncil>(initCouncil);
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
    sortBy: "MaHD",
    sortOrder: "DESC",
    year: null,
  });
  const [listYear, setListYear] = useState<Option[]>([]);
  const [facultyOptions, setFacultyOptions] = useState<Option[]>([]);
  const sortOptions = [
    { label: "MaHD giảm dần", value: 1 },
    { label: "MaHD tăng dần", value: 2 },
    { label: "Mới nhất", value: 3 }, // sắp xếp theo CreatedAt DESC
    { label: "Lâu nhất", value: 4 },
  ];
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isOpenDel, setIsOpenDel] = useState<boolean>(false);
  // 🚀 Fetch API dựa trên URL query
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
  const fetchData = async () => {
    const skip = parseInt(searchParams.get("skip") || "0");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || null;
    const sortBy = searchParams.get("sortBy") || "MaHD";
    const sortOrder = searchParams.get("sortOrder") || "DESC";
    const deCode = searchParams.get("deCode")
      ? parseInt(searchParams.get("deCode")!)
      : null;
    const year = searchParams.get("year") || null;
    setParam({ skip, limit, search, deCode, sortBy, sortOrder, year });
    setLoadingData(true);
    try {
      if (deCode != null) {
        const res = await axios.get("http://localhost:4000/councils", {
          params: {
            search,
            limit,
            skip,
            sortBy,
            sortOrder,
            MaKhoa: deCode,
            year,
          },
        });
        setRecords(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      alert("⚠️ Lỗi khi lấy dữ liệu hội đồng");
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
  const handleOpenDelete = (input: IInputCouncil) => {
    setIsOpenDel(true);
    setInput(input);
  };
  const handleCloseDelete = () => {
    setIsOpenDel(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };
  const handleOpen = (input: IInputCouncil) => {
    setIsOpen(true);
    if (input.MaHD != null) {
      setInput(input);
    } else {
      setInput(initCouncil);
    }
  };
  const handleConfirm = async () => {
    console.log(input);
    await axios
      .delete(`http://localhost:4000/councils/${input.MaHD}`, {
        params: { MaKhoa: input.MaKhoa },
      })
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
        newParams.set("sortBy", "MaHD");
        break;
      case 2:
        newParams.set("sortOrder", "ASC");
        newParams.set("sortBy", "MaHD");
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
      .post("http://localhost:4000/councils", input)
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
      .put(`http://localhost:4000/councils/${input.MaHD}`, input)
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
    if (input.MaHD == null) {
      await handleCreate();
    } else {
      await handleUpdate();
    }
  };
  if (loading) return <LoadingSpinner />;
  return (
    <>
      <AddCouncilForm
        listYear={listYear}
        onSetInput={setInput}
        onSubmit={handleSubmit}
        input={input}
        handleClose={handleClose}
        onChange={handleChange}
        onChangeSelect={handleChangeSelect}
        facultyOptions={facultyOptions}
        isOpen={isOpen}
      />
      <DeleteModal
        onClose={handleCloseDelete}
        onConfirm={handleConfirm}
        open={isOpenDel}
        title="Xóa hội đồng"
        description={`Bạn có muốn xóa hội đồng này không ${input.MaHD}`}
      />

      <CouncilList
        disable={true}
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
  );
}
