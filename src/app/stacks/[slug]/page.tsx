import type { Metadata } from "next";
import { Empty, NotBuilt, Sheet } from "@/components/sheet";

export async function generateMetadata(
  props: PageProps<"/stacks/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  return { title: slug, alternates: { canonical: `/stacks/${slug}` } };
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
