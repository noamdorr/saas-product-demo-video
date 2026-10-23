# Beat-sync - the soundtrack timing system

Pillar 3 (strongly recommended). Scene boundaries should land on backbeats (beats 2 and 4 of the bar, where the snare or clap usually sits). Cursor clicks should land on a beat, backbeat or downbeat. Pill activations should land on beats. Cuts that don't land on beats feel off - the human brain catches it even when the watcher can't explain why.

This is a *strong recommendation* rather than a hard rule. Some films - voice-over-driven, ambient-music-driven, or deliberately syncopated - break the rule with intent. But if you're not sure, follow it: in 95% of productions, beat-snapping makes the cut feel professional.

Before the checkpoint you need this file only as far as "How the timing file uses it". The rest (internal events, typing budget, films that are not beat-synced) is for the full build.

## Frames come from the beat grid, not from arithmetic

At 30 fps a 120 BPM track has a beat every 15 frames exactly, and it is tempting to compute beats as `start + n * 15`. That only works when a beat is a whole number of frames. At 30 fps, 128 BPM is 14.06 frames per beat and 95 BPM is 18.95: any multiply-and-round scheme drifts or jitters within a few bars, and the cut that was on the snare in bar 2 is a frame late by bar 10.

So nothing in the film computes a beat. `scripts/detect-beats.py` measures where each beat falls and writes the frames to `beats.json`; `src/timing.ts` imports those arrays; scenes look frames up by beat number. No frame number is typed by hand.

## The detection pipeline

Run it from the video project folder, after the soundtrack is in `public/`:

```bash
python3 "$SKILL/scripts/detect-beats.py" public/soundtrack.mp3 --fps 30 --out beats.json
```

It prints a summary and writes `beats.json`:

```json
{
  "audio_file": "soundtrack.mp3",
  "fps": 30,
  "bpm": 119.99,
  "frames_per_beat": 15.001,
  "duration_seconds": 29.544,
  "total_frames": 886,
  "first_beat_frame": 1,
  "tempo_second_opinion": 120.19,
  "grid_reliability": "good",
  "grid": "even",
  "first_audible_seconds": 0.48,
  "first_audible_beat": 1,
  "biggest_lift_beat": 14,
  "loudness_by_beat": [0.04, 0.3, 0.27, ...],
  "tracker_lag_ms": 38.5,
  "beat_frames": [1, 16, 31, 46, 60, 76, 90, 106, 120, 136, ...],
  "backbeat_frames": [1, 31, 60, 90, 120, ...],
  "downbeat_frames": [16, 46, 76, 106, 136, ...],
  "backbeat_parity": "even",
  "backbeat_confidence": 0.93,
  "backbeat_source": "detected",
  "warnings": []
}
```

What each part is worth:

- **`grid`** is `even` when the track has one steady tempo. The script then fits a single tempo through the tracked beats and places every beat on that line, so the gaps are all the same (15 frames at 120 BPM and 30 fps). This matters more than it sounds: the tracker hears each beat a few milliseconds early or late, and rounding those one by one produced gaps of 14, 15 and 16 frames in an earlier version, which made a film feel jerky against a perfectly even track. `as tracked` means the tempo really drifts and the gaps vary.
- **`beat_frames`** is the grid: the video frame each beat sounds in, from librosa's beat tracker. It is reliable on music with a steady pulse. The tracker marks each beat slightly after the hit, so the script measures that lag on the waveform (`tracker_lag_ms`) and removes it. On a track where the hits were already known by ear, detected beats sat within one frame of them, which is why `isBackbeat` allows a frame of tolerance.
- **`backbeat_frames` and `downbeat_frames`** are the grid split in two: every other beat. `backbeat_parity` says which half is the backbeat, as an index into `beat_frames` ("even" means beats 0, 2, 4, ...).
- **`backbeat_confidence`** says how sure that split is, from 0 (coin flip) to 1 (every bar agrees). The script compares the percussive high-band energy of the two halves over the whole track: a snare or clap on one half tips it, hi-hats on both cancel out.
- **`grid_reliability`** is the one line to act on: `good`, `check` or `poor`. It combines three independent signals: the beats sit on audible hits, a second tempo estimate (`tempo_second_opinion`, measured in short windows without the beat tracker) agrees with the grid, and the backbeat split is clear.
- **`first_audible_seconds` and `first_audible_beat`** say where the music actually starts. The grid runs back to time zero, so a track that opens with silence has beats before any sound; put the first event that should land with the music on `first_audible_beat` or later.
- **`biggest_lift_beat`** is the beat where the music steps up the most and stays up (the drop or swell), from `loudness_by_beat`. It is the natural place for the film's main reveal.
- **`frames_per_beat` and `bpm`** are for reading only. Do not multiply with them, for the reason in the section above.

The script does not classify individual drum hits. It cannot tell you "this hit is a snare", only which half of the grid the snares are on, and how sure it is.

### Acting on the reliability verdict

- **good**: build on the grid.
- **check**: the grid is usable, but one signal is missing. Have the human listen against the frame numbers before you cut on it, using the notes below.
- **poor**: the tracker could not hold a grid on this track. This happens with soft attacks, shifting tempo, or rhythms that are not a plain four. On one real production track it reported 86.9 BPM where short windows measured 114.8, and its beats matched only one of the five cuts that had been placed by ear. Do not build a beat-cut film on a `poor` grid. Ask the human to tap the tempo and re-run with `--bpm`, choose a track with a steady drum pattern, or place the cuts by hand and say plainly that the film is not beat-synced.

### When the confidence is low

Below 0.5 the script says so in its output and adds a line to `warnings` (which `timing.ts` repeats in the Studio console). Do not cut scenes on a low-confidence split, because a wrong split puts every cut on the kick, which is the "cut feels late" problem this whole file exists to prevent. Ask the human instead: the summary prints the first backbeats in seconds ("1.03s, 2.03s, 3.00s"), so the question is "does the snare or clap land at these times, or on the beats between them?". Then record the answer:

```bash
python3 "$SKILL/scripts/detect-beats.py" public/soundtrack.mp3 --out beats.json --confirm keep   # the script had it right
python3 "$SKILL/scripts/detect-beats.py" public/soundtrack.mp3 --out beats.json --confirm swap   # it was the other half
```

Other notes it can print:

- **Tempo is ambiguous**: the tracked grid and the short-window tempo disagree by more than 8%. Treat the grid as unproven until a human confirms the tempo.
- **`--bpm` did not change the grid**: you passed a tempo and got the same beats as without it. That is a confirmation only if a human tapped the number. Do not feed the script its own estimate, or yours, to improve the verdict: the beats are the same ones it told you not to build on.
- **Unusual tempo** (under 60 or over 200 BPM): the tracker may have locked onto half or double the real tempo. Re-run with `--bpm <real tempo>`.
- **No steady beat found**: ambient or rubato music. Use frame-budget mode ("When beat-sync fights VO" below).
- **Could not line the beats up with the hits**: soft attacks, so beats may sit a frame or two late. Check a cut by eye in Studio.

## How the timing file uses it

`assets/scaffold/src/timing.ts` is the film's clock. Read the file itself; the parts scenes use:

| Export | What it is |
|---|---|
| `BEATS`, `BACKBEATS`, `DOWNBEATS` | Master frames from `beats.json`, shifted by `AUDIO_TRIM` |
| `beatFrame(n)`, `backbeatFrame(n)` | Master frame of beat n or backbeat n, counting from 0 |
| `nearestBackbeat(frame)` | The backbeat closest to a frame |
| `isBackbeat(frame, tolerance = 1)` | Whether a frame is on a backbeat |
| `SCENES.<name>.start` / `.duration` | Each scene's place on the master timeline |
| `TOTAL_FRAMES`, `FPS` | Length of the film, frame rate |
| `SOUNDTRACK`, `AUDIO_TRIM` | The audio file name, and frames trimmed off its start |

Scenes are listed once, by the beat each one ends on:

```typescript
const SCENE_ENDS = {
  hook: backbeatFrame(4),
  proof: backbeatFrame(10),
  finale: backbeatFrame(18),
};
```

A scene starts where the previous one ended, so there is no start to keep in sync and no sum to check. When the user asks to "trim the hook by a bar", change one index and every later scene, the master and the debug compositions follow. Use `backbeatFrame(n)` for cuts. `beatFrame(n)` is there for a cut that should sit on another beat on purpose; in Studio, `timing.ts` warns about any scene that does not start on a backbeat, so an accidental one is visible.

## Find the drop with RMS, not just onsets

The biggest musical moment - the **drop** or **swell** - is frequently a *sustained* loudness peak, not a sharp transient. `librosa.onset.onset_strength` (and the beat tracker built on it) finds transients: snare and kick hits, the sharp attack at the front of a note. The swell is different - it's a sustained energy peak where the whole mix gets loud and stays loud for a beat or more. Onset detection can miss it entirely or flag only its leading edge.

`detect-beats.py` already reports the largest one as `biggest_lift_beat`. For a second moment, or a closer look, find it with `librosa.feature.rms`, which measures windowed energy rather than attack sharpness. Pin the single biggest visual reveal (the hero shot, the product burst, the dashboard slam-in) to the RMS-energy peak inside the target window - not merely to the nearest detected beat.

```python
import librosa, numpy as np
y, sr = librosa.load("music.mp3", sr=22050)
rms = librosa.feature.rms(y=y, hop_length=256)[0]
times = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=256)
# smooth over about 0.75 s first: on chopped or gated music the single loudest
# frame is an arbitrary gap edge, not the swell
k = int(0.75 * sr / 256)
smooth = np.convolve(rms, np.ones(k) / k, mode="same")
# the swell is where the smoothed level crosses halfway between the quiet and
# loud parts of the window and stays there
in_window = (times > 8) & (times < 14)
half = (smooth[in_window].min() + smooth[in_window].max()) / 2
crossing = times[in_window][np.argmax(smooth[in_window] > half)]
swell_frame = round(crossing * 30)
```

Treat a swell that builds over a second as accurate to about half a second, and say so in the brief.

The small `hop_length=256` (vs librosa's default 512) gives finer time resolution for a sharp drop. Round `swell_frame` to the nearest beat from `beats.json` only if it lands within a frame or two - otherwise trust the RMS peak (`nearestBeat(frame, BEATS, 2)` in `scene-frames.ts` does exactly this). The energy peak is where the audience *feels* the climax, even when no transient is detected there.

## Two close hits, two events

A sharp transient and the swell just after it can be ~0.3-0.5s apart - roughly 9-15 frames at 30 fps, a beat or less. That's two distinct musical moments, so assign two distinct visual events. Put a hard *impact* on the transient (a crash cut, a red flatline snapping in, a slam of a card) and the big *reveal* on the swell a beat later (the product, the dashboard, the hero number counting up).

Don't collapse them onto one frame, and don't waste the swell on a held or static screen. If the swell lands while the frame is already showing a finished, motionless composition, the loudest moment of the track has nothing to do - the energy peak passes over dead pixels. Spend the transient on the hit and the swell on the payoff.

```python
# transient (crash / flatline) on the last beat before the swell, reveal on the RMS swell
impact_frame = max(f for f in beat_frames if f < swell_frame)
reveal_frame = round(swell_frame)   # up to a beat later, on the sustained peak
```

## Leave beats empty

A scene has a beat every half second or so, and most of them should carry nothing. A film with an event on nearly every beat feels busy and jerky however exactly each event is placed; the one this skill grew out of puts four to six events in a scene of eight to twelve beats and holds still in between. When you read a scene's beats from `sceneBeats()`, the list is a set of places an event may go, not a list of slots to fill.

## Pace text reveals between beats

Reveal caption lines on detected beats - but mind the *gaps* between them. A single line left alone on screen too long reads as dead air: a **lonely line** the eye finishes reading with seconds to spare before anything changes. When a caption has multiple lines, don't hold the first one for a full bar; pull the next line in earlier, onto the next beat, so the text keeps pace with the music.

```typescript
// Two-line caption: don't strand line 1 for a whole bar.
// Reveal line 2 on the next beat, so the pair reads as one thought.
const beatsHere = sceneBeats(BEATS, SCENES.hook);   // scene-local frames
const line1Frame = beatsHere[2];
const line2Frame = beatsHere[3];                    // the very next beat
```

This is about the lines of one caption, not a reason to fill every beat: once the caption is complete, hold it. And avoid a visual landing whose caption arrives seconds later. Start a caption as the thing it describes appears, not after. If the dashboard slams in on the swell, its label should be entering on that same beat, not a bar down the line once the audience has already moved on.

## Don't duck the music under a synced hit

If a visual is aligned to a musical hit, do NOT lower or duck the track at that exact frame "for drama." Ducking the bed on the frame you snapped to kills the beat you aligned to - the audience was about to feel the hit land, and the audio pulls out from under it instead. The synced frame is the one frame where the music must stay full.

This rule is about pulling the bed out for drama. A shallow dip under a sound effect that lands on the same beat (a sidechain, 2 to 3 dB for a few frames, so a low hit sits in the mix) is a different case: one owner, told it takes a little off the snare, heard both and kept it (`sound-effects.md`, "Mix"). Ask, do not assume either way.

Keep the bed at full level (or briefly lift it) on the synced frame. If a duck is needed - to seat a voiceover line, to clear room before a swell - put it *elsewhere*, in the gaps between hits, and let it recover before the next aligned frame.

```tsx
// Duck for a VO phrase, but ramp back to full BEFORE the synced hit at `hitFrame`.
// Never let the trough of the duck sit on `hitFrame`.
const frame = useCurrentFrame();
const volume = interpolate(
  frame,
  [duckStart, duckStart + 6, hitFrame - 6, hitFrame],
  [0.6, 0.35, 0.35, 0.6],
  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
);
// <Audio src={...} volume={volume} />
```

## Series frames are scene-local; map beats globally

Inside a `<Series>`, each child's `useCurrentFrame()` resets to 0 at that child's start - the frame is scene-local, not global. Author scene-internal timings (a click 40 frames in, a card landing at 60) in local frames. But detected beats from `beats.json` are global master frames. Convert each beat from global to local before using it inside a child, or every beat-snapped event slides off by the scene's start offset - and nothing throws, so the drift is silent.

```tsx
// scene begins at global frame `scene.start`; a beat detected at global 323 ->
const localBeat = 323 - scene.start
```

This is the same `localFrame = master - sceneStart` conversion as a `<Sequence>` (see "Converting scene-local ↔ master"), but the `<Series>` trap is sharper: children have no explicit `from` prop to remind you of the offset, so it's easy to treat a global beat as if it were local.

Use the helpers rather than scattering `- sceneStart` across scenes. The scaffold's `src/scene-frames.ts` exports `toLocal` / `toMaster`, plus `sceneBeats` to grab just the beats inside a scene, already in local frames:

```tsx
import { sceneBeats } from "../scene-frames";
import { BACKBEATS, SCENES } from "../timing";

const hits = sceneBeats(BACKBEATS, SCENES.proof);
// -> e.g. [16, 46, 76, ...], local frames ready for useCurrentFrame() comparisons
```

`src/scenes/ExampleScene.tsx` in the scaffold is built this way.

## Converting scene-local ↔ master

Inside each scene, frames are scene-local (0 to `duration - 1`). To land a local event on a backbeat, take the backbeat's master frame and subtract the scene's start:

```typescript
import { toLocal } from "../scene-frames";
import { SCENES, backbeatFrame } from "../timing";

// The click lands on backbeat 9, which falls inside this scene.
const CLICK_VIEW_DETAILS = toLocal(backbeatFrame(9), SCENES.proof.start);
```

Say what lands there in a comment above the constant, because the next person to retime the scene needs to know which events were meant to coincide:

```typescript
// Last pill + button pulse + click ripple all land on this backbeat.
const CLICK_VIEW_DETAILS = toLocal(backbeatFrame(9), SCENES.proof.start);
```

## The backbeat-boundary rule

**Start with scene boundaries on backbeats.** The snare sits on the backbeat, so a cut there *feels* like a drum hit.

It is a starting point, and the ear has the last word. The film this skill grew out of ended up, after many rounds with its owner, with three of its five cuts on downbeats, because those scenes felt better starting with the weight of the kick. Place cuts on backbeats first, then move one when the user says it feels wrong.

Ear test: if a scene cut feels like it "waits" after a phrase, the cut is probably on a downbeat, one beat later than the nearest backbeat. Pull the scene end in by one beat (in `SCENE_ENDS`, the backbeat before it).

Example from iteration log: Scene 2 → Scene 5 originally cut at master 195 (kick). User flagged it as feeling late. Moved Scene 2 end to master 180 (snare). Three problems resolved at once:
1. Cut landed on snare.
2. Accent "why" enter shifted to master 210 (snare, was 225 kick).
3. Email slide-in shifted to master 210 (snare).

## Pills + clicks + ripples - the stagger pattern

For an "N things activate in rhythm, then something clicks" moment. Use it once in a film, where the rhythm is the point; the same run of three in every scene is what makes a film feel mechanical:

```typescript
// Three pills activate on three consecutive beats; the click lands on the
// beat after the last pill, not on pill 3.
const beatsHere = sceneBeats(BEATS, SCENES.proof);   // scene-local frames
const pillFrames = [beatsHere[5], beatsHere[6], beatsHere[7]];
const CLICK_VIEW_DETAILS = beatsHere[8];
```

**Avoid collision.** Don't put a pill activation + button pulse + click ripple on the same frame. That's cacophonous, not climactic. Space them one beat apart so each event reads clearly.

## Audio fade-out

The scaffold's `src/Master.tsx` already does this: the soundtrack plays at volume 0.6 and fades to 0 over the last 18 frames of the film, driven by `useCurrentFrame()` and `TOTAL_FRAMES`.

18 frames = 0.6 seconds - enough to feel like a natural outro, short enough to not waste the last beat.

## Trimming the start of the track

To skip a musical lead-in, set `AUDIO_TRIM` (in frames) in `timing.ts`. `Master.tsx` passes it to `<Audio trimBefore>`, and `timing.ts` shifts every beat by the same amount, so the picture stays on the music.

Do not put a literal `trimBefore` on the `<Audio>` instead: it moves the music without moving the grid, and every cut is then off by that many frames with nothing to warn you. A past production shifted by 9 frames this way when a trim was removed, and Scene 1 had to be extended by 9 frames to re-lock the grid.

## Click audit

After the initial build, audit every click:

```bash
grep -rn "CLICK_" src/scenes/
```

Every click constant should be derived from the grid (`sceneBeats(...)`, `toLocal(backbeatFrame(n), ...)`), not a typed number. For any that is typed, compute its master frame (`toMaster(local, SCENES.<name>.start)`) and check `isBackbeat(masterFrame)`.

If a click is off the beat, move it to the nearest one, and move any downstream animations keyed off the click (drafting, type-start, accent-exit) by the same amount. `scripts/align-internal-events.py` (below) does the lookup.

## Pacing numbers, from the films that looked expensive

Three reference films broken down for one production ran 10 to 13 cuts a minute, an average shot of 4.2 to 5.9 s, no shot under 3.5 s and none over 7 s; a long shot earned its length with a three-stage event inside it. The owner's floor was 12 cuts a minute and a camera move in every scene; the film before that one was rejected as "too static" with "the music too soft". Four to six events in a four-second scene, most beats empty. `tools/dump-timing.mjs` prints the film's cuts per minute; read it against these numbers before the first full render.

A tempo second opinion that sits at 2:1, 3:2 or 4:3 to the tracked grid is usually a dotted or swung feel, not a disagreement; the script says so in its warning, and the tracked grid is then the pulse to cut on. A `--bpm` passed back from the tracker's own number is not a confirmation; only a tapped tempo is.

## When the film is not beat-synced

Two cases: a voiceover sets the pace, or the beat grid was rated `poor` and nobody is available to confirm the tempo. In both, place the cuts by time (**frame-budget mode**):

- Set `BEAT_SYNCED = false` in `timing.ts`. This silences the backbeat warnings, which would otherwise fire for every scene.
- Keep the scene list in `timing.ts`, so the film still retimes from one place, and write each entry in `SCENE_ENDS` as `atSeconds(n)`: a voiceover phrase's end, or for a `poor` grid a time you chose for reading pace.
- Say so in the brief's Beat sync line and again at the checkpoint, and ask the user to listen. A film presented as beat-synced that is not is worse than one that says plainly it follows reading pace.
- Leave `beats.json` as the script wrote it, `poor` label included, so the next person sees why.

With a voiceover, tell the user explicitly: "with a VO, I can't guarantee beat-sync - scenes will follow the narration. The soundtrack becomes atmospheric rather than structural."

## Tools outside librosa

- **Aubio** (`brew install aubio`) - alternative beat detector, sometimes more reliable on soft tracks.
- **Audacity** - manual beat-marking fallback. Enable "Beat Finder" plugin, export as CSV, convert to frames.
- **DAW** (Ableton, Logic, Reaper) - if the user has one, the grid is already visible. Ask for a screenshot of the grid with BPM + first-kick timestamp.

For automated beat detection, `scripts/detect-beats.py` is the default.

## Internal events - the subtler beat-sync layer

Scene *boundaries* on backbeats is the loudest beat-sync rule. The subtler one: events INSIDE scenes (clicks, card landings, counter starts, b-roll fades) often drift to round-number frames (frame 4, 12, 22, etc.) that aren't on beats. The audience feels this as "the rhythm is sometimes off" without being able to point at why.

After scene boundaries are locked, run a second alignment pass on internal events:

1. List every "event frame" in each scene - every PopIn startFrame, every Cursor keypoint, every Counter startFrame, every click frame.
2. Compute the absolute master frame: `scene_start + scene_local_frame`.
3. For each event, find the nearest beat (backbeat or downbeat) within ±6 frames.
4. If within tolerance, shift the scene-local frame by `delta` to land on the beat.
5. If outside tolerance (rare), leave it - forcing it would visibly damage the scene's pacing.

The skill ships `scripts/align-internal-events.py` which automates the lookup. You provide it a JSON list of `(scene_start, scene_local_frame, label)` tuples; it prints the OLD → NEW mapping for each event, marking each nearest beat B (backbeat) or D (downbeat). If `timing.ts` sets `AUDIO_TRIM`, pass the same number as `--audio-trim` so the script shifts the grid the same way.

Why downbeats count too: scene boundaries should be on backbeats (that's the rhetorical "drum hit" feel), but internal events are smaller - landing on any beat is fine. The audience reads them as "on the beat."

### Past production note

In the Meltly demo, scene boundaries were backbeat-locked from day one. The user watched the baseline render and said "rhythm sometimes feels off" - couldn't point at why. The diagnosis: 17 internal event frames were drifting up to ±5 frames from the nearest beat. The fix script realigned them all in one pass; the user reported the next render felt visibly tighter. **The internal-event alignment is the single highest-leverage iteration after the initial render.**

## Typing-budget vs scene duration - a silent killer

A scene that's 2 seconds long can't fit a 75-character icebreaker typing at perChar=1.4 (= 105 frames = 3.5 seconds). The TypedChars component will truncate at scene end, and the result either:

- Cuts off the message mid-sentence (the user reads "Saw your half-marath...").
- Plays without the AI-thinking pauses you carefully designed in.
- Forces you to drop perChar so low the typing flickers visibly.

Run `scripts/check-typing-budget.py` against every TypedText/TypedChars in the project before building. The script takes a `typing.json` listing each block + its scene budget and verifies `start_frame + len*per_char + pauses ≤ scene_duration` for each.

Common fixes when over budget:

- **Reduce per_char** (faster typing, less time per character). Floor: 0.5 frames/char.
- **Drop AI-thinking pauses** if any. Cheapest fix; loses some personality.
- **Extend the scene** by moving its end to a later backbeat in `SCENE_ENDS`. Highest impact; affects total duration.
- **Truncate or rewrite the copy.** Last resort, requires user OK.

## Give the track's hits jobs before building

After `beats.json`, list the strongest hits and swells with their beat numbers (`music-sourcing.md` has the measurement and the pattern) and write in the brief what each one carries: the lift carries the main reveal, the hit before it is the cut into the scene that leads there, two hits a beat apart carry a two-step move, the swell carries the number that counts up. A scene then reads its moment with `beatInScene(n, SCENES.<name>)`, the brief says why each event is where it is, and a cut on `beatFrame(n)` rather than a backbeat is a decision with a comment (a lift on a downbeat is the usual reason). In one run cut this way, every planned cut showed up in the frame-difference check and nothing unplanned did inside scenes. The price: an event tied to a hit stays on that hit when its scene moves, so a scene moved earlier can lose it past its end (`gotchas.md` 34). After any change to the scene table, list every `beatInScene(` and decide for each whether it follows the music or the scene.

## An `as tracked` grid is still a grid

`grid_reliability: good` with `grid: "as tracked"` and the warning that beat gaps vary by a frame is normal for real tracks. Cut on the measured frames and ignore `frames_per_beat` for arithmetic, as this page says; the only visible effect is that events on consecutive beats are not perfectly even, which nobody noticed.
