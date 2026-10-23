# Building one scene of the <PRODUCT> film

Fill the angle brackets once per project and save this as `docs/video/scene-brief.md`; every scene agent reads it first, then the files it names, then writes only the files its task names. A reviewer looks at its stills before the scene is cut in. (`references/delegation.md` explains the setup around this page.)

## Project

- Root: `<project path>` (Remotion <version>, React 19, TypeScript). `npm run typecheck` must pass.
- `src/timing.ts`: the clock. `SCENES.<name>` is your scene's `{ start, duration }` in master frames. Never type a frame number by hand: take event frames from the beat grid with `sceneBeats(BEATS | BACKBEATS | DOWNBEATS, SCENES.<name>)` (scene-local frames of every beat inside the scene, from `src/scene-frames.ts`) or `beatInScene(n, SCENES.<name>)` (a specific beat of the track, for a named hit or swell). Cuts are on backbeats; internal events (a row landing, a click, a tag popping) go on beats, and most beats stay empty: four to six events in a four-second scene, never one on every beat. When a scene starts on a backbeat, `sceneBeats(BACKBEATS, ...)[0]` is the cut itself.
- `src/theme.ts`: `colors` (the only hex values allowed), `ui` (semantic aliases), `fonts`, `type`.
- `src/components/Stage.tsx`: wrap your scene in `<Stage duration camera enter exit origin background>`. `camera` is a list of `{frame, scale, x, y}` keyframes (the slow move during the hold); `enter`/`exit` are named moves (`whip-left`, `whip-right`, `push`, `pull-back`, `drop`, `cut`) that play over the first/last frames. Your task says which to use.
- `src/components/`: `PopIn`, `SlidePopIn`, `LandIn` (hard landing, only for the one or two moments that must hit), `TypedText`/`TypedChars`, `MaskReveal`, `ZoomPunch`, `Cursor` + `ClickRipple` + `clickPath`, `Counter`.
- Display text (headlines, side headlines, proof lines), if the project uses `Title` (`src/components/Title.tsx`): it goes through `Title`, directly or through the project's headline helpers. Give it `enterAt` (a beat, or the landing of the scene's enter move) and the words rise behind a line mask; leave it out when the headline is the only thing the cut lands on. It leaves with the Stage's exit by itself. Put a headline block in `<Depth z={1.1}>` (exported from `Stage.tsx`) so it sits on a nearer plane. Text inside the product's UI keeps `TypedText`, `TypedChars` and `MaskReveal`. No other entrance for display text.
- Camera keys take `ease` for the segment that ends on them: none is an even drift (holds), `"slowInLand"` the landing of a pull-back, `"rampIn"` on a key at the scene's last frame for a crop that runs into a push exit. A push entrance arrives from 0.9 and settles to 1; a push exit ends at `exit.from`. Give the scene's background color to `Stage`'s `background` prop, not to a child fill.
- `<src/ui/primitives.tsx, if the project has one>`: the project's UI primitives, for example `UIScale` (lay the card out at the product's 1x pixel sizes and scale it for the film), `Card`, `Dot`, `Tag`, `Row`, `Button`, `SideHeadline`. Name the ones that exist.
- `<src/data/records.ts>`: every string that appears on screen. Use these constants; do not retype copy. If a string you need is missing, inline it from `docs/screens.md` and list it in your reply so it can be moved into the data file.
- `<docs/screens.md>`: the product UI measured from the DOM (`product-ui-from-site.md`), if the product's site was captured: type sizes, weights, colors, radii, row heights, paddings. Your card's numbers come from there. Where the product uses colors outside the palette, use the palette's equivalents named in `theme.ts`; where its layout does not fit the frame, rearrange and say what you changed.
- Finished scenes to copy the shape of: `<src/scenes/One.tsx>` (type and a timeline) and `<src/scenes/Two.tsx>` (a card, rows on beats, a headline on a beat).

## Rules

- Palette only. No color outside `src/theme.ts`. No glows, no blurred blobs, no gradient text, no eyebrow labels above headings, no italic word for emphasis, no mono type as decoration.
- Copy verbatim from the data file or `docs/screens.md`. No em dashes, no curly quotes, no ellipsis character anywhere in `src/`.
- Deterministic: no `Math.random`, no `Date.now`, no CSS animations or transitions. Every `interpolate` clamps both ends.
- Layout math, not DOM measurement: compute click targets from the constants that lay the card out, so the cursor tip lands inside its target and off its label.
- Cards float on the canvas with the theme's card shadow. Headlines use the display face in the headline color.
- The first frame of your scene is what the cut lands on: a composed picture (the card already there with its first row, or landing hard), not an empty field and not an empty card. The rows after the first take the beats.
- No state the product does not show. A click gets a punch and a ripple; it does not invent a "Done" label.
- One region of change at a time: within about 0.4 s, nothing moves in a far corner while the scene's main event lands. Put a secondary element where the eye already is, or have it present on the cut.
- A window or a list keeps one size for its scene; only a chat grows, and only because the product's does. Zoom the camera instead of growing chrome.
- Reading time is made inside the scene (words earlier, the next move later), not by adding a beat.
- A sound sits on its beat; the picture may trail it by up to 3 frames and never leads it.
- Do not commit; the main session does, once your files typecheck.

## Self-check before you reply

1. `npm run typecheck`.
2. Render stills of the frames that matter and look at them: frame 0, each event frame, each click frame and the two frames before it, the frame where the longest text is fully on, the last frame. One bundle, many frames: `node tools/stills.mjs <CompositionId> 0 12 30 ... --sheet out/check/<name>.png --cols 4`, then open the sheet PNG with the Read tool.
3. Fix what you see (clipped text, a wrapped line, a cursor beside its button, an element off the frame, an empty card on frame 0), render again, and confirm in the picture.

## Reply format (at most 15 lines)

Files written; the event frames you used and which beats they are; the card's canvas placement and scale; what you rearranged from the product's layout; any string you inlined; anything invented (should be nothing); the sheet path; open doubts.
