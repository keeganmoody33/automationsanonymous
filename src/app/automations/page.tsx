import type { Metadata } from "next";
import { Empty, NotBuilt, Sheet } from "@/components/sheet";

export const metadata: Metadata = {
  title: "Automations",
  description: "Index of published automations, filterable by tool, category, and difficulty.",
  alternates: { canonical: "/automations" },
};

// Filters accepted on this route. Read from searchParams; data lands in Phase 4.
const FILTERS = ["tool", "category", "difficulty"] as const;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AutomationsIndex(props: PageProps<"/automations">) {
  const searchParams = await props.searchParams;
  const active = FILTERS.flatMap((key) => {
    const value = first(searchParams[key]);
    return value ? [{ key, value }] : [];
  });

  return (
    <Sheet
      number="03"
      route="/automations"
      title="Automations"
      summary="Every published automation as a structured record: trigger, steps, prerequisites, failure modes, and the runnable payload."
    >
      <section aria-label="Filters" className="flex flex-wrap gap-unit">
        {FILTERS.map((key) => {
          const match = active.find((a) => a.key === key);
          return (
            <span
              key={key}
              className="border-hairline px-unit py-tick text-chrome text-ink-2"
            >
              {key}: {match ? match.value : "any"}
            </span>
          );
        })}
      </section>
      <div className="mt-major">
        <Empty what="Automations" />
      </div>
      <div className="mt-unit">
        <NotBuilt phase={4} />
      </div>
    </Sheet>
  );
}
