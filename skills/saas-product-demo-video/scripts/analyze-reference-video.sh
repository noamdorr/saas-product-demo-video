#!/usr/bin/env bash
# analyze-reference-video.sh - call Gemini Pro with a YouTube URL +
# the directorial-breakdown prompt; write Markdown to references/<name>.md.
#
# Usage:
#   ./scripts/analyze-reference-video.sh <youtube_url> <short-name>
#
# Example:
#   ./scripts/analyze-reference-video.sh https://youtu.be/abc123 linear-launch
#   → writes references/linear-launch.md
#
# Setup:
#   GEMINI_API_KEY must be set in environment OR in the current project .env.
#   Get a free key at https://aistudio.google.com/apikey
#
# Requirements:
#   - python3 (for output extraction): standard
#
# Override model via env var: MODEL=gemini-3-flash-preview ./scripts/...
# Default model is the floating Gemini Pro alias.

set -euo pipefail

# --- Args ---
if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <youtube_url> <short-name>"
  echo "Example: $0 https://youtu.be/abc123 linear-launch"
  exit 1
fi

URL="$1"
NAME="$2"
if [[ ! "$NAME" =~ ^[a-zA-Z0-9][a-zA-Z0-9_-]*$ ]]; then
  echo "ERROR: short-name must contain only letters, digits, underscores or hyphens." >&2
  exit 1
fi

# --- Resolve script dir, repo root, files ---
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_DIR="$PWD"
PROMPT_FILE="$SCRIPT_DIR/reference-video-prompt.md"
OUT_DIR="$REPO_DIR/references"
OUT_FILE="$OUT_DIR/$NAME.md"
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
if ! command -v python3 >/dev/null 2>&1; then
  echo "ERROR: python3 not installed." >&2
  exit 1
fi

# --- Verify prompt file ---
if [[ ! -f "$PROMPT_FILE" ]]; then
  echo "ERROR: prompt file not found at $PROMPT_FILE" >&2
  exit 1
fi

# --- Model selection ---
MODEL="${MODEL:-gemini-pro-latest}"

# --- Build JSON with Python; no jq dependency ---
REQ_BODY="$(python3 - "$URL" "$PROMPT_FILE" <<'PYREQ'
import json, pathlib, sys
print(json.dumps({"contents": [{"parts": [
    {"fileData": {"fileUri": sys.argv[1], "mimeType": "video/*"}},
    {"text": pathlib.Path(sys.argv[2]).read_text()},
]}]}))
PYREQ
)"

echo "Analyzing: $URL"
echo "Model:     $MODEL"
echo "Output:    $OUT_FILE"
echo

# --- Call Gemini ---
RAW_RESPONSE="$(curl -sS --fail-with-body \
  "https://generativelanguage.googleapis.com/v1beta/models/$MODEL:generateContent" \
  -H "Content-Type: application/json" \
  -H "X-goog-api-key: $GEMINI_API_KEY" \
  -X POST \
  -d "$REQ_BODY")" || {
    echo "ERROR: API call failed:" >&2
    echo "$RAW_RESPONSE" >&2
    exit 1
  }

# --- Reject API errors, missing content and empty output before writing ---
EXTRACTED="$(printf '%s' "$RAW_RESPONSE" | python3 -c '
import json, sys
try:
    data = json.load(sys.stdin)
    if data.get("error"):
        error = data["error"]
        raise ValueError("API error: " + str(error.get("message", error)))
    candidates = data.get("candidates") or []
    parts = ((candidates[0].get("content") or {}).get("parts") or []) if candidates else []
    text = "".join(p.get("text", "") for p in parts if not p.get("thought")).strip()
    if not text:
        raise ValueError("empty response (no usable text parts)")
except (ValueError, TypeError, AttributeError, KeyError) as error:
    print("ERROR: " + str(error), file=sys.stderr)
    sys.exit(1)
print(text)
')"

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
