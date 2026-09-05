"use client";

import { useActionState } from "react";
import { submitAutomation, type SubmitState } from "@/app/submit/actions";
import { AutomationFields } from "@/components/automation-fields";
import { Button, Field, Input } from "@/components/form-fields";

export function SubmitForm() {
  const [state, action, pending] = useActionState<SubmitState, FormData>(submitAutomation, {});
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (state.ok) {
    return (
      <div className="border-thin border-ink p-unit-2">
        <p className="text-chrome text-ink-2">Received</p>
        <p className="mt-unit max-w-[56ch]">
          It is in the review queue. Nothing about you was recorded except the reply address, if you gave one, and that is
          never shown. If it passes review it gets a permanent address on this site.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex max-w-[72ch] flex-col gap-unit-4">
      <AutomationFields defaults={{}} errors={state.errors} disabled={pending} />
      <Field
        label="Reply address (optional)"
        name="submitterEmail"
        hint="Stored privately so the reviewer can ask a question. Never published, never shown, not an identity."
        error={state.errors?.submitterEmail}
      >
        <Input name="submitterEmail" type="email" autoComplete="off" disabled={pending} />
      </Field>
      {siteKey ? (
        // Turnstile mount point. The widget script is not loaded yet; see src/lib/turnstile.ts.
        <div className="cf-turnstile" data-sitekey={siteKey} />
      ) : null}
      {state.errors?.form ? (
        <p role="alert" className="text-chrome text-mark">
          {state.errors.form}
        </p>
      ) : null}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Sending" : "Submit for review"}
        </Button>
      </div>
    </form>
  );
}
