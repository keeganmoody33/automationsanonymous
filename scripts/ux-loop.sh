#!/usr/bin/env bash
# UX loop: screenshot every route at phone and desktop widths, check HTTP
# status and console errors, write a dated report. Rerun after each fix.
#
#   scripts/ux-loop.sh                      # against http://localhost:3777
#   scripts/ux-loop.sh https://automationsanonymous.com
#
# Needs agent-browser on PATH (npm i -g agent-browser && agent-browser install).
# Output lands in ux-out/<date>/ which is gitignored.
set -euo pipefail

BASE="${1:-http://localhost:3777}"
STAMP="$(date +%Y-%m-%d-%H%M)"
OUT="ux-out/$STAMP"
SESSION="ux-loop"
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

slug() { echo "$1" | sed -E 's#^/$#home#; s#^/##; s#[^A-Za-z0-9]+#-#g; s#-+$##'; }

for route in "${ROUTES[@]}"; do
  name="$(slug "$route")"
  url="$BASE$route"
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 "$url")"
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

ab close >/dev/null || true
echo
echo "Report: $REPORT"
