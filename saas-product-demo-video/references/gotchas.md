# Gotchas

The specific things that will eat 2+ hours each if you don't know about them.

## 1. Composition ID underscores

Composition IDs can only contain `a-z`, `A-Z`, `0-9`, `CJK`, and `-`. Underscores are rejected **at render time**, not at registration time. So Studio loads fine, and you don't discover the issue until you try `npx remotion render v2_Scene05 ...` and get an obscure error.

**Fix:** use hyphens everywhere. `v2-Scene05`, not `v2_Scene05`.

## 2. The 21-font-request network warning

By default, `@remotion/google-fonts` fetches all subsets for a font family - Latin, Latin Extended, Cyrillic, Greek, Vietnamese, etc. For three font families that's 21+ network requests, and Remotion warns at render start because `delayRender` fires on each.

**Fix:** always pass `subsets: ["latin"]`:

```tsx
loadJakarta("normal", { weights: ["600", "700", "800"], subsets: ["latin"] });
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

## 5. The `startFrom` anchor shift

If you start a project using `<Audio startFrom={N}>` to skip a musical lead-in, and later remove it or change N, the beat grid shifts by that many frames. A past production shifted by +9 frames when `startFrom` was removed, requiring Scene 1's duration to be extended by 9 frames to re-lock the grid.

**Fix:** either commit to `startFrom=0` from the start (and pre-process the audio file to start at the drop), or treat `startFrom` as part of the beat math. If you change it, re-run `scripts/detect-beats.py` and update `V2.scene1Start` offsets.

## 6. Studio audio autoplay gotcha

Remotion Studio autoplays audio at loud volume on first load. If you open Studio in a quiet office, it's jarring - and if you're in a meeting, embarrassing.

**Fix:** add a `defaultProps` with a muted flag, or wrap `<Audio>` in a dev-only conditional. Or just know the first click of the play button will be loud.

## 7. Two renders = deadlock

Running `npx remotion render` twice in parallel (e.g. horizontal + vertical) on Apple Silicon at `--concurrency=8` each can hang. Both try to spin 8 worker threads on a 10-core machine, and the OS refuses to service them both.

**Fix:** serialize the renders, or drop each to `--concurrency=4`. See `render-export.md` for details.

## 8. `.card` CSS collision

If the parent project has a global stylesheet with `.card { ... }` rules, and you create a `<div className="card">` inside a Remotion scene, your styles get clobbered by the parent app. Symptom: styles work in Studio (isolated bundle) but break in the final render (shared bundle).

**Fix:** use more specific class names (`v2-card`, `reviewer-card-bg`) or CSS Modules.

## 9. Haiku context limits during subagent drive

The `subagent-driven-development` skill can spawn Haiku subagents for parallel work. Haiku has a ~200k-token context limit, which sounds generous but fills up fast when you include the full retro + animation patterns + current source files + iteration notes.

**Fix:** for subagent tasks, give them only the specific file they're editing and a short task description. Don't dump the entire retros into each subagent. If a subagent tops out context, split its task.

## 10. Edit tool "string not unique"

The Edit tool errors if `old_string` appears more than once in the file. Very common with repetitive patterns like `startFrame + 30` or `transform: scale(1)`.

**Fix:** pass more surrounding context in `old_string` to disambiguate. Or use `replace_all: true` if you genuinely want every occurrence changed. Preferred: extract the value into a named constant and replace via `replace_all` on the constant name.

## 11. `import { easings }` path

Easings live at `src/anim/easings.ts`. Scenes living in `src/v2/scenes/` import via `../../anim/easings`. Subagents sometimes hallucinate `./easings` or `../anim/easings` - both fail silently (no TypeScript error, runtime throw deep in render).

**Fix:** verify the import path compiles via `npm run typecheck` before every render.

## 12. `npx create-video` blocks in existing git repo

If you're setting up Remotion inside an existing monorepo / git repo, `npx create-video@latest` prompts:

```
You are already inside a Git repo. Do you want to continue?
  > No
    Yes
```

This is an interactive arrow-key prompt. You can't push arrow keys through a pipe or a subagent's command interface. The process hangs indefinitely.

**Fix:** don't use `npx create-video@latest` in an existing repo. Manually write `package.json`, `tsconfig.json`, `remotion.config.ts`, `src/index.ts`, `src/Root.tsx`. Takes 30 seconds - see `project-scaffold.md`.

## 13. Bonus - `transform-origin` + CSS scale expansion

This one trips up the vertical port specifically. When a card scales via `transform: scale(1.04)` for ZoomPunch, and the card is in a centered flexbox, the scale expands from the transform-origin (default: center). That means the card grows in both directions.

In a **vertical layout** where space is precious, this can push the card past the bottom edge of the visible area. A horizontal layout has more slack, so you won't notice.

**Fix (vertical)**: either bound the card's maximum scale to ensure it never overflows, or set `transform-origin: top center` so the card grows downward only. Or compute the expanded height and pre-reserve space.

## 14. `Math.random` / `Date.now` in render → flicker

Remotion renders frames independently and re-renders on resume, so `Math.random()`, `Date.now()`, and argless `new Date()` produce different values per frame (visible **flicker**) and break render caching/determinism.

**Fix:** seed a deterministic hash by a stable index instead (see `animation-patterns.md` → "Deterministic variation (never Math.random)").

## 15. CSS `animation:`/`transition:` are frozen in render

CSS keyframe animations and transitions are wall-clock driven, so they look fine in the browser/Studio preview but sit dead at frame 0 in the deterministic renderer.

**Fix:** re-drive any motion from `useCurrentFrame()` (interpolate/spring); audit imported or third-party/brand components before dropping them in - a mascot whose bob/breathe is pure CSS will freeze.

## 16. SVG clips to its viewBox

Art that animates outside the viewBox (a floating note, a glow, a sweeping playhead) is silently cut off with no error.

**Fix:** `style={{ overflow: 'visible' }}` on the `<svg>`, or pad the viewBox.

## 17. Absolute + inset child in a transform-only wrapper renders to nothing

A `position: absolute; inset: 0` child needs a sized, positioned ancestor. Wrapping it in a transform/opacity-only `<div>` collapses that div to a zero-box, so the child vanishes or anchors to the wrong element - with no error (this is why a dashboard mock can render to blank).

**Fix:** give the wrapper `position: absolute; inset: 0` (or an explicit size).

## 18. No reliable DOM measurement during render

`getBoundingClientRect` and similar reads are unstable frame to frame in the headless renderer.

**Fix:** compute geometry from layout constants instead - a grid cell's x is `padLeft + col * (cellW + gap)`, not a measured rect.

## 19. Remote images/audio are unreliable in render

A URL in `<Img>` or `<Audio>` can stall or fail the headless renderer and is not deterministic.

**Fix:** bundle assets into `public/` and load them with `staticFile()`.

## The meta-gotcha: Studio ≠ final render

Studio runs with different audio defaults, different image intermediates, and a different bundling path than the CLI render. Things that look fine in Studio can break at render time:

- Fonts that load late (Studio is tolerant; render aborts on font `delayRender` warnings past a threshold).
- Composition IDs with underscores (Studio accepts them; render rejects).
- Audio files with weird codecs (Studio plays them; render fails to transcode).

**Rule**: final sign-off requires watching the rendered MP4, not Studio playback.
