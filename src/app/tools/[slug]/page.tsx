import type { Metadata } from "next";
import { Empty, NotBuilt, Sheet } from "@/components/sheet";

export async function generateMetadata(
  props: PageProps<"/tools/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  return { title: slug, alternates: { canonical: `/tools/${slug}` } };
}

export default async function ToolPage(props: PageProps<"/tools/[slug]">) {
  const { slug } = await props.params;
  return (
    <Sheet
      number="06"
      route={`/tools/${slug}`}
      title={slug}
      summary={`Automations using ${slug}.`}
    >
      <Empty what="Automations" />
      <div className="mt-unit">
        <NotBuilt phase={4} />
      </div>
    </Sheet>
  );
}
