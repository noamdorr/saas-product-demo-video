---
name: saas-product-demo-video
description: Produce a 20-45s SaaS product demo video in Remotion. Use whenever the user wants to make a product film, marketing reel, explainer, launch video, or LinkedIn/Instagram video of their app - including requests like "make a video of my product", "remotion video", "product demo reel", "launch film", "vertical reel", "9:16 ad", "explainer", or whenever screenshots + a soundtrack + brand colors are being assembled for a short cinematic render. Also use when the user has b-roll footage (collage, stock, live action) they want layered into a motion-graphics film, or when the product has no UI to record (API-only, Chrome extension, early-stage) and schematic UIs need to be invented.
---

# SaaS Product Demo Video

End-to-end workflow for shipping a beat-synced SaaS product film in Remotion. Covers silent cinematic films, beat-locked horizontal demos, vertical reels, and films with collage b-roll layers.

The skill is opinionated about three things: **assets**, **vibe**, **beats**. Skip any one and you produce a generic Canva-style motion graphics reel that looks like every other SaaS demo. The discipline is what makes the difference.

These are *strong recommendations* rather than hard rules. Most productions follow them; some break them with intent (e.g. voice-over-driven films where beat-sync would fight the VO). When you break a rule, do it knowingly.

---

## Prerequisites

Before starting, verify these are in place. The first one is genuinely required; the others are strong recommendations with documented fallbacks.

1. **Remotion installed** (required). `@remotion/cli` 4.0.x + `@remotion/google-fonts` + React 19. See `references/project-scaffold.md` for the exact minimal `package.json` / `tsconfig.json` / `remotion.config.ts` - never run `npx create-video` inside an existing git repo (it blocks on an arrow-key prompt).

2. **Super Powers plugin (strongly recommended, not required).** When available, this skill orchestrates `superpowers:using-superpowers`, `superpowers:brainstorming` (with visual companion), `superpowers:writing-plans`, and `superpowers:subagent-driven-development`. They give you HTML mockups in the browser for layout decisions, formal plan documents, and the implementer + reviewer subagent loop.

   **If superpowers isn't installed**, the skill still works - the workflow becomes more conversational and a bit slower. Brainstorming becomes inline dialogue (no browser companion); plans are written directly in the chat; scenes are implemented inline rather than via dispatched subagents. The three pillars (assets / vibe / beats) plus b-roll, schematic UI, click positioning, writing style, and the scripts in `scripts/` all work the same. Don't decline the work because of a missing plugin - adapt and proceed.

3. **Python 3 + librosa available.** Beat detection runs `scripts/detect-beats.py` which imports `librosa`. If not installed, run `pip install --break-system-packages librosa numpy soundfile` and tell the user - don't do it silently.

4. **For reference-video analysis (Pillar 2):** the skill supports three paths in priority order. Use the highest one that's available - see `references/reference-video-vibe.md` for full detection logic.

   1. **`gemini` CLI on PATH** (official Google CLI, or community wrappers like `gemini-yt`). Run with the prompt + YouTube URL as args.
   2. **`GEMINI_API_KEY` set** in env or `.env`. Use the skill's curl wrapper at `scripts/analyze-reference-video.sh`.
   3. **None of the above** - fall back to manual Google AI Studio copy-paste. Awkward but always works; quality is comparable.

Run `references/prereq-check.md` as your first move in a new session.

---

## The three pillars

These are the high-leverage activities. Skipping one to "save time" almost always costs more time downstream.

### Pillar 1 - Asset intake onboarding

Before anything else, run the structured questionnaire in `assets/prompt-templates/asset-intake-questionnaire.md`. It asks for:

- Aspect ratio (16:9 horizontal, 9:16 vertical, or both in parallel - see `references/vertical-port.md` if both)
- Duration in seconds (20-45s recommended)
- Logo - SVG preferred. If PNG-only, capture native dimensions to prevent pixelation when scaled up.
- Brand hex colors (primary accent + 3-6 supporting pastels)
- Font stack (all must be on Google Fonts)
- Copy / script - prefer a user-supplied draft over generating one. If they have no script, see `references/script-development.md`.
- Voiceover (optional)
- Soundtrack file - required for beat-sync. If user has none, pick from royalty-free stock.

Reference `references/asset-intake.md` for the full intake flow including the partial-asset minimum-viable set, naming hygiene on copy-in, and the asset-upscaling pixelation check.

### Pillar 2 - Reference-video vibe workflow

Before writing scenes, ask the user for **2-3 YouTube reference videos** whose vibe they want. Then produce a director's breakdown for each.

Two paths supported (see `references/reference-video-vibe.md`):

- **Automated (preferred when available)** - if the user has a `GEMINI_API_KEY` set, run `scripts/analyze-reference-video.sh <youtube-url> <slug>` for each video. Uses Gemini Pro Preview via curl. Takes ~30s per video. Outputs land at `references/gemini-<slug>.md`.
- **Manual (always works)** - open `aistudio.google.com`, paste the prompt from `scripts/reference-video-prompt.md` along with the YouTube URL, copy the result back into a file. Awkward but produces equally usable output. Use this when the API isn't available.

The **directorial verb vocabulary** (push-through, whip-pan, V-cut pull-back, ink-mask, match-cut zoom) is the most load-bearing output - it gives you specific motion primitives to build around.

### Pillar 3 - Soundtrack beat-sync

Scene boundaries should land on snares (the rhetorical "drum hit" feel). Internal events (clicks, card landings, counter starts) should land on either kicks or snares within the scene.

The pipeline:

1. Run `scripts/detect-beats.py <soundtrack.mp3> --fps 30 --out beats.json`. Emits BPM, first-kick frame, snare timestamps + frames.
2. Ingest into a single timing constants object (see `assets/code-templates/theme-v2.ts`). Every scene `<Sequence from={...} durationInFrames={...}>` pulls from this.
3. After Phase 6 (scenes built), run `scripts/align-internal-events.py` against beats.json + a list of in-scene events to nudge them onto nearest beats within ±6 frames. This is the second-highest-leverage iteration after the initial render - the audience feels off-beat internal events as "rhythm sometimes off" without being able to point at why.
4. Use `isSnare(n)` / `isKick(n)` helpers to assert in dev mode.
5. Run `scripts/check-typing-budget.py` against any TypedText/TypedChars to verify it fits within scene duration. Cuts off-screen typing before it ships.

Full math, helpers, internal-event alignment, and the typing-budget check in `references/beat-sync.md`.

---

## Adjacent capabilities - when the basics aren't enough

These cover situations beyond the standard "all-motion-graphics, just-record-a-screenshot" SaaS demo. Read the relevant reference when the user's situation needs it.

### Script development - when the user has no script

Most users come in with a vague product idea, not a finished screen-by-screen. `references/script-development.md` walks through a structured dialogue flow that produces a 4-act outline + locked screen-by-screen + locked-copy reference page, ready to feed into the spec doc.

### B-roll integration - when the film uses live-action or collage layers

If the user has stock footage, collage clips, or any video they want as a backdrop layer, use `references/b-roll-integration.md` and the `BRollLayer` template. B-roll can be a full-opacity backdrop or a low-opacity texture; the primitive handles trim, fade, blend modes, and fps-correct timing.

(Previous versions of this skill recommended sending live-action work to Premiere/DaVinci. That's wrong when the b-roll is being used as a *layer* under motion graphics - Remotion handles this well and keeping the production in one tool is a productivity win.)

### Schematic UI fidelity - when the product has no real UI to record

If the product is a Chrome extension, an API, or early-stage and there's no real product UI to screenshot, `references/schematic-ui-fidelity.md` covers how to invent schematic UIs that read as polished without infringing on real platforms (LinkedIn, Gmail, Slack). Three reference patterns: profile card, email composer, API panel - code templates in `assets/code-templates/Schematic*.tsx`.

### Click positioning - the #1 iteration churn pain point

Cursor clicks missing buttons is the most common user complaint across productions. `references/click-positioning.md` covers three approaches (refs, computed-position constants, debug overlay) - pick one upfront. The cost of getting this wrong is multiple full re-render cycles per scene.

### Writing style - keep AI-tells out of user-facing copy

Em-dashes, curly quotes, and certain phrasing tics scream "AI-generated." `references/writing-style.md` is the default style guide with a pre-render grep check that catches these. If the user has their own brand-voice guide, prefer that.

---

## Ideal sequence

The full end-to-end flow. See `references/ideal-sequence.md` for the annotated version with rationale.

1. **Gather inputs first, write code last.** Run the asset intake questionnaire.
2. **Develop the script** if the user doesn't have one - `references/script-development.md`.
3. **Produce reference-video breakdowns** - automated via `scripts/analyze-reference-video.sh` or manual via AI Studio.
4. **Detect beats and write the timing constants object.** `scripts/detect-beats.py` → `theme-v2.ts`. Every scene start derives from beats.
5. **Scaffold Remotion manually.** Minimal `package.json` / `tsconfig.json` / `remotion.config.ts`. Never `npx create-video` inside a git repo.
6. **Register per-scene debug compositions in Root.tsx.** Essential speed-up. Scrubbing one 5-second scene is 30x faster than the full master.
7. **Load every font at `Root.tsx` top level** with `subsets: ["latin"]`.
8. **Use hyphens in composition IDs** (`v2-Scene06`, never `v2_Scene06`).
9. **Invoke `superpowers:brainstorming` with visual companion** for style/layout decisions. HTML mockups beat prose every time.
10. **Write the spec doc.** `docs/superpowers/specs/YYYY-MM-DD-<name>-design.md`. Include a schematic-UI fidelity section if any are needed.
11. **Self-review the spec, then user-approves it.** No code until green light.
12. **Invoke `superpowers:writing-plans`.** Plan-template hygiene check before dispatching (see `references/project-scaffold.md`).
13. **Build animation primitives first** (TypedText, MaskReveal, PopIn, Cursor, ZoomPunch, FloatingElements, BRollLayer, Counter, IceCrack as needed). Then schematic UI cards. Then scenes. Then master.
14. **Invoke `superpowers:subagent-driven-development`.** Cap subagent batches at 3-4 files per dispatch - larger batches sometimes run out of context mid-task. See `references/iteration-playbook.md`.
15. **Spot-render Scene 1 alone.** Establish the style. Get user approval before the rest.
16. **Iterate in waves.** Cap each wave at 5-8 fixes. Run the internal-event alignment pass once after the baseline render - that single pass tightens the rhythm noticeably.
17. **Master-render at publish quality.** `--crf=14 --image-format=png` (HD) or `--crf=15 --image-format=png --scale=2` (4K). See `references/render-export.md`.
18. **Spot-check against the beat map at 0.5x speed.**

---

## References index

The `references/` directory contains the depth. Load only what you need for the current phase.

- `ideal-sequence.md` - the full annotated flow, with rationale
- `prereq-check.md` - what to verify before starting
- `asset-intake.md` - full intake flow, partial-asset fallback, asset upscaling check, naming hygiene
- `script-development.md` - screen-by-screen methodology when the user has no script
- `reference-video-vibe.md` - Gemini analysis protocol (API / CLI / AI Studio paths)
- `beat-sync.md` - beat-grid math, scene-boundary rule, internal-event alignment, typing-budget check
- `project-scaffold.md` - minimal Remotion setup, commit checklist, plan-template hygiene, .gitignore essentials
- `animation-patterns.md` - TypedText, MaskReveal, PopIn, ZoomPunch, FloatingElements, plus extensions
- `b-roll-integration.md` - `BRollLayer` patterns, opacity/blend treatments, render perf
- `schematic-ui-fidelity.md` - designing fake UI that reads as polished
- `click-positioning.md` - three approaches to keep cursor clicks landing on the right targets
- `writing-style.md` - em-dashes and other AI-tells to avoid in on-screen copy
- `cursor-math.md` - hotspot offset, keypoints, scale-ratio transform
- `iteration-playbook.md` - wave structure, batch reviews, subagent batching, Studio hot-reload restarts
- `render-export.md` - HD/4K render commands, CRF rationale
- `gotchas.md` - composition ID underscores, font warnings, italic loading, MaskReveal scale footgun
- `vertical-port.md` - 9:16 reel porting discipline

## Assets

- `assets/prompt-templates/` - fill-in templates for asset intake, spec docs, beat sheets
- `assets/code-templates/` - battle-tested components (theme constants, easings, Cursor, MaskReveal, TypedText, PopIn, ZoomPunch, FloatingElements, BRollLayer, Counter, IceCrack, SchematicProfileCard, SchematicEmailComposer, SchematicApiPanel, Act2Master, Act2MasterVertical)

## Scripts

- `scripts/detect-beats.py` - librosa-powered beat tracking. Emits BPM, first kick, snare/kick frames at target fps.
- `scripts/analyze-reference-video.sh` + `scripts/reference-video-prompt.md` - Gemini Pro wrapper for YouTube directorial breakdowns.
- `scripts/align-internal-events.py` - beat-align in-scene events within ±tolerance frames.
- `scripts/check-typing-budget.py` - verify TypedText/TypedChars fits in scene duration before render.

---

## When the skill should NOT be used

- **Existing Remotion project deep iteration.** If the user is 20+ commits into a film and asking for wave N+1 tweaks, don't re-run intake. Load `references/iteration-playbook.md` and `references/beat-sync.md` and go.
- **Non-SaaS demos.** Event recap, testimonial montage, tutorial screencast - the beat-sync + product-UI-card patterns don't apply cleanly.
- **Documentary or talking-head footage as the subject.** This skill handles b-roll as a *layer* under motion graphics. If live-action is the subject of the film (interviews, unboxing, walkthroughs), use a non-linear editor like Premiere, DaVinci, or Final Cut.
- **Voiceover-first videos.** If the script drives pacing, the beat-grid system fights the VO. Skill will fall back to frame-budget mode without beat-sync - tell the user explicitly.

---

## Output contract

A successful run produces:

- A working Remotion project with a master composition and per-scene debug compositions registered.
- `docs/superpowers/specs/YYYY-MM-DD-<name>-design.md` (spec) and `docs/superpowers/plans/YYYY-MM-DD-<name>.md` (plan).
- `references/gemini-<name>.md` for each reference video (in the user's repo, not this skill's).
- `beats.json` + `theme-v2.ts` timing constants wired into scenes (committed).
- HD MP4 (1920x1080 or 1080x1920, CRF 14).
- Optional 4K MP4 (`--scale=2`, CRF 15).
- Thumbnail JPG at an expressive frame.

The user should be able to re-render any scene independently, edit a single timing constant to re-flow the whole film, and confidently ship to LinkedIn / Instagram / YouTube Shorts without a second pass.
