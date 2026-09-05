"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAdminToken } from "@/components/admin/convex-admin-provider";

/* Read-only admin view of one record, private fields included. Editing and
   the approve/reject/publish controls land in Phase 6. */
export function RecordView({ id }: { id: string }) {
  const token = useAdminToken();
  const r = useQuery(api.admin.automations.get, { token, id });
  if (r === undefined) return <p className="text-chrome text-ink-3">Loading</p>;
  if (r === null) return <p className="text-chrome text-ink-3">Record: empty</p>;
  return (
    <div>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-unit-2 gap-y-tick text-chrome">
        <dt className="text-ink-3">status</dt>
        <dd className="text-ink">{r.status}</dd>
        <dt className="text-ink-3">origin</dt>
        <dd className="text-ink">{r.origin}</dd>
        <dt className="text-ink-3">slug</dt>
        <dd className="text-ink">{r.slug ?? "unassigned"}</dd>
        <dt className="text-ink-3">difficulty</dt>
        <dd className="text-ink">{r.difficulty}</dd>
        <dt className="text-ink-3">tools</dt>
        <dd className="text-ink">{r.toolSlugs.join(", ") || "none"}</dd>
        <dt className="text-ink-3">submitter email</dt>
        <dd className="text-ink">{r.submitterEmail ?? "none"}</dd>
        <dt className="text-ink-3">rejection note</dt>
        <dd className="text-ink">{r.rejectionNote ?? "none"}</dd>
        <dt className="text-ink-3">internal notes</dt>
        <dd className="text-ink">{r.internalNotes ?? "none"}</dd>
      </dl>
      <pre className="mt-unit-2 overflow-x-auto border-hairline bg-paper-deep p-unit-2 text-[0.75rem] leading-relaxed">
        <code>{JSON.stringify(r, null, 2)}</code>
      </pre>
    </div>
  );
}
