"use server";

import { headers } from "next/headers";
import { fetchMutation } from "convex/nextjs";
import { z } from "zod";
import { api } from "@convex/_generated/api";
import { automationFormSchema, fieldErrors, readForm, toContent, type AutomationFormErrors } from "@/lib/automation-form";
import { verifyTurnstile } from "@/lib/turnstile";

export type SubmitState = {
  ok?: boolean;
  errors?: AutomationFormErrors & { form?: string; submitterEmail?: string };
};

const email = z.string().trim().max(254).email();

export async function submitAutomation(_prev: SubmitState, formData: FormData): Promise<SubmitState> {
  const parsed = automationFormSchema.safeParse(readForm(formData));
  const errors: SubmitState["errors"] = parsed.success ? {} : fieldErrors(parsed.error);

  const rawEmail = formData.get("submitterEmail");
  let submitterEmail: string | undefined;
  if (typeof rawEmail === "string" && rawEmail.trim()) {
    const e = email.safeParse(rawEmail);
    if (e.success) submitterEmail = e.data;
    else errors.submitterEmail = "not a valid address";
  }
  if (!parsed.success || Object.keys(errors).length > 0) return { errors };

  const turnstile = formData.get("cf-turnstile-response");
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!(await verifyTurnstile(typeof turnstile === "string" ? turnstile : undefined, ip))) {
    return { errors: { form: "The anti-bot check did not pass. Reload and try again." } };
  }

  try {
    // The only public write. Lands as status pending, origin submitted.
    await fetchMutation(api.submit.submit, { ...toContent(parsed.data), submitterEmail });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Submission failed";
    return { errors: { form: message } };
  }
  return { ok: true };
}
