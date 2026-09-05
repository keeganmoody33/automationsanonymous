import { v } from "convex/values";
import { query } from "../_generated/server";
import type { QueryCtx } from "../_generated/server";
import { publicAutomationValidator, toPublicAutomation } from "../lib/publicShape";
import { listPublishedDocs } from "../lib/published";
import { countByToolSlug, publicToolValidator, toPublicTool } from "../lib/toolShape";

/** Published automations whose toolSlugs include both `a` and `b`, newest first. */
export const listByStack = query({
  args: { a: v.string(), b: v.string() },
  returns: v.array(publicAutomationValidator),
  handler: async (ctx, args) => {
    const docs = await listPublishedDocs(ctx);
    return docs
      .filter((doc) => doc.toolSlugs.includes(args.a) && doc.toolSlugs.includes(args.b))
      .map(toPublicAutomation);
  },
});

export const stackValidator = v.object({
  a: publicToolValidator,
  b: publicToolValidator,
  items: v.array(publicAutomationValidator),
});

const STACK_JOINER = "-to-";
const MAX_STACK_SLUG = 250;

async function getTool(ctx: QueryCtx, slug: string) {
  return await ctx.db
    .query("tools")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
}

/**
 * Resolve a stack page in one query. A stack slug is `${a}-to-${b}` where `a`
 * and `b` are tool slugs; tool slugs may themselves contain "-to-", so every
 * split point is tried against the tools table and the first pair that
 * resolves wins. Returns the two tools plus the published automations that
 * reference both, all from one database snapshot, or null when no split
 * resolves.
 */
export const resolve = query({
  args: { slug: v.string() },
  returns: v.union(stackValidator, v.null()),
  handler: async (ctx, args) => {
    if (args.slug.length === 0 || args.slug.length > MAX_STACK_SLUG) return null;
    const parts = args.slug.split(STACK_JOINER);
    if (parts.length < 2) return null;

    for (let i = 1; i < parts.length; i++) {
      const aSlug = parts.slice(0, i).join(STACK_JOINER);
      const bSlug = parts.slice(i).join(STACK_JOINER);
      if (aSlug === bSlug) continue;
      const [a, b] = await Promise.all([getTool(ctx, aSlug), getTool(ctx, bSlug)]);
      if (a === null || b === null) continue;

      const published = await listPublishedDocs(ctx);
      const counts = countByToolSlug(published);
      return {
        a: toPublicTool(a, counts.get(a.slug) ?? 0),
        b: toPublicTool(b, counts.get(b.slug) ?? 0),
        items: published
          .filter((doc) => doc.toolSlugs.includes(a.slug) && doc.toolSlugs.includes(b.slug))
          .map(toPublicAutomation),
      };
    }
    return null;
  },
});
