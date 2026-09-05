"use client";

import { usePresentation } from "@/components/switches/presentation-provider";
import { MODES, VOICE_FONTS } from "@/lib/fonts";

/* Segmented controls from the design's header. Tokens only. */
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
            className={`px-unit py-tick ${i > 0 ? "border-l-thin border-ink" : ""} ${on ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Switches() {
  const { mode, font, setMode, setFont } = usePresentation();
  return (
    <div className="flex items-center gap-unit-2">
      <Seg
        label="Reading mode"
        value={mode}
        options={MODES.map((m) => ({ id: m, label: m, title: m === "human" ? "Prose, context, framing" : "Summary, steps, payload, failure modes, raw JSON-LD" }))}
        onChange={setMode}
      />
      <Seg
        label="Headline face"
        value={font}
        options={VOICE_FONTS.map((f) => ({ id: f.id, label: f.label, title: `${f.name}. ${f.hint}` }))}
        onChange={setFont}
      />
    </div>
  );
}
