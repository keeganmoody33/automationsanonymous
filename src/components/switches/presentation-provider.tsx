"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  DEFAULT_FONT,
  DEFAULT_MODE,
  DEFAULT_THEME,
  MODES,
  STORAGE,
  THEMES,
  VOICE_FONTS,
  type Mode,
  type Theme,
  type VoiceFontId,
} from "@/lib/fonts";

/*
  ModeContext and the font switch. Presentation only: both set a data
  attribute on <html> that CSS reads. The server HTML never changes, so a
  crawler, an agent, and a human all receive the same document.

  Preferences live in a tiny external store backed by localStorage and are
  read with useSyncExternalStore, so the server snapshot is the default and
  the client snapshot is whatever the boot script already stamped.
*/

type Prefs = { mode: Mode; font: VoiceFontId; theme: Theme };
const DEFAULTS: Prefs = { mode: DEFAULT_MODE, font: DEFAULT_FONT, theme: DEFAULT_THEME };

function isMode(v: unknown): v is Mode {
  return typeof v === "string" && (MODES as readonly string[]).includes(v);
}
function isFont(v: unknown): v is VoiceFontId {
  return typeof v === "string" && VOICE_FONTS.some((f) => f.id === v);
}
function isTheme(v: unknown): v is Theme {
  return typeof v === "string" && (THEMES as readonly string[]).includes(v);
}

const listeners = new Set<() => void>();
let cache: Prefs | null = null;

function read(): Prefs {
  if (cache) return cache;
  let mode: Mode = DEFAULT_MODE;
  let font: VoiceFontId = DEFAULT_FONT;
  let theme: Theme = DEFAULT_THEME;
  try {
    const m = localStorage.getItem(STORAGE.mode);
    const f = localStorage.getItem(STORAGE.font);
    const t = localStorage.getItem(STORAGE.theme);
    if (isMode(m)) mode = m;
    if (isFont(f)) font = f;
    if (isTheme(t)) theme = t;
  } catch {}
  cache = { mode, font, theme };
  return cache;
}
function write(next: Partial<Prefs>) {
  cache = { ...read(), ...next };
  try {
    if (next.mode) localStorage.setItem(STORAGE.mode, next.mode);
    if (next.font) localStorage.setItem(STORAGE.font, next.font);
    if (next.theme) localStorage.setItem(STORAGE.theme, next.theme);
  } catch {}
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

type Presentation = Prefs & {
  setMode: (m: Mode) => void;
  setFont: (f: VoiceFontId) => void;
  setTheme: (t: Theme) => void;
  /** What the visitor actually sees once "system" is resolved. */
  resolvedTheme: "light" | "dark";
};
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

  // "system" removes the attribute so the prefers-color-scheme media query in
  // globals.css takes over, rather than this having to track the OS itself.
  useEffect(() => {
    const root = document.documentElement;
    if (prefs.theme === "system") delete root.dataset.theme;
    else root.dataset.theme = prefs.theme;
  }, [prefs.theme]);

  // Re-render when the OS flips while the visitor is on "system", so anything
  // reading resolvedTheme (the WebGL scene) can follow.
  const [systemDark, setSystemDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setSystemDark(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const resolvedTheme: "light" | "dark" =
    prefs.theme === "system" ? (systemDark ? "dark" : "light") : prefs.theme;

  return (
    <Ctx.Provider
      value={{
        ...prefs,
        resolvedTheme,
        setMode: (mode) => write({ mode }),
        setFont: (font) => write({ font }),
        setTheme: (theme) => write({ theme }),
      }}
    >
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
)}),f=localStorage.getItem(${JSON.stringify(STORAGE.font)}),t=localStorage.getItem(${JSON.stringify(
  STORAGE.theme,
)});d.dataset.mode=(m==="agent"?"agent":"human");d.dataset.font=(${JSON.stringify(
  VOICE_FONTS.map((f) => f.id),
)}.indexOf(f)>-1?f:${JSON.stringify(
  DEFAULT_FONT,
)});if(t==="dark"||t==="light"){d.dataset.theme=t;}}catch(e){}})();`;
