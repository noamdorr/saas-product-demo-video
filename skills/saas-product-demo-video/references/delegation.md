# Delegation - building a film with sub-agents

A 12-scene, 55-second film was built this way in one session of about two and a half hours: three research agents at the start, five scene agents in parallel after the checkpoint, a reviewer pass, a QA pass on the full render. This page is what made it work and what cost time. If your environment has no sub-agents, skip it; nothing in the skill depends on delegation.

## The shape

1. **Research agents, at the start, in parallel.** One each for: the product's real UI (capture and measure, `product-ui-from-site.md`), the music (`music-sourcing.md`), the reference films (`reference-video-vibe.md`). Each gets a narrow brief, the files to read, and one file to write; it keeps bulk output (page text, DOM dumps, transcripts) in files and replies with conclusions in under 25 lines.
2. **The main session builds the shared layer and the first scenes.** Theme, timing, primitives, the UI primitives, scene 1 to the first product scene, the checkpoint clip. The look is decided here, not by an agent.
3. **Scene agents after the checkpoint, in parallel, one scene each.** They read one shared page (`assets/prompt-templates/scene-brief.md`, filled in for the project) plus their own task paragraph, and write only their scene file and, if they want, one UI component file.
4. **A reviewer pass** on a batch of finished scenes, and **a QA pass** on the full render. Both return an ordered fix list and edit nothing; the main session applies the fixes, because two writers on one file is a merge nobody can reason about.

## What a scene agent needs before it starts

Every one of these saved a round trip when present and cost one when missing:

- **A composition to render.** An agent checks its work in stills, and stills need a registered composition. Register the scene in `Root.tsx` and `Master.tsx` with a placeholder component *before* dispatch, and tell the agent not to touch those files. Without this, every agent edits the shared registry and the edits collide.
- **The shared page**, with the project map (where timing, theme, primitives, data live), the rules (palette only, copy verbatim from the data file, no hand-typed frames, deterministic, layout math not DOM measurement), the self-check (which frames to render, how, what to look for), and the reply format.
- **Its task paragraph**: the scene's row from the brief, the exact enter and exit moves and camera keyframes, which beats carry which events (by name: "the track's beat <n>, the <t> s kick" via `beatInScene`, or "the scene's beats 1 to 5" via `sceneBeats`), the data constants to use, the composition id, and the still frames to check.
- **A finished scene to copy the shape of.** Point at one built scene file; agents reproduce structure far better than they follow prose.
- **The data file as the only source of strings.** Agents told not to edit the data file will inline strings they need; ask them to report every inlined string so the main session moves it into the data file afterwards.

## What to tell them about beats

- "Most beats stay empty" has to be in the brief, with the number: four to six events in a four-second scene. Without it, agents put something on every beat.
- Name the exact musical moments with their frames. An agent given "the <t> s kick, `beatInScene(<n>, SCENES.<name>)`" lands the click there; one given "a beat" picks a round number.
- A scene that starts on a backbeat has `sceneBeats(BACKBEATS, scene)[0] === 0`. Say whether index 0 means the cut or the first backbeat after it; one agent spent a round trip on that ambiguity.

## What a task paragraph carries, and what it does not

A controlled comparison on one production: two scene tasks dispatched to identical agents against the same foundation, one with the scene's code pasted verbatim into the task, one with the decisions only. Same tokens (about 139k each), the decision-level one faster, both typechecked first run. The verbatim task carried a constant that was 190 px wrong with the same confidence as everything around it; the decision-level task surfaced six ambiguities, one a real contradiction in the brief. What earns its place in a task: the verification line ("render frame 88; the underlined phrase sits near center, else move `CONS_ORIGIN`"), the derivation behind each number (where a constant comes from), and the gotcha the task is likely to hit. Paste code only for a thinner-context agent that must reproduce a file byte for byte.

Sub-agents do not commit. They share the repository's index with the main session and with each other; the main session commits once their files are on disk and typecheck. Say it in the brief.

## What they reliably get wrong, so the brief says it

- **The cut frame.** Agents put a card's first row on the first beat after the cut, so the cut lands on an empty card for half a second. The rule: the card and its first row (or its bar, or its title) are there on the cut; the following rows take the beats. `animation-patterns.md`, "The cut frame is composed".
- **Scale and placement.** A card laid out at the site's 1x sizes and shown at 1.5x can still be small in a 1920 frame, and a push-in can carry its edge off the frame. Ask for the card's canvas placement and scale in the reply, and look at the last frame of the scene.
- **Invented states.** Asked for a click, an agent will invent a "Downloaded" state for the button. Say "no state the product does not show; the punch and the ripple are the feedback".

## The reviewer and QA passes

Give them the brief, the rules, the sheets, and the ask: an ordered fix list, each item with the scene, the frame or line, what is wrong, the one-line fix, and a severity; then one line per scene, pass or item numbers; no praise. Both passes in the production above returned 12 to 16 items, of which all but three were applied. What they catch that the author does not: a clipped bottom row, a header crossing a column rule, a two-tone headline, copy that drifted from the brief, an empty white block that holds for a second.

Feed the QA pass the whole-film contact sheet, the cut strips and the jerk report (`self-check.md`), not the MP4: an agent reads sheets, and the sheets make the rhythm visible at a glance.

Two things made a later QA pass sharper:

- **Tell it what changed in this wave and what the owner asked for**, so it judges hardest there. Given the list (a rebuilt scene, a new text move, new transitions, new labels), one pass returned eleven items, eight of them real, including a cut that landed on a blurred empty card, a cursor parked on the empty background for two seconds and a label crowding the copy.
- **Let it render its own stills** (`tools/stills.mjs Master <frames> --out out/qa`) for anything about legibility. Sheets show rhythm; only full-size stills show whether a 20 px label reads.

Freeze the files it is judging until it replies (`gotchas.md`, 33).

## Costs, for planning

In the production above: research agents 7 to 17 minutes each; scene agents 5 to 9 minutes each (160 to 200 thousand tokens); reviewer and QA passes 6 to 7 minutes; HD render of 55 s at CRF 14 about 2.5 minutes, 4K about 2 minutes; a checkpoint clip 1 minute. Five scene agents rendering stills at once on a 10-core laptop was fine.
