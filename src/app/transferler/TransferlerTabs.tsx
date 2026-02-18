"use client";

import Link from "next/link";

export function TransferlerTabs({ activeTab }: { activeTab: "incoming" | "outgoing" }) {
  return (
    <div className="flex gap-1 border-b border-siyah/15 bg-beyaz/80 rounded-t-xl px-2 pt-2">
      <Link
        href="/transferler"
        className={`rounded-t-lg px-5 py-3 text-sm font-semibold transition-colors min-touch ${
          activeTab === "incoming"
            ? "bg-beyaz text-bordo border border-siyah/10 border-b-transparent -mb-px shadow-sm"
            : "text-siyah/60 hover:text-siyah hover:bg-siyah/5"
        }`}
      >
        Gelenler
      </Link>
      <Link
        href="/transferler?tab=outgoing"
        className={`rounded-t-lg px-5 py-3 text-sm font-semibold transition-colors min-touch ${
          activeTab === "outgoing"
            ? "bg-beyaz text-bordo border border-siyah/10 border-b-transparent -mb-px shadow-sm"
            : "text-siyah/60 hover:text-siyah hover:bg-siyah/5"
        }`}
      >
        Gidenler
      </Link>
    </div>
  );
}
