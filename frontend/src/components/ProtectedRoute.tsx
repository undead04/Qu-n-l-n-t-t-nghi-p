"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ProtectedRouteProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export default function ProtectedRoute({
  allowedRoles,
  children,
}: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.push("/login");
      return;
    }

    const parsed = JSON.parse(user);

    // Nếu không có quyền → redirect
    if (!allowedRoles.includes(parsed.Role)) {
      router.back();
      return;
    }

    setIsAuthorized(true);
  }, [allowedRoles, router]);

  if (!isAuthorized) return null;

  return <>{children}</>;
}
