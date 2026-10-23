# Sound effects

Short sounds on the film's own events: a low hit on a cut into a color field, a swell under a rewind, a click when the cursor clicks. They make a sound-on viewing feel finished. They are optional, and the film has to work without them, because most feeds start playing muted. Nothing here replaces listening: measure what you can, tell the user what to listen for, and render the film with and without them so the decision is theirs.

## When in the flow

After the full build and before the first fix wave, once the cuts and clicks sit on the grid: a sound placed on a frame that later moves is a sound to place again. Four to eight sounds in a 30 second film is a good first pass. Keep the whole layer behind the master's `sfx` prop (the scaffold has it) and render `Master` and `Master-NoSfx`; the user picks by watching both.

## Where a sound earns its place

| Event | Sound | From |
|---|---|---|
| A cut into a color field, a hard landing (a logo, a number) | a low hit (`thump`) | synthesized, `scripts/make-sfx.sh` |
| A rewind, a count-up, a riser into a reveal | a swell that peaks on the reveal (`swell`) | synthesized |
| The payoff lighting up (a tile, a row turning red) | a chime (`ping`) | synthesized (the library's `ding` has no free license) |
| A transition that moves (push-through, whip-pan, wipe) | `whoosh` or `whip` | Remotion's library |
| A cursor click | `mouseClick` | Remotion's library |
| A control changing state (toggle, tab, switch) | `uiSwitch` | Remotion's library |
| Rows landing one per beat | one `tick`, on the first row after the cut | synthesized |

Leave these out: a tick on every typed character (it tires the ear within two scenes), a sound on every beat (one tick per row on five consecutive beats is a sound on every beat, and it competes with the soundtrack), and anything recognizable as a meme or a system sound from another product. When two sounds would land within a few frames of each other, keep the one tied to the more important event.

## Where the sounds come from

Remotion publishes a small sound library (`remotion.dev/docs/sfx`, also the `@remotion/sfx` package). Each sound is a file on `remotion.media`; the six interface sounds below resolved on 2026-10-22, and each one's page carries its own license line, which you read before shipping a commercial film. The library also holds meme clips that are other people's recognizable audio. Stay with the interface sounds.

| Sound | File | Lead | Length | License on its page (read 2026-10-22) |
|---|---|---|---|---|
| `whip` | whip.wav | 0.03 s | 0.17 s | Creative Commons 0 |
| `whoosh` | whoosh.wav | 0.07 s | 0.15 s | Creative Commons 0 (freesound 831936) |
| `uiSwitch` | switch.wav | 0.13 s | 0.33 s | Creative Commons 0 |
| `pageTurn` | page-turn.wav | 0.16 s | 0.40 s | Creative Commons 0 |
| `mouseClick` | mouse-click.wav | 0.22 s | 0.40 s | Creative Commons 0 (freesound 678248) |
| `ding` | ding.wav | | | "not explicitly released under a free license"; the `Sfx` component leaves it out |

Rendering from a URL needs the network on every render. Download the few sounds you use and serve them from the project:

```bash
mkdir -p public/sfx
curl -sL -o public/sfx/mouse-click.wav https://remotion.media/mouse-click.wav
```

The library has no low hit, no riser and no free chime, and a product film's two or three biggest moments usually want exactly those. `scripts/make-sfx.sh` synthesizes a neutral set with ffmpeg (no third-party audio: a 52 Hz hit, a band-limited swell that peaks on its last frame, a chime, a tick, a click) into `public/sfx`, plus two alternates to audition (`thump-drop`, a pitch drop; `ping-bell`, three partials), and prints each file's measured lead as a cue line. The plain set shipped in one film whose owner chose the version with the effects over the one without; the alternates have not been judged by ear. Say so when you ship them: the sounds were synthesized and you could not listen to them.

## Placing a sound on its event

Every file has a lead: the time from its start to its loudest point. Start the file on the event's frame and the sound lands late; start it "a little early" by feel and it lands early (a hit that peaks on its first sample, started two frames before the cut, hit two frames before the cut). Measure, then let the component place it:

```bash
python3 <skill>/scripts/measure-lead.py public/sfx/*.wav
# file           length    peak     rms    lead  frames   cue
# thump.wav       0.70s    -0.7   -14.4  0.005s    0.1   { src: staticFile("sfx/thump.wav"), lead: 0.005 }
# swell.wav       1.75s    -1.6   -20.2  1.730s   51.9   { src: staticFile("sfx/swell.wav"), lead: 1.73 }
# mouse-click.wav 0.40s    -2.6   -31.6  0.220s   6.6   { src: staticFile("sfx/mouse-click.wav"), lead: 0.22 }
```

The lead is the center of the loudest 10 ms, so a hit that peaks on its first sample reads 0.005; that is 0. A swell's lead is its length. `assets/components/Sfx.tsx` (the scaffold has a copy) takes the frame of the visual event and starts the file early by the lead:

```tsx
<Sfx at={clickFrame} sound="mouseClick" />
<Sfx at={SCENES.hookB.start} src={staticFile("sfx/thump.wav")} lead={0} volume={0.5} />
```

Keep the cues in one table on the master, as the scaffold's `CUES` does, each `at` taken from the timing file or the scene's exported cue (`SCENES.alerts.start + ALERTS_CUES.click`), the same value the visual uses. A sound typed in as a bare frame number drifts from its event the first time a scene moves. In a test render, sounds placed this way peaked within half a frame of their events.

## Mix

The library's files are quiet and the synthesized ones are not: mouse-click's RMS is -31.6 dBFS, the thump's -14.4, so one `volume` for all puts the clicks 17 dB under the hits before the music is even considered. Set each effect's volume from the check below, not from a number you like. The calibration so far, from one film and one owner's ear: the hits over its quiet opening measured +5 and +3 dB against the music at their moments and were clearly heard; the two library clicks at volume 0.4 sat -15 and -19 dB under a full-band track and the owner did not hear them; at volume 1.0 they measured -6.6 and -11.1 dB and the owner heard both. So a library click wants 1.0 on a busy track, and about -11 dB against the music is still audible on a click while -15 dB is not. If the effects are the first thing the user notices, they are too loud; if they ask whether there were any, raise the ones under about -12 dB, and past volume 1.0 raise the file itself (`ffmpeg -af volume=8dB`), which leaves its lead unchanged.

Ducking (dipping the music a few dB under a big hit) is standard in sound design and `<Audio volume>` takes a function of the frame, so it is a few lines on the master. If you add it, keep it to the two or three biggest hits, 2 to 3 dB, in and out over about ten frames, and say it is there. Tried once (one film, wave 8): the music dipped 2.5 dB under a synthesized thump on a cut, down over 2 frames into the hit, held 3, back over 10, multiplied into the volume the master already computes per frame, and only when the effects are on, so the music-only twin stays the plain track. Measured against the previous render with effects, the mix was 0.6 to 1.4 dB quieter over those 15 frames and sample-identical elsewhere; check-sfx still read the thump at +5.6 dB, because it compares against the un-ducked twin (against the ducked music it sits about 2.5 dB higher). It pulls against `beat-sync.md`'s rule that the music stays full on a frame a visual is synced to: that cut sat on a snare, and the thump is low while the snare is not, so the dip takes a little off the snare. Whether that reads as a heavier hit or a weaker beat is the owner's ear: told what to listen for, with the previous render beside it, the owner kept the duck and shipped it. One owner, one hit; tell the next user the same thing to listen for.

## Checking

Sound cannot be checked in a still, but it can be measured. Render the film with and without the effects and subtract one soundtrack from the other:

```bash
python3 <skill>/scripts/check-sfx.py out/film.mp4 out/film-nosfx.mp4 --fps 30 --events 98,182,590,702,914
#   event 98: effect loudest at frame 98.2 (+0.2), +5.3 dB vs the music there
#   event 702: effect loudest at frame 701.6 (-0.4), -14.6 dB vs the music there
# Mean level with effects -17.4 dBFS, without -17.4 dBFS (+0.04 dB).
```

It reports where each effect is loudest, how far that is from the event frame, and how loud the effect is against the music under it over 100 ms. It cannot tell you whether the effects fit the music. Tell the user which events carry a sound and at what level, so they know what to listen for, and write the sounds, their sources and licenses into the brief's assumptions. The vertical cut carries the same cue table: `MasterVertical` takes the same `sfx` prop.

## The sound stays on the beat; the picture may trail it

When a sound and a picture event share a beat, the sound sits on the beat exactly and the picture lands with it or up to 3 frames after, never before: a cell that lit from frame 178 under a ping at 182 read as the sound being late, when the sound was right. Fill the element over `[at - 3, at]` so it is complete on the beat the sound hits. The ear leads the eye by a few frames and forgives the picture, not the sound.

## Before touching the mix

"Something off with the music past 30 s" was the source track: it decodes past full scale from 27 s with clipped samples every second (gotcha 67). Check the track in the project is bit-identical to the download, measure its peaks and band energy over the whole film's length, not the first bar, and only then offer a high-shelf cut or a soft limit. A library's master can be hot; a generated track needs a license line like any other (`music-sourcing.md`).

## Whenever sound changes, render the twin

Every change to a cue, a level or a duck re-renders both the master and `Master-NoSfx`, and the owner gets both: they pick by ear, and the twin is what `check-sfx.py` measures against. A wave that changes only the picture reuses the previous twin.
