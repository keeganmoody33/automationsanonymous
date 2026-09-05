import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { SITE_URL } from "@/lib/schema-org";
import { json, preflight } from "@/lib/api";

export async function GET() {
  const tools = await fetchQuery(api.public.tools.list, {});
  return json({
    count: tools.length,
    tools: tools.map((t) => ({
      ...t,
      url: `${SITE_URL}/tools/${t.slug}`,
      automations: `${SITE_URL}/api/automations?tool=${encodeURIComponent(t.slug)}`,
    })),
  });
}

export const OPTIONS = preflight;
