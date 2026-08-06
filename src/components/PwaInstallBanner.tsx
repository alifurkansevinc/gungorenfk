"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "gbfk-pwa-install-dismissed";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

/** Android Chrome: beforeinstallprompt; iOS: Safari “Ana Ekrana Ekle” ipucu */
export function PwaInstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* ignore */
    }

    const ua = window.navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBip);

    if (isIos && isSafari) {
      setShowIosHint(true);
      setVisible(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const dismiss = () => {
    setVisible(false);
    setDeferred(null);
    setShowIosHint(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    try {
      await deferred.userChoice;
    } catch {
      /* ignore */
    }
    dismiss();
  };

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
      <div className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border border-beyaz/10 bg-siyah px-4 py-3 text-beyaz shadow-2xl shadow-black/40">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bordo/25 text-bordo">
          <Download className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Uygulamayı yükle</p>
          {showIosHint && !deferred ? (
            <p className="mt-1 text-xs leading-relaxed text-beyaz/70">
              Safari’de Paylaş → <span className="font-semibold text-beyaz">Ana Ekrana Ekle</span> ile Güngören FK’yi
              telefonuna ekleyebilirsin.
            </p>
          ) : (
            <p className="mt-1 text-xs leading-relaxed text-beyaz/70">
              Ana ekrana ekle; maçlar ve haberler uygulamaya benzer şekilde açılsın.
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {deferred && (
              <button
                type="button"
                onClick={() => void install()}
                className="inline-flex min-h-[40px] items-center rounded-full bg-bordo px-4 text-xs font-bold text-beyaz hover:bg-bordo-dark"
              >
                Yükle
              </button>
            )}
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex min-h-[40px] items-center rounded-full border border-beyaz/20 px-4 text-xs font-semibold text-beyaz/80 hover:bg-beyaz/10"
            >
              Şimdi değil
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-beyaz/50 hover:bg-beyaz/10 hover:text-beyaz"
          aria-label="Kapat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
