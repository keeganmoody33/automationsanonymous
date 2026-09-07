import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { SITE_URL } from "@/lib/schema-org";
import { asDifficulty, json, nonEmpty, preflight } from "@/lib/api";

/*
  The filterable index a person gets on /automations, as data. tool, category
  and difficulty are pushed down to Convex; q is a substring match applied
  here because the corpus is editorially small and a search index would be
  premature.
*/
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const q = nonEmpty(params.get("q"))?.toLowerCase();
  const rawLimit = Number(params.get("limit") ?? 50);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.trunc(rawLimit), 1), 100) : 50;

  const items = await fetchQuery(api.public.automations.listPublished, {
    tool: nonEmpty(params.get("tool")),
    category: nonEmpty(params.get("category")),
    difficulty: asDifficulty(params.get("difficulty")),
  });

  const matched = q
    ? items.filter((a) =>
        [a.title, a.summary, a.problem ?? "", ...a.steps.map((s) => s.action)]
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
    : items;

  return json({
    count: matched.length,
    truncated: matched.length > limit,
    automations: matched.slice(0, limit).map((a) => ({
      slug: a.slug,
      title: a.title,
      summary: a.summary,
      difficulty: a.difficulty,
      toolSlugs: a.toolSlugs,
      timeSavedMinutes: a.timeSavedMinutes,
      publishedAt: new Date(a.publishedAt).toISOString(),
      url: `${SITE_URL}/automations/${a.slug}`,
      record: `${SITE_URL}/api/automations/${a.slug}`,
      markdown: `${SITE_URL}/api/automations/${a.slug}.md`,
    })),
  });
}

export const OPTIONS = preflight;
