# Handoff

State of the build and every decision made so far, so any session can resume without the chat history. Part 1 is status. Part 2 is the original brief, verbatim, which remains the source of truth for phases 3 through 8.

## Part 1: status

### Where things are

| Item | State |
| --- | --- |
| Branch | `claude/automationsanonymous-repo-build-1lnge8` |
| Pull request | https://github.com/keeganmoody33/automationsanonymous/pull/2 (Phases 1-3 plus review fixes; merge pending, see open thread 1) |
| Phases done | 1 (repo init), 2 (app shell and design tokens), 3 (routes stubbed), 4 (Convex schema, functions, admin gate) |
| Next phase | 5 (content layer and structured data) |
| Vercel | Project `automationsanonymous` under team `lecturesfrom` (slug `lecturesfromog`). Production deployed from this branch via `vercel deploy --prod`. Env vars still unset, see open thread 2. |
| Convex | Dev `strong-turtle-110`, prod `exciting-deer-586`, team `lecturesfrom`, project `automationsanonymous`. `ADMIN_SESSION_SECRET` set on dev. Prod env and first prod deploy pending, see open thread 2. |
| Domain | `automationsanonymous.com` and `www` on Cloudflare, DNS-only CNAMEs to `cname.vercel-dns.com`, both hostnames verified on the Vercel project. Live. |
| Landing design | Claude Design canvas, Rev C: https://claude.ai/code/artifact/cc15dfe5-8b3f-461e-b874-44fc4d179e2e |
| QA | `scripts/ux-loop.sh [base-url]`: screenshots every route at 390 and 1280, checks HTTP status against expectation, canonical, robots (admin must be noindex), description, console errors. Exit 2 on any failed check. |

### Decisions made on top of the brief

- Package manager is npm.
- Admin gate is the signed-session option: `ADMIN_PASSWORD` plus `ADMIN_SESSION_SECRET`, the latter set in both Next.js and the Convex deployment. Not Convex Auth magic link.
- shadcn/ui is configured on the New York style over Radix. The registry host was unreachable from the remote build environment, so `components.json`, `src/lib/utils.ts`, and `button.tsx` were copied from the shadcn-ui/ui source. `npx shadcn add <component>` works normally from a machine with network access.
- Font roles: `--font-chrome` and `--font-voice` both resolve to IBM Plex Mono for now (voice in bold). The spray-paint and serif faces were rejected. Voice stays its own role so the Phase 7 registry can repoint it. Blog body will need a readable face; that is an open decision, not made.
- Landing page: it is not a separate drop-in anymore. It is designed on the canvas above and gets built in code as a phase after Phase 8. The hero becomes a Three.js wireframe assembly, client-only, layered over a server-rendered SVG. Three.js is an approved dependency for that phase only.
- Landing voice: humor is the flex up front, real digital automations are the substance. The "twelve sheets" section is satire, every card stamped NOT FOR CONSTRUCTION. No twelve-step liturgy, no fellowship copy, no fake testimonials, no fake meetings. The Phase 8 voice rules stand.
- Logo: circle with an inscribed triangle drawn as construction geometry with dimensions. An original mark, not a copy of anyone's.
- Loading screen: plays once per session as a client overlay. Never changes server HTML.
- Nothing was taken from the uploaded Vite/GSAP landing page package. It stays out of the repo.
- Admin gate lives in `src/app/admin/layout.tsx`: no session means every admin route renders the login form in place. There is no `/login` route. Token is `${expiresAtMs}.${base64url(HMAC-SHA256(ADMIN_SESSION_SECRET, expiresAtMs))}` in an httpOnly cookie scoped to `/admin`; Convex admin functions take the same token as an argument and verify it themselves (`convex/lib/adminAuth.ts`).
- Public dynamic pages use `fetchQuery` with `export const revalidate = 300` (ISR). `/automations` reads `searchParams` and is therefore dynamic. Unknown slugs call `notFound()`. Metadata (title, description, canonical) comes from the record.
- Stack slugs are `${a}-to-${b}`; every `-to-` split point is tried against the tools table because tool slugs may contain `-to-`.
- Hairline token is 1px below 2dppx so grid paper and rules render on 1x displays.
- Local Turbopack builds fail on this Mac (worker cannot bind a port); use `--webpack` locally. Vercel builds with Turbopack.
- Two placeholder records live in the Convex dev deployment from the smoke test: automation `placeholder-smoke-test` (published) and tool `placeholder-tool`. Obviously placeholder; delete from the dashboard when real content lands.

### Open threads

1. Merge PR #2 into `main`. `main` is still the initial commit, so a git-triggered production deploy would overwrite the live site with an empty tree until this lands. Production is currently deployed from the branch via CLI.
2. Secrets the operator must set (the agent is blocked from writing secrets to external services). Values are in `.env.local`:
   - Vercel production: `NEXT_PUBLIC_CONVEX_URL=https://exciting-deer-586.convex.cloud`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`. Preview: `NEXT_PUBLIC_CONVEX_URL=https://strong-turtle-110.convex.cloud`.
   - Convex prod: `npx convex env set --prod ADMIN_SESSION_SECRET <same value>`.
   - Then `npx convex deploy` once from a logged-in machine, and generate a production deploy key in the Convex dashboard, set it as `CONVEX_DEPLOY_KEY` on Vercel, and change the build command to `npx convex deploy --cmd 'npm run build'`.
3. Type: A (Plex Mono Bold, current), B (Plex Sans Condensed), C (Plex Sans), D (Plex Serif). Pick one.
4. Cursor interactions for the landing build, proposed in the canvas comment thread: live crosshair, hover-revealed dimensions, ghost cursor replaying an automation, orbitable wireframe hero, scroll-driven drawing. Say which to cut.
5. A separate "automation and anonymity showcase" brief (Cloudflare Workers, WebAssembly, edge functions) was pasted and parked. It conflicts with this repo's stack rules. Decide: separate project, a blog post here, or dropped.
6. On-demand revalidation after publish. Public pages revalidate every 300s; a route handler that calls `revalidatePath` from the admin publish flow would make publishes immediate. Phase 6 decision.

### Rules that must hold in every phase

See the brief below. The short list: published content is server-rendered with `fetchQuery` only; access control lives inside every Convex function; `submitterEmail`, `rejectionNote`, `internalNotes` never reach a public client; no identity anywhere including the JSON-LD author field; slugs are permanent once published; tokens only, no hardcoded visual values; nothing writes directly to `published`.

## Part 2: the brief, verbatim

Build the repo for **automationsanonymous.com** from scratch.

Work the phases below **one at a time**. After each: run the build, commit with a clear message, stop and report what you did and anything you had to decide. Do not run ahead. I am reviewing on a phone, so small verifiable steps beat one large diff.

If something is ambiguous, ask. Do not invent a data field, a route, or a dependency to get unblocked.

### Stack

Next.js latest stable, App Router, TypeScript strict, Tailwind, shadcn/ui. **Convex** for the database and server functions. MDX in-repo for blog posts. No other dependencies without asking.

### What this is

A public directory of real automations plus an editorial blog. Submissions are **anonymous**. There are no user accounts, no profiles, no public identities. Auth exists for exactly one purpose: gating the admin routes. That is me, one person.

The bet is answer engines. The corpus has to be structured, server-rendered, and worth citing.

### Architecture rules (hold across every phase)

**Published content is server-rendered. Always.** Use `fetchQuery` from `convex/nextjs` inside server components for every public page. Do not use `useQuery` on published content, and do not use `preloadQuery` there either, since it forces `no-store` and disqualifies static rendering. Reactive hooks are for the admin queue only.

**Convex has no row-level security.** Access control lives inside each function. Every public query filters to `status === "published"` and returns an explicit public shape, never a whole document. Every admin function checks auth at the top of the function body. No client-side check is load-bearing.

**Fields that never reach a public client:** `submitterEmail`, `rejectionNote`, `internalNotes`.

**No identity, anywhere.** No handle, no author, no attribution in page copy, OG images, or the JSON-LD `author` field. That last one is the leak that gets missed.

**Slugs are permanent** once published. Nothing derives a slug from a title at render time.

**Tokens only.** Zero hardcoded colors, stroke widths, radii, or font stacks in components.

### Phase 1: repo init

`git init`, `.gitignore`, `README.md` with a one-paragraph description and setup steps, `.env.example` naming every var with no values. Commit.

### Phase 2: app shell and design tokens

Next.js App Router, TypeScript strict, Tailwind, shadcn/ui. Root layout with `metadataBase: new URL('https://automationsanonymous.com')`, apex not www.

Full CAD token set in the Tailwind theme: hairline stroke widths, muted ink colors, grid units, measurement-tick primitives. Two font roles as CSS custom properties, never hardcoded in components:
- `--font-chrome`: monospace. Labels, metadata, nav, tool names, step numbers.
- `--font-voice`: display face. Headlines and blog body only. Not Inter.

CAD drafting aesthetic. Hairline strokes, construction lines, orthographic feel. No glass, no gradients, no neumorphism.

Leave `/` as a minimal placeholder. The landing page is being designed separately and will be dropped in later. Build the tokens so it can pull from them.

Commit.

### Phase 3: routes stubbed

```
/                          landing (placeholder for now)
/automations               index, filter by tool / category / difficulty
/automations/[slug]        canonical automation page
/tools                     tool index
/tools/[slug]              automations using {tool}
/stacks/[slug]             "connect {A} to {B}"
/blog                      index
/blog/[slug]               MDX post
/submit                    anonymous submission form
/admin/queue               review queue
/admin/automations/[id]    edit and publish
/admin/import              bulk import review
```

No `/account`, no `/login` beyond whatever the admin gate needs. Commit.

### Phase 4: Convex schema and functions

`convex/schema.ts`:

```ts
automations: defineTable({
  slug: v.optional(v.string()),
  title: v.string(),
  summary: v.string(),              // one sentence, standalone, quotable
  problem: v.optional(v.string()),
  trigger: v.optional(v.string()),
  steps: v.array(v.object({
    order: v.number(),
    action: v.string(),
    toolSlug: v.optional(v.string()),
    detail: v.optional(v.string()),
  })),
  prerequisites: v.array(v.string()),
  failureModes: v.array(v.string()),
  payload: v.optional(v.object({
    format: v.string(),
    content: v.string(),
    sourceUrl: v.optional(v.string()),
  })),
  toolSlugs: v.array(v.string()),
  timeSavedMinutes: v.optional(v.number()),
  difficulty: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
  sourceUrl: v.optional(v.string()),
  origin: v.union(v.literal("imported"), v.literal("submitted"), v.literal("authored")),
  importedFrom: v.optional(v.string()),
  importedAt: v.optional(v.number()),
  submitterEmail: v.optional(v.string()),   // private, reply-only
  status: v.union(
    v.literal("raw"), v.literal("pending"), v.literal("approved"),
    v.literal("rejected"), v.literal("published")
  ),
  rejectionNote: v.optional(v.string()),
  internalNotes: v.optional(v.string()),
  publishedAt: v.optional(v.number()),
})
  .index("by_status_published", ["status", "publishedAt"])
  .index("by_slug", ["slug"])
  .index("by_origin_status", ["origin", "status"]),

tools: defineTable({
  slug: v.string(),
  name: v.string(),
  category: v.optional(v.string()),
  website: v.optional(v.string()),
}).index("by_slug", ["slug"]),
```

`payload` is the runnable artifact: n8n JSON, a Zapier export, a shell script, a cron line. It renders in a copyable block and is never paraphrased into prose.

`status: "raw"` is upstream of everything and exists for bulk import. A record lands there and cannot be published without passing through review. Nothing writes directly to `published`.

Functions, split clearly:
- **Public** (`convex/public/*.ts`): list published, get by slug, list by tool, list by stack. Each filters on status and returns an explicit public shape.
- **Admin** (`convex/admin/*.ts`): list by status, edit, approve, reject with note, publish, and a bulk `importAutomations` mutation that writes `origin: "imported"`, `status: "raw"`. Every one checks auth at the top.
- **Submit** (`convex/submit.ts`): one public mutation writing `origin: "submitted"`, `status: "pending"`. Nothing else public may write.

Admin gate: simplest thing that works. Convex Auth magic link against an allowlisted email, or a signed session from an env secret. Do not build a user system.

Commit.

### Phase 5: content layer and structured data

Blog posts as MDX at `content/blog/*.mdx` with typed zod-validated frontmatter that fails the build on invalid files. Blog does not go in Convex.

`src/lib/schema-org.ts` with typed JSON-LD builders. Automation pages emit `HowTo` with `name`, `description`, `totalTime` as an ISO 8601 duration, `tool`, and `step` as `HowToStep[]`. Blog posts emit `Article`. Tool and stack pages emit `ItemList`. Never hand-write JSON-LD inside a page file. No `author` field on anything.

`generateMetadata` on every dynamic route with a real title, a real description from the record, and `alternates.canonical`.

Every automation page opens with `summary` as a standalone sentence in a `<p>` directly under the `<h1>`, before any chrome. This is the block answer engines lift.

`app/sitemap.ts` and `app/robots.ts` from published records plus MDX. `/llms.txt` static, `/llms-full.txt` generated at build from published records including payloads.

Commit.

### Phase 6: flows

**Submit.** Public form, zod-validated, no login. Writes `status: "pending"`, `origin: "submitted"`. Optional email field, stored, never rendered. Turnstile-ready, provider left unwired.

**Import review.** `/admin/import` lists `status: "raw"` records with source, so a bulk load can be worked through and promoted to `pending` or rejected.

**Review.** `/admin/queue` lists pending. Reactive is fine here. Edit any field, then approve, reject with a note, or publish. Approve and publish are separate: approve clears the content, publish assigns the permanent slug and sets `publishedAt`.

Commit.

### Phase 7: switches

`ModeContext` at the root, defaulting to human.
- Human mode: prose, context, framing.
- Agent mode: strips to summary, prerequisites, steps, payload, failure modes, and raw JSON-LD in a copyable block. Denser, wireframe-forward.
- Both render the same record. Agent mode hides and reorders. It never fetches anything different.

Font switch swapping the two font tokens against a registry, so faces can be added later without touching components. Persist in localStorage.

**Neither switch may change the server-rendered HTML.** Presentation only.

Commit.

### Phase 8: CLAUDE.md and instructions

`CLAUDE.md` at the root, plus `.github/copilot-instructions.md` and path-specific files with `applyTo` frontmatter for `content/**/*.mdx`, `src/components/**/*.tsx`, and `convex/**`.

Cover: the Convex/MDX split, access control lives in functions, no identity anywhere, server-render published content with `fetchQuery` only, JSON-LD via builders only, tokens only, permanent slugs, nothing writes directly to `published`.

Voice rules: the domain name is the only joke. No twelve-step or recovery language anywhere in copy, routes, component names, or error states. No em dashes in user-facing copy. Specific over adjectival. Never fabricate a metric, a testimonial, a company name, or a sample automation that looks real. Empty states say the thing is empty.

Commit.

### Not in scope

Analytics, newsletter, deploy config, OAuth, any public API or MCP server. One placeholder record per content type so the build passes, obviously placeholder, not fake-real.

### Added after the brief

- Landing page build as a phase after 8, from the canvas, with Three.js on the hero and a once-per-session loading overlay.
- Vercel is the host. Cloudflare holds DNS only. Convex deploys from the Vercel build command. These are the only deploy-config exceptions.
