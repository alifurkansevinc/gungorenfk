import {
  TICKETS_UNAVAILABLE_MESSAGE,
  TICKETS_UNAVAILABLE_TITLE,
} from "@/lib/tickets-public";

type Variant = "page" | "card" | "inline";

type Props = {
  variant?: Variant;
  className?: string;
};

/** Public bilet kapalıyken gösterilen bilgilendirme. */
export function TicketsUnavailableNotice({ variant = "card", className = "" }: Props) {
  if (variant === "inline") {
    return (
      <p className={`text-sm text-siyah/75 ${className}`.trim()}>
        {TICKETS_UNAVAILABLE_MESSAGE}
      </p>
    );
  }

  if (variant === "page") {
    return (
      <div className={`mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8 ${className}`.trim()}>
        <div className="rounded-2xl border border-siyah/10 bg-beyaz p-8 text-center shadow-sm sm:p-10">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-bordo">
            Biletler
          </p>
          <h1 className="font-display mt-3 text-2xl font-bold text-siyah sm:text-3xl">
            {TICKETS_UNAVAILABLE_TITLE}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-siyah/75">
            {TICKETS_UNAVAILABLE_MESSAGE}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-siyah/10 bg-siyah/[0.02] px-4 py-4 sm:px-5 ${className}`.trim()}
    >
      <p className="font-display text-sm font-bold text-siyah">{TICKETS_UNAVAILABLE_TITLE}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-siyah/75">{TICKETS_UNAVAILABLE_MESSAGE}</p>
    </div>
  );
}
