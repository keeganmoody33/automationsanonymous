import type { Metadata } from "next";
import Link from "next/link";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { AutomationList } from "@/components/automation-list";
import { listPosts } from "@/lib/blog";

/*
  Interim home page: the directory's front door until the designed landing
  (canvas Rev C, Three.js hero) is built after Phase 8. Server-rendered from
  published records. Tokens only. Nothing here is copy for the real landing.
*/

export const metadata: Metadata = { alternates: { canonical: "/" } };
export const dynamic = "force-static";
export const revalidate = 300;

const LATEST = 5;

export default async function Home() {
  const [automations, tools, posts] = await Promise.all([
    fetchQuery(api.public.automations.listPublished, {}),
    fetchQuery(api.public.tools.list, {}),
    listPosts(),
  ]);
  const latest = automations.slice(0, LATEST);
  const post = posts[0];

  return (
    <main className="flex-1 grid-paper">
      <div className="mx-auto max-w-[1280px] px-unit-2 py-unit-4 md:px-major md:py-major">
        <header className="border-b-hairline pb-unit-2">
          <p className="text-chrome text-ink-2">Sheet 01 · Index</p>
          <h1 className="mt-unit text-3xl leading-none break-words md:text-5xl">Automations Anonymous</h1>
          <p className="mt-unit max-w-[56ch] text-ink">
            A public directory of working automations. Each one is a structured record: trigger, steps,
            prerequisites, failure modes, and the runnable payload. Submitted anonymously, reviewed by hand,
            published under a permanent address.
          </p>
        </header>

        <nav aria-label="Sections" className="mt-unit-4 grid gap-unit md:mt-major md:grid-cols-3">
          <Link href="/automations" className="group border-thin border-ink p-unit-2 hover:border-mark">
            <p className="text-chrome text-ink-2 group-hover:text-mark">Automations</p>
            <p className="mt-unit text-3xl leading-none">{automations.length}</p>
            <p className="mt-unit text-ink-2">Published records, filterable by tool, category, and difficulty.</p>
          </Link>
          <Link href="/tools" className="group border-thin border-ink p-unit-2 hover:border-mark">
            <p className="text-chrome text-ink-2 group-hover:text-mark">Tools</p>
            <p className="mt-unit text-3xl leading-none">{tools.length}</p>
            <p className="mt-unit text-ink-2">Every tool referenced, with the automations that use it.</p>
          </Link>
          <Link href="/submit" className="group border-thin border-mark p-unit-2 hover:bg-mark-soft">
            <p className="text-chrome text-mark">Submit</p>
            <p className="mt-unit text-3xl leading-none">+1</p>
            <p className="mt-unit text-ink-2">Add one. No account, no login, no attribution.</p>
          </Link>
        </nav>

        <section className="mt-major">
          <div className="flex items-baseline justify-between">
            <h2 className="text-chrome text-ink-2">Latest</h2>
            <Link href="/automations" className="text-chrome text-ink-2 hover:text-mark">
              All automations
            </Link>
          </div>
          <div className="mt-unit">
            <AutomationList items={latest} />
          </div>
        </section>

        {post ? (
          <section className="mt-major border-t-hairline pt-unit-2">
            <div className="flex items-baseline justify-between">
              <h2 className="text-chrome text-ink-2">From the blog</h2>
              <Link href="/blog" className="text-chrome text-ink-2 hover:text-mark">
                All posts
              </Link>
            </div>
            <p className="mt-unit text-chrome text-ink-3">{post.date}</p>
            <h3 className="mt-tick text-xl leading-tight">
              <Link href={`/blog/${post.slug}`} className="hover:text-mark">
                {post.title}
              </Link>
            </h3>
            <p className="mt-tick max-w-[64ch] text-ink">{post.description}</p>
          </section>
        ) : null}

        <footer className="mt-major border-t-hairline pt-unit-2 text-chrome text-ink-3">
          <p>
            Machine-readable: <Link href="/llms.txt" className="hover:text-mark">llms.txt</Link> ·{" "}
            <Link href="/llms-full.txt" className="hover:text-mark">llms-full.txt</Link> ·{" "}
            <Link href="/sitemap.xml" className="hover:text-mark">sitemap.xml</Link>
          </p>
        </footer>
      </div>
    </main>
  );
}
