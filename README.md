# SaaS Product Demo Video Skill for Remotion

A skill for producing a short SaaS product film (20 to 60 seconds) in [Remotion](https://www.remotion.dev/), and for refining or reskinning one that exists. End-to-end: asset intake, the product's real UI rebuilt from its site, a look borrowed from reference videos you like, beat detection from the soundtrack, scene composition, checked renders, and iteration waves with the owner.

It was built and used in production with Claude Code. v2 follows the open [Agent Skills](https://agentskills.io) format, so other agents that read `SKILL.md` (Codex, Cursor, Gemini CLI and more) can load it too. On 2026-10-03, v2 was run from a clean workspace to the first-scene checkpoint in Claude Code (Sonnet 5.5) and in Codex CLI (GPT-6 Astra). The questionnaire, the references, the Python and bash scripts, the React/Remotion scaffold - all just markdown and code.

## What you get

- A structured asset-intake questionnaire that pulls all the brand specifics upfront (logo, fonts, colors, soundtrack, copy, references) before a single scene gets composed, and a recipe for rebuilding the product's real UI from its site (capture at 2x, measure from the DOM, lay out at 1x, scale for the frame) instead of inventing it
- A reference-video analysis flow that pulls directorial vocabulary from clips you point at (push-through, whip-pan, match-cut zoom), a creative-direction page for the one visual argument a film makes, and the list of template tells ("claudesque", "Canva") that owners reject on sight
- librosa-powered beat detection that tells you how far to trust it, so a track that won't hold a grid gets flagged before you build a film on it
- Scene cuts placed on the backbeat by beat number, plus a one-pass aligner for in-scene events
- A ready Remotion scaffold you copy instead of typing config by hand, with a Stage component for camera moves and whip/push/pull-back transitions and a Title component for one text move. CI typechecks it on every change
- A render-and-check loop: stills from one bundle, contact sheets, cut strips, a jerk report, an attention pass and a word count, run by the agent before you see anything
- Animation primitives (TypedText, MaskReveal, PopIn, ZoomPunch, Cursor, Counter, IceCrack, BRollLayer) and sound effects measured onto their events
- Schematic UI templates for products without a real UI
- Iteration discipline from a 24-wave production: every candidate behind a switch, locked decisions, test beds beside the master, a handoff template for the next session, and 80 gotchas with symptom, cause and fix

## Example output

Here's what the skill produced for [Reechee](https://reechee.io) (30s, 16:9, motion graphics + collage b-roll):

[![Reechee product demo](https://img.youtube.com/vi/84dbi9LvWwM/maxresdefault.jpg)](https://www.youtube.com/watch?v=84dbi9LvWwM)

The skill renders MP4s suitable for LinkedIn, YouTube, or homepage hero embeds. HD by default, optional 4K via `--scale=2`.

## Prefer one HTML file and the Claude Motion editing loop?

There is a sibling skill, [claude-motion-saas-video](https://github.com/noamdorr/claude-motion-saas-video): the same job in the Claude Motion style. No Remotion, no React, no Python. One self-contained `video.html` animated as a pure function of time, a scrubbable preview in any browser, and an MP4 render through headless Chromium plus ffmpeg. It has a zero-question mode (`lucky`, it gathers brand, screens and copy from your repo and site) and an interview mode (`grill`, it captures your taste from reference videos first), and an `edit` skill that changes one word, number or timing while the rest stays.

Use this Remotion skill when you want a React codebase and beat-locked cuts from a soundtrack. Use the Claude Motion one when you want a first cut in minutes and a file you can paste into claude.ai.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ and [Python 3](https://www.python.org/) - macOS, Linux, or Windows (on Windows, the bash scripts need [WSL](https://learn.microsoft.com/en-us/windows/wsl/) or [Git Bash](https://git-scm.com/downloads); the Python and Node parts run natively)
- A coding agent that can run shell commands and read image files
- Python [`librosa`](https://librosa.org/) for beat detection and [Pillow](https://python-pillow.org/) for the contact sheets (the skill walks you through `pip install` if they're missing)
- [ffmpeg](https://ffmpeg.org/) for the contact sheets, cut strips and the check of a finished render

Remotion itself comes with the scaffold, no manual setup. Note that Remotion has its own [license](https://www.remotion.dev/docs/license): free for individuals and small teams, paid for larger companies.

### Optional (the skill works without them)

- **[Remotion's official skills](https://www.remotion.dev/docs/ai/skills).** They cover Remotion's API as it changes between releases; this skill covers how to make the film. The skill offers to install them and carries on either way.
- **A `GEMINI_API_KEY`** for the best reference-video analysis (Gemini watches the actual video). Without one, the skill samples frames with ffmpeg and reads them itself.

## Install

### Any agent - one command

```bash
npx skills add noamdorr/saas-product-demo-video
```

This uses the open [skills](https://github.com/vercel-labs/skills) installer, which puts the skill where your agent looks for skills.

### Claude Code - as a plugin

```bash
claude plugin marketplace add noamdorr/saas-product-demo-video
claude plugin install saas-product-demo-video@noamdorr-skills
```

### Claude apps - upload

Download `saas-product-demo-video.skill` from the [latest release](https://github.com/noamdorr/saas-product-demo-video/releases/latest) and upload it in your Claude settings, where skills are managed.

### Clone and link

```bash
git clone https://github.com/noamdorr/saas-product-demo-video.git
ln -s "$(pwd)/saas-product-demo-video/skills/saas-product-demo-video" ~/.claude/skills/saas-product-demo-video
```

Use this one if you want to fork and tweak (which I'd encourage - the references are written to be edited).

> **Coming from v1?** The skill moved from `saas-product-demo-video/` to `skills/saas-product-demo-video/` inside the repo. If you linked the old path, re-run the `ln -s` line above.

After install, ask your agent something like *"let's make a 30-second product demo for my SaaS"*.

## How a session looks

```
You: I want to make a 30-second product video for my SaaS.

Agent (asks the intake questions in one message):
  aspect ratio, duration, logo, brand colors, fonts,
  script, voiceover, soundtrack, reference videos

You: [answer what you can; it picks defaults for the rest and tells you]

Agent:
  - Breaks down your reference videos into a motion vocabulary
  - Copies the Remotion scaffold and detects the beats in your soundtrack
  - Writes a one-page brief and builds scene 1
  - Checks scene 1 in rendered stills, then shows it to you with the full script

You: [approve the look and the words, or redirect - this is the one stop]

Agent:
  - Builds the rest of the film, checking each scene in stills
  - Iterates in waves based on your notes
  - Renders the final HD MP4 + thumbnail
```

In practice you land a polished video in roughly 60-120 minutes of agent wallclock time, broken across however many sessions you want. Most of those minutes go into getting scene 1 right - once the style is settled, the rest of the scenes inherit the same vocabulary and finish fast.

## What's inside the skill

```
skills/saas-product-demo-video/
├── SKILL.md                       # Entry point: the flow, the one checkpoint, what done means
├── references/
│   ├── workflow.md                # The flow step by step, with the reasoning
│   ├── setup.md                   # What to check before starting
│   ├── asset-intake.md            # Gather everything before composing
│   ├── product-ui-from-site.md    # Rebuild the product's real UI from its marketing site
│   ├── script-development.md      # Screen-by-screen methodology
│   ├── shot-design.md             # What each shot changes for the viewer
│   ├── reference-video-vibe.md    # Director's breakdowns: Gemini, sampled frames, or by hand
│   ├── reference-atlas.md         # A curated sample of product films worth borrowing from
│   ├── creative-direction.md      # The one visual argument a film makes
│   ├── motion-language.md         # Curves and timing that follow meaning
│   ├── music-sourcing.md          # Find and measure a track when the owner has none
│   ├── beat-sync.md               # The beat grid, backbeat cuts, internal events, typing budget
│   ├── project-scaffold.md        # Copy the scaffold, what each file is for
│   ├── animation-patterns.md      # TypedText, MaskReveal, PopIn, ZoomPunch and more
│   ├── self-check.md              # Which stills to render and what to look for
│   ├── taste-review.md            # The questions a fresh pair of eyes asks after a checkpoint
│   ├── sound-effects.md           # Where a sound earns its place, and how to land it
│   ├── b-roll-integration.md      # When the film uses live-action layers
│   ├── schematic-ui-fidelity.md   # When the product has no real UI
│   ├── click-positioning.md       # The #1 iteration-churn pain point, solved
│   ├── cursor-math.md             # Hotspot offset, scale-ratio transform
│   ├── writing-style.md           # Em-dashes and other AI-tells to avoid
│   ├── iteration-playbook.md      # Fix waves, switches, locked decisions, when to stop
│   ├── delegation.md              # Splitting a film across scene agents in one session
│   ├── render-export.md           # HD/4K render commands
│   ├── vertical-port.md           # 9:16 porting and platform safe areas
│   └── gotchas.md                 # 80 numbered gotchas: symptom, cause, fix
├── assets/
│   ├── scaffold/                  # A complete Remotion project to copy
│   │   ├── src/                   #   Master, Root, timing, theme, easings, scene-frames,
│   │   │                          #   TypedText, MaskReveal, PopIn, ZoomPunch, Cursor, Sfx
│   │   └── tools/                 #   stills.mjs, sheets.py, jerk.py, dump-timing.mjs:
│   │                              #   the render-and-check loop
│   ├── components/                # Optional pieces: Stage, Title, Counter, IceCrack, Marker,
│   │                              #   BRollLayer, FloatingElements, TestBed, DebugClickTargets,
│   │                              #   Schematic* cards, MasterVertical
│   └── prompt-templates/
│       ├── asset-intake-questionnaire.md
│       ├── brief.md
│       ├── scene-brief.md         # Brief for one scene agent
│       ├── handoff.md             # Hand the next session the state of the film
│       └── checkpoint.html        # The one-stop review page for the owner
└── scripts/
    ├── detect-beats.py             # Beat grid, backbeats, and a reliability verdict
    ├── align-internal-events.py    # Beat-align in-scene events within a tolerance
    ├── check-typing-budget.py      # Verify typing fits in its scene before render
    ├── check-copy.mjs              # Count and check the film's words before a render
    ├── check-sfx.py                # Check every sound cue against its event
    ├── measure-lead.py             # Measure a sound file's lead before its hit
    ├── make-sfx.sh                 # Synthesize a neutral set of interface sounds with ffmpeg
    ├── analyze-reference-video.sh  # Gemini wrapper for YouTube analysis
    ├── sample-reference-frames.sh  # Contact sheets and cut strips, no API key needed
    ├── reference-video-prompt.md   # The directorial-breakdown prompt
    ├── render-stills.sh            # Render single frames for the self-check
    ├── side-by-side.sh             # Two directions for one scene, side by side
    └── verify-scaffold.sh          # Typecheck the scaffold and every optional component
```

`evals/` at the repo root is maintainer material (trigger cases, a baseline and a report) and is not part of the skill bundle.

## Development

```bash
# Typecheck the scaffold and all optional components (add --render for a test still)
skills/saas-product-demo-video/scripts/verify-scaffold.sh

# Offline tests for the Gemini wrapper
python3 -m unittest discover -s tests

# Rebuild the .skill archive for release
./build.sh
```

`build.sh` is a glorified `zip` with a different extension. No install step, no compile step.

## Contributing

Contributions welcome. Open an issue first if you're planning a non-trivial change, so we don't both build the same thing differently. Keep edits to `SKILL.md` lean (it's loaded into the agent's context every time the skill triggers); deeper content goes in `references/`.

## License

MIT. See [LICENSE](LICENSE).

## Credits

Built by [Noam Dorr](https://github.com/noamdorr). This sits on top of [Remotion](https://www.remotion.dev/), the React-based video framework that makes any of this possible.
