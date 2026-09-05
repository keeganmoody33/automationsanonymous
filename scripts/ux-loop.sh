#!/usr/bin/env bash
# UX loop: screenshot every route at phone and desktop widths, check HTTP
# status and console errors, write a dated report. Rerun after each fix.
#
#   scripts/ux-loop.sh                      # against the dev server, http://localhost:3000
#   scripts/ux-loop.sh https://automationsanonymous.com
#
# Needs agent-browser on PATH (npm i -g agent-browser && agent-browser install).
# Output lands in ux-out/<date>/ which is gitignored.
set -euo pipefail

BASE="${1:-http://localhost:${PORT:-3000}}"
BASE="${BASE%/}"
curl -sf --max-time 10 -o /dev/null "$BASE/" || { echo "No server responding at $BASE" >&2; exit 1; }
STAMP="$(date +%Y-%m-%d-%H%M%S)"
OUT="ux-out/$STAMP"
SESSION="ux-loop-$$"
mkdir -p "$OUT"

ROUTES=(
  /
  /automations
  "/automations?tool=n8n&difficulty=beginner"
  /automations/example-slug
  /tools
  /tools/example-tool
  /stacks/a-to-b
  /blog
  /blog/example-post
  /submit
  /admin/queue
  /admin/automations/example-id
  /admin/import
  /does-not-exist
)

# name  width  height
VIEWPORTS=(
  "phone 390 844"
  "desktop 1280 800"
)

REPORT="$OUT/report.md"
{
  echo "# UX loop $STAMP"
  echo
  echo "Base: $BASE"
  echo
  echo "| Route | HTTP | Title | Console errors | Phone | Desktop |"
  echo "|---|---|---|---|---|---|"
} > "$REPORT"

ab() { agent-browser --session "$SESSION" "$@"; }

# Always close the browser; mark the report if the run died partway.
trap 'rc=$?; ab close >/dev/null 2>&1 || true; if [ $rc -ne 0 ]; then echo "| ABORTED (exit $rc) | | | | | |" >> "$REPORT"; echo "ux-loop aborted (exit $rc); partial report: $REPORT" >&2; fi' EXIT

slug() { echo "$1" | sed -E 's#^/$#home#; s#^/##; s#[^A-Za-z0-9]+#-#g; s#-+$##'; }

for route in "${ROUTES[@]}"; do
  name="$(slug "$route")"
  url="$BASE$route"
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 "$url" || echo 000)"
  title=""; errors=""; shots=()
  for vp in "${VIEWPORTS[@]}"; do
    read -r vname w h <<< "$vp"
    ab set viewport "$w" "$h" >/dev/null
    ab open "$url" >/dev/null
    ab wait --load networkidle >/dev/null || true
    [ -z "$title" ] && title="$(ab get title 2>/dev/null | tr -d '\n' || true)"
    e="$(ab errors 2>/dev/null | grep -v '^$' | grep -vi 'no errors' || true)"
    [ -n "$e" ] && errors="$errors $vname:$(echo "$e" | wc -l | tr -d ' ')"
    shot="$OUT/$name.$vname.png"
    ab screenshot --full "$shot" >/dev/null
    shots+=("$shot")
  done
  echo "| \`$route\` | $code | $title | ${errors:-none} | ${shots[0]} | ${shots[1]} |" >> "$REPORT"
  echo "$code  $route"
done

echo
echo "Report: $REPORT"
