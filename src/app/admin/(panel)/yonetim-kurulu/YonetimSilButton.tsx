"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteBoardMember } from "@/app/actions/admin";

export function YonetimSilButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`"${name}" üyesini yönetim kurulundan silmek istediğinize emin misiniz?`)) return;
    setLoading(true);
    const res = await deleteBoardMember(id);
    if (res?.error) alert(res.error);
    else router.refresh();
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="text-sm text-red-600 hover:underline disabled:opacity-50"
    >
      {loading ? "..." : "Sil"}
    </button>
  );
}
