import { listPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/schema-org";
import { json, preflight } from "@/lib/api";

export const dynamic = "force-static";
export const revalidate = 3600;

export function GET() {
  const posts = listPosts();
  return json({
    count: posts.length,
    posts: posts.map((p) => ({
      ...p,
      url: `${SITE_URL}/blog/${p.slug}`,
      markdown: `${SITE_URL}/api/blog/${p.slug}.md`,
    })),
  });
}

export const OPTIONS = preflight;
