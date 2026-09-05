"use client";

import { useState } from "react";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [state, setState] = useState<"idle" | "done" | "fail">("idle");
  return (
    <button
      type="button"
      className="text-chrome text-mark hover:text-ink"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setState("done");
        } catch {
          setState("fail");
        }
        setTimeout(() => setState("idle"), 1600);
      }}
    >
      {state === "done" ? "Copied" : state === "fail" ? "Select and copy" : label}
    </button>
  );
}
