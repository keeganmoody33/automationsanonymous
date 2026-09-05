import type { Metadata } from "next";
import { NotBuilt, Sheet } from "@/components/sheet";

export async function generateMetadata(
  props: PageProps<"/blog/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  return { title: slug, alternates: { canonical: `/blog/${slug}` } };
}

export default async function BlogPost(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  return (
    <Sheet number="09" route={`/blog/${slug}`} title={slug}>
      <NotBuilt phase={5} />
    </Sheet>
  );
}
