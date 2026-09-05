import type { Metadata } from "next";
import Link from "next/link";
import { Sheet } from "@/components/sheet";

export const metadata: Metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <Sheet number="404" route="not found" title="Not found">
      <p className="text-chrome text-ink-3">This address: empty</p>
      <p className="mt-unit">
        <Link href="/automations" className="text-ink underline hover:text-mark">
          Go to the automations index
        </Link>
      </p>
    </Sheet>
  );
}
