#!/usr/bin/env bash
# Stop: before the agent ends its turn, check what it changed under src/.
#   - nothing changed under src/ (a chat-only turn) → silent, instant pass
#   - otherwise: full type-check, ESLint on the changed files, the tests that
#     import them, and the structural architecture tests
# On failure the output goes to stderr and the script exits 2, so the agent
# keeps working instead of stopping on a red build. `stop_hook_active` is set
# when the agent is already continuing because of this hook; passing then
# avoids an endless loop — the failure was already reported once.
# The full pipeline (`npm run verify`, including the build) runs in CI.
set -u
cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}" || exit 0

input=$(cat)
[ "$(jq -r '.stop_hook_active // false' <<<"$input")" = "true" ] && exit 0

# Modified, added and untracked files under src/ (renames report the new path).
mapfile -t changed < <(
  git status --porcelain --untracked-files=all -- src \
    | sed -E 's/^.. //; s/^.* -> //' \
    | grep -E '\.tsx?$' \
    | while read -r f; do [ -f "$f" ] && echo "$f"; done
)
[ "${#changed[@]}" -eq 0 ] && exit 0

fail() {
  {
    echo "Verification failed on your changes — fix it before finishing."
    echo "== $1"
    echo "$2"
  } >&2
  exit 2
}

out=$(npm run --silent type-check 2>&1) || fail "type-check" "$out"
out=$(npx --no-install eslint --max-warnings 0 "${changed[@]}" 2>&1) \
  || fail "eslint" "$out"
out=$(npx --no-install vitest related --run --passWithNoTests "${changed[@]}" \
  src/test/architecture.test.ts 2>&1) || fail "tests" "$out"
exit 0
