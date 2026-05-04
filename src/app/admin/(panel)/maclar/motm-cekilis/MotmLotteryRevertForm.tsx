"use client";

import { revertMotmLotteryToDraftForm } from "@/app/actions/motm-lottery";

export function MotmLotteryRevertForm({ eventId }: { eventId: string }) {
  return (
    <form action={revertMotmLotteryToDraftForm} className="inline">
      <input type="hidden" name="event_id" value={eventId} />
      <button
        type="submit"
        onClick={(e) => {
          if (
            !window.confirm(
              "Havuz silinecek ve etkinlik taslağa dönecek. Kaynak maçları yeniden seçebilirsiniz. Onaylıyor musunuz?",
            )
          ) {
            e.preventDefault();
          }
        }}
        className="rounded-lg border border-siyah/25 px-4 py-2 text-sm font-medium text-siyah hover:bg-siyah/5"
      >
        Taslağa dön (havuzu sıfırla)
      </button>
    </form>
  );
}
