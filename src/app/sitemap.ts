import type { MetadataRoute } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { listPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/schema-org";

export const dynamic = "force-static";
export const revalidate = 300;

// Published records plus MDX posts. Admin is never listed. Stack pages are
// not enumerated: they are derived from pairs and discovered through tools.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [automations, tools, posts] = await Promise.all([
    fetchQuery(api.public.automations.listPublished, {}),
    fetchQuery(api.public.tools.list, {}),
    listPosts(),
  ]);
  const at = (p: string) => `${SITE_URL}${p}`;
  return [
    { url: at("/"), changeFrequency: "weekly", priority: 1 },
    { url: at("/automations"), changeFrequency: "daily", priority: 0.9 },
    { url: at("/tools"), changeFrequency: "weekly", priority: 0.6 },
    { url: at("/blog"), changeFrequency: "weekly", priority: 0.6 },
    { url: at("/submit"), changeFrequency: "yearly", priority: 0.3 },
    ...automations.map((a) => ({
      url: at(`/automations/${a.slug}`),
      lastModified: new Date(a.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...tools.map((t) => ({ url: at(`/tools/${t.slug}`), changeFrequency: "weekly" as const, priority: 0.5 })),
    ...posts.map((p) => ({
      url: at(`/blog/${p.slug}`),
      lastModified: p.updated ?? p.date,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
  ];
}
