import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import type { PublicAutomation } from "@convex/lib/publicShape";
import { SITE_URL } from "@/lib/schema-org";

export const dynamic = "force-static";
export const revalidate = 300;

// Every published record as plain text, payloads included and verbatim.
function render(a: PublicAutomation): string {
  const lines: string[] = [];
  lines.push(`# ${a.title}`, "", a.summary, "", `URL: ${SITE_URL}/automations/${a.slug}`);
  lines.push(`Difficulty: ${a.difficulty}`);
  if (a.timeSavedMinutes) lines.push(`Time saved: ${a.timeSavedMinutes} minutes per run`);
  lines.push(`Tools: ${a.toolSlugs.join(", ") || "none"}`);
  if (a.problem) lines.push("", "## Problem", "", a.problem);
  if (a.trigger) lines.push("", "## Trigger", "", a.trigger);
  if (a.prerequisites.length) lines.push("", "## Prerequisites", "", ...a.prerequisites.map((p) => `- ${p}`));
  lines.push("", "## Steps", "");
  for (const s of [...a.steps].sort((x, y) => x.order - y.order)) {
    lines.push(`${s.order}. ${s.action}${s.toolSlug ? ` (${s.toolSlug})` : ""}`);
    if (s.detail) lines.push(`   ${s.detail}`);
  }
  if (a.payload) {
    lines.push("", `## Payload (${a.payload.format})`, "", "```" + a.payload.format, a.payload.content, "```");
    if (a.payload.sourceUrl) lines.push(`Source: ${a.payload.sourceUrl}`);
  }
  if (a.failureModes.length) lines.push("", "## Failure modes", "", ...a.failureModes.map((f) => `- ${f}`));
  if (a.sourceUrl) lines.push("", `Origin: ${a.origin}, ${a.sourceUrl}`);
  return lines.join("\n");
}

export async function GET() {
  const items = await fetchQuery(api.public.automations.listPublished, {});
  const head = [
    "# Automations Anonymous: full corpus",
    "",
    `${items.length} published automation${items.length === 1 ? "" : "s"}. Each record: summary, tools, steps, payload verbatim, failure modes. No authors.`,
    `Site: ${SITE_URL}`,
    "",
  ].join("\n");
  const body = items.map(render).join("\n\n---\n\n");
  return new Response(`${head}\n${body}\n`, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
