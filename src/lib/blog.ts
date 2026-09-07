import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import type { MDXProps } from "mdx/types";

/*
  Blog posts live in content/blog/*.mdx, not in Convex. The filename is the
  slug and is permanent.

  Frontmatter is read straight off disk and validated with zod, so the index,
  the sitemap and the API can list posts without importing every MDX module.
  Only the post page itself imports a module, and only for its component.
  remark-frontmatter strips the block from the rendered output.

  Every post is read at build time (generateStaticParams plus the index), so
  an invalid file fails the build rather than 500ing in production.
*/

export const frontmatterSchema = z.strictObject({
  title: z.string().min(1).max(140),
  description: z.string().min(1).max(300),
  /** Publication date, YYYY-MM-DD. */
  date: z.iso.date(),
  /** Date of last substantive edit, YYYY-MM-DD. */
  updated: z.iso.date().optional(),
  /** Drafts are excluded from the index, sitemap, API, and static params. */
  draft: z.boolean().optional(),
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;
export type PostMeta = Frontmatter & { slug: string };
export type Post = PostMeta & { Content: (props: MDXProps) => React.JSX.Element };

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/;

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

/** Frontmatter only. Throws on a missing block or an invalid one. */
export function getPostMeta(slug: string): PostMeta | null {
  if (!SLUG.test(slug)) return null;
  let raw: string;
  try {
    raw = readFileSync(path.join(BLOG_DIR, `${slug}.mdx`), "utf8");
  } catch {
    return null;
  }
  const block = FRONTMATTER.exec(raw);
  if (!block) throw new Error(`content/blog/${slug}.mdx: no frontmatter block at the top of the file`);

  let data: unknown;
  try {
    data = parseYaml(block[1]);
  } catch (err) {
    throw new Error(`content/blog/${slug}.mdx: frontmatter is not valid YAML\n${(err as Error).message}`);
  }

  const parsed = frontmatterSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`content/blog/${slug}.mdx: invalid frontmatter\n${z.prettifyError(parsed.error)}`);
  }
  return { ...parsed.data, slug };
}

export async function getPost(slug: string): Promise<Post | null> {
  const meta = getPostMeta(slug);
  if (!meta) return null;
  const mod = (await import(`@content/blog/${slug}.mdx`)) as { default: Post["Content"] };
  return { ...meta, Content: mod.default };
}

/** Published posts, newest first. Throws on any invalid file. */
export function listPosts(): PostMeta[] {
  return listSlugs()
    .map((slug) => getPostMeta(slug))
    .filter((p): p is PostMeta => p !== null && !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}
