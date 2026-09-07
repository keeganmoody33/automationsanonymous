import { readFileSync } from "node:fs";
import path from "node:path";
import { getPostMeta } from "@/lib/blog";
import { SITE_URL } from "@/lib/schema-org";
import { json, notFound, preflight, splitFormat, text } from "@/lib/api";

/* One post. `.md` returns the body with the frontmatter block stripped. */
export async function GET(_request: Request, ctx: RouteContext<"/api/blog/[slug]">) {
  const { slug: segment } = await ctx.params;
  const { slug, format } = splitFormat(segment);

  const meta = getPostMeta(slug);
  if (!meta || meta.draft) return notFound(`post "${slug}"`);

  if (format === "md") {
    const raw = readFileSync(path.join(process.cwd(), "content", "blog", `${slug}.mdx`), "utf8");
    return text(raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, ""));
  }

  return json({ ...meta, url: `${SITE_URL}/blog/${meta.slug}`, markdown: `${SITE_URL}/api/blog/${meta.slug}.md` });
}

export const OPTIONS = preflight;
