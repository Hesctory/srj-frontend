#!/usr/bin/env bash
# PostToolUse (Edit|Write|MultiEdit): check the file the agent just wrote.
#   1. Any file the repository would publish: the leak scan (.gitleaks.toml).
#      The repository is public, so a secret or a real-shaped personal
#      identifier is reported the moment it is written, long before the
#      pre-push hook would refuse the commit.
#   2. src/**/*.ts(x): ESLint. The messages of the architecture rules say how
#      to fix each violation.
# Success is silent. On failure the output goes to stderr and the script exits
# 2, which Claude Code feeds back to the agent so it fixes it right away.
set -u
cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}" || exit 0

file=$(jq -r '.tool_input.file_path // .tool_response.filePath // empty')
[ -z "$file" ] && exit 0
file=${file#"$PWD/"}
case "$file" in /*) exit 0 ;; esac # outside the repository
[ -f "$file" ] || exit 0

gitleaks=$(command -v gitleaks || echo /usr/local/libexec/srj/tools/gitleaks)
if [ ! -x "$gitleaks" ]; then
  echo "gitleaks is not installed, so $file was not leak-scanned and the pre-push hook will refuse every push. Tell the user (README.md, \"Installation\")." >&2
  exit 2
fi
# -i /dev/null and --ignore-gitleaks-allow: findings are fixed, never silenced.
if ! git check-ignore -q "$file" &&
  ! out=$("$gitleaks" detect --no-git --source "$file" --config .gitleaks.toml \
    -i /dev/null --ignore-gitleaks-allow --redact --no-banner --no-color --verbose 2>&1); then
  {
    echo "Leak scan failed on $file. This repository is public: replace the value with a synthetic one (CLAUDE.md, \"Public repository\"):"
    echo "$out"
  } >&2
  exit 2
fi

case "$file" in
  src/*.ts | src/*.tsx) ;;
  *) exit 0 ;;
esac

if ! out=$(npx --no-install eslint --max-warnings 0 "$file" 2>&1); then
  {
    echo "ESLint failed on $file. Fix these before moving on:"
    echo "$out"
  } >&2
  exit 2
fi
exit 0
