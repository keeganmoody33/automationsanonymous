import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { checkEmail, validateAutomationContent } from "./lib/limits";
import { automationContentFields } from "./lib/validators";

/**
 * The only public write. Creates an anonymous submission with
 * `origin: "submitted"` and `status: "pending"`. `submitterEmail` is stored
 * for reply-only use and is never returned by any public function.
 */
export const submit = mutation({
  args: {
    ...automationContentFields,
    submitterEmail: v.optional(v.string()),
  },
  returns: v.id("automations"),
  handler: async (ctx, args) => {
    const { submitterEmail, ...content } = args;
    validateAutomationContent(content);
    if (submitterEmail !== undefined) checkEmail(submitterEmail);

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
      submitterEmail,
      origin: "submitted",
      status: "pending",
    });
  },
});
