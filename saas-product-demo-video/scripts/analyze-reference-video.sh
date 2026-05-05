#!/usr/bin/env bash
# analyze-reference-video.sh - call Gemini Pro with a YouTube URL +
# the directorial-breakdown prompt; write Markdown to references/gemini-<name>.md.
#
# Usage:
#   ./scripts/analyze-reference-video.sh <youtube_url> <short-name>
#
# Example:
#   ./scripts/analyze-reference-video.sh https://youtu.be/abc123 linear-launch
#   → writes references/gemini-linear-launch.md
#
# Setup:
#   GEMINI_API_KEY must be set in environment OR in <repo>/.env (gitignored).
#   Get a free key at https://aistudio.google.com/apikey
#
# Requirements:
#   - jq (for JSON construction): brew install jq
#   - python3 (for output extraction): standard
#
# Override model via env var: MODEL=gemini-3-flash-preview ./scripts/...
# Default model is the current Gemini Pro Preview, best for directorial analysis.

set -euo pipefail

# --- Args ---
if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <youtube_url> <short-name>"
  echo "Example: $0 https://youtu.be/abc123 linear-launch"
  exit 1
fi

URL="$1"
NAME="$2"

# --- Resolve script dir, repo root, files ---
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
PROMPT_FILE="$SCRIPT_DIR/reference-video-prompt.md"
OUT_DIR="$REPO_DIR/references"
OUT_FILE="$OUT_DIR/gemini-$NAME.md"
ENV_FILE="$REPO_DIR/.env"

mkdir -p "$OUT_DIR"

# --- Load env (no-op if already set) ---
if [[ -z "${GEMINI_API_KEY:-}" && -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

if [[ -z "${GEMINI_API_KEY:-}" ]]; then
  echo "ERROR: GEMINI_API_KEY not set." >&2
  echo "  Get a key: https://aistudio.google.com/apikey" >&2
  echo "  Then: export GEMINI_API_KEY=... (or add to $ENV_FILE)" >&2
  exit 1
fi

# --- Verify deps ---
if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq not installed. brew install jq" >&2
  exit 1
fi

# --- Verify prompt file ---
if [[ ! -f "$PROMPT_FILE" ]]; then
  echo "ERROR: prompt file not found at $PROMPT_FILE" >&2
  exit 1
fi

# --- Model selection ---
MODEL="${MODEL:-gemini-3.1-pro-preview}"

# --- Build request body via jq (handles escaping safely) ---
PROMPT_TEXT="$(cat "$PROMPT_FILE")"
REQ_BODY="$(jq -n \
  --arg url "$URL" \
  --arg prompt "$PROMPT_TEXT" \
  '{
    contents: [{
      parts: [
        { fileData: { fileUri: $url } },
        { text: $prompt }
      ]
    }]
  }')"

echo "Analyzing: $URL"
echo "Model:     $MODEL"
echo "Output:    $OUT_FILE"
echo

# --- Call Gemini ---
RAW_RESPONSE="$(curl -s --fail-with-body \
  "https://generativelanguage.googleapis.com/v1beta/models/$MODEL:generateContent" \
  -H "Content-Type: application/json" \
  -H "X-goog-api-key: $GEMINI_API_KEY" \
  -X POST \
  -d "$REQ_BODY")" || {
    echo "ERROR: API call failed:" >&2
    echo "$RAW_RESPONSE" >&2
    exit 1
  }

# --- Extract text via python3 (more robust than jq for nested response shape) ---
EXTRACTED="$(echo "$RAW_RESPONSE" | python3 -c "
import json, sys
r = json.load(sys.stdin)
if 'candidates' not in r or not r['candidates']:
    print('ERROR: no candidates in response')
    print(json.dumps(r, indent=2)[:1000])
    sys.exit(1)
parts = r['candidates'][0]['content']['parts']
texts = [p.get('text', '') for p in parts if 'text' in p]
print(''.join(texts).strip())
")"

if [[ "$EXTRACTED" == ERROR* ]]; then
  echo "$EXTRACTED" >&2
  exit 1
fi

# --- Write output with frontmatter ---
{
  echo "---"
  echo "source: $URL"
  echo "model: $MODEL"
  echo "generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "---"
  echo
  echo "$EXTRACTED"
} > "$OUT_FILE"

echo "Done - wrote $(wc -c < "$OUT_FILE" | tr -d ' ') bytes to $OUT_FILE"
