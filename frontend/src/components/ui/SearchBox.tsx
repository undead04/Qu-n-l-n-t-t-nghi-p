"use client";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";

interface SearchBoxProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  valueSearch: string;
}

export default function SearchBox({
  placeholder = "Tìm kiếm...",
  onSearch,
  valueSearch,
}: SearchBoxProps) {
  const [value, setValue] = useState(valueSearch);
  return (
    <div className="flex items-center border rounded-xl px-3 py-2 shadow-sm bg-white focus-within:ring-2 focus-within:ring-blue-400">
      <Search className="text-gray-400 w-5 h-5 mr-2" />
      <input
        type="text"
        onChange={(e) => setValue(e.currentTarget.value)}
        value={value}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSearch(value);
            e.preventDefault(); // Ngăn chặn hành vi mặc định của Enter (nếu có)
          }
        }}
        placeholder={placeholder}
        className="w-full outline-none bg-transparent text-gray-700"
      />
    </div>
  );
}
