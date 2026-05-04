"use client";

import { buildMotmLotteryPoolForm } from "@/app/actions/motm-lottery";

export function MotmLotteryRebuildPoolForm({ eventId, isRebuild }: { eventId: string; isRebuild: boolean }) {
  return (
    <form action={buildMotmLotteryPoolForm} className="inline">
      <input type="hidden" name="event_id" value={eventId} />
      <button
        type="submit"
        onClick={(e) => {
          if (isRebuild && !window.confirm("Mevcut havuz silinip seçili maçlara göre yeniden hesaplanacak. Devam edilsin mi?")) {
            e.preventDefault();
          }
        }}
        className="rounded-lg bg-bordo px-4 py-2 text-sm font-semibold text-beyaz hover:bg-bordo-dark"
      >
        {isRebuild ? "Havuzu yeniden kur" : "Havuzu oluştur"}
      </button>
    </form>
  );
}
