# Gotchas

## Contents

Each entry is a symptom, its cause and the fix; read the one you hit, in full. Entries 1 to 19 are Remotion and browser behavior, 20 onward were learned on productions.

- [1. Composition ID underscores](#1-composition-id-underscores)
- [2. The 21-font-request network warning](#2-the-21-font-request-network-warning)
- [3. Google Fonts doesn't ship Roboto Slab italic](#3-google-fonts-doesnt-ship-roboto-slab-italic)
- [4. MaskReveal + child scale = visible seams](#4-maskreveal-child-scale-visible-seams)
- [5. Trimming the audio shifts the beat grid](#5-trimming-the-audio-shifts-the-beat-grid)
- [6. Studio is silent until you click, and loud after](#6-studio-is-silent-until-you-click-and-loud-after)
- [7. Two renders = deadlock](#7-two-renders-deadlock)
- [8. `.card` CSS collision](#8-card-css-collision)
- [9. Subagent context exhaustion](#9-subagent-context-exhaustion)
- [10. `npx create-video` blocks in existing git repo](#10-npx-create-video-blocks-in-existing-git-repo)
- [11. Bonus - `transform-origin` + CSS scale expansion](#11-bonus---transform-origin-css-scale-expansion)
- [12. `Math.random` / `Date.now` in render → flicker](#12-mathrandom-datenow-in-render-flicker)
- [13. CSS `animation:`/`transition:` are frozen in render](#13-css-animationtransition-are-frozen-in-render)
- [14. SVG clips to its viewBox](#14-svg-clips-to-its-viewbox)
- [15. Absolute + inset child in a transform-only wrapper renders to nothing](#15-absolute-inset-child-in-a-transform-only-wrapper-renders-to-nothing)
- [16. No reliable DOM measurement during render](#16-no-reliable-dom-measurement-during-render)
- [17. Remote images/audio are unreliable in render](#17-remote-imagesaudio-are-unreliable-in-render)
- [18. Native `<img>`/`<audio>` render blank; use Remotion's components](#18-native-imgaudio-render-blank-use-remotions-components)
- [19. `interpolate` extrapolates unless you clamp](#19-interpolate-extrapolates-unless-you-clamp)
- [20. The cut lands on an empty card](#20-the-cut-lands-on-an-empty-card)
- [21. A whip that travels too far shows nothing on the beat](#21-a-whip-that-travels-too-far-shows-nothing-on-the-beat)
- [22. Switching transform-origin mid-scene jumps the picture](#22-switching-transform-origin-mid-scene-jumps-the-picture)
- [23. A push carries the card's edge off the frame](#23-a-push-carries-the-cards-edge-off-the-frame)
- [24. `&mdash;` passes the em-dash grep](#24-mdash-passes-the-em-dash-grep)
- [25. zsh errors on an unmatched glob](#25-zsh-errors-on-an-unmatched-glob)
- [26. ffmpeg's select expression has a length limit](#26-ffmpegs-select-expression-has-a-length-limit)
- [27. Agents inline the strings they are not allowed to add](#27-agents-inline-the-strings-they-are-not-allowed-to-add)
- [28. A computed keyframe range collapses and the render throws](#28-a-computed-keyframe-range-collapses-and-the-render-throws)
- [29. ffmpeg may be built without drawtext](#29-ffmpeg-may-be-built-without-drawtext)
- [30. A default changed in a shared primitive changes every scene](#30-a-default-changed-in-a-shared-primitive-changes-every-scene)
- [31. A fade on a large white object reads as a gray ghost](#31-a-fade-on-a-large-white-object-reads-as-a-gray-ghost)
- [32. A far transform-origin drags edge copy off the frame](#32-a-far-transform-origin-drags-edge-copy-off-the-frame)
- [33. A reviewer that runs while you edit judges stale files](#33-a-reviewer-that-runs-while-you-edit-judges-stale-files)
- [34. A track-beat reference breaks when its scene moves](#34-a-track-beat-reference-breaks-when-its-scene-moves)
- [35. A cut scene still breaks the typecheck](#35-a-cut-scene-still-breaks-the-typecheck)
- [36. JSON tuples import as number[]](#36-json-tuples-import-as-number)
- [37. A pull-back from an off-center cell shows a strip of the next row](#37-a-pull-back-from-an-off-center-cell-shows-a-strip-of-the-next-row)
- [38. A counter that starts after the cut reads "0 days" on it](#38-a-counter-that-starts-after-the-cut-reads-0-days-on-it)
- [39. `slowInLand` on a big push is a jump](#39-slowinland-on-a-big-push-is-a-jump)
- [40. Copy inside a diving camera dives with it](#40-copy-inside-a-diving-camera-dives-with-it)
- [41. A label written for a wide cell clips in a narrow one](#41-a-label-written-for-a-wide-cell-clips-in-a-narrow-one)
- [42. No git, no undo](#42-no-git-no-undo)
- [43. A push that starts mid-scene carries the headline off the frame before its dissolve](#43-a-push-that-starts-mid-scene-carries-the-headline-off-the-frame-before-its-dissolve)
- [44. One composed element on the cut can still be an empty frame](#44-one-composed-element-on-the-cut-can-still-be-an-empty-frame)
- [45. A sound with no lead-in, started early, lands early](#45-a-sound-with-no-lead-in-started-early-lands-early)
- [46. One volume for every sound puts the library's clicks under the music](#46-one-volume-for-every-sound-puts-the-librarys-clicks-under-the-music)
- [47. A match-cut placed by eye misses by the push's whole scale](#47-a-match-cut-placed-by-eye-misses-by-the-pushs-whole-scale)
- [48. A camera that turns about a different point needs a different translate for the same picture](#48-a-camera-that-turns-about-a-different-point-needs-a-different-translate-for-the-same-picture)
- [49. A changing number passed as `volume` works; check it in the file](#49-a-changing-number-passed-as-volume-works-check-it-in-the-file)
- [50. A translucent shape over a dot field shows the dots as false detail](#50-a-translucent-shape-over-a-dot-field-shows-the-dots-as-false-detail)
- [51. Idle motion on held elements reads as a template](#51-idle-motion-on-held-elements-reads-as-a-template)
- [52. A pixel diff of two stills proves nothing until it is thresholded and looked at](#52-a-pixel-diff-of-two-stills-proves-nothing-until-it-is-thresholded-and-looked-at)
- [53. A ghost across a cut has to be the incoming scene's own cut frame](#53-a-ghost-across-a-cut-has-to-be-the-incoming-scenes-own-cut-frame)
- [54. Fading a whole layer dims the one element meant to stay saturated](#54-fading-a-whole-layer-dims-the-one-element-meant-to-stay-saturated)
- [55. Removing a column of copy leaves the layout it was balancing](#55-removing-a-column-of-copy-leaves-the-layout-it-was-balancing)
- [56. A record that is the same object across scenes needs one set of dates](#56-a-record-that-is-the-same-object-across-scenes-needs-one-set-of-dates)
- [57. A second render of the same film can carry different audio](#57-a-second-render-of-the-same-film-can-carry-different-audio)
- [58. zsh does not split a variable of flags](#58-zsh-does-not-split-a-variable-of-flags)
- [59. A logo strip in a screenshot is one set of a rotating pool](#59-a-logo-strip-in-a-screenshot-is-one-set-of-a-rotating-pool)
- [60. A layer with perspective() does not sharpen under a camera push](#60-a-layer-with-perspective-does-not-sharpen-under-a-camera-push)
- [61. An untagged render shows a different red in every player](#61-an-untagged-render-shows-a-different-red-in-every-player)
- [62. A timing dump older than its sources marks the wrong frames as cuts](#62-a-timing-dump-older-than-its-sources-marks-the-wrong-frames-as-cuts)
- [63. Linear scale on a big push front-loads the zoom](#63-linear-scale-on-a-big-push-front-loads-the-zoom)
- [64. A candidate rendered with the renderer's defaults is not the master](#64-a-candidate-rendered-with-the-renderers-defaults-is-not-the-master)
- [65. A frame pulled from the MP4 by index can sit a few frames from the composition's frame](#65-a-frame-pulled-from-the-mp4-by-index-can-sit-a-few-frames-from-the-compositions-frame)
- [66. Frames before a changed keyframe differ, and that is not a picture change](#66-frames-before-a-changed-keyframe-differ-and-that-is-not-a-picture-change)
- [67. Harshness in the mix was in the source track](#67-harshness-in-the-mix-was-in-the-source-track)
- [68. `--width`/`--height` collapse the layout; `--scale=2` is the only 4K](#68---width--height-collapse-the-layout---scale2-is-the-only-4k)
- [69. A probe's reading from frame 0 looks plausible and alarming](#69-a-probes-reading-from-frame-0-looks-plausible-and-alarming)
- [70. A weight you did not load draws a neighbor weight silently](#70-a-weight-you-did-not-load-draws-a-neighbor-weight-silently)
- [71. An emoji or an inline image on a `line-height: normal` line resizes the line](#71-an-emoji-or-an-inline-image-on-a-line-height-normal-line-resizes-the-line)
- [72. A font swap breaks any line with under 3% slack, and can un-wrap one](#72-a-font-swap-breaks-any-line-with-under-3-slack-and-can-un-wrap-one)
- [73. A removed 1 px border is a layout change](#73-a-removed-1-px-border-is-a-layout-change)
- [74. One token, two meanings](#74-one-token-two-meanings)
- [75. A shared component's prop change breaks the other aspect ratio](#75-a-shared-components-prop-change-breaks-the-other-aspect-ratio)
- [76. A crashed render leaves orphans, and the next render hangs](#76-a-crashed-render-leaves-orphans-and-the-next-render-hangs)
- [77. Stale sheets in a reused `out/` pass as new](#77-stale-sheets-in-a-reused-out-pass-as-new)
- [78. `filter: blur()` on a large layer is slow and smears](#78-filter-blur-on-a-large-layer-is-slow-and-smears)
- [79. A raster drawn larger than its source goes soft at `--scale=2`](#79-a-raster-drawn-larger-than-its-source-goes-soft-at---scale2)
- [80. The checkout may be on a feature branch](#80-the-checkout-may-be-on-a-feature-branch)

The specific things that will eat 2+ hours each if you don't know about them.

## 1. Composition ID underscores

Composition IDs can only contain `a-z`, `A-Z`, `0-9`, `CJK`, and `-`. An underscore makes the composition throw "Composition id can only contain..." when it registers, and because every composition registers on every run, one bad ID stops every render in the project, including scenes that have nothing to do with it.

**Fix:** use hyphens everywhere. `Scene-05`, not `Scene_05`.

## 2. The 21-font-request network warning

By default, `@remotion/google-fonts` fetches all subsets for a font family - Latin, Latin Extended, Cyrillic, Greek, Vietnamese, etc. For three font families that's 21+ network requests, and Remotion warns at render start because `delayRender` fires on each.

**Fix:** always pass `subsets: ["latin"]`:

```tsx
loadDisplay("normal", { weights: ["600", "700", "800"], subsets: ["latin"] });
```

If you need accented characters beyond basic Latin, add `"latin-ext"` - still only two requests per family.

## 3. Google Fonts doesn't ship Roboto Slab italic

Some Google Fonts are missing italic variants. Roboto Slab is the most common one to trip on. Loading `loadSlab("italic", ...)` silently fails; the weight is served but the italic style isn't applied.

**Fix:** load `"normal"` weights only, apply `font-style: italic` at use sites:

```tsx
<span style={{ fontFamily: fonts.editorial, fontStyle: "italic" }}>
  bring us the pain
</span>
```

## 4. MaskReveal + child scale = visible seams

If a child of MaskReveal has `transform: scale(...)`, the scale transforms the clip-path's coordinate space. Visible result: seams along the clip-path edge, often flickering between frames.

**Fix:** either scale the MaskReveal wrapper, or lift the scale into a parent of MaskReveal. Don't scale children of MaskReveal.

## 5. Trimming the audio shifts the beat grid

If you trim the start of the soundtrack to skip a musical lead-in, and later remove or change the trim, the music moves by that many frames and the beat grid no longer matches it. A past production shifted by +9 frames when a trim was removed, requiring Scene 1's duration to be extended by 9 frames to re-lock the grid.

**Fix:** set the trim in one place, `AUDIO_TRIM` in `src/timing.ts`. `Master.tsx` passes it to `<Audio trimBefore>` and `timing.ts` shifts every beat by the same amount, so the two cannot disagree (see `beat-sync.md`).

Related: the trim props changed names. `startFrom` became `trimBefore` and `endAt` became `trimAfter` in Remotion 4.0.319, and since 4.0.530 `trimAfter` is deprecated in favor of `durationInFrames`, which counts source frames starting at `trimBefore`. Write `trimBefore` + `durationInFrames`, because `<Audio>` and `<Video>` from `@remotion/media` do not accept the old names at all, and the older components keep them only as deprecated aliases.

## 6. Studio is silent until you click, and loud after

The browser's autoplay policy keeps Remotion Studio silent until the user clicks the preview; after that click the track plays at full volume. Two traps: "there is no audio" in Studio usually means nobody clicked yet, and the first click in a quiet room is loud.

**Fix:** when the question is whether the film has sound, render the MP4 and `ffprobe` it for an audio stream before touching the code; if the stream is there, the problem was Studio. While working on visuals, render `<Audio>` only when `getRemotionEnvironment().isStudio` is false, or lower `MUSIC_VOLUME` in the timing file for the session.

## 7. Two renders = deadlock

Running `npx remotion render` twice in parallel (e.g. horizontal + vertical) on Apple Silicon at `--concurrency=8` each can hang. Both try to spin 8 worker threads on a 10-core machine, and the OS refuses to service them both.

**Fix:** serialize the renders, or drop each to `--concurrency=4`. See `render-export.md` for details.

## 8. `.card` CSS collision

If any host page's stylesheet has `.card { ... }` rules (a parent app, a brainstorm or review page template that mounts the player) and you create a `<div className="card">` inside a Remotion scene, that stylesheet clobbers yours. Symptom: styles work in Studio (isolated bundle) but break where the player is embedded.

**Fix:** use more specific class names (`film-card`, `reviewer-card-bg`) or CSS Modules.

## 9. Subagent context exhaustion

A subagent driving one build task has a finite context window, and it fills faster than you expect once you include the retro, the animation patterns, the current source files and the iteration notes.

**Fix:** give a subagent only the specific file it is editing plus a short task description. Never dump whole retros into it. If one tops out, split its task.

## 10. `npx create-video` blocks in existing git repo

If you're setting up Remotion inside an existing monorepo / git repo, `npx create-video@latest` prompts:

```
You are already inside a Git repo. Do you want to continue?
  > No
    Yes
```

This is an interactive arrow-key prompt. You can't push arrow keys through a pipe or a subagent's command interface. The process hangs indefinitely.

**Fix:** don't use `npx create-video@latest` in an existing repo. Copy the skill's `assets/scaffold/` instead - see `project-scaffold.md`.

## 11. Bonus - `transform-origin` + CSS scale expansion

This one trips up the vertical port specifically. When a card scales via `transform: scale(1.04)` for ZoomPunch, and the card is in a centered flexbox, the scale expands from the transform-origin (default: center). That means the card grows in both directions.

In a **vertical layout** where space is precious, this can push the card past the bottom edge of the visible area. A horizontal layout has more slack, so you won't notice.

**Fix (vertical)**: either bound the card's maximum scale to ensure it never overflows, or set `transform-origin: top center` so the card grows downward only. Or compute the expanded height and pre-reserve space.

## 12. `Math.random` / `Date.now` in render → flicker

Remotion renders frames independently and re-renders on resume, so `Math.random()`, `Date.now()`, and argless `new Date()` produce different values per frame (visible **flicker**) and break render caching/determinism.

**Fix:** seed a deterministic hash by a stable index instead (see `animation-patterns.md` → "Deterministic variation (never Math.random)").

## 13. CSS `animation:`/`transition:` are frozen in render

CSS keyframe animations and transitions are wall-clock driven, so they look fine in the browser/Studio preview but sit dead at frame 0 in the deterministic renderer.

**Fix:** re-drive any motion from `useCurrentFrame()` (interpolate/spring); audit imported or third-party/brand components before dropping them in - a mascot whose bob/breathe is pure CSS will freeze.

## 14. SVG clips to its viewBox

Art that animates outside the viewBox (a floating note, a glow, a sweeping playhead) is silently cut off with no error.

**Fix:** `style={{ overflow: 'visible' }}` on the `<svg>`, or pad the viewBox.

## 15. Absolute + inset child in a transform-only wrapper renders to nothing

A `position: absolute; inset: 0` child needs a sized, positioned ancestor. Wrapping it in a transform/opacity-only `<div>` collapses that div to a zero-box, so the child vanishes or anchors to the wrong element - with no error (this is why a dashboard mock can render to blank).

**Fix:** give the wrapper `position: absolute; inset: 0` (or an explicit size).

## 16. No reliable DOM measurement during render

`getBoundingClientRect` and similar reads are unstable frame to frame in the headless renderer.

**Fix:** compute geometry from layout constants instead - a grid cell's x is `padLeft + col * (cellW + gap)`, not a measured rect.

The one legitimate measurement is a throwaway probe: a composition that mounts the real scene, reads the DOM at a settled frame in an effect keyed on `useCurrentFrame()`, and `console.log`s lines starting with `PROBE <frame> ...` (card heights, text boxes, a `nowrap` value's clipping, a button's offset). The CLI never shows the render tab's console, so run it through `tools/stills.mjs`, which prints those lines (gotcha 69 says how to read them). Use it to check a layout or to export a position for a match cut; never to drive a frame.

## 17. Remote images/audio are unreliable in render

A URL in `<Img>` or `<Audio>` can stall or fail the headless renderer and is not deterministic.

**Fix:** bundle assets into `public/` and load them with `staticFile()`.

## 18. Native `<img>`/`<audio>` render blank; use Remotion's components

Even for a local `staticFile()` asset, a native `<img>` can capture the frame *before* the browser has loaded and decoded the image, so a logo flashes blank for a frame or two and the result is timing-dependent (not deterministic). Native `<img>`/`<audio>`/`<video>` don't participate in Remotion's `delayRender`, so the renderer doesn't wait for them.

**Fix:** use Remotion's `<Img>`, and `<Audio>` / `<Video>` from `@remotion/media` (they hold the frame until the asset is ready). `<img src={staticFile(...)}>` is the subtle trap - right `src`, wrong element.

## 19. `interpolate` extrapolates unless you clamp

By default `interpolate(frame, [a, b], [x, y])` keeps extrapolating *linearly* outside `[a, b]`. So before `a` and after `b` the value runs past `x`/`y` - an opacity climbs above 1, a slide keeps going off-screen, a scale balloons. The element looks correct during its window and wrong on every frame outside it.

**Fix:** pass `{ extrapolateLeft: "clamp", extrapolateRight: "clamp" }` on every `interpolate` unless you specifically want extrapolation. Symptom to recognize: motion that's fine mid-window but drifts/overshoots before it starts or after it ends.

## 20. The cut lands on an empty card

Rows placed on the first beat after the cut leave the cut frame an empty white rectangle for half a second, in every product scene. Put the first row (or the bar, or the title) before frame 0 and let the rest take the beats. `animation-patterns.md`, "The cut frame is composed".

## 21. A whip that travels too far shows nothing on the beat

A whip-pan enter that starts 60% of the frame away is still off-screen on the cut frame, and one that starts 30% away with 8 px of blur is a smear. The entrance in `Stage.tsx` starts 16% away with 4 px on the cut frame, while the exit it meets ends 30% away with 8 px: the cut hides in the exit's blur and the landing still reads.

## 22. Switching transform-origin mid-scene jumps the picture

Changing `transform-origin` while the camera scale is not 1 shifts the image by the origin's move times (scale minus 1). Interpolate the origin across the hold or switch it at scale 1. And to open tight on an element, translate it to the frame's center at the tight keyframe; the origin alone leaves it in its corner.

## 23. A push carries the card's edge off the frame

A 1.08 push about a card's center moved a card that started at x 930 off a 1920 frame and clipped the cursor on the click. Check the last frame of every scene with a push and keep the card's far edge inside the frame with a margin at the push's end (40 px held in that run).

## 24. `&mdash;` passes the em-dash grep

An HTML entity renders the glyph the grep for U+2014 cannot see. Use it only where the product itself shows a dash (an empty table cell), and say so in the brief.

## 25. zsh errors on an unmatched glob

`rm -f out/check/cs_*.png` fails the whole command in zsh when no file matches. Delete through Python's `glob` or `find`, as the scaffold tools do.

## 26. ffmpeg's select expression has a length limit

A chain of a hundred `eq(n\,k)` terms fails to parse. Sample with `select='not(mod(n\,15))'` and pull single frames with one `select=eq(n\,k)` each, as `tools/sheets.py` does.

## 27. Agents inline the strings they are not allowed to add

A scene agent told not to edit the data file inlines the headline it needs. Ask for every inlined string in the reply and move them into the data file afterwards.

## 28. A computed keyframe range collapses and the render throws

Keyframes computed from beats (`[at - 2, at + 8, out - 8, out]`) can collide when two events sit close: `out - 8` lands on `at + 8` and `interpolate` throws "inputRange must be strictly monotonically increasing". Studio shows it only on the frames that hit it; `tools/stills.mjs` prints a stack trace hundreds of lines long with the message near the top (`grep -iE "inputRange|Error"`). Guard computed ranges: `[at - 2, at + 8, Math.max(at + 9, out - 8), Math.max(at + 10, out)]`.

## 29. ffmpeg may be built without drawtext

`-vf drawtext=...` fails with "No such filter" when ffmpeg was built without it (Homebrew's build lacked it in October 2026; check with `ffmpeg -filters | grep drawtext`). Label a side-by-side by its file name (`<scene>-compare-<a>-left-<b>-right.mp4`, as `scripts/side-by-side.sh` suggests) instead of in the picture.

## 30. A default changed in a shared primitive changes every scene

Changing what `Stage` does by default (the push entrance's direction, the camera's easing, the whip's travel) re-times every scene that relies on the default, silently. After any such change, render the full draft and read the cut strips and the jerk report, not only the scene that motivated the change.

## 31. A fade on a large white object reads as a gray ghost

White at half opacity over ink is gray, and whatever is behind shows through. For a big card or sheet leaving the frame, move it (out of the frame, into the floor, behind another object) instead of fading it.

## 32. A far transform-origin drags edge copy off the frame

A camera push scales every position away from its origin. Copy near the frame's left edge with the origin at 62% of the width moves toward the edge by (scale - 1) times its distance from the origin: about 80 px at 1.08 for copy 150 px in, more with a glide or on a nearer plane. Put that copy on a `Depth` plane well under 1, or keep the push about a point near it.

## 33. A reviewer that runs while you edit judges stale files

A QA agent reading stills while the main session edited the scene it was judging flagged problems in code that no longer existed and missed the new ones. Freeze the files under review until the reviewer replies, or tell it which scene is still changing and review that one again afterwards.

## 34. A track-beat reference breaks when its scene moves

`beatInScene(58, SCENES.alerts)` names beat 58 of the track, not a beat of the scene. Cutting a scene earlier in the film moved the alerts 8 beats earlier, and the click on beat 58 fell after the scene's end: no error, the click simply never happened. After any change to the scene table, `grep -n "beatInScene(" src/scenes` and shift each index by the beats its scene moved, or switch it to `sceneBeats(...)[k]` when the event belongs to the scene rather than to a hit in the music. Comments that name a time ("the 27.17 s kick") go stale the same way; rewrite them with the shift.

## 35. A cut scene still breaks the typecheck

Removing a scene from the scene table leaves its file referencing `SCENES.<name>`, and `tsconfig` includes all of `src/`. Move cut scenes out of `src/` (a `retired/` folder at the root, so they can come back) and drop their debug compositions from `Root.tsx`. Keep the names of the scenes that stay, even when their content changes completely: test beds and sketches import scenes by name, and a rename breaks them.

## 36. JSON tuples import as number[]

`cities.json` (`{"Dallas": [494, 452]}`) types as `number[]`, and `as Record<string, [number, number]>` fails with "neither type sufficiently overlaps". Cast through unknown: `as unknown as Record<string, [number, number]>`.

## 37. A pull-back from an off-center cell shows a strip of the next row

A `pull-back` enter starts at `from` around its origin, and the origin stays where it is on the canvas. A calendar cell 232 x 118 px whose center sat at x 1195 needed `from` 11, not the 9.2 that fills the frame from the center, or the cut frame showed the neighbouring cell at its left edge. Either pan the content so the cell starts at the frame's center, or take `from` at least `max(2 * max(ox, W - ox) / cellW, 2 * max(oy, H - oy) / cellH)`.

## 38. A counter that starts after the cut reads "0 days" on it

When a counter starts a few frames into its scene (the camera moves first), the cut frame shows its starting value over the picture. Hide it until it starts (`opacity` from 0 two frames before its start), or use the pre-roll trick in `animation-patterns.md` when the number should be on the cut.

## 39. `slowInLand` on a big push is a jump

`slowInLand` does most of its move in the first frames. On a pull-back that is the point; on a 1 to 2.4 push into a dashboard card it moved the frame about 300 px in two frames, and the abrupt-change check flagged it. Ease pushes beyond about 1.5x with `standard`, and keep `slowInLand` for pull-backs and small landings.

## 40. Copy inside a diving camera dives with it

A camera that dives on a point of a map scales everything inside its Stage, including the copy meant to sit beside the point. Put that copy outside the Stage, in an `AbsoluteFill` after it, so the map moves and the words hold. `Depth` with a small `z` only slows the drift; it does not hold the words still through a 2x dive.

## 41. A label written for a wide cell clips in a narrow one

"Sponsor reported it" at 28 px with `nowrap` ran out of a 232 px calendar cell. When the copy in a small UI element changes, let it wrap to two lines at a smaller size (26 px on a 29 px line held there) and look at the still before anything else.

## 42. No git, no undo

A project the owner manages without commits has no history to roll back a structural wave. Before one, snapshot the source (`cp -R src backups/src-v<N>`) next to the masters already kept in `backups/`, and say where it is in the wave notes.

## 43. A push that starts mid-scene carries the headline off the frame before its dissolve

`Title` dissolves its words on a push exit `dissolveLead` frames before the cut. When the camera's push starts on a backbeat well before the exit (a dashboard pushed 2.4x into one card from frame 70 of 126), the headline on its nearer plane rode off the top edge within eight frames, cropped by the frame at full opacity, forty frames before its dissolve. The abrupt-change check flagged the push's first frames; the headline was the thing to look at. Tie the dissolve to the push, `dissolveAt={PUSH_AT - 12}` (the last word is gone four frames into the push), and keep `dissolveLead` for pushes that are the exit itself.

## 44. One composed element on the cut can still be an empty frame

The rule is one composed element on the cut frame. A cut that lands tight (1.6x) on that element leaves the rest of the frame to whatever surrounds it: on a sponsor graph that was an empty panel for 1.2 s until the first node popped; on an alerts card, a one-row card arriving from 0.9 was a white sliver on black. Fill the tight frame: whatever sits inside it at the cut's scale is there on the cut too (two nodes with their leaf dots pre-rolled at frame -24; two rows instead of one), and the beats after the cut add the rest.

## 45. A sound with no lead-in, started early, lands early

A synthesized hit peaks on its first sample (the ffmpeg thump recipe in `sound-effects.md`: a 52 Hz sine under a decaying exponential). Started "two frames before the cut, to be safe", it landed two frames early. The library's mouse-click peaks 0.22 s in and needs exactly that lead. Measure every file (the loudest 10 ms window) and let `Sfx` place it; never type a frame offset by feel. The same wave had a tick on each of five rows landing on five consecutive beats, which is a sound on every beat: one tick says rows are landing.

## 46. One volume for every sound puts the library's clicks under the music

The library's files are quiet and synthesized hits are not: mouse-click.wav has an RMS of -31.6 dBFS, a ffmpeg thump -14.4. At the same `volume` 0.4 the two clicks measured 15 and 19 dB under the music at their moments while the thump sat 5 dB over it. `check-sfx.py` prints the level of each effect against the music; set each volume from that line. On that film the owner heard the clicks once they measured -6.6 and -11.1 dB (volume 1.0) and not at -15 and -19 (volume 0.4): a library click on a busy track wants 1.0, and anything under about -12 dB goes unheard.

## 47. A match-cut placed by eye misses by the push's whole scale

The outgoing scene's last frame carries its zoom, its camera and its exit push multiplied together (1.45 x 1.02 x 1.7 = 2.51 on one calendar), so the element sits far from where its layout says and is two and a half times its size. Export its screen position and size from the outgoing scene, computed from those same constants, and derive the incoming pull-back's scale and origin from them (`animation-patterns.md`, "A match cut on an object"). On that film the derived numbers put the two "Mechanic's lien" on the same pixels in a 50/50 overlay of the cut pair, first time.

## 48. A camera that turns about a different point needs a different translate for the same picture

To make a push end by zooming into a legend dot instead of the ring it was framed on, move the camera's origin to the dot and keep the image: a frame is `screen = s p + O (1 - s) + t`, so the same picture about the new origin needs `t' = t + (O_old - O_new)(1 - s)` at each key. Changing only the origin moves the whole frame by `(O_old - O_new)(1 - s)`, about 420 px at 2.4x on one dashboard.

## 49. A changing number passed as `volume` works; check it in the file

The master's music volume, computed per frame from the frame and passed as a plain number (a fade-out, then a duck under a hit), rendered per frame with `@remotion/media`'s `Audio`. Do not trust it from the code: render with and without the change and subtract (one film's duck read 0.6 to 1.4 dB down over its 15 frames and zero elsewhere), or use the documented `volume={(f) => ...}` callback.

## 50. A translucent shape over a dot field shows the dots as false detail

Neighbor buildings drawn at 60% opacity over a dot map let the map's dots show through inside their outlines, where they read as a second, misaligned set of windows. Dim a shape over a textured field by its strokes and contents, not by the group's opacity: keep its fill solid in the canvas color and lower `strokeOpacity` and the windows' fill instead.

## 51. Idle motion on held elements reads as a template

Logo tiles that overshot on landing (0.7 to 1.06 to 1) and then bobbed 3 px out of phase for the rest of the scene were the owner's pick of what to remove when asked for "more premium". Let held elements land (rise and grow from about 0.85, no overshoot) and hold; the camera's drift is enough life. `BreathingPulse` is for a single hero element, not for a row of tiles.

## 52. A pixel diff of two stills proves nothing until it is thresholded and looked at

Diffing a scene with a new layer against the same frame without it, to show the change is local, returned a bounding box of the whole frame: antialiasing on a dot map differs by a few levels across the canvas. Diffing two frames of a hold to show some tiles had stopped moving failed the other way: the camera's drift moves every pixel. Threshold the difference (above about 12 levels), save it as a picture and look at it; and to prove something holds still, compare it against the camera, not against an earlier frame.

## 53. A ghost across a cut has to be the incoming scene's own cut frame

To keep a full-frame color from reading as a blank, the next scene can show through it faintly. The first try ghosted the next scene's settled picture; the scene then pulled back from 3.5x underneath it, and for eight frames a small ghost calendar sat inside one huge real cell. Ghost the incoming scene frozen at its own frame 0 (`<Freeze frame={0}>`), so the outgoing scene's last frame and the incoming first frame are the same picture, and let the incoming scene carry it from there (its ground starts as the color and drains). Draw the ghost on a transparent ground: on the scene's own dark ground at 20% it darkens the color evenly and the grid disappears; with the color showing through the gaps, the grid reads. Check with a thresholded diff of the two cut frames (gotcha 52).

## 54. Fading a whole layer dims the one element meant to stay saturated

Bringing a calendar layer from 20% to full over a draining red ground took the red "today" cell inside it through a darker red for six frames: 20% red over half-drained ground is not red. Apply the fade per element and leave the saturated one at full opacity throughout.

## 55. Removing a column of copy leaves the layout it was balancing

A map placed on the right half to sit beside a column of copy stayed on the right when the copy was cut, with an empty left half for three seconds. When copy leaves a composition, move what remains as part of the same camera move (here the pull-back also carries the map to center). Labels added to a lit dot field need a ground: bare white type over bright dots was illegible; the film's own chip style read.

## 56. A record that is the same object across scenes needs one set of dates

Once a match-cut or a carried name makes two scenes show the same record, every date, amount and count about it has to agree, including sample data copied from the product's site. One lien carried three dates across a calendar, an alerts row, a document and a chat answer. Align the sample data to one story, list every value that now differs from the site for the owner, and treat a changed word in site copy as copy (the owner's call), not data.

## 57. A second render of the same film can carry different audio

The 4K pass of one film came out with a one-second stretch of audio that differed from the HD pass (up to about -40 dB, in a scene with no effects), while the HD matched the previous accepted master byte for byte. Compare the decoded audio of every deliverable against the reference (`ffmpeg -map 0:a -f md5 -`, and a PCM subtraction when they differ), and when only the audio drifted, copy the reference audio into the other file with `-map 0:v -map 1:a -c copy` instead of rendering again.

## 58. zsh does not split a variable of flags

`F="--image-format=png --concurrency=8"; npx remotion render ... $F` passed one argument, and Remotion stopped with "Invalid still image format: png --concurrency=8". In a chain of renders joined with `&&` nothing was overwritten, but a log tail printed afterwards came from the previous run and looked like success. Spell the flags out on each command, and check each output's timestamp, not only its log.

## 59. A logo strip in a screenshot is one set of a rotating pool

A screenshot of a home page showed nine client logos in a strip that "scrolls". Read live an hour later, the page showed a different nine, and neither was the list: the row was a fixed grid of nine cross-fading through three sets every 5 s, drawn from 18 logos, with two more in the list hidden by a filter; the only visible heading over the logos was on the mobile layout. Read the component in the page's JS bundle (search it for the image path) for the full list, its order, the hidden entries, the per-logo optical sizes and the timing. Download only the files it names, and date the capture: a client list changes without notice.

## 60. A layer with perspective() does not sharpen under a camera push

Chrome can rasterize a layer whose transform has `perspective()` at the device scale instead of the camera's. A dashboard tilted a few degrees in perspective and pushed from 1 to 2.4x was a 1x bitmap blown up through the push: its card text went soft, then snapped sharp on the one frame where the tilt reached zero and the layer went away. The same panel was sharp through its pull-back from 1.7x, so do not assume either way; measure. Lay the tilted element out `k` times larger, with `k` the camera's scale on that frame, and end its transform with `scale(1 / k)`: same picture, a bitmap at the camera's resolution. Check any 3D-transformed element at the push's tightest frame against the same frame rendered flat (an edge filter's mean, or a 1:1 crop). Cap `k` (one film used `RAS_MAX = 2.4`) and straighten the tilt over the push's first frames rather than its last: a 4.6x push with no cap asked the 4K render for a 15,000 px layer.

## 61. An untagged render shows a different red in every player

Remotion 4.0's default encode uses the BT.601 matrix and writes no color tags, so each player guesses. On one film's Signal Red (196, 85, 74): ffmpeg decoded 196, 83, 74; Chromium, assuming BT.709 for untagged HD, 206, 94, 72; AVFoundation (QuickTime, Safari) 211, 105, 82, lighter and warmer; the blue-gradient panel came up about 10 levels too, while ink and dark grays stayed put. `--color-space=bt709` fixes Chromium; QuickTime stays lifted (203, 97, 84) until the transfer is tagged sRGB as well, which is a lossless remux: `ffmpeg -i in.mp4 -map 0 -c copy -bsf:v h264_metadata=transfer_characteristics=13 -color_trc iec61966-2-1 -movflags +write_colr out.mp4`. Then both show 196, 86, 74. Measure the decoded color in the player the owner watches in (AVFoundation through `AVAssetImageGenerator`, a browser through a canvas), not only through ffmpeg. A side by side made from a tagged and an untagged file converts one of them, so it cannot show this change.

## 62. A timing dump older than its sources marks the wrong frames as cuts

`out/timing-dump.json` feeds `stills.mjs cuts`, `sheets.py` and `jerk.py`. On one film the dump tool sliced `SCENE_ENDS` out of `timing.ts` with a regex and broke silently the day the file gained a ternary; the dump stayed at an old version for eight waves, so the cut strips and the per-scene jerk tables judged frames that were no longer cuts. The scaffold's `dump-timing.mjs` now evaluates `timing.ts` for real (through the project's TypeScript) and the three consumers refuse a dump older than `src/timing.ts` or `beats.json` unless told `--stale-ok`. Keep that habit for any derived file: write the source's mtime into it, and have the reader compare.

## 63. Linear scale on a big push front-loads the zoom

Zoom is perceived logarithmically. A camera key from 1x to 4.6x with scale interpolated linearly did most of its visible zoom in the first eight frames (1.5x to 4x) and then crawled. For a push past about 2x, generate one key per frame with the scale interpolated in log space about the move's fixed point, and ease the whole move with `easings.even` (a sine in-out whose peak speed is 1.6x the average; `standard`'s is 2.7x). `animation-patterns.md`, "A big push".

## 64. A candidate rendered with the renderer's defaults is not the master

A candidate rendered without the master's flags came out at 31 MB against the master's 48 MB and softer on type: Remotion's default CRF is 18, the master's 14 with PNG intermediates. Read the project README's render line before any candidate render, spell every flag out (gotcha 58), and put the line in every handoff. A comparison between two renders made with different flags compares the flags.

## 65. A frame pulled from the MP4 by index can sit a few frames from the composition's frame

`select=eq(n,520)` on the master showed a cropped headline; frame 520 rendered from the composition was intact. Either the file's frame index runs a few frames off the composition's, or the file predates a tweak. The MP4 is for whole-film sheets and strips; an exact frame comes from `tools/stills.mjs`, and a still from the file is checked against the composition before it is reported as a defect.

## 66. Frames before a changed keyframe differ, and that is not a picture change

Proving "nothing else changed" by diffing two renders, frames up to the next keyframe before an edited moment differed at 43 to 51 dB PSNR. That is x264's lookahead re-deciding the stream, not pixels that moved. Compare decoded frames per scene, report the minimum PSNR and the share of pixels off by more than 12 levels, and expect that noise up to the next keyframe; a real change is tens of dB lower and sits where the edit is.

## 67. Harshness in the mix was in the source track

"Something off with the music at 30 s" was blamed on the edit. The downloaded track itself decodes past full scale from 27 s (peaks at 1.10, clipped samples every second from 30 s); the film plays it continuous at 0.845 gain. Before touching the mix, check the source's band energy and clipping (`ffmpeg -af astats` or a librosa RMS and peak pass) and confirm the file in the project is bit-identical to the download. Then offer a high-shelf cut or a soft limit, not an edit.

## 68. `--width`/`--height` collapse the layout; `--scale=2` is the only 4K

Every element is laid out in absolute pixels for the composition's size. Rendering with `--width=3840 --height=2160` keeps the layout at 1920x1080 inside a canvas four times the area: a small cluster in the corner. `--scale=2` renders the same layout at twice the pixel density and nothing moves (`render-export.md`).

## 69. A probe's reading from frame 0 looks plausible and alarming

`<Freeze frame={n}>` around the scenes did not take inside a probe composition, so its first readings came from frame 0 and reported a value "clipped" by 27 px, which was the locked state's 2 px letter-spacing at the card's 0.98 entrance scale. Render the probe at real frames (`stills.mjs` does), measure in an effect keyed on `useCurrentFrame()`, log the frame with every reading, and check any alarming number against a rendered still of that frame before reporting it.

## 70. A weight you did not load draws a neighbor weight silently

Asked for weight 500 with 600, 700 and 800 loaded, the browser drew 600 and said nothing. Audit the weights each use site asks for against the weights `loadFont` loads (the scaffold's `getInfo().fonts` check lists them), and on a font swap load the same set of weights so the look stays.

## 71. An emoji or an inline image on a `line-height: normal` line resizes the line

A line mixing the display font with an emoji takes its height from the emoji's fallback font, so a font swap moved one approved line by 4 px on one frame; a 17 px inline mark on a 16 px line grew the line and the card. Give every line that mixes fonts, emoji or symbols an explicit `lineHeight` (1.2 or more, with `paddingBottom` for descenders), and keep an inline image's margin box under the line height with negative vertical margins. Confirm with a probe (gotcha 16).

## 72. A font swap breaks any line with under 3% slack, and can un-wrap one

Measure every headline's rendered width in the old font before swapping (one line was 1596 px in a 1600 px box; the new face at 800 measured 1620 and wrapped, at 700 it fit). Estimating from a character-width ratio is a 100 px swing. A swap can also un-wrap a line: the card got shorter, its button rose 23 px, and the old click frame landed under it. Re-measure button centers (by color on the rendered frame, or a probe) before and after and move the click points by the delta; run the click check on the approved render too, so a miss that was already there is labeled as such.

## 73. A removed 1 px border is a layout change

Removing a border shrinks the box by 2 px and moves everything after it, including a click target. Make it `transparent` instead. In a reskin, keep button text size, weight and tracking so no button changes width.

## 74. One token, two meanings

`cream` was both the scene background and the light text on the dark finale; changing its value for one broke the other. Grep every use of a theme token before changing its value, and split a token the moment it has two jobs (`theme.ts` keeps semantic aliases in `ui` for this).

## 75. A shared component's prop change breaks the other aspect ratio

A prop renamed in a shared card produced six typecheck errors in the vertical master, which nobody was looking at. List every caller of a shared component (`grep -rn "<CardName"` across `src/`) before editing it, and typecheck both masters.

## 76. A crashed render leaves orphans, and the next render hangs

After a render dies (Ctrl-C, a crash, a killed terminal), headless Chrome and the render worker can stay alive and hold the port and the cache; the next render waits forever. `pkill -9 -f chrome-headless-shell; pkill -9 -f "remotion render"` before retrying. One render at a time (gotcha 7), and judge a render by its exit, never by the file's size or the progress bar.

## 77. Stale sheets in a reused `out/` pass as new

A scaffold reused in a folder with an old `out/check/` showed last version's contact sheet as this version's. Before reading a sheet or a still, check its timestamp against the render it claims to show, or move the old `out/check/` aside before the run.

## 78. `filter: blur()` on a large layer is slow and smears

A blur over a 900 px layer costs 20 to 40 ms per frame and reads as a smear mid-frame. Blur text or small elements only, for 0.4 s at most; a whip's blur belongs on the Stage (`Stage.tsx`), which keeps it short and only while moving.

## 79. A raster drawn larger than its source goes soft at `--scale=2`

A 64 px platform logo drawn at 80 px looked fine at 1080p and soft in 4K; portraits at 2.2x likewise. Check every raster at its drawn size at the largest delivery scale, and keep logos at or below 1x of their native size (`asset-intake.md`). Vector where the source allows it.

## 80. The checkout may be on a feature branch

The product's repository was on a branch when the site's look was read from it, so the film copied a design that was not live. After `git fetch`, read the live look's source of truth with `git show origin/main:<path>` and record the commit and the fetch time in the brief ("live homepage, fetched 00:08, deploy from 23:43"); the owner will ask whether today's site was checked.

## The meta-gotcha: Studio ≠ final render

Studio runs with different audio defaults, different image intermediates, and a different bundling path than the CLI render. Things that look fine in Studio can break at render time:

- Fonts that load late (Studio is tolerant; render aborts on font `delayRender` warnings past a threshold).
- Audio files with weird codecs (Studio plays them; render fails to transcode).

**Rule**: final sign-off requires watching the rendered MP4, not Studio playback.
