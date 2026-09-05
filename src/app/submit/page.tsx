import type { Metadata } from "next";
import { Sheet } from "@/components/sheet";
import { SubmitForm } from "@/components/submit-form";

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
      summary="Submit a working automation anonymously. No account, no login, no attribution. A person reviews it before it is published."
    >
      <SubmitForm />
    </Sheet>
  );
}
