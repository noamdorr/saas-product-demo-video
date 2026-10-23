---
name: saas-product-demo-video
description: Build, refine or reskin a short SaaS product film in Remotion, cut to the beat of its soundtrack, from the product's real screens, brand and copy. Use when the user wants a product demo, launch video, explainer or social reel of their software made in code; wants an existing product film changed, reskinned or critiqued; or has a product with no interface to record and needs schematic UI. Covers 16:9 and 9:16, b-roll under motion graphics, sound effects and checked renders. Not a live-action editor and not a screencast tool.
license: MIT
compatibility: Needs Node 18+, Python 3 with librosa (and Pillow for the contact sheets), ffmpeg, and a shell; Playwright only for capturing a product's site. Renders locally with Remotion; the scaffold pins its versions. Works in any coding agent that can run commands and read image files.
---

# SaaS product demo video

Build a short product film in Remotion, cut to the beat of its soundtrack, in the product's own brand, from the product's real screens. The same flow covers horizontal demos, vertical reels, films with b-roll layers, products with no interface to record, and a film that already exists and needs a wave of changes.

A generic motion-graphics reel is easy to make and easy to ignore, and so is the AI-made one that owners now recognize on sight. What separates a film from those is gathered before any scene exists: the product's real assets and screens, a look borrowed from reference films the user likes, a timing grid taken from the soundtrack, and one visual argument the film makes. The rest of this skill is craft built on those.

## Start on the right branch

- **A new film.** Intake, look, scaffold, beats, brief, the checkpoint, the build: the flow below, with the reasoning in `references/workflow.md`.
- **An existing film.** Read `docs/video/notes.md` (every "decision" entry first), the brief and the latest handoff, inspect the accepted render and the source separately, and classify the ask before touching anything: a tweak goes behind a switch, a reskin keeps every timing and move, a rebuild gets a storyboard or test beds. `references/iteration-playbook.md`, "Classify the request first". Do not repeat intake or reopen the look for a small fix.
- **Critique or planning only.** Review the render (`references/self-check.md`, `references/taste-review.md`) and return a ranked list; build nothing. Say which evidence each finding rests on: a still, a measurement, or playback, which you cannot do.
- **Narration sets the pace.** The scaffold is music-led. A film cut to a voiceover places its events by hand (`BEAT_SYNCED = false` in the timing file) and the brief says the cuts will not sit on the music; say so before starting.

## Definition of done

- A Remotion project with a master composition and one debug composition per scene; every candidate change behind a switch whose default is the shipped look.
- `docs/video/brief.md`: the inputs, the look, the visual argument in one sentence, the script scene by scene, the assumptions.
- `beats.json` and a timing file that every scene reads its frames from, so changing one beat index re-flows the film.
- An HD MP4 (1920x1080 or 1080x1920), color-tagged, a thumbnail still, and a 4K render on the owner's acceptance that carries the HD's audio.
- Every scene checked by you in rendered stills before the user saw it; the words counted; the owner told what was measured and that nobody has watched it.
- `docs/video/notes.md` with every wave and every decision, and a handoff file when the session ends with work open.
- Optionally four to eight sound effects behind the master's `sfx` prop, measured onto their events, with a `Master-NoSfx` render beside the master so the user picks by ear.

## The flow

1. **Setup.** Check the tools and note what is missing. `references/setup.md`
2. **Intake.** Send the questionnaire as one message and record the answers; capture today's site, not memory. `references/asset-intake.md`, `references/product-ui-from-site.md`
3. **Look and argument.** Break down two or three reference videos into transition verbs, pacing and signature moves; write the one sentence the film argues and the one signature move. `references/reference-video-vibe.md`, `references/creative-direction.md`
4. **Scaffold.** Copy `assets/scaffold/` into the project and install. `references/project-scaffold.md`
5. **Beats.** Run `scripts/detect-beats.py` on the soundtrack, writing `beats.json` over the scaffold's placeholder, and act on its reliability verdict. `references/beat-sync.md`
6. **Brief and first scenes.** Write `docs/video/brief.md`, build scene 1 and the first scene that shows the product, check them in stills, then stop at the checkpoint below.
7. **Full build.** Build the remaining scenes and the master, checking each in stills, counting the words, running the attention pass. Then the sound layer, if the film gets one: `references/sound-effects.md`, before the first fix wave, so every cue sits on a frame that has stopped moving.
8. **Fix waves and ship.** Collect the user's notes in batches, fix behind switches, render with the master's flags, export. A scene the user wants rethought gets two to four directions as test beds with the music, shown side by side and at full size, and the user picks. A wave that rebuilds the story gets a storyboard first (every on-screen string and one line per frame), approved before any code. End a long session with a handoff file. `references/iteration-playbook.md`, `references/render-export.md`, `assets/prompt-templates/handoff.md`

## One checkpoint

Stop for the user's approval exactly once before the full build: when the opening scene and the first product scene are rendered, with the cut between them and the music, and the brief is written. Show that clip and the script from the brief together, and ask three things: is the look right, are the words right, and does it move well with the music.

The clip needs both kinds of scene because they fail differently. A type-led opening shows the look. A product scene shows how much is on screen and how events sit on the beat, and those are what a user rejects after a full build if they first see them there. When the user will review later, a small local HTML page with the video beside the script puts both in one place; `assets/prompt-templates/checkpoint.html` is a starting point.

The reason for one stop, placed here: people judge a render far better than a document, and a wrong look or rhythm caught now costs two scenes of rework instead of the whole film. Everything before the checkpoint is reversible, so do it without asking for sign-off on documents. Ask the intake questions in one message, make a sensible choice wherever the user has no preference, and write each choice into the brief's assumptions list so it is easy to veto. After the checkpoint, build the whole film before asking for notes again. A tweak inside an approved feel needs no second checkpoint; a change of feel does.

If nobody is there to answer (an unattended run), answer the intake from the materials you were given, list every assumption in the brief, and still stop at the checkpoint. A whole film built on an unapproved look is the expensive mistake this stop exists to prevent. The one exception is a handoff brief that says in so many words to render the checkpoint and continue: then render it, open it for the user, and build on, because a session that stops with nobody to answer delivers nothing.

## The template look is the enemy

Owners name it in one word ("claudesque", "Canva", "cheap") and it is a set of defaults: a cream canvas with a serif on it, glows and blobs, one italic or colored word in a headline, eyebrow labels, hub-and-spoke diagrams, clip-art glyphs, an invented dashboard when the real one is on the site, a trick per scene, something popping on every beat, idle bobbing, text that fades in and sits. Every hex can come from the brand file and the film still reads as one more of them. The full list, what replaced each item on a film that shipped, and the one-signature-move rule are in `references/creative-direction.md`, "What reads as a template". Read it before the first scene and again before any "more premium" pass.

## The cut frame carries a picture

Every cut lands on a backbeat, and the frame it lands on has to be composed: the card with its first row, the bar, or the headline, not an empty rectangle that fills over the next beats. One composed element is enough: with the card there on the cut, the headline beside it may rise on a beat. First drafts and scene agents put the first row on the first beat after the cut, and a film then opens six scenes in a row on blank white. The rule, the pre-roll trick for counters and chip fields, and the camera moves that join scenes are in `references/animation-patterns.md`.

## Motion carries through the cut, and text moves one way

Two notes from owners who liked a film overall: "less jerkiness" and "text motion is boring". The first came from transitions that stopped dead on both sides of every cut and from camera holds that did their whole move in the first half second; the fix is an exit that accelerates into the cut, an entrance that leaves it at speed, and holds that drift evenly. The second came from headlines that faded in and sat; the fix is one move for all display text, picked from the references and used in every scene, entering on a beat and leaving the way the camera leaves, not a new trick per scene. `assets/components/Stage.tsx` implements the first; `Title.tsx` implements one text move; `references/animation-patterns.md` has the numbers, including a big push's keys in log space and how one object is handed across a cut.

One region of change at a time: within half a second, nothing moves in a far corner while the scene's main event lands. Put the secondary element where the eye already is, or on the cut (`references/motion-language.md`).

## Show the idea, not the screen

A product film is not a walkthrough. Each product scene carries one idea, and its card shows only what makes that idea land: a name, a status, a phrase. The budget, from films their owners were happy with: about 4 words a second of runtime, 15 to 30 words on a product card, headlines under 12 words and on one line. A cut with twice that drew "too much text". The product's real wording is where the few words you keep come from; it is not a reason to keep all of them. Leave prices, credits and plan names out unless the user asks. `scripts/check-copy.mjs` counts; `references/writing-style.md` has the rules and the tells.

## Check your own renders

Before the user sees a scene, render stills at the frames that matter and look at them: each click frame, the frame where the longest line of text is fully on screen, the last frame before each cut, the cut frame whole. Confirm the cursor tip is on its target, no text wraps or clips, nothing leaves the safe area, and the words match the brief exactly. After a master render: the contact sheet, the cut strips, the jerk report with the film's judged moves passed as planned, and the attention pass. `references/self-check.md` has the frame list and the commands.

This matters because the usual failures of a film like this (a cursor that misses its button, a headline that wraps, a card that sits off the grid, a timing dump that went stale) all typecheck and render without error. They are visible only in the picture, or in a number.

Stills do not show motion. Whether the film feels smooth and sits well with its music is something only a person watching can say, so never report it as checked; say what was measured and that nobody has watched it.

## The three inputs

**Assets.** Aspect ratio, duration, logo, brand colors, fonts, the script, and a soundtrack, collected up front with the questionnaire in `assets/prompt-templates/asset-intake-questionnaire.md`. A film with strong motion and placeholder brand reads as a template, and every asset that arrives late forces a re-render. The product's real UI is captured from today's site and measured from the DOM, never drawn from memory (`references/product-ui-from-site.md`); one invented dashboard sank a whole version. If the user has no script, `references/script-development.md` develops one with them.

**Look.** Two or three reference videos the user likes, each turned into a director's breakdown: shot list, transition verbs (push-through, whip-pan, match-cut zoom, mask wipe), pacing, typography, signature moves. The transition verbs are the part that matters most, because they turn a scene list into a camera plan instead of a slide deck with fades. An earlier film the user liked outranks every reference: load its cut points and entrance timings first. Use Gemini when it is available, or sample frames and read them yourself; both paths are in `references/reference-video-vibe.md`.

**Beats.** `scripts/detect-beats.py` reads the soundtrack and writes `beats.json`: the tempo, the frame of every beat, which beats are backbeats, and where the track lifts. Scene cuts go on beats, by default on backbeats, which makes a cut feel like a drum hit; the three reference films that looked expensive ran 10 to 13 cuts a minute with no shot under 3.5 s, and a camera move in every scene. Clicks and entrances start on beats too, but not on every beat: most beats in a scene carry nothing. The timing file derives every frame from `beats.json`, so scenes are placed by beat number and never by a hand-typed frame. The script ends with a reliability verdict: on `good`, build; on `check`, have the user confirm by ear; on `poor`, the track does not suit a beat-cut film, so change the track or tell the user the film will not be beat-synced.

Most films follow all three. Some break one on purpose, and that is fine when it is a choice: a film cut to a voiceover, for example, cannot also be cut to the beat.

## Working with the owner

- **They approve by watching.** Open the HD render for them (`open out/...mp4`) with a side by side against the last accepted cut and a few plain lines with times on what changed. A 4K comes after the yes. Full-size stills of anything they are asked to pick between; two owners changed their pick at full size.
- **Recommend, do not ask.** When a call is theirs (taste, copy, money, someone else's brand), paste six lines of context and your pick first, one decision at a time. Low-stakes calls are made and logged as vetoable. A critique's findings are proposals, even after "I agree with all".
- **A settled call stays settled.** Every decision is in `docs/video/notes.md` with its wave; read them before proposing the opposite of anything there, however well the opposite is built.
- **Every candidate is a switch** whose default is the shipped look and whose other value is named by version, so a veto is one token and every earlier version is reachable (`references/iteration-playbook.md`).
- **Say what was measured.** Jerk report, sound placement, color probes, word counts; never "smooth" or "in sync".

## Working notes

- **Remotion's own skills.** If Remotion's official skills are installed, use them for Remotion API questions; they track each Remotion release and this skill does not try to. If they are missing, offer `npx skills add remotion-dev/skills` and carry on either way. One difference to know: their guidance prefers previewing in Studio over rendering, while this skill needs rendered stills for the self-check and the checkpoint, so render them.
- **Delegation.** If your environment can run sub-agents, three research agents at the start (the product's UI, the music, the references) and one agent per scene after the checkpoint built one 12-scene film in an afternoon, as long as only one agent at a time edits the shared files (timing, theme, primitives), agents do not commit, and a reviewer looks before the user does. `references/delegation.md` has the setup and the briefs. If it cannot, build the scenes one after another. Nothing in this skill depends on delegation.
- **State lives in files.** The brief, `beats.json`, the timing file, `docs/video/notes.md` and the handoff hold every decision, so a long session or a fresh one can pick the film up from the repository alone. Commit after each scene, unless the user manages commits themselves; then skip the commit steps and say so in the brief. Snapshot the shipped source under `backups/src-v<N>/`.
- **Installing things.** Say what you are about to install and why before you do it. It is the user's machine.
- **Feed the skill.** The handoff's last section is what this wave taught that the skill does not say; fold it into `references/` (a symptom, its cause, the fix) in the same session, or the next film pays for it again.

## Reference map

Load what the current step needs, one file at a time. Reading many at once crowds out the one you need, and `beat-sync.md` is read alone before writing timing.

| When | Read |
|---|---|
| Starting a film | `workflow.md`, `setup.md` |
| Intake, script | `asset-intake.md`, `script-development.md`, `writing-style.md` |
| The product's UI is on its site | `product-ui-from-site.md` |
| No real UI to show | `schematic-ui-fidelity.md` |
| Look, argument, a "more premium" or "generic" note | `reference-video-vibe.md`, `creative-direction.md`, `reference-atlas.md` |
| Planning shots and the energy curve | `shot-design.md`, `motion-language.md` |
| Timing | `beat-sync.md`; no soundtrack yet: `music-sourcing.md` |
| Project setup | `project-scaffold.md`, `gotchas.md` (contents list at the top) |
| Building scenes | `animation-patterns.md`, `cursor-math.md`, `click-positioning.md` |
| Building with sub-agents | `delegation.md`, `assets/prompt-templates/scene-brief.md` |
| Footage under the graphics | `b-roll-integration.md` |
| Sound effects (read before adding any) | `sound-effects.md` |
| Checking | `self-check.md`, `taste-review.md` |
| Fixing, reskinning, rebuilding, handing off | `iteration-playbook.md`, `assets/prompt-templates/handoff.md` |
| Export, vertical cut | `render-export.md`, `vertical-port.md` |

Also in this skill: `assets/scaffold/` (a ready Remotion project, with `tools/` for stills from one bundle, the scene table, contact sheets, cut strips and a jerk check), `assets/components/` (optional pieces: the Stage camera with enter and exit moves and depth planes, the Title text move, a test bed for judging a scene in context, counter, marker, sound effects, click-target overlay, b-roll layer, schematic UI cards, vertical master), `assets/prompt-templates/` (the intake questionnaire, the brief, a checkpoint page, the scene brief for sub-agents, the handoff), and `scripts/` (beat detection, event alignment, typing budget, the word count and copy tells, reference-video analysis, still rendering, sound effects (a synthesizer for the hits the library lacks, a lead measure per file, and a placement and level check on two renders), side-by-side comparison clips, scaffold verification).

## When this is the wrong tool

- **A film already deep in revisions.** Skip intake; go to the "existing film" branch above. Load this skill at the start of every wave, including a short one: a wave run without it synthesized its sound effects by hand while this skill already sourced them from Remotion's library.
- **Voiceover-led videos.** When narration sets the pace, the beat grid fights it. This skill can lay a voiceover over a beat-cut film, but it does not yet time scenes to narration. Tell the user before starting.
- **Live action as the subject.** Interviews, unboxings and walkthroughs belong in a video editor. This skill uses footage only as a layer under motion graphics.
- **Non-product videos.** Event recaps, testimonial montages and screencast tutorials do not fit the product-card and beat-cut patterns here.
