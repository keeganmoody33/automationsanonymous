import Link from "next/link";
import { Switches } from "@/components/switches/switches";

// Public routes only. Admin is reached by URL; it is not linked anywhere.
// Stacks have no index route in the brief, so they are reached through tools.
const LINKS = [
  { href: "/automations", label: "Automations" },
  { href: "/tools", label: "Tools" },
  { href: "/blog", label: "Blog" },
  { href: "/submit", label: "Submit" },
] as const;

/** Circle with an inscribed triangle, drawn as construction geometry. */
export function Glyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <circle cx="12" cy="12" r="10" className="ln" />
      <path d="M12 2 L20.66 17 H3.34 Z" className="ln" />
      <path d="M12 0.5 V3.5 M1 17 H4 M20 17 H23" className="ln ln-hair" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className="border-b-thin border-ink bg-paper">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-unit-4 gap-y-unit px-unit-2 py-unit md:h-[64px] md:px-major md:py-0">
        <Link href="/" className="flex items-center gap-unit-2 text-chrome text-ink hover:text-mark" aria-label="Automations Anonymous, home">
          <Glyph className="h-[22px] w-[22px] shrink-0" />
          <span className="tracking-[0.16em]">Automations Anonymous</span>
        </Link>
        <nav aria-label="Site" className="flex flex-wrap gap-x-unit-2 gap-y-tick text-chrome md:gap-x-unit-4">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="border-b-hairline border-transparent pb-tick text-ink-2 hover:border-ink hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-unit-2">
          <Switches />
          <span className="hidden text-chrome text-ink-2 lg:inline">Sheet 01 · Rev A</span>
        </div>
      </div>
    </header>
  );
}
