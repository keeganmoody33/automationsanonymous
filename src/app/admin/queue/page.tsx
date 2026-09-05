import type { Metadata } from "next";
import { Sheet } from "@/components/sheet";
import { StatusList } from "@/components/admin/status-list";

export const metadata: Metadata = { title: "Queue" };

export default function AdminQueue() {
  return (
    <Sheet number="A1" route="/admin/queue" title="Queue" summary="Submitted records waiting for review.">
      <StatusList status="pending" />
    </Sheet>
  );
}
