# Asset intake

The first of the three inputs. Collect it before composing anything: a film built on placeholder brand reads as a template, and every asset that arrives late forces a re-render.

If the user is in a hurry and wants to start before fully completing intake, use the partial-asset fallback rules at the bottom of this doc. There's a minimum viable set (aspect ratio, duration, soundtrack, logo, one brand color, rough copy) that gets a v1 going while the rest gets iterated. But don't skip the intake conversation entirely - even a 60-second triage is high-leverage.

If nobody is available to answer, fill in the questionnaire yourself from the materials you were given, and record every answer you inferred as an assumption in the brief. The questions below are then a checklist for you, not a conversation.

## What to collect, in order

### 1. Aspect ratio - ask first

This is the single most important question and it's the first one in the questionnaire because getting it wrong makes the whole skeleton wrong.

- **16:9 horizontal (1920×1080)** - LinkedIn posts, YouTube, homepage hero, demo reels.
- **9:16 vertical (1080×1920)** - Instagram Reels, TikTok, YouTube Shorts, Facebook paid ads.
- **Both (parallel)** - build horizontal first (source of truth), vertical as a parallel port that shares the same timing. See `vertical-port.md`.

If the user asks "both" or says "paid ads" explicitly, assume both. Build the scaffolding for both simultaneously, not sequentially - mid-production vertical ports are expensive.

### 2. Duration

Recommended: **20-45 seconds**. Sweet spot: 28-38s. Shorter than 20s doesn't give you room for hook + pivot + proof + CTA; longer than 45s loses viewers on social platforms.

Treat the number as a target. The film is laid out in beats, so its exact length comes from the soundtrack: the timing file ends the last scene on the backbeat nearest the target.

### 3. Logo

Ask for SVG. If the user only has a PNG/JPG, accept it but note that vector-source means real 4K sharpness via `--scale=2`.

**If only PNG, check native resolution.** A 250x100 PNG displayed at 480px wide will pixelate at 1080p (and very visibly at 4K). Run `file public/logo.png` or `identify public/logo.png` to read native dimensions and record them in the asset manifest. At plan-time, every `<img width={N}>` should be checked against native: a raster never draws above 1x of its native size, because the 4K render (`--scale=2`) samples it at twice the drawn size and anything above 1x goes soft there (gotcha 79). One film shipped its 400 px-tall logo PNGs at 0.5x. Either reduce the display size, or ask the user for a higher-res source, or an SVG.

**Third-party marks.** A client's logo strip, an AI assistant's logo, a protocol mark: each is someone else's brand, and the owner clears their use, once, with the stills that show them, dated in the brief. A logo strip on the site is often a rotating pool larger than what one screenshot shows (gotcha 59); read the component for the full list and show the owner that list.

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

Why this matters: scenes will reference these paths in `staticFile()` calls. A space, a parenthesis or a typo in a filename fails quietly later, when a scene asks for `staticFile("speech bubble.mp4")` and Remotion serves a 404.

Screenshots go stale. If the product's source code is available, read the component behind each screen for its current wording and layout before trusting an older screenshot.

An assets folder can hold more than the user is allowed to show (logos of partners, competitors, tools). Copy into `public/` only what the brief permits, so nothing else can end up on screen.

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
- Accept the file and note its duration. A voiceover can be laid over a beat-cut film, but this skill does not time scenes to narration, and a narration that sets the pace will fight the beat grid. Tell the user which of the two they are getting before you build.

If no VO: default to silent + soundtrack. This is the sweet spot for social-platform autoplay (most users scroll with sound off for the first 3 seconds anyway).

### 8. Soundtrack

**Required for beat-sync.** If the user has no soundtrack, pick from royalty-free stock before proceeding. Recommended sources:
- Epidemic Sound (subscription)
- Artlist (subscription)
- Freesound.org / Pixabay Music (free, but curate carefully)

Look for:
- Clear, consistent BPM (120 BPM is the default; 90 / 100 / 140 / 150 all work)
- A clear drum pattern (beat detection is unreliable on ambient or heavily syncopated tracks, and `detect-beats.py` will report low confidence on them)
- Length ≥ target video duration + 2 seconds for the fade-out tail. When the track is shorter than the brief's duration, that is a decision, not a default: either the film is capped at the track's length (an unattended run capped a 45 s brief at 28 s and did not say so) or the track is extended by a clean loop at a bar line (`beats.json` has the bars). Ask when someone can answer; when nobody can, cap, and write it in the brief's assumptions as the first line.

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

After intake, record the answers in the Inputs section of `docs/video/brief.md` (template in `assets/prompt-templates/brief.md`). For example:

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
  - Anthropic Claude Design launch: references/anthropic-claude-design.md
  - OpenAI GPT-5 sizzle: references/openai-gpt5.md
```

Commit the brief before moving on to the reference videos.
