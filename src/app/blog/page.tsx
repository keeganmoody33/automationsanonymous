import type { Metadata } from "next";
import Link from "next/link";
import { listPosts } from "@/lib/blog";
import { Empty, Sheet } from "@/components/sheet";

export const metadata: Metadata = {
  title: "Blog",
  description: "Editorial posts on automation, written in-repo as MDX.",
  alternates: { canonical: "/blog" },
};

export default async function BlogIndex() {
  const posts = listPosts();
  return (
    <Sheet number="08" route="/blog" title="Blog" summary="Editorial posts on automation. Written in the repo, not in the database.">
      {posts.length === 0 ? (
        <Empty what="Posts" />
      ) : (
        <ol className="border-t-hairline">
          {posts.map((p) => (
            <li key={p.slug} className="border-b-hairline py-unit-2">
              <p className="text-chrome text-ink-3">{p.date}</p>
              <h2 className="mt-tick text-xl leading-tight">
                <Link href={`/blog/${p.slug}`} className="hover:text-mark">
                  {p.title}
                </Link>
              </h2>
              <p className="mt-tick max-w-[64ch] text-ink">{p.description}</p>
            </li>
          ))}
        </ol>
      )}
    </Sheet>
  );
}
