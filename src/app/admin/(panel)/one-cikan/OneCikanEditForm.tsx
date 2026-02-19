"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateHomepageFeatured } from "@/app/actions/admin";

export function OneCikanEditForm({
  id,
  title,
  subtitle,
  image_url,
  link,
  is_large,
}: {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  link: string;
  is_large: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = await updateHomepageFeatured(id, formData);
    if (res?.error) {
      setError(res.error);
      return;
    }
    router.push("/admin/one-cikan");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
      {error && <p className="rounded bg-red-100 p-2 text-sm text-red-800">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-siyah">Görsel URL *</label>
        <input name="image_url" type="url" defaultValue={image_url} required className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" placeholder="https://..." />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Başlık</label>
        <input name="title" type="text" defaultValue={title} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" placeholder="Boş bırakılırsa varsayılan kullanılır" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Alt başlık</label>
        <input name="subtitle" type="text" defaultValue={subtitle} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Link</label>
        <input name="link" type="text" defaultValue={link} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" placeholder="/magaza" />
      </div>
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="is_large" defaultChecked={is_large} className="rounded border-siyah/30 text-bordo" />
          <span className="text-sm text-siyah">Büyük kart (2x2)</span>
        </label>
      </div>
      <div className="flex gap-3">
        <button type="submit" className="rounded bg-bordo px-4 py-2 text-sm font-medium text-beyaz hover:bg-bordo/90 min-touch">Kaydet</button>
        <Link href="/admin/one-cikan" className="rounded border border-siyah/20 px-4 py-2 text-sm text-siyah hover:bg-black/5 min-touch">İptal</Link>
      </div>
    </form>
  );
}
