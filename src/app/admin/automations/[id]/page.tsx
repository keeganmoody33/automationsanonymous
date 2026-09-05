import type { Metadata } from "next";
import { Sheet } from "@/components/sheet";
import { RecordView } from "@/components/admin/record-view";

export async function generateMetadata(props: PageProps<"/admin/automations/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: `Edit ${id}` };
}

export default async function AdminAutomation(props: PageProps<"/admin/automations/[id]">) {
  const { id } = await props.params;
  return (
    <Sheet number="A2" route={`/admin/automations/${id}`} title="Record">
      <RecordView id={id} />
    </Sheet>
  );
}
