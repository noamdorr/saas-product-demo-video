# Beat-sync - the soundtrack timing system

Pillar 3 (strongly recommended). Scene boundaries should land on snares. Cursor clicks should land on snares or kicks. Pill activations should land on beats. Cuts that don't land on beats feel off - the human brain catches it even when the watcher can't explain why.

This is a *strong recommendation* rather than a hard rule. Some films - voice-over-driven, ambient-music-driven, or deliberately syncopated - break the rule with intent. But if you're not sure, follow it: in 95% of productions, beat-snapping makes the cut feel professional.

## Core math

At 30 fps with a 120 BPM track:

- **Frames per beat:** `30 fps × 60 / 120 BPM = 15 frames/beat`
- **Frames per bar (4/4):** `15 × 4 = 60 frames = 2 seconds`
- **Snare offset:** backbeat - every 30 frames starting at 30 (if song drop is at frame 15)
- **Kick offset:** downbeat - every 30 frames starting at 15 (if song drop is at frame 15)

### The core helpers

```typescript
// Assumes song drop at master frame 15 (kick beat 1 of the drop bar).
// At 120 BPM / 30 fps: 15 frames/beat, 30 frames between snares.
export const FRAMES_PER_BEAT = 15;
export const SNARE_PHASE = 30;   // first snare
export const KICK_PHASE = 15;    // first kick (the drop)

export const isSnare = (masterFrame: number) =>
  masterFrame >= SNARE_PHASE && (masterFrame - SNARE_PHASE) % (FRAMES_PER_BEAT * 2) === 0;

export const isKick = (masterFrame: number) =>
  masterFrame >= KICK_PHASE && (masterFrame - KICK_PHASE) % (FRAMES_PER_BEAT * 2) === 0;
```

Use these at dev time to assert every scene boundary and click lands on a snare:

```typescript
if (process.env.NODE_ENV !== "production") {
  if (!isSnare(V2.scene5Start)) {
    console.warn(`Scene 5 start ${V2.scene5Start} is not on a snare!`);
  }
}
```

## The detection pipeline

Run `scripts/detect-beats.py`:

```bash
python3 scripts/detect-beats.py public/soundtrack.mp3 --fps 30 --out beats.json
```

Output shape (`beats.json`):

```json
{
  "bpm": 120.0,
  "fps": 30,
  "frames_per_beat": 15,
  "first_kick_frame": 15,
  "duration_seconds": 28.0,
  "total_frames": 840,
  "snare_frames": [30, 60, 90, ... , 810, 840],
  "kick_frames":  [15, 45, 75, ... , 795, 825],
  "recommended_scene_boundaries": [0, 120, 180, 330, 450, 630, 840],
  "warnings": []
}
```

If `warnings` contains "low kick/snare confidence," librosa struggled on the track. Review by ear in Audacity - look for a clear drop at the beginning and mark kicks/snares manually. A syncopated or ambient track may need manual tempo entry.

## Find the drop with RMS, not just onsets

The biggest musical moment - the **drop** or **swell** - is frequently a *sustained* loudness peak, not a sharp transient. `librosa.onset.onset_strength` (and the beat tracker built on it) finds transients: snare and kick hits, the sharp attack at the front of a note. The swell is different - it's a sustained energy peak where the whole mix gets loud and stays loud for a beat or more. Onset detection can miss it entirely or flag only its leading edge.

Find it with `librosa.feature.rms`, which measures windowed energy rather than attack sharpness. Pin the single biggest visual reveal (the hero shot, the product burst, the dashboard slam-in) to the RMS-energy peak inside the target window - not merely to the nearest detected beat.

```python
import librosa, numpy as np
y, sr = librosa.load("music.mp3", sr=22050)
rms = librosa.feature.rms(y=y, hop_length=256)[0]
times = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=256)
# loudest moment in, say, the 8-12s window -> map to a video frame (30fps)
w = [(t*30, r) for t, r in zip(times, rms) if 8 < t < 12]
swell_frame = max(w, key=lambda p: p[1])[0]
```

The small `hop_length=256` (vs librosa's default 512) gives finer time resolution, so the peak frame is accurate to within a few video frames. Round `swell_frame` to the nearest snare/kick from `beats.json` only if it lands within a frame or two - otherwise trust the RMS peak. The energy peak is where the audience *feels* the climax, even when no transient is detected there.

## Two close hits, two events

A sharp transient and the swell just after it can be ~0.3-0.5s apart - roughly 9-15 frames at 30 fps, a beat or less. That's two distinct musical moments, so assign two distinct visual events. Put a hard *impact* on the transient (a crash cut, a red flatline snapping in, a slam of a card) and the big *reveal* on the swell a beat later (the product, the dashboard, the hero number counting up).

Don't collapse them onto one frame, and don't waste the swell on a held or static screen. If the swell lands while the frame is already showing a finished, motionless composition, the loudest moment of the track has nothing to do - the energy peak passes over dead pixels. Spend the transient on the hit and the swell on the payoff.

```python
# transient (crash / flatline) on the detected onset, reveal on the RMS swell
impact_frame = next(f for f in kick_frames if f >= swell_frame - 15)
reveal_frame = round(swell_frame)   # a beat later, on the sustained peak
```

## Pace text reveals between beats

Reveal caption lines on detected beats - but mind the *gaps* between them. A single line left alone on screen too long reads as dead air: a **lonely line** the eye finishes reading with seconds to spare before anything changes. When a caption has multiple lines, don't hold the first one for a full bar; pull the next line in earlier, onto the next beat, so the text keeps pace with the music.

```typescript
// Two-line caption: don't strand line 1 for a whole bar (60 frames).
// Reveal on consecutive beats so the eye stays busy.
const line1Frame = isSnare ? sceneSnare : sceneKick;   // first beat
const line2Frame = line1Frame + FRAMES_PER_BEAT;       // next beat, ~15 frames later
```

And avoid the inverse - a text-less hold where a visual lands but its caption arrives seconds later. Start a caption as the thing it describes appears, not after. If the dashboard slams in on the swell, its label should be entering on that same beat, not a bar down the line once the audience has already moved on.

## Don't duck the music under a synced hit

If a visual is aligned to a musical hit, do NOT lower or duck the track at that exact frame "for drama." Ducking the bed on the frame you snapped to kills the beat you aligned to - the audience was about to feel the hit land, and the audio pulls out from under it instead. The synced frame is the one frame where the music must stay full.

Keep the bed at full level (or briefly lift it) on the synced frame. If a duck is needed - to seat a voiceover line, to clear room before a swell - put it *elsewhere*, in the gaps between hits, and let it recover before the next aligned frame.

```tsx
// Duck for a VO phrase, but ramp back to full BEFORE the synced hit at `hitFrame`.
// Never let the trough of the duck sit on `hitFrame`.
volume={(f) =>
  interpolate(
    f,
    [duckStart, duckStart + 6, hitFrame - 6, hitFrame],
    [0.6, 0.35, 0.35, 0.6],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  )
}
```

## Series frames are scene-local; map beats globally

Inside a `<Series>`, each child's `useCurrentFrame()` resets to 0 at that child's start - the frame is scene-local, not global. Author scene-internal timings (a click 40 frames in, a card landing at 60) in local frames. But detected beats from `beats.json` are global master frames. Convert each beat from global to local before using it inside a child, or every beat-snapped event slides off by the scene's start offset - and nothing throws, so the drift is silent.

```tsx
// scene begins at global frame `scene.start`; a beat detected at global 323 ->
const localBeat = 323 - scene.start
```

This is the same `localFrame = master - sceneStart` conversion as a `<Sequence>` (see "Converting scene-local ↔ master"), but the `<Series>` trap is sharper: children have no explicit `from` prop to remind you of the offset, so it's easy to treat a global beat as if it were local.

Ship the conversion as a helper rather than scattering `- sceneStart` across scenes. `assets/code-templates/scene-frames.ts` exports `toLocal` / `toMaster`, plus `sceneBeats` to grab just the beats inside a scene already in local frames:

```tsx
import { sceneBeats } from "./scene-frames";

// beats.json snare_frames + this scene's master start/duration:
const localSnares = sceneBeats(beats.snare_frames, { start: 200, duration: 136 });
// -> e.g. [16, 32, 47, ...], local frames ready for useCurrentFrame() comparisons
```

## The timing constants pattern

One canonical object in `theme-v2.ts` (or `src/v2/theme-v2.ts`). Every `<Sequence>` in the master and every per-scene debug composition reads from this.

```typescript
export const V2 = {
  width: 1920, height: 1080, fps: 30, totalFrames: 840,

  // Scene starts + durations - every start is on a snare.
  scene1Start: 0,   scene1Dur: 120,   // hook (4s)
  scene2Start: 120, scene2Dur: 60,    // pivot (2s)
  scene5Start: 180, scene5Dur: 150,   // proof A - email alert (5s)
  scene6Start: 330, scene6Dur: 120,   // proof B - reviewer card (4s)
  scene8Start: 450, scene8Dur: 180,   // proof C - pitch copilot (6s)
  scene9Start: 630, scene9Dur: 210,   // finale (7s)

  // Sum: 120 + 60 + 150 + 120 + 180 + 210 = 840 ✓
} as const;
```

Sum-check comment at the bottom is non-negotiable. When the user asks "trim scenes 1 and 2," editing one file updates the whole film coherently.

## Converting scene-local ↔ master

Inside each scene, frames are scene-local (0 to `sceneDur - 1`). To land a local event on a snare:

```typescript
const localFrame = desiredSnareMaster - sceneStart;
```

Example: Scene 5 starts at master 180. Want a click at master 300 (snare):

```typescript
const CLICK_VIEW_DETAILS = 300 - 180; // local 120
```

Document in the commit message AND as a comment above the constant:

```typescript
// Local 120 → master 300 (snare). Last pill + button pulse + click ripple coincide on snare hit.
const CLICK_VIEW_DETAILS = 120;
```

Once you have more than a couple of these, reach for `assets/code-templates/scene-frames.ts` (`toLocal` / `toMaster` / `sceneBeats`) instead of repeating the `- sceneStart` arithmetic by hand.

## The snare-boundary rule

**Scene boundaries must land on a snare, not just a beat.** Snare boundaries make cuts *feel* like a drum hit.

Ear test: if a scene cut feels like it "waits" after a phrase, the cut is probably on a kick one beat later than the nearest snare. Pull the scene end in by 15 frames.

Example from iteration log: Scene 2 → Scene 5 originally cut at master 195 (kick). User flagged it as feeling late. Moved Scene 2 end to master 180 (snare). Three problems resolved at once:
1. Cut landed on snare.
2. Accent "why" enter shifted to master 210 (snare, was 225 kick).
3. Email slide-in shifted to master 210 (snare).

## Pills + clicks + ripples - the stagger pattern

For the canonical "N things activate in rhythm then something clicks" beat:

```typescript
// EmailAlert - three pills activate beat-by-beat, click lands on last pill
const activeFrame = [startFrame + 45, startFrame + 60, startFrame + 75][i];
// With email startFrame=30 and scene5Start=180:
//   pill 1 master 255 (kick)
//   pill 2 master 270 (snare)
//   pill 3 master 285 (kick)
// Click View Details: master 300 (snare) - one beat later, not on pill 3.
```

**Avoid collision.** Don't put a pill activation + button pulse + click ripple on the same frame. That's cacophonous, not climactic. Space them one beat apart so each event reads clearly.

## Audio fade-out

The last 18 frames of every composition fade the audio from 0.6 → 0:

```tsx
<Audio
  src={staticFile("soundtrack.mp3")}
  volume={(f) =>
    interpolate(f, [totalFrames - 18, totalFrames], [0.6, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  }
/>
```

18 frames = 0.6 seconds - enough to feel like a natural outro, short enough to not waste the last beat.

## `startFrom` gotcha

If you initially used `<Audio startFrom={N}>` to skip a lead-in and later remove it, the beat anchor shifts. Past production: removing `startFrom` shifted the anchor +9 frames, which required extending Scene 1 by 9 frames to re-lock the grid.

**Prevention:** either commit to `startFrom=0` from the start, or treat `startFrom` as part of the beat math. If you change it, re-run `scripts/detect-beats.py` and update the first-kick frame.

## Click-on-kick audit

After initial build, audit every click:

```bash
# Pseudo-audit:
grep -rn "CLICK_" src/v2/scenes/ | grep -o "= [0-9]*" | sort -u
# Compute each click's master frame (= sceneStart + localClick)
# Verify isSnare(masterFrame) === true for each.
```

If any click lands on a kick, shift it ±15 frames. Also shift any downstream animations keyed off the click (drafting, type-start, accent-exit) by the same amount.

## When beat-sync fights VO

If the user provides a voiceover that drives pacing, the beat grid fights the VO. Fall back to **frame-budget mode**:

- Keep the centralized timing constants pattern.
- Drop the snare-boundary rule.
- Align scene cuts to VO phrase boundaries instead.

Tell the user explicitly: "with a VO, I can't guarantee beat-sync - scenes will follow the narration. The soundtrack becomes atmospheric rather than structural."

## Tools outside librosa

- **Aubio** (`brew install aubio`) - alternative beat detector, sometimes more reliable on soft tracks.
- **Audacity** - manual beat-marking fallback. Enable "Beat Finder" plugin, export as CSV, convert to frames.
- **DAW** (Ableton, Logic, Reaper) - if the user has one, the grid is already visible. Ask for a screenshot of the grid with BPM + first-kick timestamp.

For automated beat detection, `scripts/detect-beats.py` is the default.

## Internal events - the subtler beat-sync layer

Scene *boundaries* on snares is the loudest beat-sync rule. The subtler one: events INSIDE scenes (clicks, card landings, counter starts, b-roll fades) often drift to round-number frames (frame 4, 12, 22, etc.) that aren't on beats. The audience feels this as "the rhythm is sometimes off" without being able to point at why.

After scene boundaries are locked, run a second alignment pass on internal events:

1. List every "event frame" in each scene - every PopIn startFrame, every Cursor keypoint, every Counter startFrame, every click frame.
2. Compute the absolute master frame: `scene_start + scene_local_frame`.
3. For each event, find the nearest beat (snare OR kick) within ±6 frames.
4. If within tolerance, shift the scene-local frame by `delta` to land on the beat.
5. If outside tolerance (rare), leave it - forcing it would visibly damage the scene's pacing.

The skill ships `scripts/align-internal-events.py` which automates the lookup. You provide it a JSON list of `(scene_start, scene_local_frame, label)` tuples; it prints the OLD → NEW mapping for each event.

Why kicks count too: scene boundaries should be on snares (that's the rhetorical "drum hit" feel), but internal events are smaller - landing on either kick or snare is fine. The audience reads them as "on the beat."

### Past production note

In the Meltly demo, scene boundaries were snare-locked from day one (Phase 2). The user watched the baseline render and said "rhythm sometimes feels off" - couldn't point at why. The diagnosis: 17 internal event frames were drifting up to ±5 frames from the nearest beat. The fix script realigned them all in one pass; the user reported the next render felt visibly tighter. **The internal-event alignment is the single highest-leverage iteration after the initial render.**

## Typing-budget vs scene duration - a silent killer

A scene that's 2 seconds long can't fit a 75-character icebreaker typing at perChar=1.4 (= 105 frames = 3.5 seconds). The TypedChars component will truncate at scene end, and the result either:

- Cuts off the message mid-sentence (the user reads "Saw your half-marath...").
- Plays without the AI-thinking pauses you carefully designed in.
- Forces you to drop perChar so low the typing flickers visibly.

Run `scripts/check-typing-budget.py` against every TypedText/TypedChars in the project before building. The script takes a `typing.json` listing each block + its scene budget and verifies `start_frame + len*per_char + pauses ≤ scene_duration` for each.

Common fixes when over budget:

- **Reduce per_char** (faster typing, less time per character). Floor: 0.5 frames/char.
- **Drop AI-thinking pauses** if any. Cheapest fix; loses some personality.
- **Extend the scene** by re-allocating snare boundaries. Highest impact; affects total duration.
- **Truncate or rewrite the copy.** Last resort, requires user OK.
