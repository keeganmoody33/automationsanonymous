/**
 * The one public projection of an automation. Every public query returns this
 * and nothing else. `submitterEmail`, `rejectionNote`, and `internalNotes`
 * are deliberately absent; so are `_id`, `_creationTime`, `status`,
 * `importedFrom`, and `importedAt`.
 */
import { v } from "convex/values";
import type { Infer } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import { automationFields } from "./validators";

export const publicAutomationValidator = v.object({
  slug: v.string(),
  title: automationFields.title,
  summary: automationFields.summary,
  problem: automationFields.problem,
  trigger: automationFields.trigger,
  steps: automationFields.steps,
  prerequisites: automationFields.prerequisites,
  failureModes: automationFields.failureModes,
  payload: automationFields.payload,
  toolSlugs: automationFields.toolSlugs,
  timeSavedMinutes: automationFields.timeSavedMinutes,
  difficulty: automationFields.difficulty,
  sourceUrl: automationFields.sourceUrl,
  origin: automationFields.origin,
  publishedAt: v.number(),
});

export type PublicAutomation = Infer<typeof publicAutomationValidator>;

/** A published document: status is "published" and the permanent slug and publishedAt are set. */
export type PublishedAutomation = Doc<"automations"> & {
  status: "published";
  slug: string;
  publishedAt: number;
};

/** Type guard used by every public read path. */
export function isPublished(doc: Doc<"automations"> | null): doc is PublishedAutomation {
  return (
    doc !== null &&
    doc.status === "published" &&
    typeof doc.slug === "string" &&
    typeof doc.publishedAt === "number"
  );
}

/** Project a published document to the public shape. Field-by-field, never a spread. */
export function toPublicAutomation(doc: PublishedAutomation): PublicAutomation {
  return {
    slug: doc.slug,
    title: doc.title,
    summary: doc.summary,
    problem: doc.problem,
    trigger: doc.trigger,
    steps: doc.steps,
    prerequisites: doc.prerequisites,
    failureModes: doc.failureModes,
    payload: doc.payload,
    toolSlugs: doc.toolSlugs,
    timeSavedMinutes: doc.timeSavedMinutes,
    difficulty: doc.difficulty,
    sourceUrl: doc.sourceUrl,
    origin: doc.origin,
    publishedAt: doc.publishedAt,
  };
}
