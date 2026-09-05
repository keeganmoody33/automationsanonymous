import type { Metadata } from "next";
import { NotBuilt, Sheet } from "@/components/sheet";

export const metadata: Metadata = {
  title: "Submit",
  description: "Submit an automation anonymously. No account, no login.",
  alternates: { canonical: "/submit" },
};

export default function SubmitPage() {
  return (
    <Sheet
      number="10"
      route="/submit"
      title="Submit"
      summary="Submit an automation anonymously. No account, no login, no attribution."
    >
      <NotBuilt phase={6} />
    </Sheet>
  );
}
