#!/usr/bin/env bash
# Verify staged/changed files stay within the active mentor-dashboard-ops PR allowlist.
set -euo pipefail

ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"

ACTIVE_PR="${MENTOR_OPS_ACTIVE_PR:-PR4}"

case "$ACTIVE_PR" in
  PR1)
    ALLOW_REGEX='^(docs/plans/mentor-dashboard-ops|docs/plans/mentor-dashboard-ops\.md|\.grok/skills/mentor-dashboard-ops|\.grok/skills/mentor-dashboard-ops-plan|\.cursor/rules/mentor-dashboard-ops\.mdc|CLAUDE\.md|src/lib/mentor-earnings|src/app/dashboard/mentor/mentor-payouts-panel\.tsx|e2e/mentor-dashboard\.spec\.ts)'
    ;;
  PR2)
    ALLOW_REGEX='^(docs/plans/mentor-dashboard-ops|docs/plans/mentor-dashboard-ops\.md|\.grok/skills/mentor-dashboard-ops|\.grok/skills/mentor-dashboard-ops-plan|\.cursor/rules/mentor-dashboard-ops\.mdc|supabase/migrations/.*mentor_manual_payout|src/lib/mentor-manual-payouts|src/lib/mentor-earnings|src/lib/database\.types\.ts|src/app/api/admin/mentor-payouts|src/app/dashboard/admin|src/app/dashboard/mentor|e2e/mentor-dashboard\.spec\.ts|e2e/admin-mentor-payouts\.spec\.ts|e2e/auth\.setup\.ts|e2e/fixtures/auth\.ts|e2e/helpers/session-bootstrap\.ts)'
    ;;
  PR3)
    ALLOW_REGEX='^(docs/plans/mentor-dashboard-ops|docs/plans/mentor-dashboard-ops\.md|\.grok/skills/mentor-dashboard-ops|\.grok/skills/mentor-dashboard-ops-plan|\.cursor/rules/mentor-dashboard-ops\.mdc|src/lib/mentor-listing-status|src/app/dashboard/mentor/page\.tsx|src/app/dashboard/mentor/mentor-dashboard-client\.tsx|src/app/dashboard/mentor/mentor-listing-card\.tsx|e2e/mentor-dashboard\.spec\.ts)'
    ;;
  PR4)
    ALLOW_REGEX='^(docs/plans/mentor-dashboard-ops|docs/plans/mentor-dashboard-ops\.md|\.grok/skills/mentor-dashboard-ops|\.grok/skills/mentor-dashboard-ops-plan|\.cursor/rules/mentor-dashboard-ops\.mdc|src/app/dashboard/mentor/mentor-consultation-card\.tsx|src/app/dashboard/mentor/mentor-dashboard-client\.tsx)'
    ;;
  *)
    echo "Unknown MENTOR_OPS_ACTIVE_PR=$ACTIVE_PR (use PR1–PR4)" >&2
    exit 2
    ;;
esac

if git diff --cached --name-only | grep -q .; then
  FILES=$(git diff --cached --name-only)
elif git diff --name-only | grep -q .; then
  FILES=$(git diff --name-only)
else
  echo "scope check: no changed files"
  exit 0
fi

VIOLATIONS=0
while IFS= read -r file; do
  [ -z "$file" ] && continue
  if ! echo "$file" | grep -Eq "$ALLOW_REGEX"; then
    echo "SCOPE VIOLATION ($ACTIVE_PR): $file" >&2
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
done <<< "$FILES"

if [ "$VIOLATIONS" -gt 0 ]; then
  echo "" >&2
  echo "$VIOLATIONS file(s) outside $ACTIVE_PR allowlist. See docs/plans/mentor-dashboard-ops/GUARDRAILS.md" >&2
  exit 1
fi

echo "scope check: OK ($ACTIVE_PR, $(echo "$FILES" | wc -l | tr -d ' ') file(s))"