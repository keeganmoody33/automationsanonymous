# automationsanonymous.com

A public directory of working automations plus an editorial blog. Submissions are anonymous: no accounts, no profiles, no public identities. Auth exists for one purpose, gating `/admin`, and there is one operator. The bet is answer engines, so every published page is structured, server-rendered, and worth citing.

Read `docs/HANDOFF.md` first. Part 1 is the current state and every decision made; Part 2 is the original brief, verbatim, and is the source of truth.

## Stack and commands

Next.js 16 App Router, TypeScript strict, Tailwind 4, shadcn/ui, Convex, MDX in-repo, zod, three (landing hero only). Add nothing else without asking.

- `npm run dev` then `npx convex dev` in a second terminal. On this machine Turbopack cannot bind its worker port; use `next dev --webpack` and `next build --webpack`. Vercel builds with Turbopack.
- `npx tsc --noEmit`, `npm run lint`, `npx next build --webpack` must all pass before a commit.
- `scripts/ux-loop.sh [base-url]`: screenshots every route at 390 and 1280, checks status, canonical, robots, description, console errors. Exit 2 on any failure.
- `scripts/e2e-flows.sh`: submit, review, approve, publish, import, reject in a browser against dev. Never point it at production.
- Deploy: `npx convex deploy` when `convex/` changes, then `npx vercel deploy --prod --yes --scope lecturesfromog`. Production Convex is `exciting-deer-586`, dev is `strong-turtle-110`.

## Where things live

- `convex/` is the database and every server function. `convex/public/*` read published records; `convex/submit.ts` is the only public write; `convex/admin/*` are gated. `convex/lib/publicShape.ts` defines what a public client may ever see.
- `content/blog/*.mdx` is the blog. The blog is not in Convex. The filename is the permanent slug. Frontmatter is validated by zod in `src/lib/blog.ts` and an invalid file fails the build.
- `src/lib/schema-org.tsx` is the only place JSON-LD is written. Pages call `howTo`, `article`, `itemList` and render `<JsonLd>`.
- `src/app/globals.css` is the token set. `src/components/landing/` is the landing page built from the canvas design.
- `src/lib/admin-session.ts` and `convex/lib/adminAuth.ts` share one token format; both verify it independently.

## Rules that hold in every change

1. Published content is server-rendered. Use `fetchQuery` from `convex/nextjs` inside server components. Never `useQuery` or `preloadQuery` on published content. `fetchQuery` fetches with `no-store`, so static routes that call it carry `export const dynamic = "force-static"` with `revalidate`.
2. Convex has no row-level security. Every public query filters `status === "published"` and returns the explicit public shape through `toPublicAutomation`, never a whole document. Every admin function calls `requireAdmin(token)` as its first line. No client-side check is load-bearing.
3. `submitterEmail`, `rejectionNote`, `internalNotes` never reach a public client. Not in a query result, not in HTML, not in JSON-LD, not in llms-full.txt.
4. No identity anywhere. No author, handle, or attribution in copy, metadata, OG images, or JSON-LD. `Article.publisher` is the site. There is no `author` field in `schema-org.tsx` and none may be added.
5. Slugs are permanent. `publish` assigns one once; `update` rejects `slug`; nothing derives a slug from a title at render time.
6. Nothing writes `status: "published"` except `admin/automations.publish`, and only from `approved`. Submissions land `pending`; imports land `raw`.
7. Tokens only. Zero hardcoded colors, stroke widths, radii, or font stacks in components. Fonts are two roles, `--font-chrome` and `--font-voice`; components never name a face.
8. The mode switch and the font switch are presentation only. They set attributes on `<html>` that CSS reads. They never change the server HTML and never fetch anything different.
9. The Convex and MDX split is fixed: records in Convex, posts in the repo.

## Voice

- The domain name is the only joke. No twelve-step or recovery language anywhere: copy, routes, component names, error states, commit messages.
- No em dashes in user-facing copy. Use a colon, a period, or a comma.
- Specific over adjectival. Say what it does, not how good it is.
- Never fabricate a metric, a testimonial, a company name, or a sample automation that looks real. Placeholders say PLACEHOLDER.
- Empty states say the thing is empty. "Automations: empty", not an illustration and an apology.
- Small verifiable steps. Build, commit with a clear message, stop and report what was decided.
