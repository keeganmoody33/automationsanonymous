import type { Metadata } from "next";
import { Empty, NotBuilt, Sheet } from "@/components/sheet";

export const metadata: Metadata = {
  title: "Blog",
  description: "Editorial posts on automation, written in-repo as MDX.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndex() {
  return (
    <Sheet number="08" route="/blog" title="Blog">
      <Empty what="Posts" />
      <div className="mt-unit">
        <NotBuilt phase={5} />
      </div>
    </Sheet>
  );
}
