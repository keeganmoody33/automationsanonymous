import type { Metadata } from "next";
import { Sheet } from "@/components/sheet";
import { StatusList } from "@/components/admin/status-list";

export const metadata: Metadata = { title: "Queue" };

export default function AdminQueue() {
  return (
    <Sheet number="A1" route="/admin/queue" title="Queue" summary="Submitted records waiting for review, then approved records waiting for a slug.">
      <section>
        <h2 className="text-chrome text-ink-2">Pending review</h2>
        <div className="mt-unit">
          <StatusList status="pending" />
        </div>
      </section>
      <section className="mt-major">
        <h2 className="text-chrome text-ink-2">Approved, not yet published</h2>
        <div className="mt-unit">
          <StatusList status="approved" />
        </div>
      </section>
    </Sheet>
  );
}
