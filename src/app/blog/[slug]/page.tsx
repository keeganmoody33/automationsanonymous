import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPost, listPosts } from "@/lib/blog";
import { Sheet } from "@/components/sheet";
import { JsonLd, article } from "@/lib/schema-org";

// Every post is prerendered; anything not in content/blog is a 404.
export const dynamicParams = false;

export async function generateStaticParams() {
  const posts = listPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getPost(slug);
  if (!post || post.draft) return { title: "Not found", robots: { index: false, follow: false } };
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
  };
}

export default async function BlogPost(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = await getPost(slug);
  if (!post || post.draft) notFound();
  const { Content } = post;
  return (
    <Sheet number="09" route={`/blog/${post.slug}`} title={post.title} summary={post.description}>
      <JsonLd data={article(post)} />
      <p className="text-chrome text-ink-3">
        {post.date}
        {post.updated ? ` · updated ${post.updated}` : ""}
      </p>
      <div className="mt-unit-2">
        <Content />
      </div>
    </Sheet>
  );
}
