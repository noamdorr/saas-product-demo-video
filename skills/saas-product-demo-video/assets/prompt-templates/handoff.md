# Handoff for wave <N> of the <PRODUCT> film

Save as `docs/video/handoff-wave<N>.md`. The owner pastes "Read docs/video/handoff-wave<N>.md and follow it" into a fresh session, so this page has to carry everything that session needs and nothing it has to go and find. Write it at the end of the session that knows the film, in the order below; a section that does not apply says so in one line rather than disappearing.

## Read first, in this order

1. `docs/video/brief.md` (inputs, look, script, assumptions)
2. `docs/video/notes.md`, the last two waves and every "decision" subsection
3. `src/timing.ts`, then the scene files named below
4. The skill: `<path to SKILL.md>`, then `references/iteration-playbook.md`

## Where things stand

- Shipped: `out/<film>-v<N>.mp4` (HD) and `out/<film>-v<N>-4k.mp4`, accepted by the owner on <date> with the words "<quote>".
- Source snapshot of the shipped film: `backups/src-v<N>/` (`diff -rq src backups/src-v<N>` is empty at the start of this wave; if it is not, stop and say so).
- Candidates in flight, if any: file, switch name, what it changes, what the owner has and has not seen.

## Locked

Decisions the owner has made that a later wave must not reopen, each with the wave it was decided in. Examples of the kind of thing that goes here: the chat window enters at a fixed size (wave 14); the map stays and opens the film (wave 6); no demo button on the close, the URL stands alone (wave 15); `Title` is the film's one text move (wave 4); sound levels as measured in wave 8; nothing above 1x on a raster logo.

## This wave

What the owner asked for, in their words, then the ranked list with a time estimate each. Mark which items are tweaks (go straight into the film behind a switch) and which are directions (sketch as a test bed first, `iteration-playbook.md`). Name what is out of scope this wave ("no new scenes", "copy verbatim", "finish only", "9:16 not until asked").

A "finish only" or "fresh eyes" handoff deliberately lists no findings: the next session is meant to judge for itself.

## How to work with the owner

- They approve by watching. Open the HD render for them (`open out/...mp4`) with a side by side against the shipped film and a few plain lines on what changed, with times in the film.
- One decision at a time, six lines of context, your recommendation first; they veto rather than specify.
- A settled call stays settled (see Locked). Re-read notes.md before proposing the opposite of anything there.
- They cannot be told the film is smooth or on the music from stills; say what was measured and that nobody has watched it.

## Render

The exact lines, spelled out, no shell variables (gotcha 58):

```bash
npx remotion render Master out/<film>-v<N+1>.mp4 --crf=14 --image-format=png --concurrency=8 --color-space=bt709
ffmpeg -i out/<film>-v<N+1>.mp4 -map 0 -c copy -bsf:v h264_metadata=transfer_characteristics=13 -color_trc iec61966-2-1 -movflags +write_colr+faststart out/<film>-v<N+1>-tagged.mp4
```

4K only after the owner's yes, and it takes the HD's audio (`render-export.md`).

## Checks before the owner sees it

`npm run typecheck`; `node tools/dump-timing.mjs`; `node tools/stills.mjs Master cuts --sheet out/check/cuts.png`; `python3 tools/sheets.py out/<film>.mp4`; `python3 tools/jerk.py out/<film>.mp4 --planned <ranges from the README>`; `node <skill>/scripts/check-copy.mjs`; `check-sfx.py` on the master and its music-only twin when sound changed. Full-size stills of every frame the owner will be asked to judge.

## Close the wave

Append the wave to `docs/video/notes.md` (numbered items, [fixed]/[kept]/[open]/[decided], frames and seconds, still paths, switch names, the owner's words under "decision"), snapshot `src/` to `backups/src-v<N+1>/`, bump the README's render line and jerk ranges, and end with one line: DONE / WAITING / NEEDS <owner> / PARKED, plus what they can check.

## Skill feedback

What this wave taught that the skill does not say yet, as symptom, cause, fix, with the wave number. The next session folds it into the skill's references; a lesson that stays in notes.md is lost to the next film.
