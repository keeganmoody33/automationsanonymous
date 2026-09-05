import { v } from "convex/values";
import { query } from "../_generated/server";
import {
  isPublished,
  publicAutomationValidator,
  toPublicAutomation,
} from "../lib/publicShape";
import { LIMITS } from "../lib/limits";
import { listPublishedDocs } from "../lib/published";
import { difficultyValidator } from "../lib/validators";

/**
 * Published automations, newest first. Optional filters:
 * - `tool`: toolSlugs includes this slug
 * - `category`: toolSlugs intersects the tools in this category
 * - `difficulty`: exact match
 */
export const listPublished = query({
  args: {
    tool: v.optional(v.string()),
    category: v.optional(v.string()),
    difficulty: v.optional(difficultyValidator),
  },
  returns: v.array(publicAutomationValidator),
  handler: async (ctx, args) => {
    let categorySlugs: Set<string> | null = null;
    if (args.category !== undefined) {
      // The tools table is a small curated catalog; the read is bounded by LIMITS.toolScan.
      const tools = await ctx.db.query("tools").take(LIMITS.toolScan);
      categorySlugs = new Set(
        tools.filter((t) => t.category === args.category).map((t) => t.slug),
      );
    }

    const docs = await listPublishedDocs(ctx);
    return docs
      .filter((doc) => args.tool === undefined || doc.toolSlugs.includes(args.tool))
      .filter((doc) => args.difficulty === undefined || doc.difficulty === args.difficulty)
      .filter(
        (doc) =>
          categorySlugs === null || doc.toolSlugs.some((slug) => categorySlugs.has(slug)),
      )
      .map(toPublicAutomation);
  },
});

/** One published automation by its permanent slug, or null. */
export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(publicAutomationValidator, v.null()),
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("automations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!isPublished(doc)) return null;
    return toPublicAutomation(doc);
  },
});

/** Published automations whose toolSlugs include `toolSlug`, newest first. */
export const listByTool = query({
  args: { toolSlug: v.string() },
  returns: v.array(publicAutomationValidator),
  handler: async (ctx, args) => {
    const docs = await listPublishedDocs(ctx);
    return docs
      .filter((doc) => doc.toolSlugs.includes(args.toolSlug))
      .map(toPublicAutomation);
  },
});

/** Slugs of every published automation, newest first. For the sitemap. */
export const listPublishedSlugs = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const docs = await listPublishedDocs(ctx);
    return docs.map((doc) => doc.slug);
  },
});
