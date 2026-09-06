import { fetchMutation } from "convex/nextjs";
import { ConvexError } from "convex/values";
import { z } from "zod";
import { api } from "@convex/_generated/api";
import { json, preflight } from "@/lib/api";
import { normalizeSteps, submitSchema } from "@/lib/submit-schema";

/*
  The anonymous submit form, as an endpoint. Same single public mutation the
  browser form uses: the record lands as pending, origin submitted, and a
  person reviews it before anything is published.

  No auth on purpose. Anonymity is the product. Convex enforces the length
  limits; a Turnstile token cannot be required here because the caller is not
  a browser, so this endpoint trades a captcha for hand review.
*/
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json", message: "Body must be JSON." }, { status: 400 });
  }

  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return json(
      { error: "invalid_body", message: z.prettifyError(parsed.error), issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const { submitterEmail, ...content } = parsed.data;
  try {
    await fetchMutation(api.submit.submit, {
      ...content,
      steps: normalizeSteps(content.steps),
      submitterEmail,
    });
  } catch (err) {
    const message = err instanceof ConvexError ? String(err.data) : "Submission failed.";
    return json({ error: "rejected", message }, { status: 422 });
  }

  // The id is deliberately not returned: there is nothing anonymous callers
  // can do with it, and it would be the only handle tying a submitter to a
  // record.
  return json(
    {
      status: "pending",
      message: "Received. A person reviews every submission before it is published.",
    },
    { status: 202 },
  );
}

export const OPTIONS = preflight;
