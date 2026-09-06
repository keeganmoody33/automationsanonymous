import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { SITE_URL } from "@/lib/schema-org";
import { json, notFound, preflight } from "@/lib/api";

/* `${a}-to-${b}`. Convex tries every split point, because a tool slug may
   itself contain "-to-". */
export async function GET(_request: Request, ctx: RouteContext<"/api/stacks/[slug]">) {
  const { slug } = await ctx.params;
  const stack = await fetchQuery(api.public.stacks.resolve, { slug });
  if (!stack) return notFound(`stack "${slug}"`);

  return json({
    a: stack.a,
    b: stack.b,
    url: `${SITE_URL}/stacks/${slug}`,
    count: stack.items.length,
    automations: stack.items.map((x) => ({
      slug: x.slug,
      title: x.title,
      summary: x.summary,
      record: `${SITE_URL}/api/automations/${x.slug}`,
    })),
  });
}

export const OPTIONS = preflight;
