import Link from "next/link";
import type { PublicAutomation } from "@convex/lib/publicShape";
import { Empty } from "@/components/sheet";

/* Published automations as a drawing schedule: one row per record. */
export function AutomationList({ items }: { items: PublicAutomation[] }) {
  if (items.length === 0) return <Empty what="Automations" />;
  return (
    <ol className="border-t-hairline">
      {items.map((a, i) => (
        <li key={a.slug} className="border-b-hairline py-unit-2">
          <div className="flex flex-wrap items-baseline gap-x-unit-2 gap-y-tick text-chrome text-ink-3">
            <span>{String(i + 1).padStart(2, "0")}</span>
            <span>{a.difficulty}</span>
            {a.toolSlugs.map((t) => (
              <Link key={t} href={`/tools/${t}`} className="text-ink-2 hover:text-mark">
                {t}
              </Link>
            ))}
            {a.timeSavedMinutes ? <span>{a.timeSavedMinutes} min saved</span> : null}
          </div>
          <h2 className="mt-tick text-xl leading-tight">
            <Link href={`/automations/${a.slug}`} className="hover:text-mark">
              {a.title}
            </Link>
          </h2>
          <p className="mt-tick max-w-[64ch] text-ink">{a.summary}</p>
        </li>
      ))}
    </ol>
  );
}
