import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireAdmin } from "../lib/adminAuth";
import { checkSlug, LIMITS } from "../lib/limits";
import { listPublishedDocs } from "../lib/published";
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

/**
 * Delete a tool by slug.
 *
 * Refuses when a *published* automation still lists the slug in `toolSlugs`.
 * The tool row is only a display record, so deleting it does not damage the
 * automation, but every published automation renders its toolSlugs as links to
 * `/tools/<slug>`: dropping the row turns those into 404s and removes the tool
 * from the index while the links remain. Edit or remove the automations first,
 * then delete the tool. Unpublished records (raw, pending, approved, rejected)
 * do not block the delete, since nothing public links to them.
 */
export const remove = mutation({
  args: { token: v.string(), slug: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(args.token);

    const tool = await ctx.db
      .query("tools")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (tool === null) throw new ConvexError("Not found");

    const published = await listPublishedDocs(ctx);
    const referencing = published.filter((doc) => doc.toolSlugs.includes(args.slug));
    if (referencing.length > 0) {
      throw new ConvexError(
        `Cannot delete "${args.slug}": ${referencing.length} published automation(s) still reference it (${referencing
          .slice(0, 5)
          .map((doc) => doc.slug)
          .join(", ")}). Edit or remove those first.`,
      );
    }

    await ctx.db.delete(tool._id);
    return null;
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
