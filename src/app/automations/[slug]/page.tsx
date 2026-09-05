import type { Metadata } from "next";
import { NotBuilt, Sheet } from "@/components/sheet";

// Stub: any slug renders, so keep it out of the index. Phase 5 replaces this
// with title, description, and canonical from the record, and unknown slugs
// call notFound().
export async function generateMetadata(
  props: PageProps<"/automations/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  return { title: slug, robots: { index: false, follow: false } };
}

export default async function AutomationPage(props: PageProps<"/automations/[slug]">) {
  const { slug } = await props.params;
  return (
    <Sheet number="04" route={`/automations/${slug}`} title={slug}>
      <NotBuilt phase={4} />
    </Sheet>
  );
}
