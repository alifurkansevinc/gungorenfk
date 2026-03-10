"use client";

import { useState } from "react";
import { setNewsHidden } from "@/app/actions/admin";

type Props = { id: string; isHidden: boolean };

export function EtkinlikPasifToggle({ id, isHidden }: Props) {
  const [hidden, setHidden] = useState(isHidden);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      await setNewsHidden(id, !hidden);
      setHidden(!hidden);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`rounded px-2 py-1 text-xs font-medium ${hidden ? "bg-siyah/15 text-siyah/60" : "bg-bordo/15 text-bordo"} hover:opacity-90 disabled:opacity-50`}
    >
      {hidden ? "Pasif" : "Aktif"}
    </button>
  );
}
