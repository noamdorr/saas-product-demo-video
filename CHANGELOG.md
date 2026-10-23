# Changelog

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
