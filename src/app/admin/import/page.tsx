import type { Metadata } from "next";
import { Sheet } from "@/components/sheet";
import { StatusList } from "@/components/admin/status-list";

export const metadata: Metadata = { title: "Import" };

export default function AdminImport() {
  return (
    <Sheet number="A3" route="/admin/import" title="Import" summary="Bulk-loaded records waiting to be promoted to the queue or rejected.">
      <StatusList status="raw" />
    </Sheet>
  );
}
