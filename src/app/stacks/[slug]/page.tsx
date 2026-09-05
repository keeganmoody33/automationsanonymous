import type { Metadata } from "next";
import { Empty, NotBuilt, Sheet } from "@/components/sheet";

// Stub: any slug renders, so keep it out of the index. Phase 5 replaces this
// with title, description, and canonical from the record, and unknown slugs
// call notFound().
export async function generateMetadata(
  props: PageProps<"/stacks/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  return { title: slug, robots: { index: false, follow: false } };
}

export default async function StackPage(props: PageProps<"/stacks/[slug]">) {
  const { slug } = await props.params;
  return (
    <Sheet
      number="07"
      route={`/stacks/${slug}`}
      title={slug}
      summary="Automations that connect this pair of tools."
    >
      <Empty what="Automations" />
      <div className="mt-unit">
        <NotBuilt phase={4} />
      </div>
    </Sheet>
  );
}
