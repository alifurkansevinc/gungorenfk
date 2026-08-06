"use client";

export function OfflineReloadButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="inline-flex min-h-[44px] items-center rounded-full border border-siyah/20 px-6 py-3 text-sm font-semibold text-siyah hover:bg-siyah/5"
    >
      Yenile
    </button>
  );
}
