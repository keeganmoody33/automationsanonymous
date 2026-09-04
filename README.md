# automationsanonymous.com

A public directory of real, working automations plus an editorial blog. Every automation page is a structured, server-rendered record: a one-sentence summary, the trigger, ordered steps, prerequisites, failure modes, and the runnable payload (n8n JSON, a Zapier export, a shell script, a cron line) in a copyable block. Submissions are anonymous. There are no accounts, no profiles, and no public identities. Auth exists only to gate the admin review queue for a single operator. The site is built to be cited by answer engines, so the corpus is structured with JSON-LD, sitemaps, and an `llms.txt` pair.

## Stack

- Next.js (App Router, TypeScript strict)
- Tailwind CSS and shadcn/ui
- Convex for the database and server functions
- MDX in-repo for blog posts (`content/blog/*.mdx`)

## Setup

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

## Production build

```sh
npm run build
npm start
```

The build fails on any blog post with invalid frontmatter. That is intentional.
