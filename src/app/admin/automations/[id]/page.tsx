import type { Metadata } from "next";
import { Sheet } from "@/components/sheet";
import { RecordEditor } from "@/components/admin/record-editor";

export async function generateMetadata(props: PageProps<"/admin/automations/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  return { title: `Edit ${id}` };
}

export default async function AdminAutomation(props: PageProps<"/admin/automations/[id]">) {
  const { id } = await props.params;
  return (
    <Sheet number="A2" route={`/admin/automations/${id}`} title="Record" summary="Edit any field, then approve, reject with a note, or publish. Approve clears the content; publish assigns the permanent slug.">
      <RecordEditor id={id} />
    </Sheet>
  );
}
