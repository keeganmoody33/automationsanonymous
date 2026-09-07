import { SITE_URL } from "@/lib/schema-org";
import { json, preflight } from "@/lib/api";

export const revalidate = 3600;

/*
  Capability manifest. An agent that lands here learns what it can do without
  reading prose: every read view, the one write, and the MCP endpoint. Kept in
  step with the routes below it and with the parity table in CLAUDE.md.
*/
export function GET() {
  return json({
    name: "Automations Anonymous",
    description:
      "A public directory of working automations, each a structured record with trigger, steps, prerequisites, failure modes, and the runnable payload. Submitted anonymously; there are no authors or accounts.",
    site: SITE_URL,
    mcp: `${SITE_URL}/mcp`,
    corpus: {
      index: `${SITE_URL}/llms.txt`,
      full: `${SITE_URL}/llms-full.txt`,
      sitemap: `${SITE_URL}/sitemap.xml`,
    },
    endpoints: [
      {
        method: "GET",
        path: "/api/automations",
        description: "Published automations, newest first.",
        query: {
          tool: "tool slug, e.g. cron",
          category: "tool category, e.g. chat",
          difficulty: "beginner | intermediate | advanced",
          q: "case-insensitive substring match on title, summary, problem and steps",
          limit: "1 to 100, default 50",
        },
      },
      {
        method: "GET",
        path: "/api/automations/{slug}",
        description: "One record. Append .md for the plain-text form, which includes the payload verbatim.",
      },
      { method: "GET", path: "/api/tools", description: "Every tool referenced by a published record, with counts." },
      { method: "GET", path: "/api/tools/{slug}", description: "One tool and the automations that use it." },
      {
        method: "GET",
        path: "/api/stacks/{a}-to-{b}",
        description: "Automations that connect two tools. Slugs may themselves contain -to-; every split is tried.",
      },
      { method: "GET", path: "/api/blog", description: "Published posts, newest first." },
      { method: "GET", path: "/api/blog/{slug}", description: "One post. Append .md for the body as Markdown." },
      {
        method: "POST",
        path: "/api/submit",
        description:
          "Submit an automation anonymously. Lands in a review queue as pending; a person reviews it before it is published. Body matches the record shape: title, summary, steps, prerequisites, failureModes, toolSlugs, difficulty, and optional problem, trigger, payload, timeSavedMinutes, sourceUrl, submitterEmail.",
      },
    ],
    rules: [
      "Slugs are permanent once published, so a citation resolves later.",
      "No record has an author. There are no accounts and no public identities.",
      "A submitted email address is stored for reply only and is never returned by any public endpoint.",
      "Payloads are reproduced verbatim and are never paraphrased.",
    ],
  });
}

export const OPTIONS = preflight;
