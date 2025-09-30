"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { IStudent, StudentList } from "@/components/student/StudentList";
import { IPagination } from "@/components/ui/Pagination";

export default function Page() {
  const [records, setRecords] = useState<IStudent[]>([]);
  const [pagination, setPagination] = useState<IPagination>({
    TotalRecords: 0,
    TotalPages: 0,
    PageSize: 10,
    CurrentPage: 1,
  });
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
  }>({
    search: null,
    limit: 10,
    deCode: null,
    skip: 0,
    sortOrder: "DESC",
    sortBy: "TenSV",
  });
  const dataOptions = [
    { label: "Sắp xếp tăng dần theo tên", value: 1 },
    { label: "Sắp xếp giảm dần theo tên", value: 2 },
  ];
  const facultyOptions = [
    { label: "Công nghệ thông tin", value: 1 },
    { label: "Cơ khí", value: 2 },
  ];
  // 🚀 Fetch API dựa trên URL query
  const fetchData = async () => {
    const search = searchParams.get("search") || null;
    const skip = parseInt(searchParams.get("skip") || "0");
    const limit = parseInt(searchParams.get("limit") || "10");
    const deCode = searchParams.get("deCode")
      ? parseInt(searchParams.get("deCode")!)
      : null;
    const sortBy = searchParams.get("sortBy") || "TenSV";
    const sortOrder = searchParams.get("sortOrder") || "ASC";
    setParam({ search, skip, limit, deCode, sortBy, sortOrder });
    setLoadingData(true);
    try {
      const res = await axios.get("http://localhost:4000/students", {
        params: {
          search,
          limit,
          skip,
          deCode,
          sortBy: sortBy,
          sortOrder: sortOrder,
        },
      });
      setRecords(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      alert("⚠️ Lỗi khi lấy dữ liệu report");
    } finally {
      setLoading(false);
      setLoadingData(false);
    }
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

  // ⬇️ Sort
  const handleSelectName = (value: number) => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (value === 1) {
      newParams.set("sortBy", "TenSV");
      newParams.set("sortOrder", "ASC");
    } else if (value === 2) {
      newParams.set("sortBy", "TenSV");
      newParams.set("sortOrder", "DESC");
    }
    newParams.set("skip", "0");
    newParams.set("limit", "10");
    router.push(`?${newParams.toString()}`);
  };

  const handleSelectDePartment = (value: number) => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (value == 0) {
      newParams.delete("deCode");
    } else {
      newParams.set("deCode", value.toString());
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

  return (
    <>
      {!loading && (
        <StudentList
          isLoadingData={loadingData}
          params={param}
          onSelectFaculty={handleSelectDePartment}
          facultyOptions={facultyOptions}
          data={records}
          pagination={pagination}
          onSearch={handleSearch}
          sortOptions={dataOptions}
          onSelectSort={handleSelectName}
          onPageChange={handlePageChange}
          handleView={() => {}}
        />
      )}
    </>
  );
}
