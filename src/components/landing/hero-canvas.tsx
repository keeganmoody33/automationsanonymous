"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import s from "./landing.module.css";

// Client only. The SVG underneath is the server-rendered drawing; once the
// WebGL scene is running the SVG dims so the callouts stay legible behind it.
const HeroThree = dynamic(() => import("./hero-three"), { ssr: false });

export function HeroCanvas({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  return (
    <div className={s.drawing} data-dwg>
      <div className={ready ? s.dimmed : undefined}>{children}</div>
      <div className={s.canvasLayer}>
        <HeroThree onReady={onReady} />
      </div>
    </div>
  );
}
