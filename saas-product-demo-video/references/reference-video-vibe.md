# Reference-video vibe workflow

Pillar 2 (strongly recommended). Ask the user for 2-3 YouTube reference videos whose vibe they want. Produce a Gemini-style director's breakdown for each. Save outputs in the user's repo as `references/gemini-<name>.md`.

This step is one of the highest-leverage activities in the whole production. Without it, you invent a style in isolation and the user doesn't recognize what they wanted. With it, you get a directorial vocabulary you can apply across every scene.

If the user genuinely has no references in mind and resists the request, fall back to the starter set at the bottom of this doc - but ask first.

## Three paths in priority order

Pick the highest-priority path the environment supports. Detect by running these checks in order; stop at the first one that succeeds:

```bash
# 1. Is the gemini CLI on PATH?
command -v gemini >/dev/null 2>&1 && echo "gemini CLI available"
# (Also check for common community wrappers like gemini-yt, gemini-cli, etc.)
#    If yes → use Path 1 below.

# 2. Is GEMINI_API_KEY set in env or in <repo>/.env?
[[ -n "${GEMINI_API_KEY:-}" ]] || ([[ -f .env ]] && grep -q "^GEMINI_API_KEY=" .env)
#    If yes → use Path 2 below (the skill's curl wrapper).

# 3. None of the above → use Path 3 (manual AI Studio).
```

When in doubt, ask the user: "Do you have the `gemini` CLI installed or a `GEMINI_API_KEY`? If neither, we'll use Google AI Studio in your browser - works fine, just slower."

---

### Path 1 - Existing `gemini` CLI on PATH

If the user has Google's official `gemini` CLI or a custom wrapper installed, use it. The official CLI typically accepts:

```bash
gemini --model gemini-3.1-pro-preview "$(cat scripts/reference-video-prompt.md)" --file <youtube-url>
# (Exact flags vary by CLI version. Check `gemini --help`.)
```

For community wrappers like Noam's `gemini-yt`:

```bash
gemini-yt <youtube-url> "$(cat scripts/reference-video-prompt.md)"
```

If the CLI doesn't natively accept YouTube URLs, fall through to Path 2 (the curl wrapper handles URL multimodal input directly).

Save the CLI's output to `references/gemini-<slug>.md` with frontmatter.

### Path 2 - Curl wrapper using `GEMINI_API_KEY`

If the user has a `GEMINI_API_KEY` (free tier works), the breakdowns run automatically against YouTube URLs. The skill ships a wrapper at `scripts/analyze-reference-video.sh` plus the prompt at `scripts/reference-video-prompt.md`. Together they call the Gemini API with the YouTube URL as multimodal input and write the breakdown to `references/gemini-<slug>.md`.

Setup once:

```bash
# 1. Get a key at https://aistudio.google.com/apikey (free tier works)
# 2. Set in shell or in a .env (gitignored)
export GEMINI_API_KEY="..."   # or in remotion-video/.env
```

Run per video:

```bash
./scripts/analyze-reference-video.sh https://youtu.be/abc123 vercel-ship
# → writes references/gemini-vercel-ship.md
```

The wrapper defaults to `gemini-3.1-pro-preview` (or the current latest pro model). Override via `MODEL=...` env var if needed.

This path is dramatically faster than the manual one. Three videos analyzed in parallel via background jobs lands all three breakdowns in 1-2 minutes.

### Path 3 - Google AI Studio with manual copy-paste (fallback, always works)

If the user has no API access, this still works - it's just more steps. The breakdown quality is comparable.

1. Open `aistudio.google.com` in a browser. Sign in with a Google account.
2. New chat → pick `gemini-3-pro-preview` (or whichever is the latest pro model).
3. Paste the YouTube URL on the first line.
4. Paste the prompt from `scripts/reference-video-prompt.md` after the URL.
5. Run. Wait 30-60 seconds.
6. Copy the entire response.
7. Save as `references/gemini-<slug>.md` in the user's repo, prepended with frontmatter:

```markdown
---
source: <youtube-url>
model: gemini-3-pro-preview
generated: <date>
---

<paste the response here>
```

Yes, this is awkward. The understanding quality is worth it - Gemini's video analysis is the only LLM-grade tool that gives you per-shot transition verbs against a real video. Walking the user through the AI Studio flow takes a couple of minutes but produces material that drives 10+ scenes' worth of decisions.

### Asking the user when detection is ambiguous

If detection above turns up nothing definitive, ask once: "Do you have the `gemini` CLI installed or a `GEMINI_API_KEY`? If neither, we'll use Google AI Studio in your browser - works fine, just slower."

If they don't know what any of those are, default to Path 3 (AI Studio). It's the lowest cognitive overhead and produces equally usable output.

## What to ask for

The prompt requests these exact sections for each reference. This format works because every section produces load-bearing output for scene-building:

### "What defines this video" (one paragraph)
A summary of the overall vibe - tone, rhythm, color treatment, motion grammar. This paragraph becomes the opening of the vibe statement.

### "Shot-by-shot breakdown" (timestamps + transition verbs)
Each shot gets:
- Timestamp (`0:00-0:03`)
- Description (`wide hero shot of product UI on cream bg with floating review cards`)
- Transition IN (`push-through from black`, `whip-pan from previous scene`)
- Transition OUT (`iris wipe to purple`, `shared-element shrink to top-left`)

The **transition verbs** are the most load-bearing output:
- push-through
- whip-pan
- V-cut pull-back
- ink-mask
- iris wipe
- shared-element shrink
- match-cut zoom
- hard cut
- cross-dissolve (rare - usually lazy)

These become your scene-transition vocabulary. The spec doc lists them in the "motion grammar" section.

### "Pacing" (average shot length, heartbeat pattern)
The heartbeat pattern: `Intent (slow) → Execution (fast) → Result (slow)`. Or `hook (fast) → explanation (medium) → proof (fast) → close (slow)`.

Average shot length in seconds tells you whether to build scenes at 2-3s (fast cut) or 4-6s (slower poster-style). Under 2s feels frantic; over 6s feels draggy on social.

### "Typography treatment"
Weights, sizes, letter-spacing, ALL CAPS vs sentence case, line-height. Whether text enters with type-on, mask-reveal, or pre-rendered. Whether it animates in sync with music or independently.

### "Color palette & lighting"
Dominant colors, how they shift between scenes (e.g. "pink → cream → pink → purple"), lighting direction (flat vs directional), contrast level (high vs pastel).

### "Signature moves that must NOT be missing"
The 2-4 effects without which the video would feel like a different film. Examples from past productions:
- "Classic cartoon flame tongues flickering on the word 'hell'"
- "Phrase-lift-from-center → resting-at-top motion at Scene 5 opening and Scene 9 finale"
- "Iris wipe to deep purple before the finale"
- "Pink marker underline draws under the last word of the CTA"
- "Typography-masking ink portal between scenes" (GPT-5 sizzle)
- "V-cut grid snap between product crops" (Claude Design launch)

This section answers "if the user showed me this film without one of these shots, would I feel something is missing?"

## How to use the breakdowns

Once you have 2-3 of these, the spec doc synthesizes:

1. **Vibe statement** (one paragraph) - combines the "what defines this" from each reference, filtered through the user's brand and copy.
2. **Motion vocabulary** - the union of transition verbs from all references, prioritized by signature moves.
3. **Pacing rule** - the average shot length and heartbeat pattern for the target film.
4. **Typography plan** - the convergent typography treatment.
5. **Signature moves to claim for this film** - 2-3 max. Too many signatures and each loses impact.

## Output format

Save each reference as `references/gemini-<name>.md` in the user's repo (NOT in this skill's folder). Example filename: `references/gemini-anthropic-claude-design.md`.

Commit these alongside the asset manifest before starting Phase 3 (beats).

## What NOT to do

- **Don't skip this phase** just because the user said "I trust you, pick a vibe." You will not guess correctly. Ask for at least one reference.
- **Don't use live-action references** for motion graphics projects - the vocabulary doesn't translate. Stick to product videos, sizzle reels, kinetic typography pieces.
- **Don't generate a breakdown from memory** if you've seen the video before. The timestamp discipline requires fresh viewing; without it you miss the heartbeat pattern.
- **Don't paraphrase the vibe into marketing-brochure prose.** Preserve Gemini's directorial language verbatim. Verbs and timestamps.

## If the user has no references

Offer a starter set. These three cover most SaaS demo needs:

1. **Anthropic Claude Design launch** - spatial 16:9, continuous camera, hero crops, V-cut grid snap. Good for editorial product films.
2. **OpenAI GPT-5 sizzle** - abstraction pills, typography-masking ink portals, cursorless, mesh gradients, kinetic typography. Good for bold "future of X" positioning.
3. **Linear's marketing reels** - pastel poster, hard cuts, solid colors, clean editorial type. Good for B2B SaaS with calm confidence.

Let the user pick one or two they resonate with, then run the breakdown.
