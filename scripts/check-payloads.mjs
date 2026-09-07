#!/usr/bin/env node
/*
  Corpus conformance. Checks that every authored record is what it claims to be,
  using real tools rather than the cheap structural checks the request path can
  afford (src/lib/payload-check.ts). Same intent, more depth: this can spawn
  processes, a Convex mutation cannot.

    node scripts/check-payloads.mjs [file]     default: content/seed/automations.json

  Exits non-zero with a report naming every failure. Run in CI on every push, so
  a payload that stops being valid breaks the build rather than sitting
  published and wrong.
*/
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { parse as parseYaml } from "yaml";

const FILE = process.argv[2] ?? "content/seed/automations.json";
const seed = JSON.parse(readFileSync(FILE, "utf8"));
const scratch = mkdtempSync(path.join(tmpdir(), "payload-check-"));
const failures = [];
const fail = (slug, msg) => failures.push(`${slug}: ${msg}`);

const CRON_ALIASES = new Set([
  "@reboot", "@yearly", "@annually", "@monthly",
  "@weekly", "@daily", "@midnight", "@hourly",
]);

function run(cmd, args) {
  execFileSync(cmd, args, { stdio: "pipe" });
}

// Node picks a module format from the extension, so a payload declared
// "javascript" has to land on disk as .cjs to be checkable as a script.
const EXTENSION = { javascript: "cjs", js: "cjs", yml: "yaml", bash: "sh" };

function checkPayload(slug, { format, content }) {
  const fmt = format.trim().toLowerCase();
  const file = path.join(scratch, `${slug}.${EXTENSION[fmt] ?? fmt}`);
  writeFileSync(file, content);

  try {
    switch (fmt) {
      case "sh":
      case "bash":
        run("bash", ["-n", file]);
        break;
      case "javascript":
      case "js":
        run("node", ["--check", file]);
        break;
      case "json":
        JSON.parse(content);
        break;
      case "yaml":
      case "yml": {
        const doc = parseYaml(content);
        if (doc === null || typeof doc !== "object") {
          fail(slug, "yaml parses but is not a mapping or list");
        }
        break;
      }
      case "xml":
        // A real parse, not a tag-balance heuristic. python3 ships on the runner.
        run("python3", ["-c", "import sys,xml.dom.minidom as m; m.parse(sys.argv[1])", file]);
        break;
      case "cron":
        for (const line of content.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"))) {
          const fields = line.split(/\s+/);
          if (CRON_ALIASES.has(fields[0].toLowerCase())) {
            if (fields.length < 2) fail(slug, `cron line has a schedule but no command: ${line}`);
          } else if (fields.length < 6) {
            fail(slug, `cron line needs five schedule fields and a command: ${line}`);
          }
        }
        break;
      default:
        break;
    }
  } catch (err) {
    const detail = (err.stderr?.toString() || err.message || "").trim().split("\n")[0];
    fail(slug, `payload is not valid ${fmt}: ${detail}`);
  }
}

// The project's own rules, so CI enforces what CLAUDE.md states.
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const knownTools = new Set(seed.tools.map((t) => t.slug));

for (const t of seed.tools) {
  if (!SLUG.test(t.slug)) fail(t.slug, "tool slug must be lowercase words joined by hyphens");
}

for (const r of seed.records) {
  const slug = r.slug ?? r.title;
  const blob = JSON.stringify(r);

  if (!SLUG.test(r.slug ?? "")) fail(slug, "record slug must be lowercase words joined by hyphens");
  if (r.title.length > 140) fail(slug, "title over 140 characters");
  if (r.summary.length > 300) fail(slug, "summary over 300 characters");
  if (/[—–]/.test(blob)) fail(slug, "em or en dash in user-facing copy");
  for (const banned of ["twelve step", "twelve-step", "higher power", "one day at a time"]) {
    if (blob.toLowerCase().includes(banned)) fail(slug, `recovery language: "${banned}"`);
  }

  const orders = r.steps.map((s) => s.order);
  if (orders.join() !== orders.map((_, i) => i + 1).join()) fail(slug, "steps are not numbered 1..n in order");

  for (const s of r.steps) {
    if (s.toolSlug && !knownTools.has(s.toolSlug)) fail(slug, `step references unknown tool "${s.toolSlug}"`);
    if (s.toolSlug && !r.toolSlugs.includes(s.toolSlug)) fail(slug, `step tool "${s.toolSlug}" missing from toolSlugs`);
  }
  for (const t of r.toolSlugs) {
    if (!knownTools.has(t)) fail(slug, `references unknown tool "${t}"`);
  }
  if (!r.failureModes?.length) fail(slug, "no failure modes; the field is the point of the record");

  if (r.payload) checkPayload(r.slug ?? "record", r.payload);
}

rmSync(scratch, { recursive: true, force: true });

const n = seed.records.length;
const t = seed.tools.length;
if (failures.length) {
  console.error(`corpus check failed: ${failures.length} problem(s) across ${n} records\n`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`corpus check passed: ${n} records, ${t} tools, every payload valid for its declared format`);
