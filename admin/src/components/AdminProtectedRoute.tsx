// components/AdminProtectedRoute.tsx
"use client";

import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const AdminProtectedRoute = ({
  children,
  redirectTo = "/login",
}: AdminProtectedRouteProps) => {
  const { user, adminUser, loading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !adminUser)) {
      router.push(redirectTo);
    }
  }, [user, adminUser, loading, router, redirectTo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user || !adminUser) {
    return null;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
