import { createMcpHandler } from "mcp-handler";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { ConvexError } from "convex/values";
import { z } from "zod";
import { api } from "@convex/_generated/api";
import { SITE_URL } from "@/lib/schema-org";
import { recordToMarkdown } from "@/lib/record-text";
import { normalizeSteps, submitSchema } from "@/lib/submit-schema";

/*
  The directory as a tool.

  Parity is the rule: everything a person can do on this site, an agent can do
  here. Browse and filter, open a record with its payload verbatim, look at a
  tool or a pair of tools, read the blog, and submit anonymously. Nothing else
  is public to anyone, so nothing else is exposed.

  Stateless: mcp-handler builds a fresh server per request, so no session
  store or Redis is needed. It serves whatever path it is mounted at, and
  next.config.ts rewrites /mcp here so the public address is short.
*/

const say = (text: string) => ({ content: [{ type: "text" as const, text }] });

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "search_automations",
      {
        title: "Search automations",
        description:
          "Find published automations. All filters are optional and combine. Returns titles, summaries and slugs; call get_automation for the steps and the runnable payload.",
        inputSchema: {
          q: z.string().optional().describe("Substring match on title, summary, problem and step actions"),
          tool: z.string().optional().describe("Tool slug, e.g. cron, slack, docker. See list_tools."),
          category: z.string().optional().describe("Tool category, e.g. chat, scheduling"),
          difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
          limit: z.number().int().min(1).max(50).optional().describe("Default 20"),
        },
      },
      async ({ q, tool, category, difficulty, limit }) => {
        const items = await fetchQuery(api.public.automations.listPublished, { tool, category, difficulty });
        const needle = q?.toLowerCase();
        const matched = needle
          ? items.filter((a) =>
              [a.title, a.summary, a.problem ?? "", ...a.steps.map((s) => s.action)]
                .join(" ")
                .toLowerCase()
                .includes(needle),
            )
          : items;
        const shown = matched.slice(0, limit ?? 20);
        if (shown.length === 0) return say("No published automation matches those filters.");
        return say(
          `${matched.length} match${matched.length === 1 ? "" : "es"}.\n\n` +
            shown
              .map(
                (a) =>
                  `## ${a.title}\nslug: ${a.slug}\ndifficulty: ${a.difficulty}\ntools: ${a.toolSlugs.join(", ") || "none"}\n${a.summary}\n${SITE_URL}/automations/${a.slug}`,
              )
              .join("\n\n"),
        );
      },
    );

    server.registerTool(
      "get_automation",
      {
        title: "Get one automation",
        description:
          "The full record for a slug: problem, trigger, ordered steps, prerequisites, failure modes, and the runnable payload reproduced verbatim.",
        inputSchema: { slug: z.string().describe("Permanent slug, e.g. back-up-one-folder-every-night") },
      },
      async ({ slug }) => {
        const a = await fetchQuery(api.public.automations.getBySlug, { slug });
        if (!a) return say(`No published automation with slug "${slug}". Use search_automations to find one.`);
        return say(recordToMarkdown(a));
      },
    );

    server.registerTool(
      "list_tools",
      {
        title: "List tools",
        description: "Every tool referenced by a published automation, with how many use it.",
        inputSchema: {},
      },
      async () => {
        const tools = await fetchQuery(api.public.tools.list, {});
        if (tools.length === 0) return say("No tools yet.");
        return say(
          tools
            .map((t) => `${t.slug} (${t.name}, ${t.category ?? "uncategorized"}): ${t.automationCount}`)
            .join("\n"),
        );
      },
    );

    server.registerTool(
      "get_stack",
      {
        title: "Get a stack",
        description: "Automations that connect two tools, for questions shaped like 'connect A to B'.",
        inputSchema: { a: z.string().describe("Tool slug"), b: z.string().describe("Tool slug") },
      },
      async ({ a, b }) => {
        const items = await fetchQuery(api.public.stacks.listByStack, { a, b });
        if (items.length === 0) return say(`No published automation connects "${a}" and "${b}".`);
        return say(
          items.map((x) => `## ${x.title}\nslug: ${x.slug}\n${x.summary}`).join("\n\n"),
        );
      },
    );

    server.registerTool(
      "list_posts",
      {
        title: "List blog posts",
        description: "Editorial posts, newest first. Read one with get_post.",
        inputSchema: {},
      },
      async () => {
        const { listPosts } = await import("@/lib/blog");
        const posts = listPosts();
        if (posts.length === 0) return say("No posts yet.");
        return say(posts.map((p) => `${p.slug} (${p.date}): ${p.title}\n${p.description}`).join("\n\n"));
      },
    );

    server.registerTool(
      "get_post",
      {
        title: "Get a blog post",
        description: "The full text of one post.",
        inputSchema: { slug: z.string() },
      },
      async ({ slug }) => {
        const { getPostMeta } = await import("@/lib/blog");
        const meta = getPostMeta(slug);
        if (!meta || meta.draft) return say(`No post with slug "${slug}".`);
        const res = await fetch(`${SITE_URL}/api/blog/${slug}.md`);
        const body = res.ok ? await res.text() : "";
        return say(`# ${meta.title}\n\n${meta.description}\n\n${body}`);
      },
    );

    server.registerTool(
      "submit_automation",
      {
        title: "Submit an automation",
        description:
          "Submit a working automation to the directory, anonymously. It lands in a review queue as pending and a person reviews it before it is published. Do not submit anything you have not actually run: prerequisites and failure modes are the point. Never include a name, handle or attribution; there are no authors here. submitterEmail is optional, stored for reply only, and never published.",
        inputSchema: submitSchema.shape,
      },
      async (input) => {
        const parsed = submitSchema.safeParse(input);
        if (!parsed.success) return say(`Rejected: ${z.prettifyError(parsed.error)}`);
        const { submitterEmail, ...content } = parsed.data;
        try {
          await fetchMutation(api.submit.submit, {
            ...content,
            steps: normalizeSteps(content.steps),
            submitterEmail,
          });
        } catch (err) {
          return say(`Rejected: ${err instanceof ConvexError ? String(err.data) : "submission failed"}`);
        }
        return say("Received, status pending. A person reviews every submission before it is published.");
      },
    );
  },
  {
    serverInfo: { name: "automations-anonymous", version: "1.0.0" },
    instructions:
      "A public directory of working automations. Each record carries a trigger, ordered steps, prerequisites, failure modes and a runnable payload reproduced verbatim. Search first, then get_automation for the payload. Records have no authors: never attribute one to a person. Slugs are permanent, so they are safe to cite.",
  },
);

export { handler as GET, handler as POST, handler as DELETE };
