# Changelog

## 2.2.0 (2026-11-07)

- **Real motion blur.** `tools/mb/` renders every frame several times inside a 180-degree shutter and averages the samples in linear light, through a `SubClock` composition (`Master-Sub`) that freezes the film between frames. Everything that moves blurs along its own path, held pixels stay byte-exact, and hard cuts stay hard. About 16 minutes for a 60 s HD film, 64 for 4K, where `--segments` and `join.sh` keep the frames off the disk. `Stage` drops its faked blur under it. Commands in `render-export.md`, when to use it in `animation-patterns.md`.
- **When polish plateaus.** A blind art-direction critique on stills before any more motion work (`iteration-playbook.md`), and the failure it usually finds, the clean slide deck: same headline over a slab, no shared world, no tonal arc, the accent overspent (`creative-direction.md`). The answers: tone carries the plot, type becomes composition, one accent per frame.
- **One 3D world under the whole film.** New `references/3d-world.md`: raw three.js in Remotion with one renderer per page re-parented to the mounted scene, `preserveDrawingBuffer`, `--gl=angle`, fat lines, instanced dots and windows, one shadowed key light, every scene a pure function of the frame so real motion blur still works. The camera model: a `Shot` with a lens shift, `project()` and `fit()` so DOM and world agree, aim at the subject and shift the lens. `tools/mb/sample.mjs` and `tools/stills.mjs` take `--gl`.
- **Display type as composition** in `animation-patterns.md`: large masked lines, words rising out of the line's edge on a tilt, the numbers.
- **`scripts/check-contrast.py`:** WCAG contrast for text on color, from two hexes or sampled from a still. A label that passed the eye for several versions measured 1.31:1.
- **4K motion blur from an HD plan** under-samples the fastest moves: faint stepped ghosts in a paused frame (`render-export.md`).
- **Gotchas 91 to 96:** the ANGLE backend on every render path, a WebGL canvas under a CSS scale, a layer showing through a dark world, a tall object that leans near the frame's edge, the HD plan at 4K, measured contrast.
- **Gotchas 81 to 90:** ten new entries on the shutter's pitfalls (the clock clamp, arrays indexed by frame, moves clamped on the last frame, linear light, dither, disk, joining chunks) and on what transfers from web-UI motion sources.

## 2.1.0 (2026-10-23)

The first public v2. Everything below is measured against v1.1.3.

- **Layout and install.** The skill moved from `saas-product-demo-video/` to `skills/saas-product-demo-video/` and follows the open Agent Skills format. Installs through `npx skills add`, as a Claude Code plugin (manifests in `.claude-plugin/`), as a `.skill` upload, or by clone and symlink. If you linked the old path, re-link.
- **A copyable scaffold** replaces the loose code templates: a complete Remotion project (`Master`, `Root`, `timing`, `theme`, `easings`, `scene-frames`, six primitives) that `verify-scaffold.sh` installs, typechecks and renders from a temp directory, and CI runs on every push.
- **Beat detector verdicts.** `detect-beats.py` now says how far to trust its grid (`good`, `check`, `poor`) from three independent signals, so a track that will not hold a grid is caught before a film is built on it. Cuts are placed on the backbeat by beat number.
- **Stage and Title.** `Stage` is a scene's camera plus its entrance and exit (push, whip, pull-back), and `Title` is one text move for the whole film, timed through the Stage. Motion carries through the cut; text moves one way.
- **The render-and-check loop.** Many stills from one bundle (`stills.mjs`), contact sheets and cut strips (`sheets.py`), a jerk report (`jerk.py`), a timing dump, a word count and copy check (`check-copy.mjs`), sound cues measured onto their events (`measure-lead.py`, `check-sfx.py`, `make-sfx.sh`) and a side-by-side for two directions. The agent runs these before the owner sees anything.
- **Iteration discipline** from a 24-wave production: every candidate behind a switch, locked decisions, test beds beside the master (`TestBed`), a scene brief for delegated scene agents, a handoff template for the next session, a checkpoint page for the one owner review, and a taste review separate from the technical self-check.
- **New references:** product UI rebuilt from the site, creative direction, shot design, motion language, a reference atlas, music sourcing, delegation, taste review.
- **New components:** `Stage`, `Title`, `Marker`, `TestBed`, `DebugClickTargets`, `ZoomPunch`.
- **Gotchas:** 80 numbered entries with symptom, cause and fix, plus the meta-gotcha (Studio is not the final render).
- **Writing.** Production stories in the references are anonymised to "one film" and "one owner". Customer-facing copy rules: no em dashes, no template tells.

## 1.1.3 (2026-06-16)

More render gotchas. See the GitHub release notes for 1.0.0 to 1.1.3.
