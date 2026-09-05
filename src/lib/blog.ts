import { readdirSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { MDXProps } from "mdx/types";

/*
  Blog posts live in content/blog/*.mdx, not in Convex. The filename is the
  slug and is permanent. Frontmatter is validated with zod when a post is
  loaded; every post is loaded at build time (generateStaticParams plus the
  index), so an invalid file fails the build.
*/

export const frontmatterSchema = z.strictObject({
  title: z.string().min(1).max(140),
  description: z.string().min(1).max(300),
  /** Publication date, YYYY-MM-DD. */
  date: z.iso.date(),
  /** Date of last substantive edit, YYYY-MM-DD. */
  updated: z.iso.date().optional(),
  /** Drafts are excluded from the index, sitemap, and static params. */
  draft: z.boolean().optional(),
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;

export type Post = Frontmatter & {
  slug: string;
  Content: (props: MDXProps) => React.JSX.Element;
};

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function listSlugs(): string[] {
  return readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.slice(0, -4))
    .filter((slug) => {
      if (!SLUG.test(slug)) throw new Error(`content/blog/${slug}.mdx: filename must match ${SLUG}`);
      return true;
    })
    .sort();
}

export async function getPost(slug: string): Promise<Post | null> {
  if (!SLUG.test(slug)) return null;
  let mod: { default: Post["Content"]; frontmatter: unknown };
  try {
    mod = await import(`@content/blog/${slug}.mdx`);
  } catch {
    return null;
  }
  const parsed = frontmatterSchema.safeParse(mod.frontmatter);
  if (!parsed.success) {
    throw new Error(`content/blog/${slug}.mdx: invalid frontmatter\n${z.prettifyError(parsed.error)}`);
  }
  return { ...parsed.data, slug, Content: mod.default };
}

/** Published posts, newest first. Throws on any invalid file. */
export async function listPosts(): Promise<Post[]> {
  const posts = await Promise.all(listSlugs().map((slug) => getPost(slug)));
  return posts
    .filter((p): p is Post => p !== null && !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}
