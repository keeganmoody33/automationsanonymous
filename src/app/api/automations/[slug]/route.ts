import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { SITE_URL } from "@/lib/schema-org";
import { howTo } from "@/lib/schema-org";
import { recordToMarkdown } from "@/lib/record-text";
import { json, notFound, preflight, splitFormat, text } from "@/lib/api";

/* One published record. `.md` gives the plain-text form, anything else JSON. */
export async function GET(_request: Request, ctx: RouteContext<"/api/automations/[slug]">) {
  const { slug: segment } = await ctx.params;
  const { slug, format } = splitFormat(segment);

  const a = await fetchQuery(api.public.automations.getBySlug, { slug });
  if (!a) return notFound(`automation "${slug}"`);

  if (format === "md") return text(recordToMarkdown(a));

  return json({
    ...a,
    publishedAt: new Date(a.publishedAt).toISOString(),
    url: `${SITE_URL}/automations/${a.slug}`,
    markdown: `${SITE_URL}/api/automations/${a.slug}.md`,
    jsonLd: howTo(a),
  });
}

export const OPTIONS = preflight;
