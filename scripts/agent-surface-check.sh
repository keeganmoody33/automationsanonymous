#!/usr/bin/env bash
# Check that an agent has parity with a person: every read view answers, the
# MCP server handshakes and lists its tools, a tool call returns a real
# payload, and no private field escapes.
#
#   scripts/agent-surface-check.sh                                  # dev server
#   scripts/agent-surface-check.sh https://automationsanonymous.com # production
#
# Read-only. It never calls submit_automation or POST /api/submit, so it is
# safe against production.
set -uo pipefail

BASE="${1:-http://localhost:3000}"
BASE="${BASE%/}"
FAIL=0

ok()   { printf '  ok    %s\n' "$1"; }
bad()  { printf '  FAIL  %s\n' "$1"; FAIL=$((FAIL + 1)); }

check_json() { # path, jq-ish node expression, description
  local body
  body="$(curl -s --max-time 30 "$BASE$1")"
  if node -e "
      const d = JSON.parse(process.argv[1]);
      if (!($2)) { process.exit(1); }
    " "$body" 2>/dev/null; then ok "$1 $3"; else bad "$1 $3"; fi
}

echo "== capability manifest =="
check_json "/api" "d.mcp && d.endpoints.length >= 8" "lists mcp and endpoints"

echo "== read views =="
check_json "/api/automations" "d.count >= 1 && d.automations[0].slug" "lists automations"
check_json "/api/automations?difficulty=beginner" "d.automations.every(a => true)" "accepts difficulty"
check_json "/api/automations?q=backup" "Array.isArray(d.automations)" "accepts q"
check_json "/api/tools" "d.count >= 1 && d.tools[0].automationCount !== undefined" "lists tools with counts"

SLUG="$(curl -s --max-time 30 "$BASE/api/automations" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);console.log(j.automations[0]?.slug??"")})')"
if [ -z "$SLUG" ]; then bad "no automations published, cannot check a record"; else
  check_json "/api/automations/$SLUG" "d.slug && d.steps.length >= 1 && d.jsonLd['@type'] === 'HowTo'" "record with json-ld"
  MD="$(curl -s --max-time 30 "$BASE/api/automations/$SLUG.md")"
  case "$MD" in "# "*) ok "/api/automations/$SLUG.md markdown view";; *) bad "/api/automations/$SLUG.md markdown view";; esac
  check_json "/api/tools/$(curl -s "$BASE/api/tools" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).tools[0].slug))')" "d.slug && Array.isArray(d.automations)" "one tool"
fi
check_json "/api/blog" "d.count >= 1 && d.posts[0].slug" "lists posts"

echo "== not found =="
for p in /api/automations/nope /api/tools/nope /api/stacks/nope-to-nada /api/blog/nope; do
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 "$BASE$p")"
  [ "$code" = "404" ] && ok "$p returns 404" || bad "$p returned $code, want 404"
done

echo "== private fields never leak =="
# Asserted on structure, not on substrings. The corpus itself publishes this
# script as a record, so a grep for the field names matches its own source and
# reports a leak that is not there. Checking JSON keys is both immune to that
# and stricter: it also catches a value rendered under a renamed key.
leak_check() { # url, description
  curl -s --max-time 30 "$BASE$1" | node -e '
    let s = ""; process.stdin.on("data", d => s += d).on("end", () => {
      const PRIVATE = ["submitterEmail", "rejectionNote", "internalNotes"];
      const found = new Set();
      const walk = (v) => {
        if (Array.isArray(v)) return v.forEach(walk);
        if (v && typeof v === "object") {
          for (const k of Object.keys(v)) {
            if (PRIVATE.includes(k)) found.add(k);
            walk(v[k]);
          }
        }
      };
      try { walk(JSON.parse(s)); } catch { process.exit(2); }
      if (found.size) { console.error([...found].join(",")); process.exit(1); }
    });'
}
for path in "/api/automations" "/api/automations/$SLUG"; do
  if leak_check "$path" 2>/dev/null; then ok "$path exposes no private key"; else bad "$path exposes a private key"; fi
done

# The public record must carry only known-public keys, so a newly added private
# field fails here rather than waiting for someone to add it to a deny list.
ALLOWED="slug,title,summary,problem,trigger,steps,prerequisites,failureModes,payload,toolSlugs,timeSavedMinutes,difficulty,sourceUrl,origin,publishedAt,url,markdown,jsonLd"
EXTRA="$(curl -s --max-time 30 "$BASE/api/automations/$SLUG" | node -e '
  let s = ""; process.stdin.on("data", d => s += d).on("end", () => {
    const allowed = new Set(process.argv[1].split(","));
    console.log(Object.keys(JSON.parse(s)).filter(k => !allowed.has(k)).join(","));
  });' "$ALLOWED")"
[ -z "$EXTRA" ] && ok "record carries only known-public keys" || bad "record carries unexpected key(s): $EXTRA"

echo "== mcp =="
mcp() { # method, params json
  curl -s --max-time 30 -X POST "$BASE/mcp" \
    -H 'content-type: application/json' \
    -H 'accept: application/json, text/event-stream' \
    -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"$1\",\"params\":$2}"
}
# Streamable HTTP may answer as SSE; take the last data: line when it does.
unwrap() { node -e '
  let s = ""; process.stdin.on("data", d => s += d).on("end", () => {
    const lines = s.split(/\r?\n/).filter(l => l.startsWith("data: "));
    process.stdout.write(lines.length ? lines[lines.length - 1].slice(6) : s);
  });'; }

INIT="$(mcp initialize '{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"agent-surface-check","version":"1.0.0"}}' | unwrap)"
if printf '%s' "$INIT" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const r=JSON.parse(s);process.exit(r.result&&r.result.serverInfo?0:1)})' 2>/dev/null; then
  ok "initialize handshake"
else
  bad "initialize handshake: $(printf '%s' "$INIT" | head -c 200)"
fi

TOOLS="$(mcp tools/list '{}' | unwrap)"
NAMES="$(printf '%s' "$TOOLS" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).result.tools.map(t=>t.name).sort().join(","))}catch{console.log("")}})')"
EXPECTED="get_automation,get_post,get_stack,list_posts,list_tools,search_automations,submit_automation"
[ "$NAMES" = "$EXPECTED" ] && ok "tools/list: $NAMES" || bad "tools/list got [$NAMES] want [$EXPECTED]"

CALL="$(mcp tools/call "{\"name\":\"get_automation\",\"arguments\":{\"slug\":\"$SLUG\"}}" | unwrap)"
if printf '%s' "$CALL" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const t=JSON.parse(s).result.content[0].text;process.exit(t.includes("## Steps")&&t.includes("# ")?0:1)}catch{process.exit(1)}})' 2>/dev/null; then
  ok "tools/call get_automation returns the record"
else
  bad "tools/call get_automation: $(printf '%s' "$CALL" | head -c 200)"
fi

SEARCH="$(mcp tools/call '{"name":"search_automations","arguments":{"q":"backup"}}' | unwrap)"
printf '%s' "$SEARCH" | grep -q '"text"' && ok "tools/call search_automations" || bad "tools/call search_automations"

echo
if [ "$FAIL" -eq 0 ]; then echo "agent surface: all checks passed against $BASE"; else echo "agent surface: $FAIL check(s) failed against $BASE" >&2; fi
exit "$FAIL"
