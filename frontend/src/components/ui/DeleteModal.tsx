import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "./Button";

interface DeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export default function DeleteModal({
  open,
  onClose,
  onConfirm,
  title = "Xác nhận xoá",
  description = "Bạn có chắc chắn muốn xoá mục này? Hành động này không thể hoàn tác.",
}: DeleteModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-6">
        <div className="flex items-center gap-2 text-red-600 text-lg font-semibold">
          <Trash2 className="w-5 h-5" />
          {title}
        </div>

        <p className="text-gray-600 text-sm mt-2">{description}</p>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-100"
          >
            Huỷ
          </Button>
          <Button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            Xoá
          </Button>
        </div>
      </div>
    </div>
  );
}
