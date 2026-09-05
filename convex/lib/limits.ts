/**
 * Input limits and content validation shared by `submit`, admin `update`, and
 * admin `importAutomations`. Convex validators check shape; this checks size
 * and sanity. Throws `ConvexError` with a human-readable message.
 */
import { ConvexError } from "convex/values";
import type { automationContentFields } from "./validators";
import type { ObjectType } from "convex/values";

export type AutomationContent = ObjectType<typeof automationContentFields>;
export type AutomationContentPatch = Partial<AutomationContent> & {
  rejectionNote?: string;
  internalNotes?: string;
};

export const LIMITS = {
  title: 140,
  summary: 300,
  problem: 2000,
  trigger: 2000,
  steps: 50,
  stepAction: 500,
  stepDetail: 2000,
  listItems: 30,
  listItem: 500,
  payloadFormat: 40,
  payloadContent: 50_000,
  toolSlugs: 20,
  url: 2048,
  email: 254,
  timeSavedMinutesMax: 100_000,
  note: 4000,
  importBatch: 200,
  /**
   * Upper bound on rows read by any published-content scan. Published
   * automations are an editorially curated set, far below this; the cap keeps
   * every public query inside Convex's per-function read limit regardless.
   */
  publishedScan: 2000,
  /** Upper bound on rows read from the curated `tools` catalog. */
  toolScan: 1000,
} as const;

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fail(message: string): never {
  throw new ConvexError(message);
}

function checkText(value: string, max: number, label: string, required: boolean) {
  const trimmed = value.trim();
  if (required && trimmed.length === 0) fail(`${label} is required`);
  if (value.length > max) fail(`${label} must be at most ${max} characters`);
}

function checkUrl(value: string, label: string) {
  if (value.length > LIMITS.url) fail(`${label} must be at most ${LIMITS.url} characters`);
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    fail(`${label} must be a valid URL`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    fail(`${label} must be an http or https URL`);
  }
}

function checkStringList(values: string[], label: string) {
  if (values.length > LIMITS.listItems) fail(`${label} must have at most ${LIMITS.listItems} items`);
  for (const item of values) {
    if (item.trim().length === 0) fail(`${label} items must not be empty`);
    if (item.length > LIMITS.listItem) fail(`${label} items must be at most ${LIMITS.listItem} characters`);
  }
}

export function checkSlug(slug: string, label = "slug") {
  if (slug.length === 0 || slug.length > 120 || !SLUG_RE.test(slug)) {
    fail(`${label} must match ${SLUG_RE.source}`);
  }
}

export function checkToolSlugs(toolSlugs: string[]) {
  if (toolSlugs.length > LIMITS.toolSlugs) fail(`toolSlugs must have at most ${LIMITS.toolSlugs} items`);
  const seen = new Set<string>();
  for (const slug of toolSlugs) {
    checkSlug(slug, "toolSlugs entry");
    if (seen.has(slug)) fail(`toolSlugs contains a duplicate: ${slug}`);
    seen.add(slug);
  }
}

export function checkSteps(steps: AutomationContent["steps"]) {
  if (steps.length > LIMITS.steps) fail(`steps must have at most ${LIMITS.steps} items`);
  const orders = new Set<number>();
  for (const step of steps) {
    if (orders.has(step.order)) fail(`step order ${step.order} is duplicated; orders must be unique`);
    orders.add(step.order);
    if (!Number.isInteger(step.order) || step.order < 0 || step.order > LIMITS.steps) {
      fail(`step order must be an integer between 0 and ${LIMITS.steps}`);
    }
    checkText(step.action, LIMITS.stepAction, "step action", true);
    if (step.detail !== undefined) checkText(step.detail, LIMITS.stepDetail, "step detail", false);
    if (step.toolSlug !== undefined) checkSlug(step.toolSlug, "step toolSlug");
  }
}

export function checkPayload(payload: NonNullable<AutomationContent["payload"]>) {
  checkText(payload.format, LIMITS.payloadFormat, "payload format", true);
  checkText(payload.content, LIMITS.payloadContent, "payload content", true);
  if (payload.sourceUrl !== undefined) checkUrl(payload.sourceUrl, "payload sourceUrl");
}

export function checkTimeSaved(minutes: number) {
  if (!Number.isFinite(minutes) || minutes < 0 || minutes > LIMITS.timeSavedMinutesMax) {
    fail(`timeSavedMinutes must be a finite number between 0 and ${LIMITS.timeSavedMinutesMax}`);
  }
}

export function checkEmail(email: string) {
  if (email.length > LIMITS.email || !EMAIL_RE.test(email)) fail("submitterEmail must be a valid email");
}

/** Validates a complete content record (submit, import). */
export function validateAutomationContent(input: AutomationContent) {
  checkText(input.title, LIMITS.title, "title", true);
  checkText(input.summary, LIMITS.summary, "summary", true);
  if (input.problem !== undefined) checkText(input.problem, LIMITS.problem, "problem", false);
  if (input.trigger !== undefined) checkText(input.trigger, LIMITS.trigger, "trigger", false);
  checkSteps(input.steps);
  checkStringList(input.prerequisites, "prerequisites");
  checkStringList(input.failureModes, "failureModes");
  if (input.payload !== undefined) checkPayload(input.payload);
  checkToolSlugs(input.toolSlugs);
  if (input.timeSavedMinutes !== undefined) checkTimeSaved(input.timeSavedMinutes);
  if (input.sourceUrl !== undefined) checkUrl(input.sourceUrl, "sourceUrl");
}

/** Validates only the keys present in an admin patch. */
export function validateAutomationPatch(patch: AutomationContentPatch) {
  if (patch.title !== undefined) checkText(patch.title, LIMITS.title, "title", true);
  if (patch.summary !== undefined) checkText(patch.summary, LIMITS.summary, "summary", true);
  if (patch.problem !== undefined) checkText(patch.problem, LIMITS.problem, "problem", false);
  if (patch.trigger !== undefined) checkText(patch.trigger, LIMITS.trigger, "trigger", false);
  if (patch.steps !== undefined) checkSteps(patch.steps);
  if (patch.prerequisites !== undefined) checkStringList(patch.prerequisites, "prerequisites");
  if (patch.failureModes !== undefined) checkStringList(patch.failureModes, "failureModes");
  if (patch.payload !== undefined) checkPayload(patch.payload);
  if (patch.toolSlugs !== undefined) checkToolSlugs(patch.toolSlugs);
  if (patch.timeSavedMinutes !== undefined) checkTimeSaved(patch.timeSavedMinutes);
  if (patch.sourceUrl !== undefined) checkUrl(patch.sourceUrl, "sourceUrl");
  if (patch.rejectionNote !== undefined) checkText(patch.rejectionNote, LIMITS.note, "rejectionNote", false);
  if (patch.internalNotes !== undefined) checkText(patch.internalNotes, LIMITS.note, "internalNotes", false);
}
