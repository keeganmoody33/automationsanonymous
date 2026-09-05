"use client";

import { useEffect, useState } from "react";
import s from "./landing.module.css";

const KEY = "aa:plotted";
const DURATION = 2600;

/*
  Plays once per browser session as an overlay. Skipped when the user asks
  for reduced motion. Nothing here is in the server HTML.
*/
// Decided once per page load. React runs effects twice in development, and
// the session key written by the first run must not silence the second.
let decision: boolean | null = null;
function shouldPlay(): boolean {
  if (decision !== null) return decision;
  try {
    if (sessionStorage.getItem(KEY)) return (decision = false);
    sessionStorage.setItem(KEY, "1");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return (decision = false);
    return (decision = true);
  } catch {
    return (decision = false);
  }
}

export function LoadingOverlay() {
  const [phase, setPhase] = useState<"hidden" | "in" | "out">("hidden");

  useEffect(() => {
    if (!shouldPlay()) return;
    // Start on the next frame: the overlay is a client-only effect layered on
    // top of already-painted server HTML.
    const raf = requestAnimationFrame(() => setPhase("in"));
    const t1 = setTimeout(() => setPhase("out"), DURATION);
    const t2 = setTimeout(() => setPhase("hidden"), DURATION + 600);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (phase === "hidden") return null;
  return (
    <div className={`${s.loading} ${phase === "out" ? s.loadingOut : ""} grid-paper`} aria-hidden>
      <div className={s.frame} />
      <div className={`${s.corner} ${s.tl}`} /><div className={`${s.corner} ${s.tr}`} /><div className={`${s.corner} ${s.bl}`} /><div className={`${s.corner} ${s.br}`} />
      <div className={s.sweepLine} />
      <div className={s.tlNote}>Plotting sheet 01 · automationsanonymous.com</div>
      <div className={s.loadingCenter}>
        <svg className={s.logo} viewBox="0 0 400 400">
          <path className="ln ln-center" d="M20 200 H380 M200 20 V380" />
          <path className={`ln ln-hair ln-faint ${s.ldDraw} ${s.ld0}`} d="M200 200 L200 80" />
          <path className={`ln ${s.ldDraw} ${s.ld0}`} d="M200 80 a120 120 0 1 1 -0.01 0" />
          <path className={`ln ln-heavy ${s.ldDraw} ${s.ld1}`} d="M200 80 L303.9 260 L96.1 260 Z" />
          <path className={`ln ln-hair ln-faint ${s.ldDraw} ${s.ld2}`} d="M96.1 260 L200 80 M200 200 L96.1 260 M200 200 L303.9 260" />
          <path className={`ln ln-dim ${s.ldDraw} ${s.ld3}`} d="M200 200 L284.9 284.9" />
          <text x="252" y="238" className="t" transform="rotate(45 252 238)">R 120</text>
          <path className={`ln ln-dim ${s.ldDraw} ${s.ld3}`} d="M200 110 a90 90 0 0 1 77.9 45" />
          <text x="262" y="132" className="t">60°</text>
          <g className={`${s.ldPop} ${s.lp1}`}><path className="ln ln-mark" d="M194 74 h12 M200 68 v12" /></g>
          <g className={`${s.ldPop} ${s.lp2}`}><path className="ln ln-mark" d="M298 254 h12 M303.9 248 v12" /></g>
          <g className={`${s.ldPop} ${s.lp3}`}><path className="ln ln-mark" d="M90 254 h12 M96.1 248 v12" /></g>
          <text x="200" y="352" className="t" textAnchor="middle">Circle, inscribed triangle, three verified points</text>
        </svg>
        <div className={s.word}>Automations <span>Anonymous</span></div>
        <div className={s.progress}>
          <svg viewBox="0 0 560 40">
            <path className="ln ln-dim" d="M0 8 V32 M560 8 V32" />
            <path className="ln ln-dim" d="M0 20 H560" />
            <path className="ln ln-dim" d="M-4 24 L4 16 M556 24 L564 16" />
            <rect className={`${s.fillbar} fill-ink`} x="0" y="17" width="560" height="6" />
          </svg>
        </div>
        <div className={s.status}>
          <span>Loading linetypes</span>
          <span>Hatching sections</span>
          <span>Checking slugs</span>
          <span>Withholding names</span>
          <span className={s.r}>Sheet 01</span>
        </div>
      </div>
    </div>
  );
}
