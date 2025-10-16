"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export interface Option {
  value: number | string | null;
  label: string;
}

interface SelectBoxProps {
  options: Option[];
  onChange: (opt: Option) => void;
  placeholder?: string;
  opt: Option | null;
  isDisabled?: boolean;
  isLoading?: boolean;
}

export default function SelectBox({
  options,
  onChange,
  placeholder = "Chọn...",
  opt,
  isDisabled,
  isLoading,
}: SelectBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // ✅ đóng khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (opt: Option) => {
    onChange(opt);
    setIsOpen(false);
  };

  return (
    <div ref={boxRef} className="relative col-span-1">
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
        className={`flex justify-between items-center w-full border rounded-xl px-3 py-2 shadow-sm 
      ${
        isDisabled
          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
          : "bg-white hover:border-blue-400 focus:ring-2 focus:ring-blue-400"
      }`}
      >
        <span className={isDisabled ? "text-gray-400" : "text-gray-700"}>
          {opt ? opt.label : placeholder}
        </span>
        <ChevronDown
          className={`w-5 h-5 ${
            isDisabled ? "text-gray-300" : "text-gray-400"
          }`}
        />
      </button>

      {!isLoading && !isDisabled && isOpen && (
        <div className="absolute mt-2 w-full bg-white border rounded-xl shadow-lg z-50 max-h-64 overflow-hidden">
          <ul className="max-h-40 overflow-auto">
            {options.map((o) => (
              <li
                key={o.value}
                onClick={() => handleSelect(o)}
                className={`px-4 py-2 cursor-pointer hover:bg-blue-100 ${
                  opt?.value === o.value
                    ? "bg-blue-50 font-semibold text-blue-700"
                    : ""
                }`}
              >
                {o.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
