"use client";

import { useEffect, useState } from "react";

/* Cursor readout from the design's HUD. Pointer devices only; on touch it
   never renders. Presentation only. */
export function Hud() {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (e: PointerEvent) => setPos({ x: e.clientX, y: e.clientY + window.scrollY });
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  if (!pos) return null;
  const f = (n: number) => n.toFixed(2).padStart(7, "0");
  return (
    <div aria-hidden className="pointer-events-none fixed right-unit-2 top-[72px] z-40 hidden gap-unit-2 text-chrome text-ink-2 md:flex">
      <span>X {f(pos.x)}</span>
      <span>Y {f(pos.y)}</span>
      <span className="blink inline-block h-[12px] w-[6px] bg-mark align-[-2px]" />
    </div>
  );
}
