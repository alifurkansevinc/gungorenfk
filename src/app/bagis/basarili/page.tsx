"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle, Sparkles } from "lucide-react";

function BasariliContent() {
  const searchParams = useSearchParams();
  const levelUp = searchParams.get("levelUp") === "1";
  const newLevel = searchParams.get("newLevel");

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-siyah/10 bg-beyaz p-8 shadow-lg text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
        <h1 className="mt-4 font-display text-2xl font-bold text-siyah">Bağışınız için teşekkürler</h1>
        <p className="mt-2 text-siyah/70">
          Destekleriniz kulübümüz için çok değerli. Güngören FK ailesi olarak minnettarız.
        </p>
        {levelUp && (
          <div className="mt-6 rounded-xl bg-bordo/10 border border-bordo/20 p-4">
            <Sparkles className="mx-auto h-10 w-10 text-bordo" />
            <p className="mt-2 font-bold text-bordo">Tebrikler! Seviye atladınız!</p>
            <p className="mt-1 text-sm text-siyah/80">
              Taraftar rozet baremleriniz doldu ve bir üst seviyeye geçtiniz. Yeni rozetinizi Benim Köşem’den görebilirsiniz.
            </p>
          </div>
        )}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="rounded-xl bg-bordo px-6 py-3 font-semibold text-beyaz hover:bg-bordo/90"
          >
            Anasayfaya dön
          </Link>
          <Link
            href="/benim-kosem"
            className="rounded-xl border border-siyah/20 px-6 py-3 font-semibold text-siyah hover:bg-siyah/5"
          >
            Benim Köşem
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BagisBasariliPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>}>
      <BasariliContent />
    </Suspense>
  );
}
