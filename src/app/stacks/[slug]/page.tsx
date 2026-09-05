import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { Sheet } from "@/components/sheet";
import { AutomationList } from "@/components/automation-list";

export const dynamic = "force-static";
export const revalidate = 300;

// A stack slug is `${a}-to-${b}`. Tool slugs may themselves contain "-to-",
// so public/stacks.resolve tries every split against the tools table in one
// query and returns both tools plus the published automations using both.
const resolveStack = cache((slug: string) => fetchQuery(api.public.stacks.resolve, { slug }));

export async function generateMetadata(props: PageProps<"/stacks/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const stack = await resolveStack(slug);
  if (!stack) return { title: "Not found", robots: { index: false, follow: false } };
  return {
    title: `Connect ${stack.a.name} to ${stack.b.name}`,
    description: `Published automations that connect ${stack.a.name} to ${stack.b.name}.`,
    alternates: { canonical: `/stacks/${slug}` },
  };
}

export default async function StackPage(props: PageProps<"/stacks/[slug]">) {
  const { slug } = await props.params;
  const stack = await resolveStack(slug);
  if (!stack) notFound();
  return (
    <Sheet
      number="07"
      route={`/stacks/${slug}`}
      title={`Connect ${stack.a.name} to ${stack.b.name}`}
      summary={`Published automations that connect ${stack.a.name} to ${stack.b.name}.`}
    >
      <AutomationList items={stack.items} />
    </Sheet>
  );
}
