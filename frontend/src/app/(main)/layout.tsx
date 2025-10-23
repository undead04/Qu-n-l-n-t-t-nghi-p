"use client";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import TopNavBar from "@/components/ui/TopNavBar";
import { UserProvider } from "@/context/UserContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 min-h-screen`}
      >
        <UserProvider>
          {/* Thanh sidebar ngang */}
          <TopNavBar />
          {/* Nội dung chính */}
          <main className="mx-auto max-w-7xl px-6 py-6">{children}</main>
        </UserProvider>
      </body>
    </html>
  );
}
