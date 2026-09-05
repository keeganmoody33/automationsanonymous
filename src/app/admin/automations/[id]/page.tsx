import type { Metadata } from "next";
import { NotBuilt, Sheet } from "@/components/sheet";

export async function generateMetadata(
  props: PageProps<"/admin/automations/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  return { title: `Edit ${id}` };
}

export default async function AdminAutomation(
  props: PageProps<"/admin/automations/[id]">,
) {
  const { id } = await props.params;
  return (
    <Sheet number="A2" route={`/admin/automations/${id}`} title="Edit">
      <p className="text-chrome text-ink-2">id: {id}</p>
      <div className="mt-unit">
        <NotBuilt phase={6} />
      </div>
    </Sheet>
  );
}
