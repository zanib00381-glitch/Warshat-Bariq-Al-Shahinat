"use client";

import { useRef } from "react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { SERIAL_LENGTH } from "@/lib/under-run-number";

type Props = {
  /** Cells 1-7, computed from country code, manufacturer code and UPD type. */
  fixedCells: string[];
  /** The 9 serial characters (cells 8-16); empty strings for blank cells. */
  serial: string[];
  onSerialChange: (serial: string[]) => void;
  invalid?: boolean;
  describedBy?: string;
};

const ALLOWED = /[A-Z0-9]/g;

/**
 * The 16-cell "Distinguished Under-Run Number", laid out left-to-right like the
 * card. Cells 1-7 are read-only; 8-16 are OTP-style boxes that auto-advance.
 */
export function UnderRunNumberInput({ fixedCells, serial, onSerialChange, invalid, describedBy }: Props) {
  const { t } = useLanguage();
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const focus = (i: number) => {
    const el = inputs.current[Math.max(0, Math.min(SERIAL_LENGTH - 1, i))];
    el?.focus();
    el?.select();
  };

  /** Writes characters starting at cell `start`, then moves focus after them. */
  const fill = (start: number, raw: string) => {
    const chars = raw.toUpperCase().match(ALLOWED) ?? [];
    if (chars.length === 0) return;
    const next = [...serial];
    chars.slice(0, SERIAL_LENGTH - start).forEach((c, k) => (next[start + k] = c));
    onSerialChange(next);
    focus(start + chars.length);
  };

  const clear = (i: number) => {
    const next = [...serial];
    next[i] = "";
    onSerialChange(next);
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (serial[i]) clear(i);
      else if (i > 0) {
        clear(i - 1);
        focus(i - 1);
      }
    } else if (e.key === "Delete") {
      e.preventDefault();
      clear(i);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focus(i - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focus(i + 1);
    }
  };

  const cellBase = "flex h-10 w-full items-center justify-center rounded-md border text-center font-bold";

  return (
    <div dir="ltr" className="flex flex-wrap gap-1.5 font-sans" role="group" aria-describedby={describedBy}>
      {fixedCells.map((value, i) => (
        <div key={`fixed-${i}`} className={i === 6 ? "w-16" : "w-9"}>
          <div className="mb-1 text-center text-xs font-semibold text-slate-500">{i + 1}</div>
          <div
            className={`${cellBase} border-slate-200 bg-slate-100 text-slate-500`}
            title={t("form.autoComputed")}
            aria-label={t("form.cellLabel", { n: String(i + 1) })}
          >
            {value || "—"}
          </div>
        </div>
      ))}
      {/* On phones, start the editable serial on its own row so all 9 boxes line up. */}
      <div className="h-0 basis-full sm:hidden" aria-hidden />
      {serial.map((value, i) => (
        <div key={`serial-${i}`} className="w-8 sm:w-9">
          <div className="mb-1 text-center text-xs font-semibold text-brand">{i + 8}</div>
          <input
            ref={(el) => {
              inputs.current[i] = el;
            }}
            value={value}
            onChange={(e) => {
              // Typing into a filled cell: keep only the newly typed character(s).
              const typed = e.target.value.startsWith(value) ? e.target.value.slice(value.length) : e.target.value;
              if (typed) fill(i, typed);
              else clear(i);
            }}
            onKeyDown={(e) => onKeyDown(i, e)}
            onPaste={(e) => {
              e.preventDefault();
              fill(i, e.clipboardData.getData("text"));
            }}
            onFocus={(e) => e.target.select()}
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            aria-label={t("form.cellLabel", { n: String(i + 8) })}
            aria-invalid={invalid || undefined}
            className={`${cellBase} bg-white uppercase outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 ${
              invalid ? "border-red-400" : "border-slate-300"
            }`}
          />
        </div>
      ))}
    </div>
  );
}
