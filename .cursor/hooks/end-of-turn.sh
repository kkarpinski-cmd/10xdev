#!/usr/bin/env bash
# stop: sweep everything this turn changed, send the agent back once.
export NO_COLOR=1 FORCE_COLOR=0

if ! command -v jq >/dev/null 2>&1; then
  jq -n '{followup_message: "Hook end-of-turn.sh needs jq on PATH."}' 2>/dev/null ||
    printf '%s\n' '{"followup_message":"Hook end-of-turn.sh needs jq on PATH."}'
  exit 0
fi

INPUT=$(cat)
STATUS=$(printf '%s' "$INPUT" | jq -r '.status // "completed"' 2>/dev/null)
LOOPS=$(printf '%s' "$INPUT" | jq -r '.loop_count // 0' 2>/dev/null)
ACTIVE=$(printf '%s' "$INPUT" | jq -r '.stop_hook_active // false' 2>/dev/null)

if [ "$STATUS" != "completed" ] || [ "${LOOPS:-0}" != "0" ] || [ "$ACTIVE" = "true" ]; then
  exit 0
fi

CWD=$(printf '%s' "$INPUT" | jq -r '.cwd // empty' 2>/dev/null)
SID=$(printf '%s' "$INPUT" | jq -r '.conversation_id // .session_id // empty' 2>/dev/null | tr -cd 'A-Za-z0-9_-')
REGISTRY="${TMPDIR:-/tmp}/cursor-hooks/${SID:-none}.roots"

ROOTS=()
while IFS= read -r r; do
  [ -n "$r" ] && [ -d "$r" ] && ROOTS+=("$r")
done <<EOF
$({ git -C "${CWD:-${CURSOR_PROJECT_DIR:-$PWD}}" rev-parse --show-toplevel 2>/dev/null; [ -n "$SID" ] && cat "$REGISTRY" 2>/dev/null; } | sort -u)
EOF

if [ "${#ROOTS[@]}" -eq 0 ]; then
  exit 0
fi

REPORT=""
for ROOT in "${ROOTS[@]}"; do
  cd "$ROOT" || continue

  CHANGED=$({ git diff --name-only HEAD; git ls-files -o --exclude-standard; } 2>/dev/null | sort -u)
  [ -n "$CHANGED" ] || continue

  FILES=()
  while IFS= read -r f; do
    case "$f" in
      *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs|*.astro)
        [ -f "$f" ] && FILES+=("$f")
        ;;
    esac
  done <<EOF
$CHANGED
EOF

  if [ "${#FILES[@]}" -gt 0 ]; then
    if command -v npx >/dev/null 2>&1; then
      OUT=$(npx --no-install eslint --quiet "${FILES[@]}" 2>&1 </dev/null) || REPORT="$REPORT
ESLint errors in changed files ($ROOT):
$OUT
"
      # Full data suite finishes in ~8s locally; run all unit tests, not only related.
      OUT=$(npx --no-install vitest run 2>&1 </dev/null) || REPORT="$REPORT
Unit/integration tests fail ($ROOT):
$OUT
"
    else
      REPORT="$REPORT
npx not found ($ROOT); skipped ESLint and Vitest.
"
    fi
  fi

  if command -v npx >/dev/null 2>&1; then
    if ! OUT=$(npx --no-install astro check 2>&1 </dev/null); then
      [ -n "$OUT" ] && REPORT="$REPORT
Typecheck (astro check) fails ($ROOT):
$OUT
"
    fi
  else
    REPORT="$REPORT
npx not found ($ROOT); skipped astro check.
"
  fi
done

if [ -n "$REPORT" ]; then
  jq -n --arg msg "Fix these before you finish:$REPORT" '{followup_message: $msg}'
else
  [ -n "$SID" ] && : >"$REGISTRY" 2>/dev/null
fi
exit 0
