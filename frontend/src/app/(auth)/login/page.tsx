"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/dist/client/components/navigation";
import axios from "axios";
import { Button } from "@/components/ui/Button";
export interface User {
  Username: string;
  Role: "Admin" | "SinhVien" | "GiaoVien";
  Code: string;
  TenNguoiDung: string;
  MaKhoa: number;
}

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  // 🔹 Khi load trang, kiểm tra localStorage có user cũ không
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    console.log("Stored User:", storedUser);
    if (storedUser !== null && storedUser !== undefined) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // 🔹 Xử lý đăng nhập
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await axios.post("http://localhost:4000/login", {
        username,
        password,
      });

      const data = await res.data[0];

      if (res.status === 200) {
        setMessage("✅ Đăng nhập thành công!");
        setUser(data);
        // 👉 Lưu thông tin user vào localStorage
        localStorage.setItem("user", JSON.stringify(data));

        if (data.Role === "Admin") router.push("/admin/student");
        else if (data.Role === "GiaoVien") router.push("/project");
        else if (data.Role === "SinhVien") router.push("/student/project");
        else router.push("/");
      } else {
        setMessage(data.message || "Sai tài khoản hoặc mật khẩu");
      }
    } catch (error) {
      console.error(error);
      setMessage("❌ Lỗi kết nối server");
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-md w-96">
      <h2 className="text-2xl font-semibold mb-6 text-center">
        {user ? "Thông tin người dùng" : "Đăng nhập hệ thống"}
      </h2>

      {/* Nếu chưa login thì hiện form */}
      <form className="space-y-4">
        <div>
          <Label htmlFor="username">Tên đăng nhập</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Nhập mã SV hoặc GV"
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Mật khẩu</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Nhập mật khẩu"
            required
          />
        </div>
        <Button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Đăng nhập
        </Button>
      </form>

      {message && (
        <p
          className={`text-center mt-4 ${
            message.startsWith("✅") ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
