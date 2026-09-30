"use client";

/* eslint-disable @next/next/no-img-element -- local previews (blob: URLs) and static SVG defaults */
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { COMPANY } from "@/config/company";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { PhotoKind } from "@/lib/barrier-photos";
import { resizePhoto } from "@/lib/image-resize";
import { Spinner } from "@/components/Spinner";

type Props = {
  kind: PhotoKind;
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string | null;
};

/** Pick a barrier picture for one side; without one, the default picture is used. */
export function BarrierPhotoPicker({ kind, file, onChange, error }: Props) {
  const { t } = useLanguage();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [readError, setReadError] = useState(false);

  // Object URL for the chosen file's thumbnail, released when the file changes.
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again later
    if (!picked) return;
    setBusy(true);
    setReadError(false);
    try {
      onChange(await resizePhoto(picked));
    } catch {
      setReadError(true);
    }
    setBusy(false);
  }

  const label = kind === "side" ? t("form.sidePhoto") : t("form.rearPhoto");
  const shown = preview ?? COMPANY.default_barrier_photos[kind];

  return (
    <div>
      <label htmlFor={inputId} className="mb-1 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <div className={`flex gap-3 rounded-lg border p-3 ${error || readError ? "border-red-400" : "border-slate-200"} bg-slate-50`}>
        <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white">
          <img src={shown} alt={label} className="h-full w-full object-cover" />
          {!file && (
            <span className="absolute start-1 top-1 rounded bg-slate-800/75 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {t("form.defaultBadge")}
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-col justify-center gap-2">
          <p className="text-xs text-slate-500">{file ? <span dir="ltr">{file.name}</span> : t("form.defaultPhotoNote")}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-md border border-brand bg-white px-3 py-1.5 text-sm font-semibold text-brand hover:bg-brand/5 disabled:opacity-60"
            >
              {busy && <Spinner className="h-3.5 w-3.5" />}
              {file ? t("form.changePhoto") : t("form.choosePhoto")}
            </button>
            {file && (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 hover:border-red-400 hover:text-red-600"
              >
                {t("form.useDefaultPhoto")}
              </button>
            )}
          </div>
        </div>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onPick}
          className="sr-only"
        />
      </div>
      {(error || readError) && (
        <p className="mt-1 text-xs font-medium text-red-600">{readError ? t("messages.photoReadFailed") : error}</p>
      )}
    </div>
  );
}
