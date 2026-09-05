import { Field, Input, Select, Textarea } from "@/components/form-fields";
import { DIFFICULTY_OPTIONS, type AutomationFormErrors, type AutomationFormInput } from "@/lib/automation-form";

/* Every content field of an automation as form controls. Uncontrolled: the
   caller supplies defaults (and a key to reset). */
export function AutomationFields({
  defaults,
  errors = {},
  disabled,
}: {
  defaults: Partial<AutomationFormInput>;
  errors?: AutomationFormErrors;
  disabled?: boolean;
}) {
  const d = defaults;
  return (
    <div className="flex flex-col gap-unit-2">
      <Field label="Title" name="title" error={errors.title}>
        <Input name="title" defaultValue={d.title} maxLength={140} required disabled={disabled} />
      </Field>
      <Field
        label="Summary"
        name="summary"
        hint="One sentence that stands alone. It is the first thing on the page and what search engines quote."
        error={errors.summary}
      >
        <Textarea name="summary" defaultValue={d.summary} rows={2} maxLength={300} required disabled={disabled} />
      </Field>
      <Field label="Problem" name="problem" hint="What was broken or slow before this existed." error={errors.problem}>
        <Textarea name="problem" defaultValue={d.problem} rows={3} disabled={disabled} />
      </Field>
      <Field label="Trigger" name="trigger" hint="What starts it: a schedule, an event, a message." error={errors.trigger}>
        <Textarea name="trigger" defaultValue={d.trigger} rows={2} disabled={disabled} />
      </Field>
      <Field
        label="Steps"
        name="steps"
        hint="One per line. Optional tool and detail after pipes: action | tool-slug | detail"
        error={errors.steps}
      >
        <Textarea name="steps" defaultValue={d.steps} rows={6} required disabled={disabled} />
      </Field>
      <Field label="Prerequisites" name="prerequisites" hint="One per line." error={errors.prerequisites}>
        <Textarea name="prerequisites" defaultValue={d.prerequisites} rows={3} disabled={disabled} />
      </Field>
      <Field label="Failure modes" name="failureModes" hint="One per line. How it breaks, and how you notice." error={errors.failureModes}>
        <Textarea name="failureModes" defaultValue={d.failureModes} rows={3} disabled={disabled} />
      </Field>
      <div className="grid gap-unit-2 md:grid-cols-3">
        <Field label="Tools" name="toolSlugs" hint="Slugs, comma separated: n8n, google-sheets" error={errors.toolSlugs}>
          <Input name="toolSlugs" defaultValue={d.toolSlugs} disabled={disabled} />
        </Field>
        <Field label="Difficulty" name="difficulty" error={errors.difficulty}>
          <Select name="difficulty" defaultValue={d.difficulty ?? "beginner"} disabled={disabled}>
            {DIFFICULTY_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Minutes saved per run" name="timeSavedMinutes" error={errors.timeSavedMinutes}>
          <Input name="timeSavedMinutes" inputMode="numeric" defaultValue={d.timeSavedMinutes} disabled={disabled} />
        </Field>
      </div>
      <Field label="Source URL" name="sourceUrl" hint="Where this came from, if anywhere." error={errors.sourceUrl}>
        <Input name="sourceUrl" type="url" defaultValue={d.sourceUrl} disabled={disabled} />
      </Field>
      <fieldset className="border-hairline p-unit-2">
        <legend className="px-tick text-chrome text-ink-2">Payload</legend>
        <p className="mb-unit text-chrome text-ink-3">
          The runnable artifact, pasted verbatim: n8n JSON, a Zapier export, a shell script, a cron line. Shown as-is, never paraphrased.
        </p>
        <div className="flex flex-col gap-unit-2">
          <div className="grid gap-unit-2 md:grid-cols-2">
            <Field label="Format" name="payloadFormat" hint="json, yaml, sh, cron, text" error={errors.payloadFormat}>
              <Input name="payloadFormat" defaultValue={d.payloadFormat} maxLength={40} disabled={disabled} />
            </Field>
            <Field label="Payload source URL" name="payloadSourceUrl" error={errors.payloadSourceUrl}>
              <Input name="payloadSourceUrl" type="url" defaultValue={d.payloadSourceUrl} disabled={disabled} />
            </Field>
          </div>
          <Field label="Content" name="payloadContent" error={errors.payloadContent}>
            <Textarea name="payloadContent" defaultValue={d.payloadContent} rows={8} spellCheck={false} disabled={disabled} />
          </Field>
        </div>
      </fieldset>
    </div>
  );
}
