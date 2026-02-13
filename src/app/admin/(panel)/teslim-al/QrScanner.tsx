"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X } from "lucide-react";

/** QR'dan teslim kodu çıkar: URL'de code= varsa onu al, yoksa tüm metni kod say. */
export function parsePickupCodeFromQr(decoded: string): string {
  const s = decoded.trim();
  try {
    const url = new URL(s);
    const code = url.searchParams.get("code");
    if (code) return code.toUpperCase();
  } catch {
    /* URL değilse tüm metin koddur */
  }
  return s.toUpperCase();
}

export function QrScanner({
  onScan,
  onClose,
}: {
  onScan: (code: string) => void;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"starting" | "ready">("starting");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const divId = "qr-reader-teslim";

  useEffect(() => {
    let mounted = true;
    const start = async () => {
      try {
        const scanner = new Html5Qrcode(divId);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 5, qrbox: { width: 250, height: 250 } },
          (decoded) => {
            if (!mounted) return;
            const code = parsePickupCodeFromQr(decoded);
            if (code) {
              scanner.stop().catch(() => {});
              scannerRef.current = null;
              onScan(code);
            }
          },
          () => {}
        );
        if (mounted) setStatus("ready");
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : "Kamera açılamadı.");
      }
    };
    start();
    return () => {
      mounted = false;
      scannerRef.current?.stop().catch(() => {});
      scannerRef.current = null;
    };
  }, [onScan]);

  return (
    <div className="relative rounded-2xl border border-gray-200 bg-white p-4 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">QR kodu kameraya tutun</span>
        <button
          type="button"
          onClick={() => {
            scannerRef.current?.stop().catch(() => {});
            onClose();
          }}
          className="rounded-lg p-2 hover:bg-gray-100"
          aria-label="Kapat"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <div id={divId} className="rounded-xl overflow-hidden" style={{ minHeight: "200px" }} />
      {status === "ready" && <p className="mt-2 text-xs text-gray-500">Kod okununca otomatik teslim alınacak.</p>}
    </div>
  );
}
