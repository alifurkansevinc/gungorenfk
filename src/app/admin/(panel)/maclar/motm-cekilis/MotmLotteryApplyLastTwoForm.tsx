"use client";

import { applyLastTwoMotmVoteMatchesForm } from "@/app/actions/motm-lottery";

export function MotmLotteryApplyLastTwoForm({ eventId }: { eventId: string }) {
  return (
    <form action={applyLastTwoMotmVoteMatchesForm} className="inline">
      <input type="hidden" name="event_id" value={eventId} />
      <button
        type="submit"
        onClick={(e) => {
          if (
            !window.confirm(
              "MOTM oyu bulunan maçlar içinden takvimde en yeni iki maç kaynak olarak seçilecek (mevcut seçim değişir). Onaylıyor musunuz?",
            )
          ) {
            e.preventDefault();
          }
        }}
        className="rounded-lg border border-bordo/40 bg-bordo/10 px-4 py-2 text-sm font-semibold text-bordo hover:bg-bordo/15"
      >
        Son iki MOTM maçını bağla
      </button>
    </form>
  );
}
