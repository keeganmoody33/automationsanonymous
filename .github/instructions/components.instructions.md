---
applyTo: "src/components/**/*.tsx"
---

# Components

- Server components by default. Add `"use client"` only for interaction, browser APIs, or reactive admin hooks.
- Tokens only. Use the Tailwind utilities generated from `src/app/globals.css` (`text-ink`, `border-hairline`, `p-unit`, `bg-paper-deep`, `text-mark`, `font-chrome`, `font-voice`, ...) or `var(--token)`. Never a literal color, stroke width, radius, or font family. If a value is missing, add a token in `globals.css` first.
- Two font roles: `--font-chrome` (labels, metadata, nav, tool names, step numbers) and `--font-voice` (headlines). Never name a face.
- Public components receive `PublicAutomation` from `@convex/lib/publicShape`. Never accept or render `submitterEmail`, `rejectionNote`, or `internalNotes` outside `src/components/admin/`.
- No identity anywhere: no author, handle, avatar, or attribution props.
- JSON-LD only via `src/lib/schema-org.tsx` builders and `<JsonLd>`.
- Mode awareness is CSS: add `human-only` to prose that agent mode should hide and `agent-only` to blocks only agents need. Both are always in the HTML.
- Copy: no em dashes, no twelve-step or recovery language, specific over adjectival. Empty states render `<Empty what="..." />` or the pattern `{thing}: empty`. Not-built areas render `<NotBuilt phase={n} />`.
- Inline SVG uses the drafting vocabulary from `globals.css` (`ln`, `ln-hair`, `ln-hidden`, `ln-center`, `ln-dim`, `ln-mark`, `fill-*`, `t`, `balloon`, `draw`, `pop`). Wrap animated drawings in an element with `data-dwg` so they start when scrolled into view.
- Admin components take the session token from `useAdminToken()` and pass it as the first argument to every admin function.
