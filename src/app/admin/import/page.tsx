import type { Metadata } from "next";
import { Empty, NotBuilt, Sheet } from "@/components/sheet";

export const metadata: Metadata = { title: "Import" };

export default function AdminImport() {
  return (
    <Sheet number="A3" route="/admin/import" title="Import">
      <Empty what="Raw" />
      <div className="mt-unit">
        <NotBuilt phase={6} />
      </div>
    </Sheet>
  );
}
