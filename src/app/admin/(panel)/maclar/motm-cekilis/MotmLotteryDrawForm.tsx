"use client";

import { runMotmLotteryDrawForm } from "@/app/actions/motm-lottery";

export function MotmLotteryDrawForm({
  eventId,
  poolSize,
  winnerCount,
}: {
  eventId: string;
  poolSize: number;
  winnerCount: number;
}) {
  const disabled = poolSize === 0 || winnerCount > poolSize;
  return (
    <form action={runMotmLotteryDrawForm} className="inline">
      <input type="hidden" name="event_id" value={eventId} />
      <button
        type="submit"
        disabled={disabled}
        onClick={(e) => {
          if (disabled) return;
          if (
            !window.confirm(
              `${winnerCount} talihli, ${poolSize} kişilik havuzdan rastgele seçilecek. Bu işlem geri alınamaz. Devam edilsin mi?`,
            )
          ) {
            e.preventDefault();
          }
        }}
        className="rounded-lg bg-bordo px-4 py-2 text-sm font-semibold text-beyaz hover:bg-bordo-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        Çekilişi yap
      </button>
    </form>
  );
}
