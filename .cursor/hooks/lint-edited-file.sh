#!/usr/bin/env bash
# postToolUse (Write): lint the edited file; errors return as additional_context.
export NO_COLOR=1 FORCE_COLOR=0

if ! command -v jq >/dev/null 2>&1; then
  jq -n '{additional_context: "Hook lint-edited-file.sh needs jq on PATH."}' 2>/dev/null ||
    printf '%s\n' '{"additional_context":"Hook lint-edited-file.sh needs jq on PATH."}'
  exit 0
fi

INPUT=$(cat)
FILE=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // .tool_input.target_file // empty' 2>/dev/null)
CWD=$(printf '%s' "$INPUT" | jq -r '.cwd // empty' 2>/dev/null)
[ -n "$FILE" ] || exit 0
case "$FILE" in /*) ;; *) FILE="${CWD:-${CURSOR_PROJECT_DIR:-$PWD}}/$FILE" ;; esac

case "$FILE" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs|*.astro) ;;
  *) exit 0 ;;
esac
[ -f "$FILE" ] || exit 0

ROOT=$(git -C "$(dirname "$FILE")" rev-parse --show-toplevel 2>/dev/null) || exit 0
REPO=$(git -C "$ROOT" rev-parse --path-format=absolute --git-common-dir 2>/dev/null)
SESSION_ROOT=$(git -C "${CWD:-${CURSOR_PROJECT_DIR:-$PWD}}" rev-parse --show-toplevel 2>/dev/null)
SESSION_REPO=$(git -C "${SESSION_ROOT:-${CWD:-${CURSOR_PROJECT_DIR:-$PWD}}}" rev-parse --path-format=absolute --git-common-dir 2>/dev/null)
[ -n "$REPO" ] && [ "$REPO" = "$SESSION_REPO" ] || exit 0
cd "$ROOT" || exit 0

REL="${FILE#"$ROOT"/}"
SID=$(printf '%s' "$INPUT" | jq -r '.conversation_id // .session_id // empty' 2>/dev/null | tr -cd 'A-Za-z0-9_-')
if [ -n "$SID" ] && mkdir -p "${TMPDIR:-/tmp}/cursor-hooks" 2>/dev/null; then
  printf '%s\n' "$ROOT" >>"${TMPDIR:-/tmp}/cursor-hooks/$SID.roots"
fi

if ! command -v npx >/dev/null 2>&1; then
  jq -n --arg f "$REL" '{additional_context: ("npx not found; cannot run ESLint on " + $f + ".")}'
  exit 0
fi

if ! OUTPUT=$(npx --no-install eslint --quiet "$REL" 2>&1); then
  jq -n --arg msg "ESLint reported errors in $REL:
$OUTPUT" '{additional_context: $msg}'
fi
exit 0
