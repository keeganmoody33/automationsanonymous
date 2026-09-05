import type { Metadata } from "next";
import { Empty, NotBuilt, Sheet } from "@/components/sheet";

export const metadata: Metadata = { title: "Queue" };

export default function AdminQueue() {
  return (
    <Sheet number="A1" route="/admin/queue" title="Queue">
      <Empty what="Pending" />
      <div className="mt-unit">
        <NotBuilt phase={6} />
      </div>
    </Sheet>
  );
}
