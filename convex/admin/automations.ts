import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireAdmin } from "../lib/adminAuth";
import {
  checkSlug,
  LIMITS,
  validateAutomationContent,
  validateAutomationPatch,
} from "../lib/limits";
import {
  automationContentFields,
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
 * Author a record in-house: `origin: "authored"`, `status: "pending"`.
 * Pending, not approved, so authored content passes through the same review
 * gate as everything else and nothing writes `published` except `publish`.
 * No slug, no publishedAt, no submitterEmail. Same limits as `submit`.
 */
export const createAuthored = mutation({
  args: {
    token: v.string(),
    ...automationContentFields,
    internalNotes: v.optional(v.string()),
  },
  returns: v.id("automations"),
  handler: async (ctx, args) => {
    await requireAdmin(args.token);
    const { token: _token, internalNotes, ...content } = args;
    validateAutomationContent(content);
    if (internalNotes !== undefined && internalNotes.length > LIMITS.note) {
      throw new ConvexError(`internalNotes must be at most ${LIMITS.note} characters`);
    }

    return await ctx.db.insert("automations", {
      title: content.title.trim(),
      summary: content.summary.trim(),
      problem: content.problem,
      trigger: content.trigger,
      steps: content.steps,
      prerequisites: content.prerequisites,
      failureModes: content.failureModes,
      payload: content.payload,
      toolSlugs: content.toolSlugs,
      timeSavedMinutes: content.timeSavedMinutes,
      difficulty: content.difficulty,
      sourceUrl: content.sourceUrl,
      internalNotes,
      origin: "authored",
      status: "pending",
    });
  },
});

/**
 * Hard delete, admin only. There is no undo and no soft-delete flag.
 *
 * Deleting a *published* record retires a permanent URL and frees its slug for
 * reuse, which is the one way the "slugs are permanent" rule can be broken. Use
 * it for placeholders and mistakes, not as an editorial unpublish.
 *
 * `id` is a plain string, matching `get`, so a route param can be passed
 * straight through: a malformed or wrong-table id raises ConvexError("Not
 * found") rather than an opaque ArgumentValidationError.
 */
export const remove = mutation({
  args: { token: v.string(), id: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(args.token);
    const id = ctx.db.normalizeId("automations", args.id);
    if (id === null) throw new ConvexError("Not found");
    const doc = await ctx.db.get(id);
    if (doc === null) throw new ConvexError("Not found");
    await ctx.db.delete(id);
    return null;
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
