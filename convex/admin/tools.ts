import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireAdmin } from "../lib/adminAuth";
import { checkSlug, LIMITS } from "../lib/limits";
import { toolDoc } from "../lib/validators";

/** Create or update a tool by slug. Returns the tool id. */
export const upsert = mutation({
  args: {
    token: v.string(),
    slug: v.string(),
    name: v.string(),
    category: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  returns: v.id("tools"),
  handler: async (ctx, args) => {
    await requireAdmin(args.token);
    checkSlug(args.slug);
    if (args.name.trim().length === 0 || args.name.length > LIMITS.title) {
      throw new ConvexError(`name is required and at most ${LIMITS.title} characters`);
    }
    if (args.category !== undefined && (args.category.trim().length === 0 || args.category.length > 80)) {
      throw new ConvexError("category must be 1 to 80 characters");
    }
    if (args.website !== undefined) {
      let parsed: URL;
      try {
        parsed = new URL(args.website);
      } catch {
        throw new ConvexError("website must be a valid URL");
      }
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new ConvexError("website must be an http or https URL");
      }
    }

    const existing = await ctx.db
      .query("tools")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    const fields = {
      slug: args.slug,
      name: args.name.trim(),
      category: args.category,
      website: args.website,
    };

    if (existing === null) {
      return await ctx.db.insert("tools", fields);
    }
    await ctx.db.replace(existing._id, fields);
    return existing._id;
  },
});

/** Every tool, full documents. */
export const list = query({
  args: { token: v.string() },
  returns: v.array(toolDoc),
  handler: async (ctx, args) => {
    await requireAdmin(args.token);
    return await ctx.db.query("tools").take(LIMITS.toolScan);
  },
});
