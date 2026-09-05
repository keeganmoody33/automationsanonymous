/**
 * Shared validators derived from the schema so every function stays in sync
 * with `convex/schema.ts`. Nothing here is registered as a function.
 */
import { v } from "convex/values";
import schema from "../schema";

/** Field validators of the `automations` table, exactly as declared in the schema. */
export const automationFields = schema.tables.automations.validator.fields;

/** Field validators of the `tools` table. */
export const toolFields = schema.tables.tools.validator.fields;

/** Whole `automations` document, including `_id` and `_creationTime`. Admin-only shape. */
export const automationDoc = schema.doc("automations");

/** Whole `tools` document. */
export const toolDoc = schema.doc("tools");

export const difficultyValidator = automationFields.difficulty;
export const statusValidator = automationFields.status;
export const originValidator = automationFields.origin;
export const stepsValidator = automationFields.steps;
export const payloadValidator = automationFields.payload;

/**
 * Editable content fields: what a submitter or importer supplies, and what an
 * admin may patch. Excludes slug, status, origin, publishedAt, importedAt,
 * importedFrom, and submitterEmail on purpose.
 */
export const automationContentFields = {
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
};

/** Same fields, every one optional, for admin `update` patches. */
export const automationPatchFields = {
  title: v.optional(automationFields.title),
  summary: v.optional(automationFields.summary),
  problem: automationFields.problem,
  trigger: automationFields.trigger,
  steps: v.optional(automationFields.steps),
  prerequisites: v.optional(automationFields.prerequisites),
  failureModes: v.optional(automationFields.failureModes),
  payload: automationFields.payload,
  toolSlugs: v.optional(automationFields.toolSlugs),
  timeSavedMinutes: automationFields.timeSavedMinutes,
  difficulty: v.optional(automationFields.difficulty),
  sourceUrl: automationFields.sourceUrl,
  rejectionNote: automationFields.rejectionNote,
  internalNotes: automationFields.internalNotes,
};
