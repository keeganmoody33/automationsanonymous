import { z } from "zod";

/*
  The structured shape a machine submits, shared by POST /api/submit and the
  MCP submit_automation tool. The browser form has its own text-shaped schema
  in automation-form.ts and converts to this same record before writing.

  Convex validates all of this again inside the mutation. This layer exists to
  give a caller a useful error instead of an argument validation failure.
*/

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const url = z.string().trim().max(2048).regex(/^https?:\/\//, "must start with http:// or https://");

export const submitSchema = z.strictObject({
  title: z.string().trim().min(3).max(140),
  summary: z.string().trim().min(20, "one full sentence that stands alone").max(300),
  problem: z.string().trim().max(2000).optional(),
  trigger: z.string().trim().max(2000).optional(),
  steps: z
    .array(
      z.strictObject({
        order: z.number().int().min(1),
        action: z.string().trim().min(1).max(500),
        toolSlug: z.string().regex(SLUG).optional(),
        detail: z.string().trim().max(2000).optional(),
      }),
    )
    .min(1, "at least one step")
    .max(50),
  prerequisites: z.array(z.string().trim().min(1).max(500)).max(30).default([]),
  failureModes: z.array(z.string().trim().min(1).max(500)).max(30).default([]),
  payload: z
    .strictObject({
      format: z.string().trim().min(1).max(40),
      content: z.string().min(1).max(50_000),
      sourceUrl: url.optional(),
    })
    .optional(),
  toolSlugs: z.array(z.string().regex(SLUG, "lowercase words joined by hyphens")).max(20).default([]),
  timeSavedMinutes: z.number().int().min(0).max(100_000).optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  sourceUrl: url.optional(),
  /** Stored for reply only. Never rendered, never returned by any public endpoint. */
  submitterEmail: z.string().trim().max(254).email().optional(),
});

export type SubmitInput = z.infer<typeof submitSchema>;

/** Steps must be numbered 1..n in order, which Convex also enforces. */
export function normalizeSteps(steps: SubmitInput["steps"]): SubmitInput["steps"] {
  return [...steps]
    .sort((a, b) => a.order - b.order)
    .map((s, i) => ({ ...s, order: i + 1 }));
}
