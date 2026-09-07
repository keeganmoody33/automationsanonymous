"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { usePresentation } from "@/components/switches/presentation-provider";
import s from "./landing.module.css";

// Client only. The SVG underneath is the server-rendered drawing and the
// no-JS fallback; once WebGL is running it recedes but stays legible, because
// it carries the numbered callouts the 3D scene has no labels for.
const HeroThree = dynamic(() => import("./hero-three"), { ssr: false });

export function HeroCanvas({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const { resolvedTheme } = usePresentation();
  const onReady = useCallback(() => setReady(true), []);
  return (
    <div className={s.drawing} data-dwg>
      <div className={ready ? s.behind : undefined}>{children}</div>
      <div className={s.canvasLayer}>
        {/* Keyed on the theme: the scene reads its colours from CSS tokens at
            mount, so a light/dark switch remounts it rather than leaving the
            wireframe in the old palette. */}
        <HeroThree key={resolvedTheme} onReady={onReady} />
      </div>
      {ready ? (
        <p className={s.grabHint} aria-hidden>
          Drag to turn it
        </p>
      ) : null}
    </div>
  );
}
