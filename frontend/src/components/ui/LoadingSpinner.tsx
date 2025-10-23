import React from "react";

const LoadingSpinner: React.FC<{ size?: number; message?: string }> = ({
  size = 40,
  message = "Đang tải...",
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px]">
      <div
        className="animate-spin rounded-full border-4 border-t-4 border-gray-200 border-t-blue-500"
        style={{ width: size, height: size }}
      ></div>
      <p className="mt-3 text-gray-600">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
