"use client";

import { useState } from "react";
import { updateDonationReceiptTemplate } from "@/app/actions/admin";

type Props = {
  initial: { title: string; body: string };
};

export function BagisMakbuzFormu({ initial }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [title, setTitle] = useState(initial.title);
  const [body, setBody] = useState(initial.body);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    const fd = new FormData();
    fd.set("receipt_title", title);
    fd.set("receipt_body", body);
    const result = await updateDonationReceiptTemplate(fd);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-siyah/10 bg-beyaz p-6 shadow-sm">
      <h2 className="font-semibold text-siyah">Bağış makbuzu metni</h2>
      <p className="mt-1 text-sm text-siyah/60">
        Bağış tamamlandıktan sonra gösterilen makbuzda kullanılır. İsteğe bağlı: {"{{receipt_number}}"}, {"{{amount}}"}, {"{{date}}"}, {"{{name}}"}, {"{{message}}"}
      </p>
      {error && <p className="mt-4 rounded bg-red-100 p-2 text-sm text-red-800">{error}</p>}
      {success && <p className="mt-4 rounded bg-green-100 p-2 text-sm text-green-800">Kaydedildi.</p>}
      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="receipt_title" className="block text-sm font-medium text-siyah">Makbuz başlığı</label>
          <input
            id="receipt_title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded border border-siyah/20 px-3 py-2 text-siyah"
            placeholder="Bağış Makbuzu"
          />
        </div>
        <div>
          <label htmlFor="receipt_body" className="block text-sm font-medium text-siyah">Makbuz alt metni</label>
          <textarea
            id="receipt_body"
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="mt-1 w-full rounded border border-siyah/20 px-3 py-2 text-siyah"
            placeholder="Bu makbuz, Güngören Belediye Spor Kulübü'ne yapılan bağışı belgelemektedir. Bağışçıya teşekkür ederiz."
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-bordo px-4 py-2 font-semibold text-beyaz hover:bg-bordo/90 disabled:opacity-50"
        >
          {loading ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </form>
  );
}
