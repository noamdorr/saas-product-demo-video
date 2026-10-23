# Iteration playbook

After the checkpoint the whole film is built in one pass, then improved in waves. Each wave is: **watch → gather notes → categorize → execute**. Without structure, iteration devolves into infinite nitpick loops.

## Classify the request first

Three kinds of ask, three different jobs, and taking one for another cost whole evenings:

- **A tweak** inside an approved feel: a word, a number, a timing inside a scene, a color. Build it behind a switch, prove it with a still or a short clip of the moment, and render the whole film once. No second checkpoint.
- **A reskin** of a film the owner likes: a new palette, font or sample universe on the same film. Timing, easings, durations, keypoints, structure and music stay untouched; every new card inherits the delay, drift and rotation of the card in its slot. One owner who asked for a reskin and got a rebuilt film: "I thought you'd just change colors and designs a bit... this new video doesn't look good", and the old film "felt better". Before a font swap, measure every headline's width in the old font (under 3% slack breaks), fix line heights on lines with emoji, and re-measure click targets after (gotchas 70 to 73). Render the untouched original into the new folder first as the baseline, and review as original-left, new-right with same-frame still pairs.
- **A rebuild or a new direction** changes what a scene shows or says. That gets the storyboard or the test beds below, and a checkpoint.

When the ask is ambiguous ("move the text closer to the UI" was read as moving the UI; "cross out" meant underline), paste the exact string and ask one question before building. "Ground it in the product" is not "reproduce the product": reading the components closely led one film to show everything it had read.

## Wave structure

Three to five waves is typical for a 28-45s film:

- **Wave 1 - structural**: do scene timings work? Is the pacing right? Are any scenes missing or unnecessary? Do the transitions feel cohesive?
- **Wave 2 - animation tuning**: cursor paths, easings, stagger timings, spring configs. The "it looks right but feels off" layer.
- **Wave 3 - typography + copy**: final word-by-word polish. Font sizes, letter spacing, copy rewrites.
- **Wave 4 - color + detail**: final hex tuning, shadows, background gradients, logo treatment.
- **Wave 5 - export polish**: any last cleanups visible only in the final MP4 at full resolution.

Not every film needs five waves. A 20-second vertical ad often ships clean after two.

## Batch review rule

**Never ship a fix mid-wave.** Collect ALL user notes for a wave, categorize, then execute as a batch. This:
- prevents whiplash (you fix A, they notice B in the new render, you fix B, that breaks A)
- lets independent fixes be done side by side
- cuts render count roughly in half

The user's job during a wave is to watch the render and dump *every* note. Your job is to not touch the code until the wave is fully scoped.

## The surgical-vs-structural split

Every note falls into one of two buckets:

**Surgical** - localized change, known file, known lines:
- "The cursor should click on the first button, not the second."
- "Scene 3 ends a beat early."
- "Make the pink more saturated."
- "The text should type-on with more overlap."

**Structural** - architecture-level change:
- "Scene 5 should come before Scene 4."
- "Add a new scene showing the email flow."
- "Remove the cursor entirely from scenes 1-2."
- "Switch to a new soundtrack."

Surgical changes: edit directly, then verify with a still or a single-scene render rather than the full film.

Structural changes: re-run the relevant phase. Scene reorder → change the scene's beat numbers in the timing file, re-check that every cut is on a backbeat, re-render. New scene → add its row to the brief, write the scene component, add it to the master, render.

## When the note is about the whole film

"It feels jerky", "too much text", "the old one felt better" are neither surgical nor structural. They say the approach is off, and fixing scenes one by one will not answer them.

- If there is an earlier film or cut the user prefers, measure both (`sample-reference-frames.sh` reports abrupt changes; compare cut times, entrance lengths, words per card) and adopt the earlier one's cut points and entrance timings before changing anything else. Its timings carry every round of the user's ear that went into it.
- "Jerky" usually means too many hard landings, something on every beat, or beats that are not evenly spaced. Check `beats.json` says `"grid": "even"`, ease the entrances, and empty most of the beats. If the transitions themselves stop and start (each move halts on both sides of its cut), carry their momentum across the cut and let holds drift at an even speed (`animation-patterns.md`, "Scene transitions"): on one film that note was answered by those two changes plus cards that grow, with the same story, copy and cut points.
- "Text is boring" means headlines fade in and sit. Give every headline the same rise-and-leave move (`Title`, `animation-patterns.md`), not a new trick per scene.
- "Too much text" means the cards are showing the screen and not the idea. Cut each card to the one thing its scene is about.

Keep the previous render, so the user compares by watching.

## When the owner asks for a fresh-eyes review

"It's pretty decent; with fresh eyes, what would you improve? Don't change anything yet" asks for ideas, not edits. What made the answer useful on one film:

1. **Look at the whole film first**: a frame every two seconds tiled into three sheets in time order, then the four or five frames that matter at full size. Read the scene table and the last wave's notes so you do not re-propose what was already tried.
2. **Rank five recommendations, biggest payoff first**, each with the evidence on screen (quote the words, name the second) and a time estimate. Lead with story before polish: on that film the top note was that the hook built one case (a lawsuit, then a default) and the film never paid it off, while its proof was a different case; making them one case beat every visual note.
3. **Expect a veto and build on it.** The owner rejected cutting the map scene ("visually I love how this animation works") and asked for it earlier instead. The answer was to make it the opening shot and the bookend, which also carried the story. An element the owner loves is a resource to move, not a weakness to cut.
4. **Develop the owner's counter-idea before judging it.** "What if the calendar goes back in time?" read as risky and turned out better than the forward version, once it had one rule: show today first, then rewind (see `animation-patterns.md`, "A calendar that rewinds").
5. **Tweaks go in the film; directions get test beds.** A pick that keeps its scene's idea and cut points and changes how one cut or one move behaves (a match-cut, a brake, a duck) is a tweak: build it, render the whole film and put it beside the previous one. One that changes what a scene shows is a direction: sketch it as a test bed first (below). On one film four picks built as tweaks and shown as a whole-film side-by-side were all kept.
6. **Measure what you cannot see or hear, and say so.** Sound: each file's lead (`scripts/measure-lead.py`) and where and how loud each effect lands (`scripts/check-sfx.py` on a render with and one without), reported as unheard. Motion: the jerk report with the judged moves passed as `--planned`, so the list that remains is worth a look. On one film the review found a hit two frames early and a headline cropped by the frame at the start of a push, neither visible on a contact sheet.

## When the owner asks for "more premium"

"I just wanted to do something else to make it look a bit more premium" came after a shipped film, with the owner's own ideas first: buildings in the background, then their old stock library (a notification, someone frustrated, real estate). Asked "what would you recommend?", the useful answer was craft on what is already there, ranked, each with its second and a time: the product UI as an object in space (`animation-patterns.md`, "Product UI in perspective"), removing idle motion (gotcha 51), a soft sound under the two or three biggest camera moves, a dithered lift in the backdrop. And what to skip, said plainly: more objects, more effects, more text, decoration behind the product cards (the empty field is usually the approved look), stock footage in a film whose look has none (`b-roll-integration.md`, "Before using a stock library"). The owner picked the first two. Their own idea survived as a drawing in the film's language (a building at the map's pin, `animation-patterns.md`), which is how an owner's idea that does not fit as asked usually lands.

## Notes that arrive one at a time

When the owner says "more notes coming, batch them", build each note in source as it arrives and check it in stills (and a short render of the moment, for the abrupt-change check), but render the film once, when they say so. When you open that render, name every change with its time in the film: handed a render with "the building in the proof", one owner asked "where's the building on the map zoom-in?", because the film had two zoom-ins and they had watched the half-size comparison.

## When the story is rebuilt: a storyboard before any code

A wave that changes what the film says needs the owner's sign-off on the words and the pictures before a scene is touched. The owner asked for it in so many words: "I want to see the entire text and description of each frame before we start building." Write it as acts and numbered frames, each with its time range, every on-screen string verbatim, and one line of what the picture does; then the calls you made yourself, as vetoable lines. Save it next to the brief (`docs/video/storyboard-wave<N>.md`) so the build reads from it.

Check each line against the live site while writing it, and say where it comes from (home page or a sub-page). A line that is verbatim on a sub-page can still be rejected: "Signal, not noise" was a card title on a lenders page and the owner called it "too claudesque" (an antithesis slogan, `writing-style.md`). Offer the replacements from the site's own home page, with a recommendation.

Then build in one pass: the storyboard is the approval, so the next stop is the rendered master.

## When a scene has to be reinvented

A note like "this scene looks AI-made" or "this beat is boring, rethink it" cannot be answered by tuning. It needs new directions, and the owner has to see them as film. What worked:

1. **Sketch two to four directions as test beds**, each a few seconds of film in context: the last 20 frames of the scene before, the sketch over the scene's own length, the first 20 frames of the scene after, with the soundtrack trimmed to the same span. `assets/components/TestBed.tsx` builds that composition; keep the sketches in `src/sketches/` and register each. A direction judged in context, with the cut into it and out of it and the music, is a different thing from the same direction in stills.
2. **Include the owner's own idea even when you doubt it**, built well enough to judge. In one film the owner's first idea (the signals on a US map) confirmed the owner's own worry about overload once rendered, and their second idea, offered mid-session, won.
3. **Include at least one concrete, everyday object as the metaphor** (a calendar, a page of records, a map), not only abstract camera moves. Offered a polished 3D dolly along a timeline and a calendar whose months ran past, the owner picked the calendar: it reads instantly, and the motion still came from the months running.
4. **Check each test bed** with a contact sheet every 6 to 9 frames and the abrupt-change check (`tools/sheets.py <clip> --step 6 --dump none`, `tools/jerk.py <clip> --cuts none`).
5. **Show the owner two finalists side by side** (`scripts/side-by-side.sh left.mp4 right.mp4 out.mp4`), open the file for them, and let them pick. This is a taste call: give your recommendation in one line and then accept theirs. Your favorite can lose; the one that lost here had the better motion numbers. The side-by-side is half size, so a sketch whose point is a detail (a drawing 200 px wide) loses it there: open a full-size still pair or the full-size test bed beside it. On one film the owner picked twice from half-size comparisons and changed both picks after seeing them full size in the film: a top-down plan ("not clear at all that this is a real estate object, just some schematics"), then an elevation over the axonometric they remembered as "more 3D, built of dots". Expect a switch after the full render and keep it one line (step 6).
6. **Log the choice** in the brief's assumptions (what was tried, why the winner won, where the others live), and keep the losing sketches registered so they can be promoted later.

Promote the winner into the real scene file and check the whole film again: a new scene changes the cut into the next one.

## Locked decisions

Every decision the owner has made is written in `docs/video/notes.md` under a "decision" heading with its wave, and the next session reads those before proposing anything. A settled call stays settled until the owner reopens it: a window the owner fixed at one size (wave 14) was re-animated as collapse-then-open ten waves later and reverted the same day; the map the owner said they loved was proposed for cutting and had to be defended. Examples of the kind of thing that locks: a window's size, an element the owner loves, the one text move, the sound levels, the ending, "no demo button, the URL stands alone". The handoff template (`assets/prompt-templates/handoff.md`) has a Locked section for exactly this.

## Every candidate is a switch

How one film ran 24 waves in three days on one source tree with every earlier version still reachable:

- Each change is a prop on its scene whose default is the shipped look and whose other value is named by the version it came from in the prop's comment: `<Dashboard tilt={false}>` is v11; `<Ask ending="pullback" | "dive" | "cut">`; `<Graph entities="estate" | "glyph" | "dots">`. A veto is one token.
- A value that moves cue frames or a match-cut origin is a module constant (`ALERTS_LAYOUT`), not a prop, so sound and the next scene derive from it.
- A mode constant in the timing file can set a scene's variant and its length together (`FILM_END: "coverage" | "ruler"` picks the ending and its end beat), so one word re-flows the film.
- Candidates go to new files; the shipped scene file is never overwritten. The master takes `overrides` so a test bed is the real film with one scene swapped. The shipped source is snapshotted (`backups/src-v14/`) and `diff -rq` against it is the start-state proof of the next wave. A candidate may be re-rendered over itself before acceptance, with its snapshot refreshed.

## Recommend, do not ask

When the call is the owner's (taste, copy, money, someone else's brand), give the context in six lines and your pick first, as a vetoable line; then ask one question at a time. Three "what would YOU recommend?" replies in one session mean the questions were the wrong shape. Low-stakes calls are made and logged in the notes as "decided, vetoable". A critique's findings about copy are proposals even after the owner says "I agree with all": one audience-naming line a reviewer added was cut by the owner on sight. If a justification reaches ("a dramatic coordinated climax"), the design is wrong and will be vetoed on sight.

## Common fix patterns

### "Too slow" / "not enough time to read"

Opposite notes with one lever: reading time is made inside the scene before it is made by length. A tile legible 0.17 s before the picture moved on was "not enough time"; a whole extra backbeat (1.1 s) was "too slow"; 0.9 s, from raising the words earlier and starting the run half a beat later, was right. "Too slow" is shorter holds, faster entrances, or a scene cut, in that order; "can't read" is words earlier and fewer words, not slower entrances.

### "Too much text"

Count the words (`scripts/check-copy.mjs`, `writing-style.md`): 15 to 30 on a card, about 4 a second. Cut each card to the one thing its scene is about; the product's real wording is where the few words come from, not a reason to keep all of them.

### "Cheap" / "Canva" / "claude-ish"

One adjective is the whole note. It names the template look (`creative-direction.md`, "What reads as a template"): find which tell is on screen and replace it with the film's own object or the product's real surface, not with a different effect.


### "It feels late / early"

Usually a beat-sync issue. Check the event against the beat grid (see `beat-sync.md`). A cut on a downbeat can read as "late", so try the backbeat before it; but some scenes feel better starting on the downbeat, and the user's ear decides.

### "The cursor is off"

Three possible causes:
1. **Hotspot drift** - cursor scale changes aren't using the scale-ratio transform. See `cursor-math.md`.
2. **Missing keypoint** - cursor arrives at click position too late/early. Add an intermediate keypoint.
3. **Click target drift** - the target element moved during a prior fix, but keypoints are hard-coded. Refactor to compute click targets from layout math.

### "The type-on looks robotic"

Increase word overlap. Default `perWord * 0.6`. Try `perWord * 0.5` (more overlap) or drop `perWord` from 10 to 8 (faster per-word animation). If still robotic, the font-weight transition is broken - verify `font-weight` is consistent throughout the animation.

### "Scene N feels disconnected"

Usually a transition problem, not a content problem. Options:
- Add a shared element (a color, a card that carries through) between scenes.
- Swap the hard cut for a match-cut zoom or a cross-dissolve.
- Extend the outgoing scene's fade/MaskReveal by 3-6 frames so the handoff is softer.

### "The color is off"

Don't tweak by eye forever. Pick reference images, sample hex values, and assign them to named constants in the theme file. If the user says "the pink is too pink," ask them to name a color they'd expect instead ("coral", "magenta", "rose") and sample from a reference.

### "The logo looks wrong on dark bg"

Verify the `filter: brightness(0) invert(1)` trick is applied. If the logo has color detail that must be preserved (a colored smile, a gradient), render the wordmark as inline SVG + colored path rather than inverting.

### "Something flickers"

Non-determinism. Search for `Math.random()` in scene components and replace with `Math.sin(frame * k + seed)` or similar. Any `useMemo` with an empty dep array that reads `Date.now()` will also flicker.

## Render-gate discipline

Before every wave's render:
- Run `npm run typecheck`. If TypeScript fails, the render will fail - save the time.
- Verify `npm run dev` (Studio) renders the master without errors in the console.
- For each scene with a click: check the click frame is on a beat (the timing file's helpers tell you), and look at a still of that frame to confirm the cursor is on its target (`self-check.md`).

If the typecheck passes and Studio loads clean, the CLI render will succeed ~95% of the time. The 5%: font-loading issues (missing `subsets: ["latin"]`), composition ID underscores (see `gotchas.md`).

## Splitting a wave across sub-agents

When a wave has three or more fixes that touch different files, and your environment can run sub-agents, they can be done in parallel: one fix each, with the exact file, the change, and the check that proves it. Fixes that touch the timing file, the theme or a shared primitive stay with one agent, because two agents editing the same constants produce a merge nobody can reason about.

Whoever does the work, confirm it landed before building on it: `git status`, a typecheck, and a still of the affected frame. A report that says "done" is not the same as files on disk.

If your environment has no sub-agents, do the fixes one after another. The wave discipline is what matters, not who executes it.

## Studio hot-reload restarts

Remotion Studio caches the bundle as you commit. After 5-10 commits in a session, Studio's bundle drifts from disk and the browser starts throwing `MediaPlaybackError: Failed to fetch` or similar. The error is misleading - it looks like a b-roll problem but it's actually a stale bundle.

Fix: kill the dev server, restart with `npm run dev`. Do this proactively after any wave that adds new scenes, primitives, or assets.

If the error persists after a clean restart, then it's a real path problem. Verify b-roll paths with `ls public/b-rolls/`.

## The wave that ran 24 times

The loop that shipped one film in 24 waves over about 36 hours, each wave an hour or two:

1. A fresh-eyes review: sheets at 0.5 to 2 s, cut strips, full-size stills at every cut, hold and densest frame, the jerk report with the judged ranges, `check-sfx`, strings against the live site. No edits.
2. At most five ranked recommendations, each with its evidence on screen and a time. Stop until the owner picks.
3. Build the picks behind switches; a direction gets a test bed first.
4. Render the HD and its music-only twin and a side by side against the shipped film; `open` the file for the owner; three plain lines with times on what changed.
5. The owner's one-line verdict ("v14 accepted, render the 4K", "v7 replaces v6 as the shipped film", "the previous version felt better").
6. 4K only on the yes, taking the HD's audio. Notes, memory, snapshot; the README's render line and jerk ranges bumped.

Scope is held by naming it every wave ("no new scenes", "copy verbatim", "finish only", "9:16 out of scope until asked") and offered-but-not-built items ride a standing list.

## Handing the film to the next session

A long build ends with a handoff file, not a conversation: `assets/prompt-templates/handoff.md`, saved as `docs/video/handoff-wave<N>.md`, that the owner pastes as "Read it and follow it". One owner said it in words when a review ran long: "this context window became too overwhelming... let's tackle it in a new clean thread. please give me a paste-able handoff prompt." Its last section is the skill feedback from the wave, which the next session folds into these references; a lesson that stays in the notes is lost to the next film.

## When to stop iterating

The stop rule is per session, not per film: 24 waves were fine when each was the owner's decision and an HD render took minutes. Within a session, the user's 5th "one more thing" is often cheaper to defer to the next wave than to fix now. Signs it's time to ship this wave:

- Notes are getting increasingly subjective ("the vibe is off" with no specific target).
- You're re-fixing things that were fixed in the prior wave.
- The user says "this is great, but..." and trails off.

Ship the current cut. Write the unresolved notes into `docs/video/notes.md`. Come back after a day of distance.

## The "watch as real viewer" test

Before final sign-off, render at full resolution (`--crf=15 --scale=2` for 4K, or the target platform spec) and watch it on the device it's meant for:

- LinkedIn ad? Open LinkedIn on desktop, upload as a test, watch in-feed.
- Instagram Reel? Push to your phone, open Instagram, watch vertically.
- Homepage hero? Embed in a staging page, watch at full viewport.

Watching in Studio or on your dev machine at 50% playback masks 3-4 subtle issues per film. The final-platform watch catches them.

## Keeping wave notes

Keep iteration notes as numbered, dated entries in `docs/video/notes.md`:

```markdown
## Wave 2 - animation tuning (2026-04-24)

1. [fixed] Cursor drifts off-target in Scene 5 after click feedback - scale-ratio transform.
2. [fixed] Scene 3 perWord too slow - dropped from 12 to 10.
3. [skip/v2] Finale typography feels corporate - try Editorial Serif in Plus Jakarta later.
4. [fixed] Pink #EE2E7F looks muddy on cream - bumped saturation to #EB2980.
5. [checking] "Bring us the pain" phrase lift feels late - verifying beat-sync.
```

Commit these. They are how a later session, or a later film, learns what was tried.
