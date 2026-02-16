"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteTransferSeasonStat } from "@/app/actions/admin";

export function TransferStatSilButton({ statId }: { statId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Bu sezon kaydını silmek istediğinize emin misiniz?")) return;
    setLoading(true);
    const res = await deleteTransferSeasonStat(statId);
    if (res?.error) alert(res.error);
    else router.refresh();
    setLoading(false);
  }

  return (
    <button type="button" onClick={handleDelete} disabled={loading} className="text-xs text-red-600 hover:underline disabled:opacity-50">
      {loading ? "..." : "Sil"}
    </button>
  );
}
