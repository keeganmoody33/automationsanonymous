/*
  Font registry for the --font-voice role. Adding a face means adding an
  entry here and a matching [data-font] rule in globals.css; no component
  changes. The chrome role never switches.
*/
export const VOICE_FONTS = [
  { id: "mono", label: "Aa", name: "IBM Plex Mono Bold", hint: "Drafting lettering. One family for the whole sheet." },
  { id: "sans-condensed", label: "Aa", name: "IBM Plex Sans Condensed Bold", hint: "Tight and tall. A stencil on a crate." },
  { id: "sans", label: "Aa", name: "IBM Plex Sans Bold", hint: "Clean and wide. Safest for long headlines." },
  { id: "serif", label: "Aa", name: "IBM Plex Serif Bold", hint: "Editorial. A journal against a drawing." },
] as const;

export type VoiceFontId = (typeof VOICE_FONTS)[number]["id"];
export const DEFAULT_FONT: VoiceFontId = "mono";

export const MODES = ["human", "agent"] as const;
export type Mode = (typeof MODES)[number];
export const DEFAULT_MODE: Mode = "human";

export const STORAGE = { mode: "aa:mode", font: "aa:font" } as const;
