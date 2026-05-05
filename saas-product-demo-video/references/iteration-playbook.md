# Iteration playbook

The skill builds the first pass in one shot, then iterates in waves. Each wave is: **watch → gather notes → categorize → execute**. Without structure, iteration devolves into infinite nitpick loops.

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
- enables parallel subagents (each wave batch has 3-8 independent changes)
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

Surgical changes: execute directly with Edit tool. Pair a quick visual verification (render one scene, not the full film).

Structural changes: re-run the relevant phase. Scene reorder → update `theme-v2.ts` V2 constants, re-verify beat-sync, re-render. New scene → draft the scene copy + spec addendum, write the scene component, add to Act2Master, render.

## Common fix patterns

### "It feels late / early"

Usually a beat-sync issue. Run the click-on-kick audit (see `beat-sync.md`). A cut on a kick instead of a snare reads as "late" 90% of the time.

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

Don't tweak by eye forever. Pick reference images, sample hex values, and assign them to named constants in `theme-v2.ts`. If the user says "the pink is too pink," ask them to name a color they'd expect instead ("coral", "magenta", "rose") and sample from a reference.

### "The logo looks wrong on dark bg"

Verify the `filter: brightness(0) invert(1)` trick is applied. If the logo has color detail that must be preserved (a colored smile, a gradient), render the wordmark as inline SVG + colored path rather than inverting.

### "Something flickers"

Non-determinism. Search for `Math.random()` in scene components and replace with `Math.sin(frame * k + seed)` or similar. Any `useMemo` with an empty dep array that reads `Date.now()` will also flicker.

## Render-gate discipline

Before every wave's render:
- Run `npm run typecheck`. If TypeScript fails, the render will fail - save the time.
- Verify `npm run dev` (Studio) renders the master without errors in the console.
- For each scene with a click: check the click frame is on a snare (use the debug console log from `isSnare()`).

If the typecheck passes and Studio loads clean, the CLI render will succeed ~95% of the time. The 5%: font-loading issues (missing `subsets: ["latin"]`), composition ID underscores (see `gotchas.md`).

## Subagents during iteration

For any wave with 3+ independent surgical fixes, spawn subagents in parallel. One subagent per fix:

> Subagent A: adjust Scene 3 end from master 450 to master 420. Update `V2.scene3Dur` from 180 to 150. Update the follow-up scene starts by -30. Re-verify the total sum. Report back with the diff.

> Subagent B: increase cursor perWord-overlap in `TypedText.tsx` from 0.6 to 0.5. No other changes.

> Subagent C: change `v2Colors.pink` from `#EE2E7F` to `#EB2980`. Report back.

Each subagent works on its own area. Merge their diffs. Re-render once.

### Subagent context-budget gotcha

A single subagent can run out of context mid-task on long batches. Symptom: subagent reports DONE but only half the files were actually created and no commits land. Always verify with `git log --oneline` and `ls` before assuming success.

Mitigations:

- **Cap subagent batches at 3-4 files per dispatch.** A "create all 11 scenes in one subagent" call regularly fails partway. "Create scenes 1-3" reliably succeeds.
- **Have the subagent commit per logical group**, not in one final commit. If they crash before the final commit, you lose visibility into what landed.
- **Always include "if you encounter context pressure, stop, commit what's done, and report DONE_WITH_CONCERNS"** in the dispatch prompt. The subagent will tell you it's about to fail rather than failing silently.

When a subagent dies mid-task, the recovery is to dispatch a fresh continuation subagent with explicit "what's already on disk, what remains" instructions. Don't try to revive the dead one.

## Studio hot-reload restarts

Remotion Studio caches the bundle as you commit. After 5-10 commits in a session, Studio's bundle drifts from disk and the browser starts throwing `MediaPlaybackError: Failed to fetch` or similar. The error is misleading - it looks like a b-roll problem but it's actually a stale bundle.

Fix: kill the dev server, restart with `npm run dev`. Do this proactively after any wave that adds new scenes, primitives, or assets.

If the error persists after a clean restart, then it's a real path problem. Verify b-roll paths with `ls public/b-rolls/`.

## When to stop iterating

The user's 5th "one more thing" is often cheaper to defer to v2 than to fix in v1. Signs it's time to ship:

- Notes are getting increasingly subjective ("the vibe is off" with no specific target).
- You're re-fixing things that were fixed in the prior wave.
- The user says "this is great, but..." and trails off.

Ship the current cut. Open a `v2-notes.md` with unresolved notes. Come back after a day of distance.

## The "watch as real viewer" test

Before final sign-off, render at full resolution (`--crf=15 --scale=2` for 4K, or the target platform spec) and watch it on the device it's meant for:

- LinkedIn ad? Open LinkedIn on desktop, upload as a test, watch in-feed.
- Instagram Reel? Push to your phone, open Instagram, watch vertically.
- Homepage hero? Embed in a staging page, watch at full viewport.

Watching in Studio or on your dev machine at 50% playback masks 3-4 subtle issues per film. The final-platform watch catches them.

## Notion-level notes hygiene

Keep iteration notes as numbered, dated entries in `docs/superpowers/plans/<name>.md`:

```markdown
## Wave 2 - animation tuning (2026-04-24)

1. [fixed] Cursor drifts off-target in Scene 5 after click feedback - scale-ratio transform.
2. [fixed] Scene 3 perWord too slow - dropped from 12 to 10.
3. [skip/v2] Finale typography feels corporate - try Editorial Serif in Plus Jakarta later.
4. [fixed] Pink #EE2E7F looks muddy on cream - bumped saturation to #EB2980.
5. [checking] "Bring us the pain" phrase lift feels late - verifying beat-sync.
```

Commit these. The retro after the project uses them.
