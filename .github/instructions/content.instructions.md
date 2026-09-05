---
applyTo: "content/**/*.mdx"
---

# Blog posts

- One file per post in `content/blog/`. The filename is the slug, lowercase words joined by hyphens, and it never changes after publishing.
- Frontmatter is exactly `title` (3 to 140 chars), `description` (one standalone sentence, up to 300 chars), `date` (YYYY-MM-DD), optional `updated` (YYYY-MM-DD), optional `draft: true`. Any other key fails the build (`src/lib/blog.ts`).
- Headings inside a post start at `##`. The title is the page `h1`.
- No author, byline, or signature. The publisher is the site.
- No em dashes. No twelve-step or recovery language. Specific over adjectival. Never fabricate a metric, a testimonial, or a company.
- Site links are relative paths (`/automations/some-slug`). External links get `rel="noopener noreferrer"` automatically.
- Code blocks render in the payload style. Keep them runnable and verbatim.
- Drafts (`draft: true`) are excluded from the index, sitemap, and static params, and 404 in production.
