"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAdminToken } from "@/components/admin/convex-admin-provider";
import { Empty } from "@/components/sheet";

type Status = "raw" | "pending" | "approved" | "rejected" | "published";

/* Reactive list of records in one status. Admin only; never on a public page. */
export function StatusList({ status }: { status: Status }) {
  const token = useAdminToken();
  const rows = useQuery(api.admin.automations.listByStatus, { token, status });
  if (rows === undefined) return <p className="text-chrome text-ink-3">Loading</p>;
  if (rows.length === 0) return <Empty what={status} />;
  return (
    <ul className="border-t-hairline">
      {rows.map((r) => (
        <li key={r._id} className="border-b-hairline py-unit">
          <div className="flex flex-wrap items-baseline gap-x-unit-2 text-chrome text-ink-3">
            <span>{r.origin}</span>
            {r.importedFrom ? <span>{r.importedFrom}</span> : null}
            <span>{new Date(r._creationTime).toISOString().slice(0, 10)}</span>
            {r.submitterEmail ? <span className="text-ink-2">reply available</span> : null}
          </div>
          <Link href={`/admin/automations/${r._id}`} className="mt-tick block text-ink hover:text-mark">
            {r.title}
          </Link>
          <p className="mt-tick max-w-[64ch] text-ink-2">{r.summary}</p>
        </li>
      ))}
    </ul>
  );
}
