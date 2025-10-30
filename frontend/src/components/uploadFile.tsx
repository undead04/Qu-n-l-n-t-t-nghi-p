"use client";

import { useEffect, useState } from "react";
import {
  Upload,
  FileText,
  Trash2,
  Download,
  Edit,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button"; // dùng button tự chế của bạn
import axios from "axios";
import LoadingSpinner from "./ui/LoadingSpinner";
import { formatDate } from "@/utils/formatDate";
import { IProject } from "./project/ProjectList";
import { useUser } from "@/context/UserContext";

interface UploadedFile {
  files: string;
  MaTL: string;
  MaDT: string;
  TenTL: string;
  UpdatedAt: Date;
  Url: string;
}
interface Prop {
  MaDT: string;
  MaKhoa: string;
  project: IProject | null;
}
export default function ProjectSubmission({ MaDT, MaKhoa, project }: Prop) {
  const [uploadFiles, setUpLoadFiles] = useState<File[]>([]);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const { user } = useUser();
  const [diffDays, setDiffDays] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setUpLoadFiles((prev) => [...prev, ...selectedFiles]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    setUpLoadFiles((prev) => [...prev, ...dropped]);
  };

  const handleDelete = (name: string) => {
    setUpLoadFiles((prev) => prev.filter((f) => f.name !== name));
  };
  const fetchFiles = async () => {
    try {
      if (user) {
        const [filesRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/files`, {
            params: { MaDT, MaKhoa, Role: user.MaKhoa },
          }),
        ]);
        setFiles(filesRes.data);
      }
    } catch (error) {
      console.error("Fetch data error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      if (user) {
        const [filesRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/files`, {
            params: { MaDT, MaKhoa, Role: user.MaKhoa },
          }),
        ]);
        setFiles(filesRes.data);
      }

      // So sánh chỉ theo ngày
      const end = normalizeDate(
        new Date(project?.ThoiGianKetThuc || new Date())
      );
      const now = normalizeDate(new Date());

      const diffMs = end.getTime() - now.getTime();

      setDiffDays(diffMs);
    } catch (error) {
      console.error("Fetch data error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);
  const normalizeDate = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const handleSave = async () => {
    try {
      if (!MaDT || !MaKhoa || !user)
        return alert("Thiếu thông tin MaDT hoặc MaKhoa!");
      if (uploadFiles.length === 0) return alert("Chưa chọn file nào!");
      if (diffDays < 0) {
        alert("Đã quá hạn không thể nộp file");
        return;
      }
      const formData = new FormData();
      formData.append("MaDT", MaDT);
      formData.append("MaKhoa", MaKhoa);
      uploadFiles.forEach((file) => formData.append("files", file));

      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/files`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      alert("Nộp file thành công");
      await fetchFiles();
      setIsOpen(false);
    } catch (error: any) {
      console.log(error);
      alert(error.response.data.error);
    }
  };
  const handleDeleteFile = async () => {
    try {
      if (files.length == 0) {
        alert("Không có tài liệu để xóa");
        return;
      }

      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/files`, {
        params: { MaDT, MaKhoa, urls: files.map((item) => item.Url).join(",") },
      });
      alert("Xóa tài liệu thành công");
      await fetchFiles();
    } catch (error: any) {
      console.log(error);
      alert(error.response.data.error);
    }
  };
  async function urlToFile(url: string, filename: string, mimeType?: string) {
    const res = await axios.get(url, { responseType: "blob" });
    return new File([res.data], filename, { type: mimeType || res.data.type });
  }
  if (isLoading) return <LoadingSpinner />;
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="shadow-md border rounded-2xl bg-white">
        {/* --- Header --- */}
        <div className="border-b p-5">
          <h2 className="text-xl font-semibold">Bài nộp đồ án</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* --- Bảng thông tin --- */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left border-collapse">
              <tbody>
                <tr className="border-b bg-gray-50">
                  <td className="p-3 font-medium w-1/3">Trạng thái bài nộp</td>
                  {files.length > 0 ? (
                    <td className="p-3 text-green-600 font-semibold">Đã nộp</td>
                  ) : (
                    <td className="p-3 text-red-600 font-semibold">Chưa nộp</td>
                  )}
                </tr>
                <tr className="border-b">
                  <td className="p-3 font-medium">Thời gian còn lại</td>
                  <td className="p-3 text-blue-600">
                    {diffDays >= 0 ? "Còn hạn" : "Đã hết hạn"}
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium">Tập tin đã nộp</td>
                  <td className="p-3">
                    {files.length === 0 ? (
                      <p className="text-gray-500 italic">
                        Chưa có tập tin nào được nộp
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {files.map((file) => (
                          <li
                            key={file.TenTL}
                            className="flex items-center justify-between bg-gray-50 border rounded-md px-3 py-2 hover:bg-gray-100"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-500" />
                              <span className="text-sm">{file.TenTL}</span>
                              <span className="text-xs text-gray-400 ml-2">
                                ({formatDate(file.UpdatedAt)})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <a
                                href={file.files} // ← Đường dẫn file PDF, PNG, v.v.
                                download // ← Cho phép tải về (nếu cùng domain hoặc có header hợp lệ)
                                target="_blank" // ← Mở tab mới (tuỳ chọn)
                                rel="noopener noreferrer" // ← Bảo mật
                                className="p-2 hover:bg-gray-200 rounded-full inline-flex cursor-pointer"
                              >
                                <Download className="w-4 h-4 text-gray-600" />
                              </a>

                              <button
                                onClick={() => handleDelete(file.TenTL)}
                                className="p-2 hover:bg-gray-200 rounded-full"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {isOpen && user?.Role == "SinhVien" && (
            <div
              onClick={() => document.getElementById("fileUpload")?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-4 cursor-pointer transition flex flex-wrap gap-4 min-h-[100px] ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
              }`}
            >
              {uploadFiles.length === 0 && (
                <>
                  <Upload className="mx-auto mb-3 w-8 h-8 text-gray-500" />
                  <p className="w-full text-center text-gray-500">
                    Kéo thả tập tin vào đây hoặc nhấn vào khu vực để chọn
                  </p>
                </>
              )}

              {uploadFiles.map((file) => (
                <div
                  key={file.name}
                  className="w-24 h-24 flex flex-col items-center justify-center border rounded-lg p-2 bg-gray-50 hover:bg-gray-100 relative"
                >
                  <FileText className="w-8 h-8 text-blue-500 mb-1" />
                  <span className="text-xs text-center truncate w-full">
                    {file.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(file.name);
                    }}
                    className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-200 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </button>
                </div>
              ))}

              <input
                id="fileUpload"
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {/* --- Nút hành động --- */}
          {user?.Role == "SinhVien" && (
            <div className="flex flex-wrap justify-end gap-3 pt-4 border-t">
              <Button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 border border-gray-300 bg-yellow-300 hover:bg-yellow-400"
              >
                <Edit className="w-4 h-4" /> {isOpen ? "Huỷ" : "Sửa bài làm"}
              </Button>
              {!isOpen && (
                <Button
                  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white"
                  onClick={handleDeleteFile}
                >
                  <XCircle className="w-4 h-4" /> Loại bỏ bài nộp
                </Button>
              )}
              <Button
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleSave}
              >
                <Upload className="w-4 h-4" /> Nộp bài
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
