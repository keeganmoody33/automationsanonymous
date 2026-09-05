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

# route  expected-status
ROUTES=(
  "/ 200"
  "/automations 200"
  "/automations?tool=n8n&difficulty=beginner 200"
  "/automations/placeholder-smoke-test 200"
  "/automations/does-not-exist 404"
  "/tools 200"
  "/tools/placeholder-tool 200"
  "/tools/does-not-exist 404"
  "/stacks/placeholder-tool-to-other-tool 200"
  "/stacks/placeholder-tool-to-placeholder-tool 404"
  "/stacks/a-to-b 404"
  "/blog 200"
  "/blog/example-post 200"
  "/submit 200"
  "/admin/queue 200"
  "/admin/automations/example-id 200"
  "/admin/import 200"
  "/does-not-exist 404"
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
  echo "| Route | HTTP | Canonical | Robots | Description | Title | Console errors | Phone | Desktop |"
  echo "|---|---|---|---|---|---|---|---|---|"
} > "$REPORT"

ab() { agent-browser --session "$SESSION" "$@"; }

# Always close the browser; mark the report if the run died partway.
trap 'rc=$?; ab close >/dev/null 2>&1 || true; if [ $rc -ne 0 ]; then echo "| ABORTED (exit $rc) | | | | | | | | |" >> "$REPORT"; echo "ux-loop aborted (exit $rc); partial report: $REPORT" >&2; fi' EXIT

slug() { echo "$1" | sed -E 's#^/$#home#; s#^/##; s#[^A-Za-z0-9]+#-#g; s#-+$##'; }

fail=0
body="$(mktemp)"
for entry in "${ROUTES[@]}"; do
  read -r route expect <<< "$entry"
  name="$(slug "$route")"
  url="$BASE$route"
  code="$(curl -s -o "$body" -w '%{http_code}' --max-time 30 "$url" || echo 000)"
  # The answer-engine surface: what a crawler sees without a browser.
  canonical="$(grep -oE '<link rel="canonical" href="[^"]*"' "$body" | sed -E 's/.*href="([^"]*)"/\1/' | head -1 || true)"
  robots="$(grep -oE '<meta name="robots" content="[^"]*"' "$body" | sed -E 's/.*content="([^"]*)"/\1/' | head -1 || true)"
  desc="$(grep -oE '<meta name="description" content="[^"]*"' "$body" | sed -E 's/.*content="([^"]*)"/\1/' | head -1 || true)"
  mark="$code"
  [ "$code" != "$expect" ] && { mark="**$code** (want $expect)"; fail=$((fail+1)); }
  case "$route" in
    /admin*) echo "$robots" | grep -q noindex || { robots="**${robots:-missing}** (want noindex)"; fail=$((fail+1)); } ;;
  esac
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
  echo "| \`$route\` | $mark | ${canonical:-none} | ${robots:-none} | $( [ -n "$desc" ] && echo "${desc:0:60}" || echo none ) | $title | ${errors:-none} | ${shots[0]} | ${shots[1]} |" >> "$REPORT"
  echo "$code  $route"
done

rm -f "$body"
echo
echo "Report: $REPORT"
if [ "$fail" -gt 0 ]; then
  echo "$fail check(s) failed; see bold cells in the report" >&2
  exit 2
fi
