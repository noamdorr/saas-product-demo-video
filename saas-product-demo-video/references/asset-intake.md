# Asset intake

Pillar 1 of the three pillars (strongly recommended). Complete this phase before composing - skipping it produces generic Canva-style motion graphics.

If the user is in a hurry and wants to start before fully completing intake, use the partial-asset fallback rules at the bottom of this doc. There's a minimum viable set (aspect ratio, duration, soundtrack, logo, one brand color, rough copy) that gets a v1 going while the rest gets iterated. But don't skip the intake conversation entirely - even a 60-second triage is high-leverage.

## What to collect, in order

### 1. Aspect ratio - ask first

This is the single most important question and it's the first one in the questionnaire because getting it wrong makes the whole skeleton wrong.

- **16:9 horizontal (1920×1080)** - LinkedIn posts, YouTube, homepage hero, demo reels.
- **9:16 vertical (1080×1920)** - Instagram Reels, TikTok, YouTube Shorts, Facebook paid ads.
- **Both (parallel)** - build horizontal first (source of truth), vertical as a parallel port with V2V constants. See `vertical-port.md`.

If the user asks "both" or says "paid ads" explicitly, assume both. Build the scaffolding for both simultaneously, not sequentially - mid-production vertical ports are expensive.

### 2. Duration

Recommended: **20-45 seconds**. Sweet spot: 28-38s. Shorter than 20s doesn't give you room for hook + pivot + proof + CTA; longer than 45s loses viewers on social platforms.

Durations must be a multiple of `framesPerBeat × 2` for clean scene boundaries. At 30 fps / 120 BPM, that's 30 frames = 1 second. So 20s, 25s, 28s, 30s, 37.5s, 42s all work.

### 3. Logo

Ask for SVG. If the user only has a PNG/JPG, accept it but note that vector-source means real 4K sharpness via `--scale=2`.

**If only PNG, check native resolution.** A 250x100 PNG displayed at 480px wide will pixelate at 1080p (and very visibly at 4K). Run `file public/logo.png` or `identify public/logo.png` to read native dimensions and record them in the asset manifest. At plan-time, every `<img width={N}>` should be checked against native - if `N > native_width × 1.2`, the image will pixelate. Either reduce the display size, or ask the user for a higher-res source.

For dark-background scenes, ask whether the logo needs a white variant. Offer the `filter: brightness(0) invert(1)` approach (same treatment most marketing sites use in their dark-mode footers) as a default - it loses any color detail but avoids maintaining two logo files. If color detail matters (e.g. a pink smile in the mark), render the wordmark as HTML + inline SVG for the color-critical part.

### 3b. Asset naming hygiene on copy-in

Source filenames are often messy: spaces, parentheses, version markers, typos. Always rename to canonical kebab-case-no-spaces on copy:

```bash
# Source:                                                Target:
# "speech bubble (2) FINAL.mp4"                       → public/b-rolls/speech-bubble.mp4
# "Logo Final FINAL v3.png"                           → public/logo.png
# "yurasoop-sports-percussion-422684.mp3"             → public/soundtrack.mp3
# "congitive_overload_FullHD_Wide.mp4" (typo source)  → public/b-rolls/cognitive-overload.mp4
```

Why this matters: scenes will reference these paths in `staticFile()` calls. Spaces, parentheses, and typos in filenames are silent footguns when the implementer subagent later types `staticFile("speech bubble.mp4")` from memory and Remotion serves a 404.

### 4. Brand hex colors

Ask for:
- 1 primary accent (the "hero" color - pink, orange, electric blue, etc.)
- 1 dark color (for CTA / finale backgrounds - deep purple, black, navy)
- 3-6 supporting pastels (cream, blush, peach, lavender, mint)

If the user dumps a Firecrawl'd brand palette or a style-guide JSON, great - skip the conversation about hex codes.

### 5. Font stack

All fonts must be available via `@remotion/google-fonts`. Verify before accepting.

Typical sweet spot:
- **Display** - Plus Jakarta Sans 800, Inter 800, Outfit 800, or similar
- **Editorial** - Roboto Slab, Merriweather, or a serif with personality
- **UI** - Inter 400/500/600/700 (what most SaaS uses internally)
- **Secondary** - whatever the user's web CTA uses (often Noto Sans)

If the user wants a non-Google font, tell them it needs to be loaded manually (not via `@remotion/google-fonts`) and that adds complexity to `Root.tsx`.

**Gotcha**: Google Fonts doesn't ship Roboto Slab italic. If the user's brand calls for italic serif, load `"normal"` weights only and apply `font-style: italic` at the use site.

### 6. Copy / script

**Prefer a user-supplied draft.** Many users have a marketing line or homepage hero they want to use. Get theirs first, offer to refine.

If the user has nothing, draft based on their product's narrative arc:
- **Hook** (0-3s): a provocation or pattern-break
- **Pivot** (3-6s): "actually, here's the truth"
- **Proof** (6-25s): what the product does, shown not told
- **Close** (25-end): promise + CTA

Keep copy punchy. Every word should earn its frame.

### 7. Voiceover (optional)

If the user has a VO:
- Accept the file and note the total duration. The beat-sync system fights VO timing - you'll fall back to frame-budget mode with VO-driven pacing. Tell the user.
- If the user's Claude handles VO integration downstream, this skill's job is done at "here's a clean silent cut."

If no VO: default to silent + soundtrack. This is the sweet spot for social-platform autoplay (most users scroll with sound off for the first 3 seconds anyway).

### 8. Soundtrack

**Required for beat-sync.** If the user has no soundtrack, pick from royalty-free stock before proceeding. Recommended sources:
- Epidemic Sound (subscription)
- Artlist (subscription)
- Freesound.org / Pixabay Music (free, but curate carefully)

Look for:
- Clear, consistent BPM (120 BPM is the default; 90 / 100 / 140 / 150 all work)
- Distinguishable kick and snare (librosa struggles on mushy or ambient tracks)
- Length ≥ target video duration + 2 seconds for the fade-out tail

The last 18 frames of the composition become an audio fade-out (`volume={(f) => interpolate(f, [totalFrames - 18, totalFrames], [0.6, 0])}`).

## Partial-asset fallback rules

If the user hasn't answered everything but is pushing to start, the minimum viable set is:

- Aspect ratio ✅ (no fallback - must have)
- Duration ✅ (no fallback - must have)
- Soundtrack ✅ (no fallback - can't do beat-sync without it)
- Logo ✅ (can use temporarily text-rendered logo, but user must provide eventually)
- At least one brand color ✅ (extend to a palette as you go)
- A rough copy draft ✅ (can refine together)

Font stack, complete palette, VO, and reference videos can be iterated during production.

## Output: the asset manifest

After intake, write a manifest to `docs/superpowers/specs/<date>-<name>-assets.md`:

```markdown
# <Project name> - asset manifest

- Aspect ratio: 16:9 (1920×1080) + 9:16 (1080×1920) parallel
- Duration: 28s (840 frames @ 30 fps)
- Logo: public/logo.svg - use filter: brightness(0) invert(1) for dark bg
- Brand colors:
  - pink #EE2E7F (primary accent)
  - deepPurple #390854 (CTA bg)
  - cream #FAFAF7, lavender #E8DDF0, peach #FCE5D4 (scene bgs)
- Fonts:
  - Display: Plus Jakarta Sans 800
  - Editorial: Roboto Slab 400/500/600 (italic via font-style)
  - UI: Inter 400/500/600/700
- Copy: see `docs/.../<name>-script.md`
- VO: none (silent + soundtrack)
- Soundtrack: public/soundtrack.mp3 (120 BPM, ~28s, 4/4)
- Reference videos:
  - Anthropic Claude Design launch: references/gemini-anthropic-claude-design.md
  - OpenAI GPT-5 sizzle: references/gemini-openai-gpt5.md
```

Commit the manifest before starting Phase 2 (vibe).
