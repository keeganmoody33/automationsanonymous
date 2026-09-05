import type { Metadata } from "next";
import { Empty, NotBuilt, Sheet } from "@/components/sheet";

export const metadata: Metadata = {
  title: "Tools",
  description: "Index of tools that appear in published automations.",
  alternates: { canonical: "/tools" },
};

export default function ToolsIndex() {
  return (
    <Sheet
      number="05"
      route="/tools"
      title="Tools"
      summary="Every tool referenced by a published automation, with the automations that use it."
    >
      <Empty what="Tools" />
      <div className="mt-unit">
        <NotBuilt phase={4} />
      </div>
    </Sheet>
  );
}
