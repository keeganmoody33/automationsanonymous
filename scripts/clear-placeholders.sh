#!/usr/bin/env bash
# Delete every record whose title begins with PLACEHOLDER, in any status.
#
#   scripts/clear-placeholders.sh          # dev
#   scripts/clear-placeholders.sh --prod   # production
#
# The smoke tests and the end to end flow test write records titled
# PLACEHOLDER ... on purpose. This removes them once real content has landed.
# It matches on that prefix only, so an authored record is never touched.
set -euo pipefail

PROD_FLAG=""
[ "${1:-}" = "--prod" ] && PROD_FLAG="--prod"

cd "$(dirname "$0")/.."

SECRET="$(grep '^ADMIN_SESSION_SECRET=' .env.local | cut -d= -f2-)"
[ -n "$SECRET" ] || { echo "ADMIN_SESSION_SECRET is not in .env.local" >&2; exit 1; }

TOKEN="$(node -e '
  const c = require("crypto");
  const expires = Date.now() + 15 * 60 * 1000;
  console.log(expires + "." + c.createHmac("sha256", process.argv[1]).update(String(expires)).digest("base64url"));
' "$SECRET")"

run() { npx convex run $PROD_FLAG "$1" "$2"; }

for status in raw pending approved rejected published; do
  ids="$(run admin/automations:listByStatus "{\"token\":\"$TOKEN\",\"status\":\"$status\"}" \
    | node -e '
        let s = ""; process.stdin.on("data", d => s += d).on("end", () => {
          for (const r of JSON.parse(s)) {
            if (r.title.startsWith("PLACEHOLDER")) console.log(r._id + "\t" + r.title);
          }
        });
      ')"
  [ -z "$ids" ] && continue
  printf '%s\n' "$ids" | while IFS=$'\t' read -r id title; do
    run admin/automations:remove "{\"token\":\"$TOKEN\",\"id\":\"$id\"}" > /dev/null
    echo "  removed [$status] $title"
  done
done

echo
echo "published slugs now:"
run public/automations:listPublishedSlugs '{}'
