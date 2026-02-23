"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * E-posta şifre sıfırlama linki bazen ana sayfaya (#...type=recovery) düşer.
 * Bu bileşen ana sayfada veya başka sayfada hash'te type=recovery varsa
 * /auth/callback'e (hash ile) yönlendirir.
 */
export function RecoveryRedirect() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/auth/callback") return;
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (hash && hash.includes("type=recovery")) {
      window.location.replace(`/auth/callback${hash}`);
    }
  }, [pathname]);

  return null;
}
