"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminTransitionServiceRequest } from "@/app/actions/order-service";
import type { ServiceRequestStatus, ServiceRequestType } from "@/lib/order-service-shared";

export function RequestActions({
  id,
  status,
  requestType,
}: {
  id: string;
  status: ServiceRequestStatus;
  requestType: ServiceRequestType;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: "approve" | "reject" | "receive" | "complete") {
    if (action === "complete" || action === "reject") {
      const label = action === "reject" ? "Talep reddedilsin mi?" : requestType === "RETURN" ? "Para iadesi başlatılsın mı?" : "Beden değişimi tamamlansın mı?";
      if (!window.confirm(label)) return;
    }
    setError(null);
    startTransition(async () => {
      const result = await adminTransitionServiceRequest({ requestId: id, action, adminNote: note });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setNote("");
      router.refresh();
    });
  }

  if (status === "TAMAMLANDI" || status === "REDDEDILDI" || status === "IPTAL") return null;

  return (
    <div className="space-y-2">
      <input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Admin notu"
        maxLength={500}
        className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs"
      />
      <div className="flex flex-wrap gap-1.5">
        {status === "TALEP" && (
          <button type="button" disabled={pending} onClick={() => run("approve")} className="rounded-lg bg-bordo px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-60">
            Onayla
          </button>
        )}
        {status === "ONAYLANDI" && (
          <button type="button" disabled={pending} onClick={() => run("receive")} className="rounded-lg bg-indigo-700 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-60">
            Teslim alındı
          </button>
        )}
        {status === "TESLIM_ALINDI" && (
          <button type="button" disabled={pending} onClick={() => run("complete")} className="rounded-lg bg-green-700 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-60">
            {requestType === "RETURN" ? "İadeyi tamamla" : "Değişimi tamamla"}
          </button>
        )}
        {(status === "TALEP" || status === "ONAYLANDI") && (
          <button type="button" disabled={pending} onClick={() => run("reject")} className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-800 disabled:opacity-60">
            Reddet
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
