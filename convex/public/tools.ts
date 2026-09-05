import { v } from "convex/values";
import { query } from "../_generated/server";
import { LIMITS } from "../lib/limits";
import { listPublishedDocs } from "../lib/published";
import { countByToolSlug, publicToolValidator, toPublicTool } from "../lib/toolShape";

export { publicToolValidator } from "../lib/toolShape";

/** Every tool with its count of published automations, sorted by name. */
export const list = query({
  args: {},
  returns: v.array(publicToolValidator),
  handler: async (ctx) => {
    // The tools table is a small curated catalog; the read is bounded by LIMITS.toolScan.
    const tools = await ctx.db.query("tools").take(LIMITS.toolScan);
    const counts = countByToolSlug(await listPublishedDocs(ctx));
    return tools
      .map((tool) => toPublicTool(tool, counts.get(tool.slug) ?? 0))
      .sort((x, y) => x.name.localeCompare(y.name));
  },
});

/** One tool by slug with its published automation count, or null. */
export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(publicToolValidator, v.null()),
  handler: async (ctx, args) => {
    const tool = await ctx.db
      .query("tools")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (tool === null) return null;
    const published = await listPublishedDocs(ctx);
    const automationCount = published.filter((doc) => doc.toolSlugs.includes(tool.slug)).length;
    return toPublicTool(tool, automationCount);
  },
});

/** Distinct tool categories, sorted. */
export const listCategories = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const tools = await ctx.db.query("tools").take(LIMITS.toolScan);
    const categories = new Set<string>();
    for (const tool of tools) {
      if (tool.category !== undefined && tool.category.length > 0) categories.add(tool.category);
    }
    return [...categories].sort((x, y) => x.localeCompare(y));
  },
});
