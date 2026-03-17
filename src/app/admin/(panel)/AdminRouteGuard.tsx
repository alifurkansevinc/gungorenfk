"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { canAccessPath } from "@/lib/admin-roles";
import type { AdminRole } from "@/lib/admin-roles";

export function AdminRouteGuard({
  role,
  children,
}: { role: AdminRole; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!pathname?.startsWith("/admin")) return;
    if (canAccessPath(role, pathname)) return;
    router.replace("/admin");
  }, [role, pathname, router]);

  return <>{children}</>;
}
