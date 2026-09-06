import { parse as parseYaml } from "yaml";

/*
  Structural checks on a submitted payload, run in the request path.

  These are cheap and synchronous on purpose: they exist to make a submission
  cost something real to produce. A bot generating plausible prose fails them; a
  person who actually ran the automation passes without noticing. That asymmetry
  is the point, and it is what a rate limit cannot give, because a rate limit
  slows a flood while this raises the floor on everything that arrives.

  They are deliberately shallower than `scripts/check-payloads.mjs`, which runs
  in CI with real tools (node --check, bash -n, shellcheck). CI can afford to
  spawn processes; a mutation cannot. Same intent, different depth, so the two
  are not a failed attempt at sharing code.

  Convex re-checks the format allowlist, JSON and cron independently in
  `convex/lib/limits.ts`, because NEXT_PUBLIC_CONVEX_URL is public and the
  mutation is callable without going through any of this.
*/

/** Formats a payload may declare. Kept in step with `convex/lib/limits.ts`. */
export const PAYLOAD_FORMATS = [
  "sh",
  "bash",
  "yaml",
  "yml",
  "json",
  "xml",
  "javascript",
  "js",
  "python",
  "cron",
  "text",
  "toml",
  "ini",
  "sql",
  "hcl",
] as const;

export type PayloadFormat = (typeof PAYLOAD_FORMATS)[number];

const CRON_ALIASES = new Set([
  "@reboot",
  "@yearly",
  "@annually",
  "@monthly",
  "@weekly",
  "@daily",
  "@midnight",
  "@hourly",
]);

/**
 * Lines that carry a schedule. Blanks, comments, and environment assignments
 * (SHELL=/bin/sh, MAILTO="", PATH=...) are all legitimate crontab content and
 * are not schedules, so they are skipped rather than rejected.
 */
const CRON_ENV_LINE = /^[A-Za-z_][A-Za-z0-9_]*\s*=/;

function meaningfulLines(content: string): string[] {
  return content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && !CRON_ENV_LINE.test(l));
}

/**
 * Prose wearing a payload's clothes: sentences, no shell or code punctuation.
 * Only consulted for formats that have no parser, so a false positive costs a
 * submitter one edit rather than a rejection they cannot understand.
 */
function looksLikeProse(content: string): boolean {
  const text = content.trim();
  if (text.length < 40) return false;
  if (/[$|><;&`{}[\]=\\]|\s--?\w|\/\w/.test(text)) return false;
  const words = text.split(/\s+/);
  const sentences = text.split(/[.!?]\s/).length;
  return words.length > 12 && sentences > 1;
}

function balancedTags(xml: string): boolean {
  const withoutComments = xml.replace(/<!--[\s\S]*?-->/g, "");
  const stack: string[] = [];
  const tag = /<\/?([A-Za-z_][\w.:-]*)([^>]*?)(\/?)>/g;
  let m: RegExpExecArray | null;
  while ((m = tag.exec(withoutComments)) !== null) {
    const [raw, name, , selfClose] = m;
    if (raw.startsWith("<?") || raw.startsWith("<!")) continue;
    if (raw.startsWith("</")) {
      if (stack.pop() !== name) return false;
    } else if (!selfClose) {
      stack.push(name);
    }
  }
  return stack.length === 0;
}

function balancedBrackets(code: string): boolean {
  // Strings and comments are not parsed out, so this is a smoke test rather
  // than a syntax check. CI runs `node --check` for the real thing.
  const pairs: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
  const stack: string[] = [];
  for (const ch of code) {
    if (ch === "(" || ch === "[" || ch === "{") stack.push(ch);
    else if (ch in pairs && stack.pop() !== pairs[ch]) return false;
  }
  return stack.length === 0;
}

/**
 * Returns a human-readable reason the payload is not what it claims to be, or
 * null when it passes. The message is shown to the submitter, so it names the
 * problem rather than the rule.
 */
export function payloadIssue(format: string, content: string): string | null {
  const trimmed = content.trim();
  if (trimmed.length < 8) return "payload content is too short to be runnable";

  const fmt = format.trim().toLowerCase();
  if (!(PAYLOAD_FORMATS as readonly string[]).includes(fmt)) {
    return `payload format must be one of: ${PAYLOAD_FORMATS.join(", ")}`;
  }

  switch (fmt) {
    case "json": {
      try {
        JSON.parse(trimmed);
      } catch (err) {
        return `payload does not parse as JSON: ${(err as Error).message}`;
      }
      return null;
    }
    case "yaml":
    case "yml": {
      try {
        const doc = parseYaml(trimmed);
        if (doc === null || typeof doc !== "object") {
          return "payload parses as YAML but is not a mapping or a list";
        }
      } catch (err) {
        return `payload does not parse as YAML: ${(err as Error).message}`;
      }
      return null;
    }
    case "xml": {
      if (!trimmed.startsWith("<")) return "payload does not start with an XML tag";
      if (!balancedTags(trimmed)) return "payload has unbalanced XML tags";
      return null;
    }
    case "cron": {
      for (const line of meaningfulLines(trimmed)) {
        const fields = line.split(/\s+/);
        // Shorthands are matched exactly, and an unrecognised @token is an
        // error rather than something to fall through to the field count.
        // Both rules mirror convex/lib/limits.ts, which is the backstop that
        // cannot be bypassed; a submission must not clear this gate and then
        // die in the mutation.
        if (fields[0].startsWith("@")) {
          if (!CRON_ALIASES.has(fields[0])) {
            return `cron line "${line}" uses an unknown shorthand; allowed: ${[...CRON_ALIASES].join(", ")}`;
          }
          if (fields.length < 2) return `cron line "${line}" has a schedule but no command`;
          continue;
        }
        if (fields.length < 6) {
          return `cron line "${line}" needs five schedule fields and a command`;
        }
      }
      return null;
    }
    case "javascript":
    case "js": {
      if (!balancedBrackets(trimmed)) return "payload has unbalanced brackets";
      if (looksLikeProse(trimmed)) return "payload reads as prose rather than code";
      return null;
    }
    default: {
      // sh, bash, python, text, toml, ini, sql, hcl: no parser available here.
      if (looksLikeProse(trimmed)) return "payload reads as prose rather than a runnable artifact";
      return null;
    }
  }
}
