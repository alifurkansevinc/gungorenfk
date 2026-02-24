"use client";

import { useState, useEffect } from "react";

export function AdminToast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent<{ message?: string }>).detail;
      setMessage(detail?.message ?? "Kaydedildi.");
    };
    window.addEventListener("admin-toast", onToast);
    return () => window.removeEventListener("admin-toast", onToast);
  }, []);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 3500);
    return () => clearTimeout(t);
  }, [message]);

  if (!message) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-6 right-6 z-[100] rounded-xl bg-siyah px-5 py-3 text-sm font-medium text-beyaz shadow-lg"
    >
      {message}
    </div>
  );
}
