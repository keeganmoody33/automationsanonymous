import type { Metadata } from "next";
import { Sheet } from "@/components/sheet";
import { StatusList } from "@/components/admin/status-list";
import { ImportForm } from "@/components/admin/import-form";

export const metadata: Metadata = { title: "Import" };

export default function AdminImport() {
  return (
    <Sheet number="A3" route="/admin/import" title="Import" summary="Bulk-loaded records land here as raw. Each one is promoted to the queue or rejected; nothing publishes from here.">
      <ImportForm />
      <section className="mt-major">
        <h2 className="text-chrome text-ink-2">Raw</h2>
        <div className="mt-unit">
          <StatusList status="raw" />
        </div>
      </section>
    </Sheet>
  );
}
