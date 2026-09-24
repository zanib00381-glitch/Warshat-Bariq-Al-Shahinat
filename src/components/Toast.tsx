"use client";

import { useEffect } from "react";

type Props = {
  message: string | null;
  tone?: "success" | "error";
  onClose: () => void;
  closeLabel: string;
  durationMs?: number;
};

/** Transient notification pinned to the top of the screen; auto-dismisses. */
export function Toast({ message, tone = "success", onClose, closeLabel, durationMs = 4000 }: Props) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, durationMs);
    return () => clearTimeout(timer);
  }, [message, onClose, durationMs]);

  if (!message) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4 print:hidden">
      <div
        role={tone === "error" ? "alert" : "status"}
        className={`pointer-events-auto flex max-w-md items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg ${
          tone === "error" ? "bg-red-600" : "bg-emerald-600"
        }`}
      >
        <span aria-hidden>{tone === "error" ? "⚠" : "✓"}</span>
        <span>{message}</span>
        <button type="button" onClick={onClose} className="ms-2 opacity-80 hover:opacity-100" aria-label={closeLabel}>
          ×
        </button>
      </div>
    </div>
  );
}
