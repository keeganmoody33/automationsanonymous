import type { Metadata } from "next";
import { NotBuilt, Sheet } from "@/components/sheet";

// Real title, description, and canonical come from the record in Phase 5.
export async function generateMetadata(
  props: PageProps<"/automations/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  return { title: slug, alternates: { canonical: `/automations/${slug}` } };
}

export default async function AutomationPage(props: PageProps<"/automations/[slug]">) {
  const { slug } = await props.params;
  return (
    <Sheet number="04" route={`/automations/${slug}`} title={slug}>
      <NotBuilt phase={4} />
    </Sheet>
  );
}
