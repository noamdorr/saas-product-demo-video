# Self-check: look at the render before the user does

The failures that cost a film its review rounds all compile. A cursor that stops beside its button, a headline that wraps onto a second line, a card that hangs off the frame: each one typechecks and renders without a warning, and each one is obvious in a single still. So after building a scene, render the frames that matter, look at them, and fix what you see before showing anyone.

## Which frames

For each scene, pick:

- **Frame 0 of every scene.** For scene 1 it is the poster a player shows before playback, so something readable has to be on it (the hook line is there in full, or at least its first words). For every scene it is the frame the cut lands on, and it has to carry a composed picture: the card with its first row, the bar, the headline, not an empty rectangle that fills over the next beats (`animation-patterns.md`, "The cut frame is composed"). Rows after the first ease in on the beats.
- **The frame of each hard landing.** A film has two or three of these (the main reveal, the logo), and on that frame the element has to be fully there (`LandIn`, see `animation-patterns.md`). Ordinary entrances start on their beat and ease in, so they are meant to be faint on their first frame.
- **Every click frame**, and the frame two before it, to see the cursor arrive.
- **The frame where the longest line of text is fully on screen** (the end of its type-on or reveal).
- **The settle frame**: the first frame where everything in the scene has finished entering.
- **Eight frames into any push that starts mid-scene** (a push into one card well before the exit): a headline on its nearer plane can ride off the top edge at full opacity long before its exit dissolve (`gotchas.md` 43).
- **The cut frame, whole, at the camera's tight scale.** With the camera at 1.6x on one element, look at what else the frame holds: one chip in an empty panel, or a one-row card, is the composed element and still an empty frame (`gotchas.md` 44).
- **The last frame before the cut.** The first frame after it belongs to the next scene and cannot be seen from this scene's debug composition, so check the handoffs once the master renders (see below).

Frames are local to the scene's debug composition. The timing file tells you where each event sits. Skip what a scene does not have: no cursor means no click frames, and at the checkpoint there is no next scene yet, so check the last frame of what is built.

```bash
# from the Remotion project root
<skill>/scripts/render-stills.sh Scene-03 43 45 88 119
# -> out/check/Scene-03-f0043.png ...
```

Then open each PNG and look at it. The script renders nearby frames in one pass, so asking for all of a scene's frames at once is much quicker than one call per frame.

## What to check in each still

- **Cursor on target.** The tip of the cursor is inside the button or link it clicks, not near it. If you cannot tell, mount `DebugClickTargets` (see `click-positioning.md`) and render the frame again with `PROPS='{"debugClicks":true}'`, which draws each target's box. The tip should also sit on an empty part of the target and not on its label.
- **Text fits.** No line wraps that the brief shows as one line, nothing is clipped by its container, no two text blocks overlap.
- **Nothing leaves the frame.** No element is cut by the edge unless the scene intends it. For a vertical cut, nothing important sits where the platform draws its own interface (see `vertical-port.md`).
- **The words are right.** Compare on-screen text with the brief character by character: spelling, punctuation, capitalization. Run the check in `writing-style.md`.
- **The brand loaded.** The display font is the brand font and not a fallback (a fallback usually shows as a different letter shape and width). Colors match the theme. A raster logo is sharp at its displayed size.
- **Consistency with the scene before.** Same margins, same type sizes for the same role, same card style.

Fix, render the same still again, and confirm the fix in the picture. A change you have not seen is not yet a fix.

## An attention pass, on the frames the owner will judge

Once the stills pass, read the film for where the eye is. The eye follows change; two changes in far-apart regions within about 0.4 s split it, and each such moment reads as "busy" without the viewer knowing why. A script that lists, per frame, the regions of the frame that changed (a coarse grid, mean absolute difference per cell against the previous frame, excluding frames inside a camera move) finds them in a minute: on one finished film it found five, and four were fixed by moving the secondary element to where the eye already was or onto the cut (`motion-language.md`, "One region of change at a time").

Before the owner picks between candidates, give them full-size stills of each at the frames that matter, in the film's context, not only the half-size side by side. Two owners changed their pick at full size (`iteration-playbook.md`, "When a scene has to be reinvented").

## The whole film, before sending it

Once the master is rendered, sample it the same way a reference video is sampled:

```bash
<skill>/scripts/sample-reference-frames.sh out/<film>.mp4 self-check
# -> references/frames-self-check/index.md, overview-*.jpg, cut-*.jpg
```

- The change times in `index.md` should include the hard cuts in the timing file. A planned cut the script does not list is usually a soft one (a phrase that holds across the cut, a wipe, an iris), which is fine; look at the frames either side of it to confirm. A sharp change you did not plan is worth a look.
- The overview sheets show the color arc and the rhythm at a glance: two neighboring scenes that look alike, a scene that sits empty for a second, a frame of blank background between scenes.
- The change strips show whether each transition reads as the move named in the brief.
- Frame N pulled from the master MP4 with ffmpeg can sit a few frames from frame N of the composition. The sheets and strips are for the whole-film look; an exact frame comes from `tools/stills.mjs`.
- Once the film's intended moves (a dive, a pull-back) have been judged, pass their frame ranges to the jerk check as `--planned 84-101,240-243` and write the ranges in the README next to the command, so each run's unplanned list holds only what is new.

Delete `references/frames-self-check/` afterwards; it is a check, not a reference.

## What stills cannot tell you

Stills do not show how motion feels, whether the film is smooth or jerky, or whether what happens on screen sits well with the music. A film can pass every check in this file and still feel wrong the moment someone plays it. You cannot judge this, so do not describe a film as smooth or in sync; say what was measured and that nobody has watched it.

Two numbers give an early warning. `sample-reference-frames.sh` reports the abrupt one-frame changes in a video and the most that fall in any three seconds; `tools/jerk.py` reports the same with the planned cuts marked. Run the same tool on your film and on the reference videos or an earlier film the user liked (the two measure differently, so compare like with like). Far more abrupt changes than the reference means a busier, jerkier film. And count the words on each product card, every label and name once: 15 to 30 is the range one well-received film sat in, and twice that drew the note "too much text".

## Faster stills: one bundle, many frames

`tools/stills.mjs` in the scaffold renders through the Node API: one bundle, then every frame you list, anywhere in the composition, and tiles them into a contact sheet (`--sheet out/check/x.png --cols 4`). `render-stills.sh` renders a run of nearby frames in one pass; `stills.mjs` adds spread frames (twelve across a scene in about six seconds), `every:15` to sample a composition, `cuts` for the first and last frame of every scene from `out/timing-dump.json` (`node tools/dump-timing.mjs` writes it and prints the scene table), `--props '{"debugClicks":true}'` for the click-target overlay, and the render tab's console: the CLI never shows it, so a probe's `console.log` is lost there, while `stills.mjs` prints any page log that starts with `PROBE `.

Open the sheet with the image reader, not the single stills: one sheet of twelve frames is one look.

## The whole film: contact sheet, cut strips, jerk report

After a master render, three artifacts show what the stills cannot:

```bash
node tools/dump-timing.mjs                 # the scene table, for the next two
python3 tools/sheets.py out/master.mp4     # contact-<name>.png (every 15 frames) and cuts-<name>.png (5 frames around each cut)
python3 tools/jerk.py out/master.mp4       # abrupt frame-to-frame changes, marked PLANNED (a cut) or UNPLANNED
```

Two things about reading the jerk report that took a film to learn:

- **Count and peak go in opposite directions when an exit gets longer.** Stretching a push exit from 10 to 14 frames lowered its worst frame and raised the number of frames above the threshold, which is why push exits stop at 12 frames. Read both: the script prints the peak unplanned change after the list.
- **Soft cuts are expected once transitions carry momentum** (`animation-patterns.md`, "Scene transitions"): with the blur peaking on the cut, a whip cut often shows no abrupt change at all. A planned cut listed as soft is then the design working, not a missing cut.

For a short test clip, pass `--cuts none` to `jerk.py` and `--dump none` to `sheets.py`, or the film's timing dump marks the wrong frames.

The contact sheet is the rhythm: a run of identical thumbnails is a hold with nothing moving (in one run a hold past about 2.5 s drew the note "static"), two neighboring scenes that look alike are a flat stretch, a dark thumbnail is a blank. The cut strips are the handoffs: the "cut" column must carry a composed picture. The jerk report's UNPLANNED frames right beside a cut are the whip or push (expected); one in the middle of a scene is a pop. A planned cut with no abrupt change is a soft one (a whip with blur on both sides), which is fine when intended.

Hand all three to a QA pass (`delegation.md`) along with the brief; an agent reads sheets well and returns a fix list in minutes.

Two more checks when a film is being refreshed rather than built:

- **Per-frame scores against the approved film**, not pop counts: compute the abrupt-change score per frame for both and flag any frame at about three times the approved film's value at the same point. A pop that scored 0.0038 under a 0.004 floor was missed by the count and found by the ratio. For an entrance window, compare raw motion in the changed region plus a frame strip before calling it a pop.
- **Run the click check on the approved render too**, so a miss can be labeled "was already there" (three clicks in one approved vertical cut missed by 3 px) instead of being charged to this wave.

The probe (gotcha 16) measures what stills cannot: render it at real frames through `tools/stills.mjs`, measure in an effect keyed on `useCurrentFrame()`, and log the frame with every reading; a reading from frame 0 looks plausible and is wrong (gotcha 69).

## A reviewer after the author

The author misses what a fresh reader sees in the first sheet: a window clipped at the bottom, a header crossing a column rule, legend numbers counting up from zero on the cut, a two-tone headline, a map's copy touching the map, a static hold. Run a reviewer pass on each batch of scenes and a QA pass on the full render before the user sees it; both in `delegation.md`.
