# Reference-video look

The second of the three inputs. Ask the user for two or three reference videos whose look they want, and produce a director's breakdown of each. Save each one in the user's project as `references/<name>.md`.

This is one of the highest-leverage steps in the whole production. Without it you invent a style in isolation and the user does not recognize it as what they wanted. With it you have a motion vocabulary to apply to every scene.

If the user has no references in mind, offer the starter set at the bottom of this file.

## Three ways to get a breakdown

Use the first one your environment supports.

### 1. Gemini, when `GEMINI_API_KEY` is set

Gemini watches the actual video, so it sees continuous motion and hears the music. This gives the best breakdown. The call sends the video's URL and the prompt to Google's API; nothing from the user's project is uploaded. If the user has asked that nothing leave the machine, use the frame path instead.

```bash
# Is a key available?
[[ -n "${GEMINI_API_KEY:-}" ]] || ([[ -f .env ]] && grep -q "^GEMINI_API_KEY=" .env) && echo "key found"

# One run per video, from the user's project root:
<skill>/scripts/analyze-reference-video.sh https://youtu.be/abc123 linear-launch
# -> writes references/linear-launch.md
```

The wrapper sends the YouTube URL and the prompt in `scripts/reference-video-prompt.md` to the Gemini API and writes the file only after a successful, non-empty response, so a failed call never replaces a breakdown you already have. It defaults to the `gemini-pro-latest` alias; set `MODEL=...` to override. A free key from `aistudio.google.com/apikey` is enough.

### 2. Sampled frames, read by you

When there is no key, sample the video into images and write the breakdown yourself. This needs `ffmpeg`. A YouTube URL also needs `yt-dlp`; without it, ask the user to download the video and pass the file.

```bash
<skill>/scripts/sample-reference-frames.sh <video-file-or-url> linear-launch
# -> references/frames-linear-launch/index.md, overview-*.jpg, cut-*.jpg
```

The script produces three things:

- **Overview sheets**: a 4x3 grid of frames per sheet covering the whole video in order. They show the color arc, the layouts, how type enters, and the overall rhythm.
- **Change strips** (`cut-*.jpg`): eight frames across 0.4 seconds around every sharp visual change. Most are cuts; some are large in-scene events, such as a headline lifting or a card filling the frame, so judge each one from its strip. These are where the transition verbs come from. A hard cut shows two unrelated halves; a wipe or iris shows a shape growing across the strip; a whip-pan shows directional blur; a match cut shows one element holding its place while everything around it changes.
- **An index** with the time of every change and the spacing between them, so pacing is measured rather than guessed.

Read `index.md`, then the overview sheets in order, then the change strips. Write `references/<name>.md` using the sections in `scripts/reference-video-prompt.md`, with `method: sampled frames` in the frontmatter.

Know what this path cannot see. There is no audio, so you cannot tell whether cuts follow the music; say so in the breakdown instead of guessing. Slow dissolves and continuous camera moves are not detected as cuts, so look for them in the overview sheets. Easing and speed are only roughly readable from eight frames. Cuts, wipes, color, type and layout come through well.

### 3. Google AI Studio by hand

When neither of the above is possible, the user can run the breakdown in a browser:

1. Open `aistudio.google.com` and start a chat with the latest Gemini Pro model.
2. Paste the YouTube URL, then the prompt from `scripts/reference-video-prompt.md`.
3. Copy the response into `references/<name>.md` in the project, with this at the top:

```markdown
---
source: <youtube-url>
model: <model used>
generated: <date>
---
```

It takes the user a couple of minutes per video.

## When the user has an earlier film they liked

It outranks every other reference. If its source is available, read its cut points and the timing of its entrances and start the new film from those, changing only what the new look or script needs. If only the render exists, sample it like any reference and note its cut times and its count of abrupt changes as targets. A new film that departs from the rhythm its owner already approved has to earn that, and usually does not.

## When breakdowns already exist, or disagree with the brand

If the user hands you breakdowns written earlier, use them as they are; you do not need to analyze the videos again.

A reference is taste, the brand is a rule. When a reference uses something the brand does not allow (gradients, a different palette, a shape language), keep its motion verbs and pacing, drop the rest, and write in the brief's Look section what you took and what you left out.

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

These become your scene-transition vocabulary. The brief lists the ones this film will use.

### "Pacing" (average shot length, heartbeat pattern)
The heartbeat pattern: `Intent (slow) → Execution (fast) → Result (slow)`. Or `hook (fast) → explanation (medium) → proof (fast) → close (slow)`.

Average shot length in seconds tells you whether to build scenes at 2-3s (fast cut) or 4-6s (slower poster-style). Under 2s feels frantic; over 6s feels draggy on social. A longer scene does not need more happening in it: do not make up for long shots by putting an event on every beat.

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

Once you have two or three of these, the Look section of the brief distills them:

1. **Vibe statement** (one paragraph) - combines the "what defines this" from each reference, filtered through the user's brand and copy.
2. **Motion vocabulary** - the union of transition verbs from all references, prioritized by signature moves.
3. **Pacing rule** - the average shot length and heartbeat pattern for the target film.
4. **Typography plan** - the convergent typography treatment.
5. **Signature moves to claim for this film** - 2-3 max. Too many signatures and each loses impact.

## Output format

Save each reference as `references/<name>.md` in the user's project, not in this skill's folder. Example: `references/anthropic-claude-design.md`.

Commit these with the brief before moving on to beats.

## What NOT to do

- **Don't skip this step** because the user said "I trust you, pick a vibe." A guessed style is rarely the one they had in mind. Ask for at least one reference, or have them pick from the starter set.
- **Don't use live-action references** for motion graphics projects - the vocabulary doesn't translate. Stick to product videos, sizzle reels, kinetic typography pieces.
- **Don't write a breakdown from memory** of a video you think you know. The timestamps and the pacing have to come from the video itself, through one of the three paths above.
- **Don't paraphrase the breakdown into marketing prose.** Keep the directorial language: verbs and timestamps.

## If the user has no references

Offer a starter set. These three cover most SaaS demo needs:

1. **Anthropic Claude Design launch** - spatial 16:9, continuous camera, hero crops, V-cut grid snap. Good for editorial product films.
2. **OpenAI GPT-5 sizzle** - abstraction pills, typography-masking ink portals, cursorless, mesh gradients, kinetic typography. Good for bold "future of X" positioning.
3. **Linear's marketing reels** - pastel poster, hard cuts, solid colors, clean editorial type. Good for B2B SaaS with calm confidence.

Let the user pick one or two they resonate with, then run the breakdown.

## Notes from a run with Gemini

`analyze-reference-video.sh` worked on `gemini-pro-latest` for three films of 33 to 48 s in about seven minutes, including the search for the URLs. Linear, Vercel and Raycast all have short motion-graphics launch films on their official channels; Stripe's channel had only keynotes and old explainers, so it is not a fair pick for this format. The most useful output beyond the breakdowns is a table with one row per planned shot of the new film: transition in, in-scene camera move, transition out, each a verb from the breakdowns with the reference and timestamp it came from. Ask for it in the agent's brief and copy it into the brief's Look section; the scene tasks then name their moves from it. Also ask how the references handle frame 0 (most fade in from black, which this skill does not do), how cards enter and exit, and what the camera does during a hold (a 2 to 4% push, in all three).
