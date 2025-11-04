"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { IPagination } from "@/components/ui/Pagination";
import { FacultyList, IFaculty } from "@/components/faculty/FacultyList";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ROLES } from "@/context/UserContext";

export default function Page() {
  const [records, setRecords] = useState<IFaculty[]>([]);
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
    skip: number;
  }>({
    search: null,
    limit: 10,
    skip: 0,
  });
  // 🚀 Fetch API dựa trên URL query
  const fetchData = async () => {
    const search = searchParams.get("search") || null;
    const skip = parseInt(searchParams.get("skip") || "0");
    const limit = parseInt(searchParams.get("limit") || "10");
    setParam({ search, skip, limit });
    setLoadingData(true);
    try {
      const res = await axios.get("http://localhost:4000/faculties", {
        params: {
          search,
          limit,
          skip,
        },
      });
      setRecords(res.data);
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

  // 📄 Phân trang
  const handlePageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams.toString());
    const limit = parseInt(searchParams.get("limit") || "10");
    newParams.set("limit", limit.toString());
    newParams.set("skip", ((page - 1) * limit).toString());
    router.push(`?${newParams.toString()}`);
  };

  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
      {!loading ? (
        <FacultyList
          isLoadingData={loadingData}
          params={param}
          data={records}
          onSearch={handleSearch}
          onPageChange={handlePageChange}
        />
      ) : (
        <LoadingSpinner />
      )}
    </ProtectedRoute>
  );
}
