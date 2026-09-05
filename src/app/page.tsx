import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { Landing } from "@/components/landing/landing";

export const metadata: Metadata = { alternates: { canonical: "/" } };
export const dynamic = "force-static";
export const revalidate = 300;

/* Distinct unordered tool pairs across published records: the stacks that exist. */
function countStacks(items: { toolSlugs: string[] }[]): number {
  const pairs = new Set<string>();
  for (const a of items) {
    const t = Array.from(new Set(a.toolSlugs)).sort();
    for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) pairs.add(`${t[i]}-to-${t[j]}`);
  }
  return pairs.size;
}

export default async function Home() {
  const [automations, tools] = await Promise.all([
    fetchQuery(api.public.automations.listPublished, {}),
    fetchQuery(api.public.tools.list, {}),
  ]);
  return <Landing automations={automations} tools={tools} stacks={countStacks(automations)} />;
}
