"use client";

import { useLayoutEffect, useRef, useState } from "react";

/** Card size in CSS px (792 × 612 pt at 96 dpi). */
const CARD_WIDTH_PX = 1056;
const CARD_HEIGHT_PX = 816;

/**
 * Shrinks the fixed-size card to fit narrow screens without reflowing it, so the
 * on-screen card is always the same layout as the printed/PDF one. Print ignores
 * the scaling (see `.card-scaler` rules in globals.css).
 */
export function CardScaler({ children }: { children: React.ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;
    const update = () => setScale(Math.min(1, outer.clientWidth / CARD_WIDTH_PX));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(outer);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={outerRef} dir="ltr" className="card-scaler w-full overflow-hidden" style={{ height: CARD_HEIGHT_PX * scale }}>
      <div
        className="card-scaler-inner mx-auto origin-top-left shadow-lg ring-1 ring-slate-200"
        style={{ width: CARD_WIDTH_PX, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
