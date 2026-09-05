import { z } from "zod";

/*
  The automation form is text: one line per step, one line per list item,
  comma-separated tool slugs. This file owns the mapping between that text and
  the structured record Convex stores, in both directions, so the public
  submit form and the admin editor cannot drift.

  Step line format:  action | toolSlug | detail    (tool and detail optional)
*/

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;

const lines = (s: string) =>
  s
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

const opt = (s: string | undefined) => (s && s.trim() ? s.trim() : undefined);

const url = z
  .string()
  .trim()
  .max(2048)
  .refine((s) => s === "" || /^https?:\/\//.test(s), "must start with http:// or https://");

export const automationFormSchema = z.object({
  title: z.string().trim().min(3, "at least 3 characters").max(140),
  summary: z.string().trim().min(20, "one full sentence, at least 20 characters").max(300),
  problem: z.string().trim().max(2000).optional(),
  trigger: z.string().trim().max(2000).optional(),
  steps: z
    .string()
    .refine((s) => lines(s).length >= 1, "at least one step")
    .refine((s) => lines(s).length <= 50, "at most 50 steps")
    .refine(
      (s) => lines(s).every((l) => !l.split("|")[1]?.trim() || SLUG.test(l.split("|")[1].trim())),
      "tool slugs are lowercase words joined by hyphens",
    ),
  prerequisites: z.string().refine((s) => lines(s).length <= 30, "at most 30 items"),
  failureModes: z.string().refine((s) => lines(s).length <= 30, "at most 30 items"),
  toolSlugs: z
    .string()
    .trim()
    .refine((s) => s.split(",").map((t) => t.trim()).filter(Boolean).length <= 20, "at most 20 tools")
    .refine(
      (s) => s.split(",").map((t) => t.trim()).filter(Boolean).every((t) => SLUG.test(t)),
      "tool slugs are lowercase words joined by hyphens, separated by commas",
    ),
  timeSavedMinutes: z
    .string()
    .trim()
    .refine((s) => s === "" || (/^\d+$/.test(s) && Number(s) <= 100_000), "whole minutes, up to 100000"),
  difficulty: z.enum(DIFFICULTIES),
  sourceUrl: url,
  payloadFormat: z.string().trim().max(40),
  payloadContent: z.string().max(50_000),
  payloadSourceUrl: url,
});

export type AutomationFormInput = z.infer<typeof automationFormSchema>;
export type AutomationFormErrors = Partial<Record<keyof AutomationFormInput, string>>;

export type AutomationContent = {
  title: string;
  summary: string;
  problem?: string;
  trigger?: string;
  steps: { order: number; action: string; toolSlug?: string; detail?: string }[];
  prerequisites: string[];
  failureModes: string[];
  payload?: { format: string; content: string; sourceUrl?: string };
  toolSlugs: string[];
  timeSavedMinutes?: number;
  difficulty: (typeof DIFFICULTIES)[number];
  sourceUrl?: string;
};

/** Validated form text to the record shape Convex accepts. */
export function toContent(f: AutomationFormInput): AutomationContent {
  const steps = lines(f.steps).map((l, i) => {
    const [action, toolSlug, ...rest] = l.split("|").map((p) => p.trim());
    return {
      order: i + 1,
      action,
      ...(toolSlug ? { toolSlug } : {}),
      ...(rest.join(" | ").trim() ? { detail: rest.join(" | ").trim() } : {}),
    };
  });
  const payloadContent = f.payloadContent.trim();
  return {
    title: f.title,
    summary: f.summary,
    problem: opt(f.problem),
    trigger: opt(f.trigger),
    steps,
    prerequisites: lines(f.prerequisites),
    failureModes: lines(f.failureModes),
    payload: payloadContent
      ? {
          format: f.payloadFormat || "text",
          content: payloadContent,
          ...(f.payloadSourceUrl ? { sourceUrl: f.payloadSourceUrl } : {}),
        }
      : undefined,
    toolSlugs: Array.from(new Set(f.toolSlugs.split(",").map((t) => t.trim()).filter(Boolean))),
    timeSavedMinutes: f.timeSavedMinutes ? Number(f.timeSavedMinutes) : undefined,
    difficulty: f.difficulty,
    sourceUrl: opt(f.sourceUrl),
  };
}

/** A stored record back to form text, for the admin editor. */
export function fromContent(c: AutomationContent): AutomationFormInput {
  return {
    title: c.title,
    summary: c.summary,
    problem: c.problem ?? "",
    trigger: c.trigger ?? "",
    steps: [...c.steps]
      .sort((a, b) => a.order - b.order)
      .map((s) => [s.action, s.toolSlug ?? "", s.detail ?? ""].join(" | ").replace(/( \| )+$/, ""))
      .join("\n"),
    prerequisites: c.prerequisites.join("\n"),
    failureModes: c.failureModes.join("\n"),
    toolSlugs: c.toolSlugs.join(", "),
    timeSavedMinutes: c.timeSavedMinutes?.toString() ?? "",
    difficulty: c.difficulty,
    sourceUrl: c.sourceUrl ?? "",
    payloadFormat: c.payload?.format ?? "",
    payloadContent: c.payload?.content ?? "",
    payloadSourceUrl: c.payload?.sourceUrl ?? "",
  };
}

/** FormData to the schema's input shape. Missing fields become empty strings. */
export function readForm(formData: FormData): Record<keyof AutomationFormInput, string> {
  const get = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" ? v : "";
  };
  return {
    title: get("title"),
    summary: get("summary"),
    problem: get("problem"),
    trigger: get("trigger"),
    steps: get("steps"),
    prerequisites: get("prerequisites"),
    failureModes: get("failureModes"),
    toolSlugs: get("toolSlugs"),
    timeSavedMinutes: get("timeSavedMinutes"),
    difficulty: get("difficulty"),
    sourceUrl: get("sourceUrl"),
    payloadFormat: get("payloadFormat"),
    payloadContent: get("payloadContent"),
    payloadSourceUrl: get("payloadSourceUrl"),
  };
}

export function fieldErrors(error: z.ZodError): AutomationFormErrors {
  const out: AutomationFormErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof AutomationFormInput | undefined;
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

export const DIFFICULTY_OPTIONS = DIFFICULTIES;
