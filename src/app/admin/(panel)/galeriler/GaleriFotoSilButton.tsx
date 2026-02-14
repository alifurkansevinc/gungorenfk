"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteGalleryPhoto } from "@/app/actions/admin";

export function GaleriFotoSilButton({ photoId }: { photoId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Bu fotoğrafı silmek istediğinize emin misiniz?")) return;
    setLoading(true);
    const res = await deleteGalleryPhoto(photoId);
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
