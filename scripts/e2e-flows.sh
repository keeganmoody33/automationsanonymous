#!/usr/bin/env bash
# End-to-end test of the Phase 6 flows against a local dev server and the
# Convex DEV deployment. Creates placeholder records (titled PLACEHOLDER ...)
# in dev; never point it at production.
#
#   scripts/e2e-flows.sh
#
# Needs agent-browser on PATH and ADMIN_PASSWORD in .env.local.
set -u
cd "$(dirname "$0")/.."
(npx next dev --webpack -p 3000 > "${TMPDIR:-/tmp}/dev.log" 2>&1 &); for i in $(seq 1 40); do curl -sf -o /dev/null http://localhost:3000/ && break; sleep 2; done; echo "dev up"
PASS=$(grep '^ADMIN_PASSWORD=' .env.local | cut -d= -f2-)
S=e2e-$$; ab(){ agent-browser --session $S "$@"; }
T=$(date +%H%M%S); SLUG="placeholder-e2e-$T"
ab set viewport 1280 900 >/dev/null

# click a button/link by accessible name after scrolling it into view
btn(){ local ref; ref=$(ab snapshot -i | grep -i "button \"$1\"" | grep -oE 'ref=e[0-9]+' | head -1 | cut -d= -f2); [ -n "$ref" ] && ab scrollintoview @$ref >/dev/null && ab click @$ref >/dev/null || echo "no button $1"; }
lnk(){ local ref; ref=$(ab snapshot -i | grep -i "link \"$1" | grep -oE 'ref=e[0-9]+' | head -1 | cut -d= -f2); [ -n "$ref" ] && ab scrollintoview @$ref >/dev/null && ab click @$ref >/dev/null || echo "no link $1"; }

echo "=== 1. submit: validation ==="
ab open http://localhost:3000/submit >/dev/null; ab wait --load networkidle >/dev/null
ab find label "Title" fill "xy" >/dev/null
ab find label "Summary" fill "too short" >/dev/null
ab find label "Steps" fill "x | Bad Slug" >/dev/null
btn "Submit for review"; sleep 2
echo "errors shown: $(ab get text body | grep -oiE 'at least 3 characters|at least 20 characters|lowercase words joined by hyphens' | sort -u | tr '\n' ' ')"

echo "=== 2. submit: valid ==="
ab find label "Title" fill "PLACEHOLDER e2e record $T" >/dev/null
ab find label "Summary" fill "Placeholder written by the Phase 6 end-to-end test to exercise submit, review, and publish." >/dev/null
ab find label "Steps" fill "Placeholder step one | placeholder-tool
Placeholder step two | other-tool | with a detail" >/dev/null
ab find label "Failure modes" fill "This record is a placeholder and does nothing." >/dev/null
ab find label "Tools" fill "placeholder-tool, other-tool" >/dev/null
ab find label "Minutes saved per run" fill "15" >/dev/null
ab find label "Content" fill "PLACEHOLDER payload" >/dev/null
ab find label "Reply address (optional)" fill "placeholder@example.invalid" >/dev/null
btn "Submit for review"
ab wait --text "Received" >/dev/null 2>&1 || sleep 3
echo "received: $(ab get text body | grep -oiE 'Received|review queue' | sort -u | tr '\n' ' ')"

echo "=== 3. admin: login, queue ==="
ab open http://localhost:3000/admin/queue >/dev/null; ab wait --load networkidle >/dev/null
ab find label "Password" fill "$PASS" >/dev/null; btn "Open"
ab wait --text "Pending review" >/dev/null 2>&1 || sleep 3; sleep 2
echo "queue lists it: $(ab get text body | grep -ic "PLACEHOLDER e2e record $T")  reply flag: $(ab get text body | grep -ic 'reply available')"

echo "=== 4. record: approve ==="
lnk "PLACEHOLDER e2e record $T"; ab wait --load networkidle >/dev/null; sleep 2
echo "status before: $(ab get text body | grep -oiE 'status: [a-z]+' | head -1)  email visible to admin: $(ab get text body | grep -ic 'placeholder@example.invalid')"
btn "Approve"; sleep 3
ab screenshot "${TMPDIR:-/tmp}/e2e-after-approve.png" >/dev/null
echo "status after approve: $(ab get text body | grep -oiE 'status: [a-z]+' | head -1)"

echo "=== 5. record: publish ==="
ab find label "Publish with permanent slug" fill "$SLUG" >/dev/null
btn "Publish"; sleep 6
ab screenshot "${TMPDIR:-/tmp}/e2e-after-publish.png" >/dev/null
echo "notice: $(ab get text body | grep -oiE "Published at /automations/$SLUG|Publish: .*" | head -1)"
echo "status after publish: $(ab get text body | grep -oiE 'status: [a-z]+' | head -1)"

echo "=== 6. public page and revalidation ==="
printf "public page: "; curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/automations/$SLUG"
printf "private field leaked: "; curl -s "http://localhost:3000/automations/$SLUG" | grep -ic "example.invalid"
printf "in index: "; curl -s http://localhost:3000/automations | grep -ic "PLACEHOLDER e2e record $T"
printf "in sitemap: "; curl -s http://localhost:3000/sitemap.xml | grep -ic "$SLUG"
printf "in llms-full: "; curl -s http://localhost:3000/llms-full.txt | grep -ic "PLACEHOLDER e2e record $T"
printf "howto steps: "; curl -s "http://localhost:3000/automations/$SLUG" | grep -oiE '"@type":"HowToStep"' | wc -l | tr -d ' '

echo "=== 7. import: paste JSON, promote ==="
ab open http://localhost:3000/admin/import >/dev/null; ab wait --load networkidle >/dev/null; sleep 1
ab find label "Imported from" fill "e2e-$T" >/dev/null
ab find label "Records" fill "[{\"title\":\"PLACEHOLDER import $T\",\"summary\":\"Placeholder imported by the Phase 6 end-to-end test; not a real automation.\",\"steps\":[{\"order\":1,\"action\":\"Placeholder\"}],\"prerequisites\":[],\"failureModes\":[\"Placeholder\"],\"toolSlugs\":[\"placeholder-tool\"],\"difficulty\":\"beginner\"}]" >/dev/null
btn "Import as raw"; sleep 3
ab screenshot "${TMPDIR:-/tmp}/e2e-import.png" >/dev/null
echo "import notice: $(ab get text body | grep -oiE 'Import: [^|]*' | head -1)"
echo "raw lists it: $(ab get text body | grep -ic "PLACEHOLDER import $T")"
lnk "PLACEHOLDER import $T"; ab wait --load networkidle >/dev/null; sleep 2
btn "Promote to queue"; sleep 3
echo "status after promote: $(ab get text body | grep -oiE 'status: [a-z]+' | head -1)"
echo "=== 8. reject ==="
ab find label "Reject with a note" fill "Placeholder rejected by the e2e test." >/dev/null
btn "Reject"; sleep 3
echo "status after reject: $(ab get text body | grep -oiE 'status: [a-z]+' | head -1)  note shown: $(ab get text body | grep -ic 'rejection note')"
ab screenshot "${TMPDIR:-/tmp}/e2e-record.png" >/dev/null
echo "=== console errors on admin ==="; ab errors | head -3
ab close >/dev/null

echo "=== 9. loop ==="
./scripts/ux-loop.sh > "${TMPDIR:-/tmp}/loop.out" 2>&1; echo "loop exit=$?"; tail -1 "${TMPDIR:-/tmp}/loop.out"
pkill -f "next dev --webpack -p 3000" || true
