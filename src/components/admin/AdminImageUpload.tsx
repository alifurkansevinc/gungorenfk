"use client";

import { useCallback, useId, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Link2, Loader2, Upload } from "lucide-react";
import type { AdminMediaFolder } from "@/lib/admin-media";
import { uploadAdminMediaFile } from "@/lib/admin-media-upload-client";

type Props = {
  /** Form gönderiminde kullanılacak alan adı (örn. photo_url). */
  name: string;
  folder: AdminMediaFolder;
  label?: string;
  helperText?: string;
  defaultValue?: string | null;
  /** Kontrollü kullanım (mağaza çoklu görsel vb.). */
  value?: string;
  onChange?: (url: string) => void;
  inputClassName?: string;
};

export function AdminImageUpload({
  name,
  folder,
  label = "Görsel",
  helperText,
  defaultValue,
  value: controlledValue,
  onChange,
  inputClassName = "mt-1 w-full rounded border border-siyah/20 px-3 py-2 text-sm",
}: Props) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [internalUrl, setInternalUrl] = useState((defaultValue ?? "").trim());
  const [showUrlField, setShowUrlField] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const url = controlledValue !== undefined ? controlledValue : internalUrl;

  const setUrl = useCallback(
    (next: string) => {
      if (controlledValue === undefined) setInternalUrl(next);
      onChange?.(next);
      setError(null);
    },
    [controlledValue, onChange],
  );

  async function handleFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    const res = await uploadAdminMediaFile(file, folder);
    setUploading(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setUrl(res.url);
    setShowUrlField(true);
  }

  const previewOk = url.length > 0 && (url.startsWith("http://") || url.startsWith("https://"));

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium text-siyah">
        {label}
      </label>
      {helperText ? <p className="text-xs text-siyah/60">{helperText}</p> : null}

      <input type="hidden" name={name} value={url} readOnly />

      <div className="flex flex-wrap items-start gap-4">
        <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-siyah/15 bg-siyah/[0.04]">
          {previewOk ? (
            <Image src={url} alt="" fill className="object-cover" sizes="112px" unoptimized />
          ) : (
            <ImagePlus className="h-8 w-8 text-siyah/25" aria-hidden />
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-beyaz/80">
              <Loader2 className="h-6 w-6 animate-spin text-bordo" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <input
            ref={fileRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              void handleFile(f);
              e.target.value = "";
            }}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg bg-bordo px-3 py-2 text-sm font-semibold text-beyaz hover:bg-bordo-dark disabled:opacity-60"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Yükleniyor…" : "Dosya yükle"}
            </button>
            <button
              type="button"
              onClick={() => setShowUrlField((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-siyah/20 px-3 py-2 text-sm text-siyah/80 hover:bg-siyah/5"
            >
              <Link2 className="h-4 w-4" />
              {showUrlField ? "URL alanını gizle" : "URL ile gir"}
            </button>
          </div>
          <p className="text-xs text-siyah/50">JPEG, PNG, WebP veya GIF · en fazla 5 MB</p>
        </div>
      </div>

      {showUrlField && (
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value.trim())}
          placeholder="https://… veya yükleme sonrası otomatik dolar"
          className={inputClassName}
          aria-label={`${label} URL`}
        />
      )}

      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
