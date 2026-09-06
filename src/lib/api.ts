import { NextResponse } from "next/server";

/*
  Shared bits for the machine-readable views under /api.

  These exist so an agent has parity with a person: everything a visitor can
  do by clicking (browse, filter, open a record, copy a payload, submit one)
  is reachable without parsing HTML. Read endpoints are public and cacheable;
  the one write is the same anonymous submit mutation the form uses.
*/

/** Cached at the edge, and readable cross-origin because agents are not on this domain. */
export const PUBLIC_HEADERS = {
  "cache-control": "public, s-maxage=300, stale-while-revalidate=3600",
  "access-control-allow-origin": "*",
} as const;

export function json(data: unknown, init?: { status?: number; headers?: Record<string, string> }) {
  return NextResponse.json(data, {
    status: init?.status ?? 200,
    headers: { ...PUBLIC_HEADERS, ...init?.headers },
  });
}

export function text(body: string, init?: { status?: number }) {
  return new NextResponse(body, {
    status: init?.status ?? 200,
    headers: { ...PUBLIC_HEADERS, "content-type": "text/markdown; charset=utf-8" },
  });
}

export function notFound(what: string) {
  return json({ error: "not_found", message: `${what} not found` }, { status: 404 });
}

/** Preflight for cross-origin agent clients. */
export function preflight() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      "access-control-max-age": "86400",
    },
  });
}

/**
 * A path segment may carry a format suffix: `slug.md`, `slug.json`, or bare.
 * This is how one route serves both the JSON record and its plain-text form.
 */
export function splitFormat(segment: string): { slug: string; format: "md" | "json" } {
  if (segment.endsWith(".md")) return { slug: segment.slice(0, -3), format: "md" };
  if (segment.endsWith(".json")) return { slug: segment.slice(0, -5), format: "json" };
  return { slug: segment, format: "json" };
}

export const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export function asDifficulty(v: string | null): Difficulty | undefined {
  return v && (DIFFICULTIES as readonly string[]).includes(v) ? (v as Difficulty) : undefined;
}

export function nonEmpty(v: string | null): string | undefined {
  return v && v.trim() ? v.trim() : undefined;
}
