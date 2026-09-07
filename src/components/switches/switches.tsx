"use client";

import { usePresentation } from "@/components/switches/presentation-provider";
import { MODES, VOICE_FONTS } from "@/lib/fonts";

/*
  Header controls. Only the theme is on the surface: it is the one control a
  visitor arrives wanting, and it explains itself. Reading mode and the
  headline face sit inside a collapsed disclosure, because four unlabelled
  "Aa" buttons and a bare "human / agent" toggle were the first thing a
  first-time visitor read, and they cost more comprehension than they bought.
*/

function Seg<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string; title: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-unit">
      <span className="text-chrome text-ink-3">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex border-thin border-ink text-chrome">
        {options.map((o, i) => {
          const on = o.id === value;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={on}
              title={o.title}
              onClick={() => onChange(o.id)}
              className={`px-unit py-tick transition-colors ${i > 0 ? "border-l-thin border-ink" : ""} ${
                on ? "bg-ink text-paper" : "text-ink-2 hover:bg-mark-soft hover:text-ink"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Light and dark, named for what the idiom calls them. */
export function ThemeSwitch() {
  const { resolvedTheme, setTheme } = usePresentation();
  return (
    <Seg
      label="Sheet"
      value={resolvedTheme}
      options={[
        { id: "light" as const, label: "Paper", title: "Dark ink on white paper" },
        { id: "dark" as const, label: "Blueprint", title: "White lines on blue, easier on the eyes at night" },
      ]}
      onChange={setTheme}
    />
  );
}

/** Everything else, collapsed. */
export function DisplayOptions() {
  const { mode, font, setMode, setFont } = usePresentation();
  return (
    <details className="relative">
      <summary className="cursor-pointer list-none text-chrome text-ink-2 hover:text-mark">
        Display
      </summary>
      <div className="absolute right-0 z-50 mt-unit flex w-max flex-col gap-unit-2 border-thin border-ink bg-paper p-unit-2 shadow-[0_2px_0_0_var(--line)]">
        <Seg
          label="Read"
          value={mode}
          options={MODES.map((m) => ({
            id: m,
            label: m,
            title:
              m === "human"
                ? "Prose and context, the way a person reads it"
                : "Strips to steps, payload, failure modes and raw JSON-LD",
          }))}
          onChange={setMode}
        />
        <Seg
          label="Type"
          value={font}
          options={VOICE_FONTS.map((f) => ({ id: f.id, label: f.label, title: `${f.name}. ${f.hint}` }))}
          onChange={setFont}
        />
      </div>
    </details>
  );
}
