"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Product = { id: string; name: string; slug?: string; description?: string; price?: number; image_url?: string | null; sku?: string };

export function HediyeKullanForm({ products }: { products: Product[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClaim(productId: string) {
    setError(null);
    setLoading(productId);
    try {
      const res = await fetch("/api/gift/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Hediye kullanılamadı.");
        return;
      }
      router.push("/benim-kosem?hediye=ok");
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <div
            key={p.id}
            className="flex flex-col overflow-hidden rounded-xl border border-siyah/10 bg-beyaz shadow-sm transition hover:shadow-md"
          >
            <div className="relative aspect-square w-full bg-siyah/5">
              {p.image_url ? (
                <Image src={p.image_url} alt={p.name} fill className="object-contain p-2" sizes="(max-width:640px) 100vw, 33vw" />
              ) : (
                <div className="flex h-full items-center justify-center text-siyah/40">Ürün</div>
              )}
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h3 className="font-semibold text-siyah">{p.name}</h3>
              {p.description && <p className="mt-1 line-clamp-2 text-sm text-siyah/70">{p.description}</p>}
              <button
                type="button"
                onClick={() => handleClaim(p.id)}
                disabled={!!loading}
                className="mt-4 w-full rounded-lg bg-bordo px-4 py-2 text-sm font-medium text-beyaz hover:bg-bordo/90 disabled:opacity-60"
              >
                {loading === p.id ? "İşleniyor…" : "Hediye hakkı ile al"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
