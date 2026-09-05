"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { DEFAULT_FONT, DEFAULT_MODE, MODES, STORAGE, VOICE_FONTS, type Mode, type VoiceFontId } from "@/lib/fonts";

/*
  ModeContext and the font switch. Presentation only: both set a data
  attribute on <html> that CSS reads. The server HTML never changes, so a
  crawler, an agent, and a human all receive the same document.

  Preferences live in a tiny external store backed by localStorage and are
  read with useSyncExternalStore, so the server snapshot is the default and
  the client snapshot is whatever the boot script already stamped.
*/

type Prefs = { mode: Mode; font: VoiceFontId };
const DEFAULTS: Prefs = { mode: DEFAULT_MODE, font: DEFAULT_FONT };

function isMode(v: unknown): v is Mode {
  return typeof v === "string" && (MODES as readonly string[]).includes(v);
}
function isFont(v: unknown): v is VoiceFontId {
  return typeof v === "string" && VOICE_FONTS.some((f) => f.id === v);
}

const listeners = new Set<() => void>();
let cache: Prefs | null = null;

function read(): Prefs {
  if (cache) return cache;
  let mode: Mode = DEFAULT_MODE;
  let font: VoiceFontId = DEFAULT_FONT;
  try {
    const m = localStorage.getItem(STORAGE.mode);
    const f = localStorage.getItem(STORAGE.font);
    if (isMode(m)) mode = m;
    if (isFont(f)) font = f;
  } catch {}
  cache = { mode, font };
  return cache;
}
function write(next: Partial<Prefs>) {
  cache = { ...read(), ...next };
  try {
    if (next.mode) localStorage.setItem(STORAGE.mode, next.mode);
    if (next.font) localStorage.setItem(STORAGE.font, next.font);
  } catch {}
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

type Presentation = Prefs & { setMode: (m: Mode) => void; setFont: (f: VoiceFontId) => void };
const Ctx = createContext<Presentation | null>(null);

export function PresentationProvider({ children }: { children: ReactNode }) {
  const prefs = useSyncExternalStore(subscribe, read, () => DEFAULTS);

  // The one job of these effects: mirror the preference onto <html> for CSS.
  useEffect(() => {
    document.documentElement.dataset.mode = prefs.mode;
  }, [prefs.mode]);
  useEffect(() => {
    document.documentElement.dataset.font = prefs.font;
  }, [prefs.font]);

  return (
    <Ctx.Provider value={{ ...prefs, setMode: (mode) => write({ mode }), setFont: (font) => write({ font }) }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePresentation(): Presentation {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePresentation outside PresentationProvider");
  return v;
}

/** Runs before paint. Stamps stored preferences so the first frame is right. */
export const PRESENTATION_BOOT = `(function(){try{var d=document.documentElement,m=localStorage.getItem(${JSON.stringify(
  STORAGE.mode,
)}),f=localStorage.getItem(${JSON.stringify(STORAGE.font)});d.dataset.mode=(m==="agent"?"agent":"human");d.dataset.font=(${JSON.stringify(
  VOICE_FONTS.map((f) => f.id),
)}.indexOf(f)>-1?f:${JSON.stringify(DEFAULT_FONT)});}catch(e){}})();`;
