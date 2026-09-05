import Link from "next/link";

// Public routes only. Admin is reached by URL; it is not linked anywhere.
const LINKS = [
  { href: "/automations", label: "Automations" },
  { href: "/tools", label: "Tools" },
  { href: "/blog", label: "Blog" },
  { href: "/submit", label: "Submit" },
] as const;

export function SiteNav() {
  return (
    <nav
      aria-label="Site"
      className="border-b-hairline bg-paper px-unit-2 md:px-major"
    >
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-baseline gap-x-unit-2 gap-y-unit py-unit text-chrome">
        <Link href="/" className="text-ink hover:text-mark">
          Automations Anonymous
        </Link>
        <span aria-hidden className="text-ink-3">
          ·
        </span>
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="text-ink-2 hover:text-mark">
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
