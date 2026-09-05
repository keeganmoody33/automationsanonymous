# automationsanonymous.com

A public directory of real, working automations plus an editorial blog. Every automation page is a structured, server-rendered record: a one-sentence summary, the trigger, ordered steps, prerequisites, failure modes, and the runnable payload (n8n JSON, a Zapier export, a shell script, a cron line) in a copyable block. Submissions are anonymous. There are no accounts, no profiles, and no public identities. Auth exists only to gate the admin review queue for a single operator. The site is built to be cited by answer engines, so the corpus is structured with JSON-LD, sitemaps, and an `llms.txt` pair.

## Stack

- Next.js (App Router, TypeScript strict)
- Tailwind CSS and shadcn/ui
- Convex for the database and server functions
- MDX in-repo for blog posts (`content/blog/*.mdx`)

## Setup

> Build status: Phase 3 of 8 (routes stubbed). Convex, content, and flows land in later phases. Live at https://automationsanonymous.com.

1. Clone the repo and install dependencies:

   ```sh
   git clone https://github.com/keeganmoody33/automationsanonymous.git
   cd automationsanonymous
   npm install
   ```

2. Create your local env file from the template and fill in values:

   ```sh
   cp .env.example .env.local
   ```

   Every variable is listed and described in `.env.example`.

3. Start the Convex dev deployment. On first run this creates the deployment and writes `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` into `.env.local`:

   ```sh
   npx convex dev
   ```

4. Set `ADMIN_SESSION_SECRET` on the Convex deployment as well, with the same value as in `.env.local`:

   ```sh
   npx convex env set ADMIN_SESSION_SECRET <value>
   ```

5. In a second terminal, run the Next.js dev server:

   ```sh
   npm run dev
   ```

6. Open http://localhost:3000. The admin queue is at `/admin/queue`.

## Design tokens

All visual values live in `src/app/globals.css`: paper and ink colors, hairline, thin and heavy stroke widths, the 8px grid with 64px majors, measurement tick sizes, square radii, and the two font roles. Components use tokens through Tailwind utilities or `var(--token)`. Nothing hardcodes a color, a stroke width, a radius, or a font stack.

Font roles are CSS custom properties:

- `--font-chrome`: monospace. Labels, metadata, nav, tool names, step numbers.
- `--font-voice`: display face. Headlines.

The faces themselves are loaded in `src/app/layout.tsx` with `next/font` and bound to `--font-chrome-face` and `--font-voice-face`, which is what the font switch swaps later.

## shadcn/ui

Configured in `components.json` with the New York style on Radix. Components live in `src/components/ui/`. Add more with:

```sh
npx shadcn@latest add <component>
```

The semantic color names shadcn components use (`background`, `primary`, `muted`, `border`, and so on) are mapped onto the drafting palette in `globals.css`, so added components pick up the idiom without edits.

## Production build

```sh
npm run build
npm start
```

If Turbopack fails locally with `binding to a port: Operation not permitted`, the machine is refusing its worker a socket. Use `next build --webpack` and `next dev --webpack` there; Vercel builds with Turbopack as normal.

## UX loop

`scripts/ux-loop.sh [base-url]` screenshots every route at phone and desktop widths, records HTTP status and console errors, and writes a dated report under `ux-out/` (gitignored). Needs `agent-browser` on PATH. Run it after each visual change, against the dev server by default or against production with the domain as the argument.

The build fails on any blog post with invalid frontmatter. That is intentional.
