"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CheckCircle, Sparkles } from "lucide-react";

function BasariliContent() {
  const searchParams = useSearchParams();
  const qrCode = searchParams.get("qrCode") || "";
  const levelUp = searchParams.get("levelUp") === "1";
  const seatFromUrl = searchParams.get("seatCode") || "";
  const [seatCode, setSeatCode] = useState(seatFromUrl);
  const qrUrl =
    typeof window !== "undefined" && qrCode
      ? `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrCode)}`
      : "";

  useEffect(() => {
    if (seatFromUrl) setSeatCode(seatFromUrl);
    else if (qrCode) {
      fetch(`/api/tickets/by-qr?qrCode=${encodeURIComponent(qrCode)}`)
        .then((r) => r.json())
        .then((d) => d.seatCode && setSeatCode(d.seatCode))
        .catch(() => {});
    }
  }, [qrCode, seatFromUrl]);

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-siyah/10 bg-beyaz p-8 shadow-lg text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
        <h1 className="mt-4 font-display text-2xl font-bold text-siyah">Biletiniz hazır</h1>
        <p className="mt-2 text-siyah/70">
          Maç günü stadyum girişinde aşağıdaki QR kodu göstermeniz yeterli.
        </p>
        {qrCode && (
          <div className="mt-6 rounded-xl border-2 border-bordo/20 bg-bordo/5 p-6">
            {qrUrl && (
              <img src={qrUrl} alt="Bilet QR" width={256} height={256} className="mx-auto rounded-lg" />
            )}
            {seatCode && (
              <p className="mt-2 text-sm font-semibold text-bordo">Koltuk: {seatCode}</p>
            )}
            <p className="mt-3 font-mono text-sm font-bold text-siyah">Kod: {qrCode}</p>
          </div>
        )}
        {levelUp && (
          <div className="mt-6 rounded-xl bg-bordo/10 border border-bordo/20 p-4">
            <Sparkles className="mx-auto h-10 w-10 text-bordo" />
            <p className="mt-2 font-bold text-bordo">Tebrikler! Seviye atladınız!</p>
          </div>
        )}
        <Link
          href="/biletler"
          className="mt-8 inline-block rounded-xl bg-bordo px-6 py-3 font-semibold text-beyaz hover:bg-bordo/90"
        >
          Biletlere dön
        </Link>
      </div>
    </div>
  );
}

export default function BiletlerBasariliPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>}>
      <BasariliContent />
    </Suspense>
  );
}
