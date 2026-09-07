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

/**
 * Payload formats a submission may declare. A fixed allowlist, not a free
 * string: `format` is echoed verbatim into a fenced code block on every
 * published page and into the llms-full.txt feed, so an unbounded value lands
 * straight in public output. `text` is the escape hatch for anything unlisted.
 */
export const PAYLOAD_FORMATS = [
  "sh",
  "bash",
  "yaml",
  "yml",
  "json",
  "xml",
  "javascript",
  "js",
  "python",
  "cron",
  "text",
  "toml",
  "ini",
  "sql",
  "hcl",
] as const;

export type PayloadFormat = (typeof PAYLOAD_FORMATS)[number];

const PAYLOAD_FORMAT_SET: ReadonlySet<string> = new Set(PAYLOAD_FORMATS);

/** Shortest trimmed payload content worth publishing, any format. */
const PAYLOAD_CONTENT_MIN = 8;

/** Shorthand schedules accepted in place of the five cron schedule fields. */
const CRON_MACROS = [
  "@reboot",
  "@daily",
  "@hourly",
  "@weekly",
  "@monthly",
  "@yearly",
  "@annually",
  "@midnight",
] as const;

const CRON_MACRO_SET: ReadonlySet<string> = new Set(CRON_MACROS);

/** A line, truncated, safe to put inside an error message. */
function quoteLine(line: string): string {
  return line.length > 60 ? `${line.slice(0, 60)}...` : line;
}

function checkJsonPayload(content: string) {
  try {
    JSON.parse(content);
  } catch {
    fail("payload content must be valid JSON when format is json");
  }
}

/**
 * Environment assignments (`SHELL=/bin/sh`, `MAILTO=""`, `PATH=...`) are
 * ordinary crontab content, not schedules, so they are skipped rather than
 * measured against the field count. Kept byte-identical to the same regex in
 * `src/lib/payload-check.ts` so the two gates agree.
 */
const CRON_ENV_ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*\s*=/;

/**
 * Every non-empty, non-comment, non-assignment line must be a real crontab
 * entry: either five schedule fields plus a command (six or more
 * whitespace-separated fields), or one of the `@`-shorthands followed by a
 * command.
 */
function checkCronPayload(content: string) {
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.length === 0 || line.startsWith("#")) continue;
    if (CRON_ENV_ASSIGNMENT.test(line)) continue;
    const fields = line.split(/\s+/);
    // The shorthand branch must come first: `@reboot /usr/bin/foo` is two
    // fields and would fail the six-field count.
    if (fields[0].startsWith("@")) {
      if (!CRON_MACRO_SET.has(fields[0])) {
        fail(
          `payload content line "${quoteLine(line)}" uses an unknown cron shorthand; allowed: ${CRON_MACROS.join(", ")}`,
        );
      }
      if (fields.length < 2) {
        fail(`payload content line "${quoteLine(line)}" must be a cron shorthand followed by a command`);
      }
    } else if (fields.length < 6) {
      fail(
        `payload content line "${quoteLine(line)}" must have at least 6 whitespace-separated fields (5 schedule fields plus a command) when format is cron`,
      );
    }
  }
}

/**
 * Structural sanity for `payload.content`, keyed off `payload.format`.
 *
 * Deliberately cheap: the Convex runtime ships no parser libraries, so this is
 * an allowlisted format, a real `JSON.parse` for json, and a field-count walk
 * for cron. It is a backstop, not a linter. The Next.js side runs a fuller
 * per-format parse in the shared zod schema and covers all three write paths
 * (browser form, `POST /api/submit`, MCP `submit_automation`), but
 * `NEXT_PUBLIC_CONVEX_URL` is public, so `submit` is callable directly and has
 * to hold this line on its own.
 *
 * `format` is matched exactly, not case-folded or trimmed, because the stored
 * value is what gets rendered as the code-fence tag.
 */
function checkPayloadShape(format: string, content: string) {
  if (!PAYLOAD_FORMAT_SET.has(format)) {
    fail(`payload format must be one of: ${PAYLOAD_FORMATS.join(", ")}`);
  }
  const trimmed = content.trim();
  if (trimmed.length < PAYLOAD_CONTENT_MIN) {
    fail(`payload content must be at least ${PAYLOAD_CONTENT_MIN} characters`);
  }
  if (format === "json") checkJsonPayload(trimmed);
  if (format === "cron") checkCronPayload(trimmed);
}

export function checkPayload(payload: NonNullable<AutomationContent["payload"]>) {
  checkText(payload.format, LIMITS.payloadFormat, "payload format", true);
  checkText(payload.content, LIMITS.payloadContent, "payload content", true);
  checkPayloadShape(payload.format, payload.content);
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
