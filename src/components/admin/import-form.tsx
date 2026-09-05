"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@convex/_generated/api";
import { useAdminToken } from "@/components/admin/convex-admin-provider";
import { Button, Field, Input, Textarea } from "@/components/form-fields";

/* Paste a JSON array of records. They land as status raw, origin imported,
   and show up in the list below for promotion or rejection. */
export function ImportForm() {
  const token = useAdminToken();
  const importAutomations = useMutation(api.admin.imports.importAutomations);
  const [source, setSource] = useState("");
  const [json, setJson] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function onImport() {
    setNotice("");
    let items: unknown;
    try {
      items = JSON.parse(json);
    } catch {
      setNotice("Import: not valid JSON");
      return;
    }
    if (!Array.isArray(items) || items.length === 0) {
      setNotice("Import: expected a non-empty JSON array of records");
      return;
    }
    setBusy(true);
    try {
      const ids = await importAutomations({ token, items: items as never, importedFrom: source.trim() });
      setNotice(`Import: ${ids.length} record${ids.length === 1 ? "" : "s"} added as raw`);
      setJson("");
    } catch (err) {
      setNotice(`Import: ${err instanceof ConvexError ? String(err.data) : err instanceof Error ? err.message : "failed"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-unit-2 border-hairline p-unit-2">
      <Field label="Imported from" name="importedFrom" hint="Where this batch came from. Stored on every record.">
        <Input name="importedFrom" value={source} onChange={(e) => setSource(e.target.value)} disabled={busy} />
      </Field>
      <Field
        label="Records"
        name="records"
        hint="JSON array. Each item: title, summary, steps[{order, action, toolSlug?, detail?}], prerequisites[], failureModes[], toolSlugs[], difficulty, optional problem, trigger, payload{format, content, sourceUrl?}, timeSavedMinutes, sourceUrl, internalNotes. Up to 200."
      >
        <Textarea name="records" rows={10} spellCheck={false} value={json} onChange={(e) => setJson(e.target.value)} disabled={busy} />
      </Field>
      <div className="flex items-center gap-unit-2">
        <Button type="button" disabled={busy || !source.trim() || !json.trim()} onClick={onImport}>
          {busy ? "Importing" : "Import as raw"}
        </Button>
        {notice ? (
          <span role="status" className="text-chrome text-ink-2">
            {notice}
          </span>
        ) : null}
      </div>
    </div>
  );
}
