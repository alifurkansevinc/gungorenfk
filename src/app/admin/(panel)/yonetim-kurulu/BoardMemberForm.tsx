"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBoardMember, updateBoardMember } from "@/app/actions/admin";
import { BOARD_ROLE_LABELS } from "@/lib/board-labels";

const ROLE_SLUGS = Object.keys(BOARD_ROLE_LABELS);
const CUSTOM_ROLE_VALUE = "__custom__";

type Row = {
  id: string;
  name: string;
  role_slug: string | null;
  role_description: string | null;
  role_custom: string | null;
  biography: string | null;
  photo_url: string | null;
  sort_order: number;
  is_active: boolean;
};

export function BoardMemberForm({ member }: { member?: Row | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const hasCustomRole = member ? (member.role_custom != null && member.role_custom.trim() !== "" && !ROLE_SLUGS.includes(member.role_slug ?? "")) : false;
  const [useCustomRole, setUseCustomRole] = useState(hasCustomRole);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    if (formData.get("role_slug") === CUSTOM_ROLE_VALUE) formData.set("role_slug", "");
    const res = member ? await updateBoardMember(member.id, formData) : await createBoardMember(formData);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("admin-toast", { detail: { message: member ? "Üye güncellendi." : "Üye kaydedildi." } }));
    }
    router.push("/admin/yonetim-kurulu");
    router.refresh();
  }

  const defaultRole = member?.role_slug ?? (member?.role_custom ? CUSTOM_ROLE_VALUE : "");

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
      {error && <p className="rounded bg-red-100 p-2 text-sm text-red-800">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-siyah">Ad Soyad *</label>
        <input name="name" defaultValue={member?.name} required className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Görev</label>
        <p className="mt-0.5 text-xs text-siyah/60">Listeden seçin veya &quot;Diğer (aşağıda yazın)&quot; ile serbest görev ismi yazın.</p>
        <select
          name="role_slug"
          defaultValue={defaultRole}
          className="mt-1 w-full rounded border border-siyah/20 px-3 py-2"
          onChange={(e) => setUseCustomRole(e.target.value === CUSTOM_ROLE_VALUE)}
        >
          <option value="">— Seçin veya aşağıda yazın —</option>
          {ROLE_SLUGS.map((slug) => (
            <option key={slug} value={slug}>{BOARD_ROLE_LABELS[slug] ?? slug}</option>
          ))}
          <option value={CUSTOM_ROLE_VALUE}>Diğer (aşağıda yazın)</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Görev İsmi (serbest)</label>
        <p className="mt-0.5 text-xs text-siyah/60">Görev listesinde yoksa buraya yazın; sitede ana görev olarak gösterilir.</p>
        <input name="role_custom" defaultValue={member?.role_custom ?? ""} placeholder="Örn. Genel Sekreter" className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Görev açıklama (alt başlık)</label>
        <p className="mt-0.5 text-xs text-siyah/60">Ana görevin altında gösterilir; isteğe bağlı.</p>
        <input name="role_description" defaultValue={member?.role_description ?? ""} placeholder="Örn. Alt görev, sorumluluk alanı" className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Biyografi</label>
        <p className="mt-0.5 text-xs text-siyah/60">Girilirse sitede üye kartında gösterilir.</p>
        <textarea name="biography" defaultValue={member?.biography ?? ""} rows={4} placeholder="Kısa öz geçmiş..." className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Görsel URL</label>
        <input name="photo_url" type="url" defaultValue={member?.photo_url ?? ""} placeholder="https://..." className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Sıra</label>
        <input name="sort_order" type="number" defaultValue={member?.sort_order ?? 0} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div>
        <label className="flex items-center gap-2">
          <input name="is_active" type="checkbox" defaultChecked={member?.is_active ?? true} className="rounded" />
          <span className="text-sm text-siyah">Aktif (sitede göster)</span>
        </label>
      </div>
      <div className="flex gap-3 pt-4">
        <button type="submit" className="rounded bg-bordo px-4 py-2 font-semibold text-beyaz hover:bg-bordo/90">{member ? "Güncelle" : "Ekle"}</button>
        <Link href="/admin/yonetim-kurulu" className="rounded border border-siyah/20 px-4 py-2 font-medium text-siyah hover:bg-siyah/5">İptal</Link>
      </div>
    </form>
  );
}
