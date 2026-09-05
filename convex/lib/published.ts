/**
 * Shared read helper for published automations. Every public query goes
 * through here so the status filter and the read bound live in one place.
 */
import type { QueryCtx } from "../_generated/server";
import { LIMITS } from "./limits";
import { isPublished, type PublishedAutomation } from "./publicShape";

/** Published automations, newest `publishedAt` first, bounded by `LIMITS.publishedScan`. */
export async function listPublishedDocs(ctx: QueryCtx): Promise<PublishedAutomation[]> {
  const rows = await ctx.db
    .query("automations")
    .withIndex("by_status_published", (q) => q.eq("status", "published"))
    .order("desc")
    .take(LIMITS.publishedScan);
  return rows.filter(isPublished);
}
