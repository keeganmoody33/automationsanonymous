import type { PublicAutomation } from "@convex/lib/publicShape";
import { SITE_URL } from "@/lib/schema-org";

/*
  One automation rendered as plain text. Used by /llms-full.txt, by the
  per-record .md view, and by the MCP server, so a machine reading this
  corpus gets the identical record everywhere.

  The payload is reproduced verbatim, never summarised. That is the point of
  the field.
*/
export function recordToMarkdown(a: PublicAutomation): string {
  const out: string[] = [];
  out.push(`# ${a.title}`, "", a.summary, "");
  out.push(`URL: ${SITE_URL}/automations/${a.slug}`);
  out.push(`Difficulty: ${a.difficulty}`);
  if (a.timeSavedMinutes) out.push(`Time saved: ${a.timeSavedMinutes} minutes per run`);
  out.push(`Tools: ${a.toolSlugs.join(", ") || "none"}`);
  out.push(`Published: ${new Date(a.publishedAt).toISOString().slice(0, 10)}`);

  if (a.problem) out.push("", "## Problem", "", a.problem);
  if (a.trigger) out.push("", "## Trigger", "", a.trigger);

  if (a.prerequisites.length) {
    out.push("", "## Prerequisites", "");
    for (const p of a.prerequisites) out.push(`- ${p}`);
  }

  out.push("", "## Steps", "");
  for (const s of [...a.steps].sort((x, y) => x.order - y.order)) {
    out.push(`${s.order}. ${s.action}${s.toolSlug ? ` (${s.toolSlug})` : ""}`);
    if (s.detail) out.push(`   ${s.detail}`);
  }

  if (a.payload) {
    out.push("", `## Payload (${a.payload.format})`, "", "```" + a.payload.format, a.payload.content, "```");
    if (a.payload.sourceUrl) out.push("", `Source: ${a.payload.sourceUrl}`);
  }

  if (a.failureModes.length) {
    out.push("", "## Failure modes", "");
    for (const f of a.failureModes) out.push(`- ${f}`);
  }

  if (a.sourceUrl) out.push("", `Origin: ${a.origin}, ${a.sourceUrl}`);
  return out.join("\n");
}
