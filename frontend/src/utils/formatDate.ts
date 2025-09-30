export const formatDate = (date: Date) => {
  const dateStr = date;
  const formatted = new Date(dateStr).toLocaleDateString("vi-VN");
  return formatted;
};
export const convertDateVN = (date: Date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // tháng bắt đầu từ 0
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};
