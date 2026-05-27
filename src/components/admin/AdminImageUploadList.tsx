"use client";

import { Plus, Trash2 } from "lucide-react";
import type { AdminMediaFolder } from "@/lib/admin-media";
import { AdminImageUpload } from "./AdminImageUpload";

type Props = {
  folder: AdminMediaFolder;
  label?: string;
  urls: string[];
  onChange: (urls: string[]) => void;
  inputClassName?: string;
};

/** Mağaza vb. için birden fazla görsel (sıralı). Form gönderiminde image_url_0, image_url_1… üretilir. */
export function AdminImageUploadList({
  folder,
  label = "Görseller",
  urls,
  onChange,
  inputClassName,
}: Props) {
  function setAt(i: number, url: string) {
    onChange(urls.map((u, j) => (j === i ? url : u)));
  }
  function removeAt(i: number) {
    const next = urls.filter((_, j) => j !== i);
    onChange(next.length > 0 ? next : [""]);
  }
  function add() {
    onChange([...urls, ""]);
  }

  const list = urls.length > 0 ? urls : [""];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-siyah">{label}</span>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1 text-sm font-medium text-bordo hover:underline"
        >
          <Plus className="h-4 w-4" /> Görsel ekle
        </button>
      </div>
      <p className="text-xs text-siyah/55">Her satır için dosya yükleyin veya URL girin. Sıra vitrinde önemlidir.</p>
      <div className="space-y-4">
        {list.map((url, i) => (
          <div key={i} className="relative rounded-xl border border-siyah/10 bg-siyah/[0.02] p-3 pr-12">
            <AdminImageUpload
              name={`image_url_${i}`}
              folder={folder}
              label={`Görsel ${i + 1}`}
              value={url}
              onChange={(v) => setAt(i, v)}
              inputClassName={inputClassName}
            />
            {list.length > 1 && (
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute right-2 top-2 rounded-lg p-2 text-siyah/50 hover:bg-red-50 hover:text-red-600"
                aria-label="Görseli kaldır"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
