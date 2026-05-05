# Spec doc template

Save to `docs/superpowers/specs/YYYY-MM-DD-<name>-design.md` in the user's repo. This is the blueprint the build phase executes against.

---

# `<name>` - design spec

**Date:** YYYY-MM-DD
**Aspect ratios:** 16:9 (1920×1080) [+ 9:16 (1080×1920) parallel port if applicable]
**Duration:** Ns (N frames @ 30 fps)
**Soundtrack:** `public/soundtrack.mp3` (BPM, length)
**Target platforms:** LinkedIn, homepage hero, [etc.]

## One-paragraph vibe statement

Synthesized from the reference video breakdowns. One paragraph only. Should read like a director briefing another director, not a marketing tagline.

Example: *"Fast-paced but never frantic. Cream and pastel backgrounds carry calm authority while pink and deep purple provide punch at emphasis moments. Motion grammar is kinetic type + staggered card entrances + shared-element transitions. Every scene boundary lands on a snare and the viewer feels the music without the music needing to be foregrounded."*

## Motion vocabulary

The union of transition verbs pulled from references, filtered for what will actually get used in this film:

- Push-through: Scene 1 → Scene 2
- Shared-element shrink: Scene 2 → Scene 5 (the accent phrase carries through)
- Iris wipe: Scene 8 → Scene 9 (finale reveal)
- Hard cut: most other boundaries
- Cross-dissolve: avoid (feels lazy)

## Pacing rule

Average shot length: Xs. Heartbeat pattern: `(e.g. fast → medium → fast → slow)`. Every scene cut on a snare.

## Typography plan

- **Display**: [font name + weight + size range]
- **Editorial**: [font name + weight] - used for [specific scenes]
- **UI**: [font name + weights] - used for [product crops]
- Animation grammar: type-on with 40% word overlap (`perWord: 10`), mask-reveal for hero phrases, character-by-character for [specific moment].
- Letter spacing: [tight/default/airy]
- Case: [ALL CAPS vs sentence case usage]

## Color plan

| Name | Hex | Usage |
|---|---|---|
| primaryAccent | `#xxxxxx` | emphasis words, CTA button |
| darkAccent | `#xxxxxx` | finale bg, CTA bg |
| cream | `#xxxxxx` | Scenes 1-5 bg |
| blush | `#xxxxxx` | Scene 6 bg |
| peach | `#xxxxxx` | Scene 8 bg |
| lavender | `#xxxxxx` | Scene 7 bg |

Scene color arc: `cream → cream → blush → peach → lavender → darkAccent`

## Signature moves (2-3 max)

1. `<signature move #1>` - appears at Scenes X and Y.
2. `<signature move #2>` - appears at Scene Z.
3. `<signature move #3>` - appears at Scene W.

Any more than 3 and each loses impact.

## Scene-by-scene breakdown

### Scene 01 - `<short name>` (frames 0-119, 4s)

**Purpose:** [hook / pivot / proof / close]

**Beat:** starts on master 0, ends on master 120 (snare).

**On-screen:** [what the viewer sees]

**Motion:** [how it enters, what animates, how it exits]

**Key constants:**
- `scene1Start: 0, scene1Dur: 120`
- [any click targets, phrase positions, etc.]

### Scene 02 - `<short name>` (frames 120-179, 2s)

[same structure]

### Scene 05 - `<short name>` (frames 180-329, 5s)

[same structure]

[continue for each scene]

## Audio

- `public/soundtrack.mp3`: [BPM] BPM, [duration]s, first kick at frame [N].
- Fade-out: last 18 frames, volume 0.6 → 0.
- No voiceover. [or: voiceover file at `public/vo.mp3`, drives pacing.]

## Primitives required

- `TypedText` - word-stagger type-on (40% overlap)
- `MaskReveal` - horizontal clip-path wipe
- `PopIn` - spring scale + fade
- `ZoomPunch` - 1.06 peak hero accent
- `FloatingElements` - deterministic ambient pills
- `Cursor` - hotspot-anchored SVG with scale-ratio transform
- [additions: iris wipe, marker underline, phrase lift, etc.]

## Timing constants object

See `src/v2/theme-v2.ts`:

```typescript
export const V2 = {
  width: 1920, height: 1080, fps: 30, totalFrames: <N>,
  scene1Start: 0,   scene1Dur: 120,
  // ...
} as const;
```

Sum-check: [verify]

## Render target

- Master: `--crf=14 --image-format=png --concurrency=8`
- 4K: add `--scale=2 --crf=15`
- Output: `out/<name>_<aspect>.mp4`

## Known risks / open questions

- [anything the user needs to decide or clarify before Phase 7]
