import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { Sheet } from "@/components/sheet";
import { AutomationList } from "@/components/automation-list";

export const metadata: Metadata = {
  title: "Automations",
  description: "Index of published automations, filterable by tool, category, and difficulty.",
  alternates: { canonical: "/automations" },
};

// Filters accepted on this route. Reading searchParams makes the index
// dynamic; detail pages stay static.
const FILTERS = ["tool", "category", "difficulty"] as const;
const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
type Difficulty = (typeof DIFFICULTIES)[number];

function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v ? v : undefined;
}

export default async function AutomationsIndex(props: PageProps<"/automations">) {
  const sp = await props.searchParams;
  const tool = first(sp.tool);
  const category = first(sp.category);
  const rawDifficulty = first(sp.difficulty);
  const difficulty = DIFFICULTIES.includes(rawDifficulty as Difficulty)
    ? (rawDifficulty as Difficulty)
    : undefined;

  const items = await fetchQuery(api.public.automations.listPublished, {
    tool,
    category,
    difficulty,
  });
  const active: Record<(typeof FILTERS)[number], string | undefined> = { tool, category, difficulty };

  return (
    <Sheet
      number="03"
      route="/automations"
      title="Automations"
      summary="Every published automation as a structured record: trigger, steps, prerequisites, failure modes, and the runnable payload."
    >
      <section aria-label="Filters" className="flex flex-wrap gap-unit">
        {FILTERS.map((key) => (
          <span key={key} className="border-hairline px-unit py-tick text-chrome text-ink-2 break-all">
            {key}: {active[key] ?? "any"}
          </span>
        ))}
      </section>
      <div className="mt-major">
        <AutomationList items={items} />
      </div>
    </Sheet>
  );
}
