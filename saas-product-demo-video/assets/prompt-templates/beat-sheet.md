# Beat sheet template

Save alongside the spec doc as a scene-by-scene timing ledger. Every critical frame in the film lives here. One source of truth - scenes, cursor keypoints, and Master Sequences all reference this file mentally.

---

# `<name>` - beat sheet

**BPM:** N | **FPS:** 30 | **Frames per beat:** 15 | **First kick frame:** 15 | **First snare frame:** 30
**Total frames:** N (Ns)

## Scene boundaries (all on snare)

| Scene | Start (master) | End (master) | Duration (frames / seconds) | Snare check |
|---|---|---|---|---|
| Scene 01 | 0 | 120 | 120 / 4.0s | ✓ |
| Scene 02 | 120 | 180 | 60 / 2.0s | ✓ |
| Scene 05 | 180 | 330 | 150 / 5.0s | ✓ |
| Scene 06 | 330 | 450 | 120 / 4.0s | ✓ |
| Scene 08 | 450 | 630 | 180 / 6.0s | ✓ |
| Scene 09 | 630 | 840 | 210 / 7.0s | ✓ |

Sum-check: 120 + 60 + 150 + 120 + 180 + 210 = 840 ✓

## Click frames (all on snare)

| Scene | Local frame | Master frame | On snare? | Target |
|---|---|---|---|---|
| Scene 05 | 120 | 300 | ✓ | "View Details" button on email alert |
| Scene 06 | 90 | 420 | ✓ | Reviewer unlock button |
| Scene 08 | 120 | 570 | ✓ | Generate pitch button |
| Scene 09 | 150 | 780 | ✓ | Finale CTA |

## Key animation frames per scene

### Scene 01 (master 0-120)

- Frame 0: solid saturated bg fades in
- Frame 15 (kick): first word of hook enters via MaskReveal
- Frame 30 (snare): second word enters
- Frame 45 (kick): third word
- Frame 60 (snare): pulse on first word
- Frame 90 (snare): begin push-through transition out
- Frame 120 (snare): scene ends

### Scene 02 (master 120-180)

- Frame 120 (snare): "actually" phrase enters center
- Frame 150 (snare): phrase holds, floating pills ambient
- Frame 180 (snare): scene ends - shared-element shrink to Scene 5

[repeat for each scene]

## Audio

- Soundtrack: `public/soundtrack.mp3`
- Volume: 0.6 throughout
- Fade-out: frames 822 → 840, volume 0.6 → 0 (18 frames, 0.6s)

## Pills / card activation staggers

Scene 05 email alert (master 180-330):
- Pill 1 activates master 255 (kick)
- Pill 2 activates master 270 (snare)
- Pill 3 activates master 285 (kick)
- Click "View Details" master 300 (snare) - one beat after last pill

## Phrase-lift moments

- Scene 5 opening: "Why you're..." lifts from center at master 210 (snare) to rest at top by master 240
- Scene 9 opening: finale phrase lifts at master 660 (snare)

## Iris wipe

- Scene 08 → Scene 09 transition: iris expands from bottom-right at master 615, reaches full coverage at master 630 (scene boundary)

## Validation

Run `scripts/detect-beats.py public/soundtrack.mp3 --fps 30 --out beats.json` to regenerate the snare/kick arrays. Then programmatically verify:

- Every entry in the "Scene boundaries" table's "End (master)" column exists in `beats.json.snare_frames`.
- Every entry in the "Click frames" table's "Master frame" column exists in `beats.json.snare_frames`.

If any check fails, shift the offending frame ±15 and re-verify downstream.
