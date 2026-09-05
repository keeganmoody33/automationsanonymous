import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireAdmin } from "../lib/adminAuth";
import { checkSlug, LIMITS, validateAutomationPatch } from "../lib/limits";
import {
  automationDoc,
  automationPatchFields,
  statusValidator,
} from "../lib/validators";

/** Full documents (admin shape, includes private fields) for one status, newest first. */
export const listByStatus = query({
  args: { token: v.string(), status: statusValidator },
  returns: v.array(automationDoc),
  handler: async (ctx, args) => {
    await requireAdmin(args.token);
    return await ctx.db
      .query("automations")
      .withIndex("by_status_published", (q) => q.eq("status", args.status))
      .order("desc")
      .take(LIMITS.publishedScan);
  },
});

/**
 * One full document by id, or null. `id` is a plain string so a URL segment can
 * be passed straight through; malformed or wrong-table ids resolve to null via
 * `normalizeId` instead of throwing an ArgumentValidationError.
 */
export const get = query({
  args: { token: v.string(), id: v.string() },
  returns: v.union(automationDoc, v.null()),
  handler: async (ctx, args) => {
    await requireAdmin(args.token);
    const id = ctx.db.normalizeId("automations", args.id);
    if (id === null) return null;
    return await ctx.db.get(id);
  },
});

/**
 * Edit content fields. `slug`, `status`, `origin`, `publishedAt`, `importedAt`,
 * `importedFrom`, and `submitterEmail` are not editable here; the validator
 * rejects them and `slug` is additionally rejected by name.
 */
export const update = mutation({
  args: {
    token: v.string(),
    id: v.id("automations"),
    patch: v.object(automationPatchFields),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(args.token);
    if ("slug" in args.patch) throw new ConvexError("slug is permanent and cannot be edited");
    validateAutomationPatch(args.patch);

    const doc = await ctx.db.get(args.id);
    if (doc === null) throw new ConvexError("Not found");

    // Only defined keys are written; Convex strips undefined so this cannot clear fields.
    await ctx.db.patch(args.id, {
      title: args.patch.title?.trim(),
      summary: args.patch.summary?.trim(),
      problem: args.patch.problem,
      trigger: args.patch.trigger,
      steps: args.patch.steps,
      prerequisites: args.patch.prerequisites,
      failureModes: args.patch.failureModes,
      payload: args.patch.payload,
      toolSlugs: args.patch.toolSlugs,
      timeSavedMinutes: args.patch.timeSavedMinutes,
      difficulty: args.patch.difficulty,
      sourceUrl: args.patch.sourceUrl,
      rejectionNote: args.patch.rejectionNote,
      internalNotes: args.patch.internalNotes,
    });
    return null;
  },
});

/** pending | raw -> approved */
export const approve = mutation({
  args: { token: v.string(), id: v.id("automations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(args.token);
    const doc = await ctx.db.get(args.id);
    if (doc === null) throw new ConvexError("Not found");
    if (doc.status !== "pending" && doc.status !== "raw") {
      throw new ConvexError(`Cannot approve from status "${doc.status}"`);
    }
    await ctx.db.patch(args.id, { status: "approved" });
    return null;
  },
});

/** raw | pending | approved -> rejected, with a note. Published records are not unpublished here. */
export const reject = mutation({
  args: { token: v.string(), id: v.id("automations"), note: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(args.token);
    if (args.note.length > LIMITS.note) {
      throw new ConvexError(`note must be at most ${LIMITS.note} characters`);
    }
    const doc = await ctx.db.get(args.id);
    if (doc === null) throw new ConvexError("Not found");
    if (doc.status === "published" || doc.status === "rejected") {
      throw new ConvexError(`Cannot reject from status "${doc.status}"`);
    }
    await ctx.db.patch(args.id, { status: "rejected", rejectionNote: args.note });
    return null;
  },
});

/** raw -> pending */
export const promoteRaw = mutation({
  args: { token: v.string(), id: v.id("automations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(args.token);
    const doc = await ctx.db.get(args.id);
    if (doc === null) throw new ConvexError("Not found");
    if (doc.status !== "raw") throw new ConvexError(`Cannot promote from status "${doc.status}"`);
    await ctx.db.patch(args.id, { status: "pending" });
    return null;
  },
});

/**
 * approved -> published. The only code path that writes `status: "published"`.
 * Assigns the permanent slug (validated, unique via by_slug) and `publishedAt`.
 * If the record already carries a slug, `args.slug` must equal it.
 */
export const publish = mutation({
  args: { token: v.string(), id: v.id("automations"), slug: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(args.token);
    checkSlug(args.slug);

    const doc = await ctx.db.get(args.id);
    if (doc === null) throw new ConvexError("Not found");
    if (doc.status !== "approved") {
      throw new ConvexError(`Cannot publish from status "${doc.status}"; only approved records publish`);
    }
    if (doc.slug !== undefined && doc.slug !== args.slug) {
      throw new ConvexError("slug is permanent and does not match the record's existing slug");
    }

    const existing = await ctx.db
      .query("automations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (existing !== null && existing._id !== args.id) {
      throw new ConvexError("slug is already in use");
    }

    await ctx.db.patch(args.id, {
      slug: args.slug,
      status: "published",
      publishedAt: Date.now(),
    });
    return null;
  },
});
