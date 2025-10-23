// lib/utils.ts
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export function getScore(row: any, user: any): number {
  const roles = [
    { maGV: row.MaGVChuTich, diem: row.DiemGVChuTich },
    { maGV: row.MaGVHuongDan, diem: row.DiemGVHuongDan },
    { maGV: row.MaGVPhanBien, diem: row.DiemGVPhanBien },
  ];

  const diem = roles.find((r) => r.maGV === user?.Username)?.diem ?? 0;
  return diem;
}
