"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { useAdminToken } from "@/components/admin/convex-admin-provider";
import { AutomationFields } from "@/components/automation-fields";
import { Button, Field, Input, Textarea } from "@/components/form-fields";
import { publishAutomation } from "@/app/admin/actions";
import { automationFormSchema, fieldErrors, fromContent, readForm, toContent, type AutomationFormErrors } from "@/lib/automation-form";

function errorText(err: unknown): string {
  if (err instanceof ConvexError) return String(err.data);
  return err instanceof Error ? err.message : "Failed";
}

function suggestSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function RecordEditor({ id }: { id: string }) {
  const token = useAdminToken();
  const doc = useQuery(api.admin.automations.get, { token, id });
  if (doc === undefined) return <p className="text-chrome text-ink-3">Loading</p>;
  if (doc === null) return <p className="text-chrome text-ink-3">Record: empty</p>;
  return <Editor key={doc._id} doc={doc} token={token} />;
}

function Editor({ doc, token }: { doc: Doc<"automations">; token: string }) {
  const update = useMutation(api.admin.automations.update);
  const approve = useMutation(api.admin.automations.approve);
  const reject = useMutation(api.admin.automations.reject);
  const promoteRaw = useMutation(api.admin.automations.promoteRaw);

  const [errors, setErrors] = useState<AutomationFormErrors>({});
  const [notice, setNotice] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();
  const [rejectNote, setRejectNote] = useState(doc.rejectionNote ?? "");
  const [slug, setSlug] = useState(doc.slug ?? suggestSlug(doc.title));
  const [savedVersion, setSavedVersion] = useState(0);

  async function run(label: string, fn: () => Promise<unknown>) {
    setBusy(true);
    setNotice("");
    try {
      await fn();
      setNotice(`${label}: done`);
    } catch (err) {
      setNotice(`${label}: ${errorText(err)}`);
    } finally {
      setBusy(false);
    }
  }

  async function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = automationFormSchema.safeParse(readForm(form));
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      setNotice("Save: fix the marked fields");
      return;
    }
    setErrors({});
    const internalNotes = String(form.get("internalNotes") ?? "").trim() || undefined;
    await run("Save", () => update({ token, id: doc._id, patch: { ...toContent(parsed.data), internalNotes } }));
    setSavedVersion((v) => v + 1);
  }

  return (
    <div className="flex flex-col gap-unit-4">
      <dl className="flex flex-wrap gap-x-unit-4 gap-y-unit text-chrome text-ink-2">
        <div>
          <dt className="inline">status: </dt>
          <dd className="inline text-ink">{doc.status}</dd>
        </div>
        <div>
          <dt className="inline">origin: </dt>
          <dd className="inline text-ink">{doc.origin}{doc.importedFrom ? ` · ${doc.importedFrom}` : ""}</dd>
        </div>
        <div>
          <dt className="inline">slug: </dt>
          <dd className="inline text-ink">{doc.slug ?? "unassigned"}</dd>
        </div>
        <div>
          <dt className="inline">reply address: </dt>
          <dd className="inline text-ink">{doc.submitterEmail ?? "none"}</dd>
        </div>
        {doc.slug ? (
          <div>
            <Link href={`/automations/${doc.slug}`} className="text-ink hover:text-mark">
              view public page
            </Link>
          </div>
        ) : null}
      </dl>

      {doc.rejectionNote ? (
        <p className="border-l-thin border-mark pl-unit-2 text-ink-2">
          <span className="text-chrome text-mark">rejection note · </span>
          {doc.rejectionNote}
        </p>
      ) : null}

      <form onSubmit={onSave} className="flex flex-col gap-unit-4">
        <AutomationFields key={savedVersion} defaults={fromContent(doc)} errors={errors} disabled={busy} />
        <Field label="Internal notes" name="internalNotes" hint="Never leaves the admin." >
          <Textarea name="internalNotes" defaultValue={doc.internalNotes ?? ""} rows={3} disabled={busy} />
        </Field>
        <div className="flex flex-wrap items-center gap-unit-2">
          <Button type="submit" disabled={busy}>
            Save
          </Button>
          {doc.status === "published" ? (
            <span className="text-chrome text-ink-3">Published: edits go live on the next revalidation. The slug never changes.</span>
          ) : null}
        </div>
      </form>

      <section className="border-t-hairline pt-unit-2">
        <h2 className="text-chrome text-ink-2">Review</h2>
        <div className="mt-unit-2 flex flex-col gap-unit-2">
          <div className="flex flex-wrap gap-unit-2">
            {doc.status === "raw" ? (
              <Button type="button" disabled={busy} onClick={() => run("Promote to queue", () => promoteRaw({ token, id: doc._id }))}>
                Promote to queue
              </Button>
            ) : null}
            {doc.status === "raw" || doc.status === "pending" ? (
              <Button type="button" disabled={busy} onClick={() => run("Approve", () => approve({ token, id: doc._id }))}>
                Approve
              </Button>
            ) : null}
          </div>

          {doc.status !== "published" && doc.status !== "rejected" ? (
            <div className="flex flex-col gap-unit border-hairline p-unit-2">
              <Field label="Reject with a note" name="rejectNote" hint="Stored on the record, never public.">
                <Textarea name="rejectNote" rows={2} value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} disabled={busy} />
              </Field>
              <div>
                <Button
                  type="button"
                  tone="mark"
                  disabled={busy || rejectNote.trim().length === 0}
                  onClick={() => run("Reject", () => reject({ token, id: doc._id, note: rejectNote.trim() }))}
                >
                  Reject
                </Button>
              </div>
            </div>
          ) : null}

          {doc.status === "approved" ? (
            <div className="flex flex-col gap-unit border-thin border-ink p-unit-2">
              <Field label="Publish with permanent slug" name="slug" hint="Lowercase words joined by hyphens. It never changes after this.">
                <Input name="slug" value={slug} onChange={(e) => setSlug(e.target.value)} disabled={busy || pending} />
              </Field>
              <div>
                <Button
                  type="button"
                  disabled={busy || pending || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)}
                  onClick={() =>
                    startTransition(async () => {
                      setNotice("");
                      const r = await publishAutomation(doc._id, slug);
                      setNotice(r.ok ? `Published at /automations/${r.slug}` : `Publish: ${r.error}`);
                    })
                  }
                >
                  {pending ? "Publishing" : "Publish"}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {notice ? (
        <p role="status" className="text-chrome text-ink-2">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
