# Copilot instructions: automationsanonymous.com

Next.js 16 App Router, TypeScript strict, Tailwind 4, Convex, MDX in-repo. Read `docs/HANDOFF.md` for state and the brief. Path-specific rules are in `.github/instructions/`.

Rules that hold everywhere:

- Published content is server-rendered with `fetchQuery` from `convex/nextjs`. Never `useQuery` or `preloadQuery` on published content. Static routes that call `fetchQuery` set `dynamic = "force-static"` and `revalidate`.
- Access control lives inside every Convex function: public queries filter `status === "published"` and return the explicit public shape; admin functions call `requireAdmin(token)` first.
- `submitterEmail`, `rejectionNote`, `internalNotes` never reach a public client.
- No identity anywhere: no author, handle, or attribution in copy, metadata, or JSON-LD. Do not add an `author` field.
- JSON-LD only through the builders in `src/lib/schema-org.tsx` and `<JsonLd>`. Never hand-write it in a page.
- Tokens only: no hardcoded colors, stroke widths, radii, or font stacks in components. Two font roles, `--font-chrome` and `--font-voice`.
- Slugs are permanent once published. Nothing writes `status: "published"` except `admin/automations.publish`.
- Mode and font switches are presentation only and never change server HTML.
- Voice: the domain name is the only joke; no twelve-step or recovery language anywhere; no em dashes in user-facing copy; specific over adjectival; never fabricate a metric, testimonial, company, or realistic sample; empty states say the thing is empty.
- No new dependencies without asking.
