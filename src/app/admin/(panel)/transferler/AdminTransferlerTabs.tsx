"use client";

import Link from "next/link";

export function AdminTransferlerTabs({ activeTab }: { activeTab: "incoming" | "outgoing" }) {
  return (
    <div className="mt-4 flex gap-1 border-b border-siyah/10">
      <Link
        href="/admin/transferler?tab=incoming"
        className={`border-b-2 px-4 py-2 text-sm font-medium min-touch ${
          activeTab === "incoming"
            ? "border-bordo text-bordo"
            : "border-transparent text-siyah/60 hover:text-siyah hover:border-siyah/20"
        }`}
      >
        Gelenler
      </Link>
      <Link
        href="/admin/transferler?tab=outgoing"
        className={`border-b-2 px-4 py-2 text-sm font-medium min-touch ${
          activeTab === "outgoing"
            ? "border-bordo text-bordo"
            : "border-transparent text-siyah/60 hover:text-siyah hover:border-siyah/20"
        }`}
      >
        Gidenler
      </Link>
    </div>
  );
}
