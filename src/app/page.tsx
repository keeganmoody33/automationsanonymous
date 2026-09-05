import type { Metadata } from "next";

export const metadata: Metadata = { alternates: { canonical: "/" } };

// Placeholder. The landing page is designed separately and lands later.
// It pulls from the tokens in globals.css; nothing here is final.
export default function Home() {
  return (
    <main className="flex-1 grid-paper">
      <div className="mx-auto max-w-[1280px] px-unit-2 py-unit-4 md:px-major md:py-major">
        <p className="text-chrome text-ink-2">Sheet 01 · Placeholder</p>
        <h1 className="mt-unit text-3xl leading-none md:text-5xl">Automations Anonymous</h1>
        <p className="mt-unit max-w-[48ch] text-ink">
          A public directory of working automations, submitted anonymously and
          reviewed by hand. The landing page is not built yet.
        </p>
      </div>
    </main>
  );
}
