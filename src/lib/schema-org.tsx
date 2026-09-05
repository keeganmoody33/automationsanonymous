import type { PublicAutomation } from "@convex/lib/publicShape";
import type { Frontmatter } from "@/lib/blog";

/*
  Typed JSON-LD builders. Pages call these and render the result through
  <JsonLd>; no page hand-writes structured data. There is no `author` field
  anywhere in this file and none may be added: the site has no identities.
*/

export const SITE_URL = "https://automationsanonymous.com";
export const SITE_NAME = "Automations Anonymous";

type Thing = { "@context": "https://schema.org"; "@type": string; [k: string]: unknown };

const abs = (p: string) => new URL(p, SITE_URL).toString();

/** Minutes to an ISO 8601 duration. */
export function isoDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `PT${h ? `${h}H` : ""}${m || !h ? `${m}M` : ""}`;
}

export type HowTo = Thing & {
  "@type": "HowTo";
  name: string;
  description: string;
  url: string;
  totalTime?: string;
  tool: { "@type": "HowToTool"; name: string; url: string }[];
  step: { "@type": "HowToStep"; position: number; name: string; text: string; url?: string }[];
  datePublished: string;
};

export function howTo(a: PublicAutomation): HowTo {
  const url = abs(`/automations/${a.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: a.title,
    description: a.summary,
    url,
    ...(a.timeSavedMinutes ? { totalTime: isoDuration(a.timeSavedMinutes) } : {}),
    tool: a.toolSlugs.map((slug) => ({ "@type": "HowToTool", name: slug, url: abs(`/tools/${slug}`) })),
    step: [...a.steps]
      .sort((x, y) => x.order - y.order)
      .map((s) => ({
        "@type": "HowToStep",
        position: s.order,
        name: s.action,
        text: s.detail ?? s.action,
        ...(s.toolSlug ? { url: abs(`/tools/${s.toolSlug}`) } : {}),
      })),
    datePublished: new Date(a.publishedAt).toISOString(),
  };
}

export type Article = Thing & {
  "@type": "Article";
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified: string;
  publisher: { "@type": "Organization"; name: string; url: string };
};

export function article(post: Frontmatter & { slug: string }): Article {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    url: abs(`/blog/${post.slug}`),
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };
}

export type ItemList = Thing & {
  "@type": "ItemList";
  name: string;
  url: string;
  numberOfItems: number;
  itemListElement: { "@type": "ListItem"; position: number; name: string; url: string }[];
};

export function itemList(name: string, pathname: string, items: { name: string; path: string }[]): ItemList {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    url: abs(pathname),
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      url: abs(it.path),
    })),
  };
}

export function automationItems(items: PublicAutomation[]) {
  return items.map((a) => ({ name: a.title, path: `/automations/${a.slug}` }));
}

/** Renders one JSON-LD block. `<` is escaped so a title cannot close the script tag. */
export function JsonLd({ data }: { data: Thing }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
