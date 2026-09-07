import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { SITE_URL } from "@/lib/schema-org";
import { json, notFound, preflight } from "@/lib/api";

export async function GET(_request: Request, ctx: RouteContext<"/api/tools/[slug]">) {
  const { slug } = await ctx.params;
  const [tool, items] = await Promise.all([
    fetchQuery(api.public.tools.getBySlug, { slug }),
    fetchQuery(api.public.automations.listByTool, { toolSlug: slug }),
  ]);
  if (!tool) return notFound(`tool "${slug}"`);

  return json({
    ...tool,
    url: `${SITE_URL}/tools/${tool.slug}`,
    automations: items.map((a) => ({
      slug: a.slug,
      title: a.title,
      summary: a.summary,
      difficulty: a.difficulty,
      record: `${SITE_URL}/api/automations/${a.slug}`,
    })),
  });
}

export const OPTIONS = preflight;
