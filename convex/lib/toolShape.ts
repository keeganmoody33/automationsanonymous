/**
 * The public projection of a tool: catalog fields plus the count of published
 * automations that reference it.
 */
import { v } from "convex/values";
import type { Infer } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import { toolFields } from "./validators";
import type { PublishedAutomation } from "./publicShape";

export const publicToolValidator = v.object({
  slug: toolFields.slug,
  name: toolFields.name,
  category: toolFields.category,
  website: toolFields.website,
  automationCount: v.number(),
});

export type PublicTool = Infer<typeof publicToolValidator>;

export function toPublicTool(tool: Doc<"tools">, automationCount: number): PublicTool {
  return {
    slug: tool.slug,
    name: tool.name,
    category: tool.category,
    website: tool.website,
    automationCount,
  };
}

/** Count of published automations per tool slug. */
export function countByToolSlug(published: PublishedAutomation[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const doc of published) {
    for (const slug of doc.toolSlugs) {
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
  }
  return counts;
}
