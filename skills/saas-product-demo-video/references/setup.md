# Setup

Run these checks once at the start of a film and note what is missing. Only the first three are needed to build; the rest unlock specific steps, so a missing one changes which path you take and never stops the work.

## Needed to build

**Node 18 or newer.**

```bash
node --version
```

**Remotion.** Nothing to install globally. The scaffold in `assets/scaffold/` pins Remotion and its packages to one exact version, and `npm install` inside the copied project brings them in. The first render also downloads a headless browser, about 90 MB, once per project. See `project-scaffold.md`.

**Python 3 with librosa**, for beat detection.

```bash
python3 -c "import librosa; print(librosa.__version__)"
```

If it is missing, install it into a virtual environment inside the project, which touches nothing else on the machine:

```bash
python3 -m venv .venv
.venv/bin/pip install librosa numpy soundfile
# then run the skill's Python scripts with .venv/bin/python
```

If the user prefers a system-wide install, tell them what you are about to install and why first.

## Unlocks a step

**ffmpeg and ffprobe.** Used to sample frames from reference videos when Gemini is not available, to verify the specs of a finished render, and by the scaffold's `tools/sheets.py` and `tools/jerk.py`. Remotion bundles its own ffmpeg for rendering, so the film still builds without these.

**Pillow** (`pip install pillow`, or into the same virtual environment as librosa), for the contact sheets that `tools/stills.mjs --sheet` and `tools/sheets.py` tile. Without it the stills still render, one PNG each.

**Playwright** (`npm i -D playwright`; it drives the installed Chrome through `channel: "chrome"`), only when the product's UI is captured from its public site (`product-ui-from-site.md`). Say what you are installing before you do.

```bash
command -v ffmpeg ffprobe
```

**A Gemini API key**, for the best reference-video breakdowns: `GEMINI_API_KEY` in the environment or the project's `.env`. Without it, use the frame-sampling path in `reference-video-vibe.md`, which needs ffmpeg (and `yt-dlp` if the reference is a URL rather than a file).

**Remotion's official skills.** Check whether your environment already lists a skill named `remotion-best-practices`. If not, offer the user the install and continue either way:

```bash
npx skills add remotion-dev/skills
```

They cover Remotion's API as it changes between releases. This skill covers how to make the film. In an unattended run there is nobody to offer the install to, so skip it and note that in the brief.

## A second project on the same machine

A film that copies another (a reskin, a sibling product, a test bed) skips `npm install`: `rsync` the project without `node_modules/` and `out/`, then clone the dependencies with `cp -Rc` (an APFS clone, seconds, no disk) or symlink `node_modules` to the sibling when the versions match, and prove the start state with `diff -rq src ../original/src` before the first edit.

## Git

The skill writes `docs/video/`, `references/`, `beats.json` and `src/` in the user's project. Check for uncommitted work in those places before starting, and ask the user to commit or stash it if there is any, because a film produces many small commits and they should not mix with unrelated changes.

```bash
git status --short
```

In a new repository with no commits yet, add a `.gitignore` for `node_modules/` and `out/` (the scaffold brings one for its own folder) and make a first commit of what the user gave you, so every later commit shows only the film's own changes.

Then start intake: `asset-intake.md`.
