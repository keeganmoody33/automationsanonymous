import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { Sheet } from "@/components/sheet";
import { AutomationRecord } from "@/components/automation-record";
import { JsonLd, howTo } from "@/lib/schema-org";

// Static with revalidation. Slugs are permanent, so the URL never moves.
// force-static: convex/nextjs fetches with no-store, which would otherwise
// make the route dynamic; with force-static Next keeps ISR and refetches on
// each regeneration.
export const dynamic = "force-static";
export const revalidate = 300;

// Convex queries are POSTs, which Next does not memoize, so one lookup is
// shared between generateMetadata and the page.
const getAutomation = cache((slug: string) => fetchQuery(api.public.automations.getBySlug, { slug }));

export async function generateMetadata(props: PageProps<"/automations/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const a = await getAutomation(slug);
  if (!a) return { title: "Not found", robots: { index: false, follow: false } };
  return {
    title: a.title,
    description: a.summary,
    alternates: { canonical: `/automations/${a.slug}` },
  };
}

export default async function AutomationPage(props: PageProps<"/automations/[slug]">) {
  const { slug } = await props.params;
  const a = await getAutomation(slug);
  if (!a) notFound();
  return (
    <Sheet number="04" route={`/automations/${a.slug}`} title={a.title} summary={a.summary}>
      <JsonLd data={howTo(a)} />
      <AutomationRecord a={a} />
    </Sheet>
  );
}
