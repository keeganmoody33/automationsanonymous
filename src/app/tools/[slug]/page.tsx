import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { Sheet } from "@/components/sheet";
import { AutomationList } from "@/components/automation-list";
import { JsonLd, automationItems, itemList } from "@/lib/schema-org";

export const dynamic = "force-static";
export const revalidate = 300;

const getTool = cache((slug: string) => fetchQuery(api.public.tools.getBySlug, { slug }));

export async function generateMetadata(props: PageProps<"/tools/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const tool = await getTool(slug);
  if (!tool) return { title: "Not found", robots: { index: false, follow: false } };
  return {
    title: tool.name,
    description: `Published automations that use ${tool.name}.`,
    alternates: { canonical: `/tools/${tool.slug}` },
  };
}

export default async function ToolPage(props: PageProps<"/tools/[slug]">) {
  const { slug } = await props.params;
  const [tool, items] = await Promise.all([
    getTool(slug),
    fetchQuery(api.public.automations.listByTool, { toolSlug: slug }),
  ]);
  if (!tool) notFound();
  return (
    <Sheet
      number="06"
      route={`/tools/${tool.slug}`}
      title={tool.name}
      summary={`Published automations that use ${tool.name}.`}
    >
      {tool.website ? (
        <p className="mb-unit-2 text-chrome">
          <a href={tool.website} rel="noopener noreferrer" className="text-ink-2 hover:text-mark">
            {tool.website}
          </a>
        </p>
      ) : null}
      <JsonLd data={itemList(`Automations using ${tool.name}`, `/tools/${tool.slug}`, automationItems(items))} />
      <AutomationList items={items} />
    </Sheet>
  );
}
