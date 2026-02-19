"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createTransfer, updateTransfer } from "@/app/actions/admin";

const CLUB_NAME = "Güngören FK";

type TransferRow = {
  id: string;
  player_name: string;
  player_image_url: string | null;
  position: string | null;
  age: number | null;
  from_team_name: string;
  from_team_league: string | null;
  to_team_name: string;
  to_team_league: string | null;
  transfer_date: string | null;
  sort_order: number;
  direction?: "incoming" | "outgoing";
};

const MEVKI_OPTIONS = [
  "Kaleci",
  "Stoper",
  "Sağ Bek",
  "Sol Bek",
  "Ön Libero",
  "Defansif Orta Saha",
  "Merkez Orta Saha",
  "Sağ Kanat",
  "Sol Kanat",
  "İkinci Forvet",
  "Merkez Forvet",
];

export function TransferFormu({ transfer }: { transfer?: TransferRow | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = transfer ? await updateTransfer(transfer.id, formData) : await createTransfer(formData);
    if (res?.error) {
      setError(res.error);
      return;
    }
    const id = !transfer && res && "id" in res ? (res as { id?: string }).id : undefined;
    if (id) router.push(`/admin/transferler/duzenle/${id}`);
    else router.push("/admin/transferler");
    router.refresh();
  }

  const transferDate = transfer?.transfer_date ? String(transfer.transfer_date).slice(0, 10) : "";
  const defaultDirection = transfer?.direction === "outgoing" ? "outgoing" : "incoming";
  const [direction, setDirection] = useState<"incoming" | "outgoing">(defaultDirection);

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-4">
      {error && <p className="rounded bg-red-100 p-2 text-sm text-red-800">{error}</p>}
      <div>
        <span className="block text-sm font-medium text-siyah mb-2">Transfer türü *</span>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="direction" value="incoming" defaultChecked={defaultDirection === "incoming"} onChange={() => setDirection("incoming")} className="rounded-full border-siyah/30 text-bordo" />
            <span>Gelen (kadromuza katılan)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="direction" value="outgoing" defaultChecked={defaultDirection === "outgoing"} onChange={() => setDirection("outgoing")} className="rounded-full border-siyah/30 text-bordo" />
            <span>Giden (bizden ayrılan)</span>
          </label>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Oyuncu adı *</label>
        <input name="player_name" defaultValue={transfer?.player_name} required className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" placeholder="Ad Soyad" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Oyuncu fotoğraf URL</label>
        <input name="player_image_url" type="url" defaultValue={transfer?.player_image_url ?? ""} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" placeholder="https://..." />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-siyah">Mevki</label>
          <select name="position" defaultValue={transfer?.position ?? ""} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2">
            <option value="">Seçin</option>
            {MEVKI_OPTIONS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-siyah">Yaş</label>
          <input name="age" type="number" min={14} max={50} defaultValue={transfer?.age ?? ""} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" placeholder="Örn: 24" />
        </div>
      </div>
      {direction === "incoming" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-siyah">Geldiği takım *</label>
            <input name="from_team_name" defaultValue={transfer?.from_team_name} required className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" placeholder="Takım adı" />
          </div>
          <div>
            <label className="block text-sm font-medium text-siyah">Geldiği takım ligi</label>
            <input name="from_team_league" defaultValue={transfer?.from_team_league ?? ""} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" placeholder="Örn: Süper Lig" />
          </div>
          <input type="hidden" name="to_team_name" value={CLUB_NAME} />
          <input type="hidden" name="to_team_league" value="" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="from_team_name" value={CLUB_NAME} />
          <input type="hidden" name="from_team_league" value="" />
          <div>
            <label className="block text-sm font-medium text-siyah">Gittiği takım *</label>
            <input name="to_team_name" defaultValue={transfer?.to_team_name} required className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" placeholder="Takım adı" />
          </div>
          <div>
            <label className="block text-sm font-medium text-siyah">Gittiği takım ligi</label>
            <input name="to_team_league" defaultValue={transfer?.to_team_league ?? ""} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" placeholder="Örn: 1. Lig" />
          </div>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-siyah">Transfer tarihi</label>
          <input name="transfer_date" type="date" defaultValue={transferDate} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-siyah">Sıra</label>
          <input name="sort_order" type="number" defaultValue={transfer?.sort_order ?? 0} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
        </div>
      </div>
      <div className="flex gap-3">
        <button type="submit" className="rounded bg-bordo px-4 py-2 text-sm font-medium text-beyaz hover:bg-bordo-dark min-touch">Kaydet</button>
        <Link href="/admin/transferler" className="rounded border border-siyah/20 px-4 py-2 text-sm text-siyah hover:bg-black/5 min-touch">İptal</Link>
      </div>
    </form>
  );
}
