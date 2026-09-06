# automationsanonymous.com

A public directory of working automations plus an editorial blog. Submissions are anonymous: no accounts, no profiles, no public identities. Auth exists for one purpose, gating `/admin`, and there is one operator. The bet is answer engines, so every published page is structured, server-rendered, and worth citing.

Read `docs/HANDOFF.md` first. Part 1 is the current state and every decision made; Part 2 is the original brief, verbatim, and is the source of truth.

## Stack and commands

Next.js 16 App Router, TypeScript strict, Tailwind 4, shadcn/ui, Convex, MDX in-repo, zod, three (landing hero only). Add nothing else without asking.

- `npm run dev` then `npx convex dev` in a second terminal. On this machine Turbopack cannot bind its worker port; use `next dev --webpack` and `next build --webpack`. Vercel builds with Turbopack.
- From a clean clone, run `npx next typegen` once before type-checking: `PageProps`, `LayoutProps` and `RouteContext` are generated into the gitignored `.next/types`, so `tsc` fails on every route file without it.
- `npx tsc --noEmit`, `npm run lint`, `npx next build --webpack`, and `node scripts/check-payloads.mjs` must all pass before a commit. CI runs the same four on every push, plus `npm audit --omit=dev --audit-level=high`. CI is the only trustworthy build signal, because Turbopack cannot run on the operator's machine.
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
10. A payload must be what it claims to be. The declared `format` is checked against an allowlist and the content is parsed for that format. This is enforced twice on purpose: `src/lib/payload-check.ts` runs in the request path and reaches all three write paths through the shared schema, and `convex/lib/limits.ts` repeats the cheap half as a backstop, because `NEXT_PUBLIC_CONVEX_URL` is public and the mutation is callable without going through any Next.js code. When you change one, change the other; a submission must never clear the form and then die in the mutation.
11. `publish` refuses a record whose `toolSlugs` or `steps[].toolSlug` name a tool with no row, because every one of those renders as a link and would ship a live 404. Unknown slugs are allowed at submit time on purpose: a stranger submitting a genuinely new tool should not be rejected, and the operator adds the tool during review.

## The agent surface

Anything a person can do on this site, an agent can do without parsing HTML. That is a rule, not a feature. When you add a capability to the UI, add the machine path in the same change, and extend `scripts/agent-surface-check.sh` to prove it.

| A person can | An agent can |
| --- | --- |
| Browse `/automations` | `GET /api/automations`, or `search_automations` |
| Filter by tool, category, difficulty | the same query parameters, or the same tool arguments |
| Read a record and copy its payload | `GET /api/automations/{slug}` or `.md`, or `get_automation` |
| Browse `/tools`, open one | `GET /api/tools`, `GET /api/tools/{slug}`, or `list_tools` |
| Open a stack page | `GET /api/stacks/{a}-to-{b}`, or `get_stack` |
| Read the blog | `GET /api/blog`, `GET /api/blog/{slug}.md`, or `list_posts` and `get_post` |
| Submit anonymously at `/submit` | `POST /api/submit`, or `submit_automation` |
| Discover what exists | `GET /api` and `/llms.txt` |

Nothing else is public to anyone, so nothing else is exposed. Editing, approving and publishing stay behind the admin gate for humans and agents alike; there is no agent path to them and there should not be.

- The MCP server is `src/app/api/mcp/route.ts`, stateless, mounted at `/api/mcp` and rewritten to `/mcp`. No auth: the read surface is public and the one write is the same anonymous submit a browser gets.
- `src/lib/record-text.ts` is the one renderer for a record as text. `/llms-full.txt`, the `.md` view and the MCP tools all use it, so a machine sees the identical record everywhere.
- `src/lib/submit-schema.ts` is the one structured submit schema, shared by the endpoint and the MCP tool. The browser form converts its text fields into the same shape. Convex validates all of it again.
- Read endpoints send `access-control-allow-origin: *` and a shared `s-maxage`; agents are not on this domain.
- `scripts/agent-surface-check.sh [base-url]` is read-only and safe against production: it handshakes MCP, lists tools, calls one, and asserts no private field appears in any public response. It runs weekly against production from `.github/workflows/verify-corpus.yml`.
- `scripts/check-payloads.mjs` parses every payload in the seed corpus with the real tool for its declared format and enforces the content rules this file states. It is deliberately deeper than the request-path gate, because CI can spawn processes and a mutation cannot.

## Voice

- The domain name is the only joke. No twelve-step or recovery language anywhere: copy, routes, component names, error states, commit messages.
- No em dashes in user-facing copy. Use a colon, a period, or a comma.
- Specific over adjectival. Say what it does, not how good it is.
- Never fabricate a metric, a testimonial, a company name, or a sample automation that looks real. Placeholders say PLACEHOLDER.
- Empty states say the thing is empty. "Automations: empty", not an illustration and an apology.
- Small verifiable steps. Build, commit with a clear message, stop and report what was decided.
