"use client";

import { useState } from "react";
import { importMackolikMatches } from "@/app/actions/admin";
import { Download } from "lucide-react";

export function MackolikImportButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleImport() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await importMackolikMatches();
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setResult({ imported: res.imported, skipped: res.skipped });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handleImport}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-siyah/20 bg-beyaz px-4 py-2 text-sm font-medium text-siyah hover:bg-siyah/5 disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        {loading ? "İçe aktarılıyor…" : "Mackolik'ten içe aktar"}
      </button>
      {result && (
        <span className="text-sm text-siyah/70">
          {result.imported} maç eklendi, {result.skipped} zaten vardı.
        </span>
      )}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
