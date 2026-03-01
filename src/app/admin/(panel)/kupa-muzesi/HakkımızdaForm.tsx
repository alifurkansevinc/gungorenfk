"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateClubAbout } from "@/app/actions/admin";

export function HakkımızdaForm({ initialContent }: { initialContent: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = await updateClubAbout(formData);
    if (res.error) {
      setError(res.error);
      setSaving(false);
      return;
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("admin-toast", { detail: { message: "Hakkımızda metni kaydedildi." } }));
    }
    router.refresh();
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      {error && <p className="mb-2 rounded bg-red-100 p-2 text-sm text-red-800">{error}</p>}
      <label className="block text-sm font-medium text-siyah">Hakkımızda açıklama metni</label>
      <p className="mt-0.5 text-xs text-siyah/60">Kulübümüz sayfasında &quot;Hakkımızda&quot; ve &quot;Tarihi ve Kupa Müzesi&quot; bölümünün üstünde gösterilir. Paragraflar için satır atlayın.</p>
      <textarea
        name="content"
        defaultValue={initialContent}
        rows={8}
        className="mt-2 w-full rounded border border-siyah/20 px-3 py-2 text-sm"
        placeholder="Güngören Belediye Spor Kulübü..."
      />
      <button
        type="submit"
        disabled={saving}
        className="mt-3 rounded bg-bordo px-4 py-2 text-sm font-semibold text-beyaz hover:bg-bordo/90 disabled:opacity-60"
      >
        {saving ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </form>
  );
}
