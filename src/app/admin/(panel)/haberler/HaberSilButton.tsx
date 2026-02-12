"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteNews } from "@/app/actions/admin";

export function HaberSilButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`"${title}" haberini silmek istediğinize emin misiniz?`)) return;
    setLoading(true);
    const res = await deleteNews(id);
    if (res?.error) alert(res.error);
    else router.refresh();
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="text-red-600 hover:underline text-sm disabled:opacity-50"
    >
      {loading ? "..." : "Sil"}
    </button>
  );
}
