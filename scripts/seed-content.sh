#!/usr/bin/env bash
# Seed the directory with authored records.
#
#   scripts/seed-content.sh content/seed/automations.json          # dev
#   scripts/seed-content.sh content/seed/automations.json --prod   # production
#
# Every record goes through the real review path: createAuthored writes it as
# pending, then approve, then publish assigns the permanent slug. Nothing here
# writes `published` directly.
#
# Safe to run twice, and safe to resume after a failure part way through: a
# record already published is skipped, and one left pending or approved by an
# interrupted run is picked up by title rather than created again.
#
# Needs ADMIN_SESSION_SECRET in .env.local, node, and the Convex CLI.
set -euo pipefail

FILE="${1:?usage: seed-content.sh <seed.json> [--prod]}"
PROD_FLAG=""
[ "${2:-}" = "--prod" ] && PROD_FLAG="--prod"

cd "$(dirname "$0")/.."
SEED="$PWD/$FILE"

SECRET="$(grep '^ADMIN_SESSION_SECRET=' .env.local | cut -d= -f2-)"
[ -n "$SECRET" ] || { echo "ADMIN_SESSION_SECRET is not in .env.local" >&2; exit 1; }

TOKEN="$(node -e '
  const c = require("crypto");
  const expires = Date.now() + 30 * 60 * 1000;
  console.log(expires + "." + c.createHmac("sha256", process.argv[1]).update(String(expires)).digest("base64url"));
' "$SECRET")"

# The Convex CLI occasionally fails a single call on a flaky connection.
run() {
  local out attempt=1
  while :; do
    if out="$(npx convex run $PROD_FLAG "$1" "$2" 2>&1)"; then
      printf '%s' "$out"
      return 0
    fi
    if [ "$attempt" -ge 3 ]; then
      printf '%s\n' "$out" >&2
      return 1
    fi
    attempt=$((attempt + 1))
    sleep 2
  done
}

node_field() { node -e "$1" "$SEED" "${2:-}" "${3:-}"; }

echo "== tools =="
COUNT_T="$(node_field 'console.log(require(process.argv[1]).tools.length)')"
for i in $(seq 0 $((COUNT_T - 1))); do
  args="$(node_field '
    const t = require(process.argv[1]).tools[process.argv[2]];
    console.log(JSON.stringify({ token: process.argv[3], ...t }));
  ' "$i" "$TOKEN")"
  run admin/tools:upsert "$args" > /dev/null
  echo "  $(node_field 'console.log(require(process.argv[1]).tools[process.argv[2]].slug)' "$i")"
done

echo "== automations =="
COUNT="$(node_field 'console.log(require(process.argv[1]).records.length)')"
for i in $(seq 0 $((COUNT - 1))); do
  slug="$(node_field 'console.log(require(process.argv[1]).records[process.argv[2]].slug)' "$i")"
  title="$(node_field 'console.log(require(process.argv[1]).records[process.argv[2]].title)' "$i")"

  existing="$(run public/automations:getBySlug "{\"slug\":\"$slug\"}" | tr -d '[:space:]')"
  if [ "$existing" != "null" ] && [ -n "$existing" ]; then
    echo "  $slug: already published, skipped"
    continue
  fi

  # Pick up a record an interrupted run left behind, matched on title.
  id=""
  for status in approved pending; do
    found="$(run admin/automations:listByStatus "{\"token\":\"$TOKEN\",\"status\":\"$status\"}" \
      | node -e '
          let s = ""; process.stdin.on("data", d => s += d).on("end", () => {
            const rows = JSON.parse(s);
            const hit = rows.find(r => r.title === process.argv[1]);
            console.log(hit ? hit._id : "");
          });
        ' "$title")"
    if [ -n "$found" ]; then id="$found"; echo "  $slug: resuming $status record"; break; fi
  done

  if [ -z "$id" ]; then
    args="$(node_field '
      const { slug, ...content } = require(process.argv[1]).records[process.argv[2]];
      console.log(JSON.stringify({ token: process.argv[3], ...content }));
    ' "$i" "$TOKEN")"
    id="$(run admin/automations:createAuthored "$args" | tr -d '"[:space:]')"
  fi

  run admin/automations:approve "{\"token\":\"$TOKEN\",\"id\":\"$id\"}" > /dev/null 2>&1 || true
  run admin/automations:publish "{\"token\":\"$TOKEN\",\"id\":\"$id\",\"slug\":\"$slug\"}" > /dev/null
  echo "  $slug: published"
done

echo
echo "published slugs:"
run public/automations:listPublishedSlugs '{}'
