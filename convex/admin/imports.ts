import { ConvexError, v } from "convex/values";
import { mutation } from "../_generated/server";
import { requireAdmin } from "../lib/adminAuth";
import { LIMITS, validateAutomationContent } from "../lib/limits";
import { automationContentFields } from "../lib/validators";

/**
 * Bulk insert with `origin: "imported"`, `status: "raw"`, `importedAt: now`.
 * Raw records cannot be published without passing through review
 * (promoteRaw or approve, then publish). Batch capped at LIMITS.importBatch.
 */
export const importAutomations = mutation({
  args: {
    token: v.string(),
    items: v.array(
      v.object({
        ...automationContentFields,
        internalNotes: v.optional(v.string()),
      }),
    ),
    importedFrom: v.string(),
  },
  returns: v.array(v.id("automations")),
  handler: async (ctx, args) => {
    await requireAdmin(args.token);
    if (args.items.length === 0) throw new ConvexError("items must not be empty");
    if (args.items.length > LIMITS.importBatch) {
      throw new ConvexError(`items must have at most ${LIMITS.importBatch} entries per call`);
    }
    if (args.importedFrom.trim().length === 0 || args.importedFrom.length > LIMITS.url) {
      throw new ConvexError("importedFrom is required");
    }

    // Validate the whole batch before writing anything so a bad item fails the batch cleanly.
    for (const item of args.items) {
      const { internalNotes, ...content } = item;
      validateAutomationContent(content);
      if (internalNotes !== undefined && internalNotes.length > LIMITS.note) {
        throw new ConvexError(`internalNotes must be at most ${LIMITS.note} characters`);
      }
    }

    const importedAt = Date.now();
    const ids = [];
    for (const item of args.items) {
      ids.push(
        await ctx.db.insert("automations", {
          title: item.title.trim(),
          summary: item.summary.trim(),
          problem: item.problem,
          trigger: item.trigger,
          steps: item.steps,
          prerequisites: item.prerequisites,
          failureModes: item.failureModes,
          payload: item.payload,
          toolSlugs: item.toolSlugs,
          timeSavedMinutes: item.timeSavedMinutes,
          difficulty: item.difficulty,
          sourceUrl: item.sourceUrl,
          internalNotes: item.internalNotes,
          origin: "imported",
          importedFrom: args.importedFrom,
          importedAt,
          status: "raw",
        }),
      );
    }
    return ids;
  },
});
