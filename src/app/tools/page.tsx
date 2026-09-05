import type { Metadata } from "next";
import Link from "next/link";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { Empty, Sheet } from "@/components/sheet";
import { JsonLd, itemList } from "@/lib/schema-org";

export const dynamic = "force-static";
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Tools",
  description: "Index of tools that appear in published automations.",
  alternates: { canonical: "/tools" },
};

export default async function ToolsIndex() {
  const tools = await fetchQuery(api.public.tools.list, {});
  return (
    <Sheet
      number="05"
      route="/tools"
      title="Tools"
      summary="Every tool referenced by a published automation, with the automations that use it."
    >
      <JsonLd data={itemList("Tools", "/tools", tools.map((t) => ({ name: t.name, path: `/tools/${t.slug}` })))} />
      {tools.length === 0 ? (
        <Empty what="Tools" />
      ) : (
        <ul className="border-t-hairline">
          {tools.map((t) => (
            <li key={t.slug} className="flex flex-wrap items-baseline gap-x-unit-2 border-b-hairline py-unit">
              <Link href={`/tools/${t.slug}`} className="text-ink hover:text-mark">
                {t.name}
              </Link>
              <span className="text-chrome text-ink-3">{t.category ?? "uncategorized"}</span>
              <span className="ml-auto text-chrome text-ink-2">
                {t.automationCount} {t.automationCount === 1 ? "automation" : "automations"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
