# Workflow

The flow from "I want a product video" to a shipped file, with the reason behind each step. The reasons are here so you can adapt when a film does not fit the default path.

## 1. Setup

Run the checks in `setup.md`. Note what is missing and which path that implies (for example, no Gemini means sampling frames for the reference videos). Nothing here should stop the work except a missing Node or Python.

## 2. Intake

Send `assets/prompt-templates/asset-intake-questionnaire.md` as one message. Aspect ratio and duration come first because the whole skeleton depends on them. Take whatever the user answers, choose sensible defaults for the rest, and record both in the brief, with the defaults listed as assumptions.

Why first: every asset that arrives after scenes exist forces a re-render, and motion does not rescue weak copy. If the user has no script, develop one with `script-development.md` before going further, because scene count and timing both hang off the words.

## 3. Look

Get two or three reference videos and produce a director's breakdown of each (`reference-video-vibe.md`). Keep the transition verbs and the signature moves; they become the film's motion vocabulary.

Why: without references you invent a style in isolation and the user does not recognize it as what they wanted. With them, each scene boundary has a named move to build.

## 4. Scaffold

Copy `assets/scaffold/` into the project, install, and confirm it typechecks and renders its example still (`project-scaffold.md`). Put the brand colors and fonts into the theme file. The scene list goes into the timing file once the beats are in. Each scene gets its own debug composition next to the master, because scrubbing a five-second scene is far quicker than scrubbing the whole film.

## 5. Beats

From the project root, run `scripts/detect-beats.py public/<soundtrack> --fps 30 --out beats.json`. This replaces the placeholder `beats.json` the scaffold came with. Read the reliability verdict on the last line: on `good`, carry on; on `check`, ask the user to listen and confirm; on `poor`, the track does not suit a beat-cut film, so settle that with the user before building. Then place scenes by beat number in the timing file (`beat-sync.md`).

Why: a cut that lands on the backbeat feels like a drum hit, and a cut that misses by a few frames feels late without the viewer knowing why. Placing scenes by beat number means the frames can never drift from the music.

## 6. Brief and first scenes

Write `docs/video/brief.md` from `assets/prompt-templates/brief.md`: inputs, look, the script scene by scene, and your assumptions. One page. It is a working record for you and a reference for the user, not a document to approve on its own.

Build the primitives they need, then scene 1 and the first scene that shows the product. Check both in stills (`self-check.md`). Until the checkpoint passes, the master holds these two scenes alone, and the others exist only as rows in the brief and entries in the timing file.

Render the checkpoint clip from the master, limited to those scenes' frames, because the soundtrack lives in the master and a scene's own debug composition is silent:

```bash
npx remotion render Master out/checkpoint.mp4 --frames=0-<last frame of the second built scene>
```

A plain master render at this stage would be the built scenes followed by blank background for the rest of the film's length. If the first product scene is not scene 2, build the scenes up to it; the clip has to play continuously.

## 7. The checkpoint

Show the user the clip and the script together and ask three things: is the look right, are the words right, and does it move well with the music. This is the one stop before the full build. Change what they ask for, re-render, and confirm.

In an unattended run (a handoff brief that says "render the checkpoint and continue"), render the clip, open it for the user with the system's `open`, write the assumptions into the brief, and keep building. The clip is the thing they react to when they return; a session that stops there with nobody to answer delivers nothing.

Why here, and why two scenes: it is the earliest moment the user can react to the real thing. An opening scene alone shows the look; it takes a product scene to show how much is on screen and how events sit on the beat. One film had its three-second opening approved and its full cut rejected for exactly those two things.

## 8. Full build

Build the remaining scenes, then the master. Add optional pieces from `assets/components/` only where a scene uses them. After each scene: typecheck, render its stills, look at them, fix what is wrong, commit. Run `scripts/check-typing-budget.py` so no typed line runs past its scene. If any event frames were typed by hand, run `scripts/align-internal-events.py` on them so clicks and landings sit on beats; frames taken from the beat grid in code are on the grid already, and retyping them into a file for the script only checks your copying.

If your environment has sub-agents, scenes can be built in parallel once the timing file, theme and primitives are settled: `delegation.md` has the setup (a shared scene brief, placeholder scenes registered before dispatch, one file per agent), the briefs, and the reviewer and QA passes that follow. Confirm each agent's files exist and typecheck before building on them.

## 9. Fix waves

Render the full film and hand it to the user. Collect all their notes before changing anything, then fix them as one batch (`iteration-playbook.md`). Keep small local fixes and structural changes in separate batches: a moved scene shifts everything after it, and mixing the two makes it hard to tell which change broke what. After any layout change, recompute the cursor targets (`cursor-math.md`).

## 10. Ship

Render at publish quality and make a thumbnail (`render-export.md`). Watch the result once at half speed against the music: every visible change should sit on a beat. Then watch it where it will live, on a phone for a vertical cut, because Studio at desktop size hides problems a feed shows.

If a vertical cut is wanted and was not built alongside, port it now with `vertical-port.md`. It is cheaper when started early.

## When to stop

Stop iterating when the notes turn subjective with no target, or when a fix undoes the previous wave's fix. Ship the current cut, write the open notes into `docs/video/notes.md`, and come back after a day.
