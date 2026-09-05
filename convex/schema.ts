import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  automations: defineTable({
    slug: v.optional(v.string()),
    title: v.string(),
    summary: v.string(),
    problem: v.optional(v.string()),
    trigger: v.optional(v.string()),
    steps: v.array(
      v.object({
        order: v.number(),
        action: v.string(),
        toolSlug: v.optional(v.string()),
        detail: v.optional(v.string()),
      }),
    ),
    prerequisites: v.array(v.string()),
    failureModes: v.array(v.string()),
    payload: v.optional(
      v.object({
        format: v.string(),
        content: v.string(),
        sourceUrl: v.optional(v.string()),
      }),
    ),
    toolSlugs: v.array(v.string()),
    timeSavedMinutes: v.optional(v.number()),
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced"),
    ),
    sourceUrl: v.optional(v.string()),
    origin: v.union(
      v.literal("imported"),
      v.literal("submitted"),
      v.literal("authored"),
    ),
    importedFrom: v.optional(v.string()),
    importedAt: v.optional(v.number()),
    submitterEmail: v.optional(v.string()),
    status: v.union(
      v.literal("raw"),
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("published"),
    ),
    rejectionNote: v.optional(v.string()),
    internalNotes: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
  })
    .index("by_status_published", ["status", "publishedAt"])
    .index("by_slug", ["slug"])
    .index("by_origin_status", ["origin", "status"]),

  tools: defineTable({
    slug: v.string(),
    name: v.string(),
    category: v.optional(v.string()),
    website: v.optional(v.string()),
  }).index("by_slug", ["slug"]),
});
