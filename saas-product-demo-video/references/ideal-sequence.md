# Ideal sequence - annotated

The full flow from "I want to make a product video" to "ship on LinkedIn." Each step is specific and runnable. Rationale follows each item - skip at your peril.

## Phase 0 - Prereq check

Before anything else, run `prereq-check.md`. Verify Remotion, Super Powers plugin, Python 3 + librosa. Don't start intake while Remotion is missing; you'll have to restart.

## Phase 1 - Asset intake (Pillar 1)

**1. Gather inputs first, write code last.** Run `assets/prompt-templates/asset-intake-questionnaire.md`. Ask for:
- Aspect ratio (16:9, 9:16, or both - decide now, not later)
- Duration (20-45s)
- Logo (SVG preferred) + confirmation that `filter: brightness(0) invert(1)` is acceptable for dark-bg variants
- Brand hex colors (primary accent + 3-6 supporting pastels)
- Font stack (all on Google Fonts - verify before accepting)
- Copy / script (prefer user-supplied draft; offer to generate if they have nothing)
- Voiceover (optional; if present, user's Claude handles integration)
- Soundtrack file (required for beat-sync)

**Rationale:** Every minute you spend on assets upstream saves 30 minutes of re-rendering downstream. A film with weak copy but great motion still feels weak. Motion amplifies copy; it does not rescue it.

## Phase 2 - Vibe (Pillar 2)

**2. Produce reference-video breakdowns.** Ask the user for 2-3 YouTube references whose vibe they want. Use `assets/prompt-templates/gemini-reference-video.md` against each URL in Gemini 2.x or NotebookLM. Save outputs as `references/gemini-<name>.md` in the user's repo.

**Rationale:** The directorial verb vocabulary ("push-through," "whip-pan," "V-cut pull-back," "ink-mask") is the most load-bearing output - it gives you specific motion primitives to build around. Without references you will invent a style in isolation and the user won't recognize it.

## Phase 3 - Beats (Pillar 3)

**3. Listen to the soundtrack and mark beats.** Run `scripts/detect-beats.py <soundtrack.mp3> --fps 30 --out beats.json`. Emits BPM, first kick frame, snare timestamps in seconds and frames. Review the output against the audio - librosa gets 120 BPM + clear kick/snare tracks right; syncopated or soft tracks need a manual pass.

**4. Write the timing constants object.** Use `assets/code-templates/theme-v2.ts` as the template. Every scene start and duration derives from beats. Check: do all scene durations sum to `totalFrames`? Scene boundaries on snares only.

**Rationale:** Scene boundaries on snares make the cut *feel* like a drum hit. Clicks on kicks feel lazy; clicks on snares feel deliberate. This is the "drummer ear" test.

## Phase 4 - Scaffold

**5. Scaffold Remotion manually.** Write `package.json` / `tsconfig.json` / `remotion.config.ts` by hand using `references/project-scaffold.md`. Do NOT run `npx create-video` inside a git repo - it blocks on an arrow-key prompt you can't push through a pipe.

**6. Register per-scene debug compositions in Root.tsx.** Before writing any scene, register a `Composition` for each scene ID (`v2-Scene01`...`v2-SceneN`) in Root.tsx in addition to the master. Use hyphens, never underscores (Remotion rejects underscores at render time).

**7. Load every font at Root.tsx top level** with `subsets: ["latin"]` - kills the 21-network-request warning.

**Rationale:** Per-scene debug compositions are the single biggest speed-up. Scrubbing a 5-second scene is 30× faster than scrubbing the full 28s master.

## Phase 5 - Brainstorm + spec

**8. Invoke `superpowers:brainstorming` with visual companion.** Use the browser companion for:
- Visual style direction (editorial / pastel poster / bold contrast / other)
- Signature effect style (flame, portal, whip-pan, scroll)
- Layout for UI scenes (split 50/50, top-centered + UI below, full-frame)
- Cursor style (if used)

Present 3-4 side-by-side options with the same line of copy rendered in each style. User picks with one word.

**9. Write the spec doc.** Save to `docs/superpowers/specs/YYYY-MM-DD-<name>-design.md`. Cover: deliverable scope + deferred, narrative arc, full beat sheet (scene / time / frames / bg / content / animation / cursor), visual system, product UI fidelity per card, critical files list, verification checklist, flagged risks. See `assets/prompt-templates/spec-doc.md`.

**10. Self-review the spec.** Hunt for placeholders, contradictions, ambiguities. Fix inline. Then user reviews + approves. No code until green light.

## Phase 6 - Plan + build

**11. Invoke `superpowers:writing-plans`.** Generate the implementation plan with exact code for every task. Each task: files (create/modify with exact paths), steps (imperative verbs + paste-verbatim code blocks), typecheck step, commit step. Plans can run 2000-3000+ lines - that's fine, the length is the point.

**12. Build animation primitives first.** Order: SolidBg → TypedText → MaskReveal → PopIn → Cursor → ZoomPunch → FloatingElements. Then UI cards (EmailAlert, ReviewerContactCard, BuyingCommittee, PainPointsCard, PitchCard - or the equivalents for the target product). Then scenes. Then master composition. Then renders.

**13. Invoke `superpowers:subagent-driven-development`.** Dispatch one subagent per task. Pragmatic compromise: for pure plan-paste tasks (mechanical foundation components), batch ONE code-quality review across 3-5 commits at the end. For structural tasks (layouts, multi-scene wiring), run the full per-task review cycle.

**14. Spot-render Scene 1 alone.** Establish the style early. Get user approval before building the rest. Cheaper to reject the style on scene 1 than after all 6 scenes are built.

## Phase 7 - Iterate

**15. Iterate in waves.** Cap each wave at 5-8 fixes. One subagent dispatch per wave with all fixes as OLD/NEW code blocks.

**16. Split surgical and structural into separate waves.** Surgical first, structural second. Combining them cascades alignment bugs (cursor targets drift, accent word jumps, eyebrow Y offsets) across multiple follow-up waves.

**17. After any layout change, recompute cursor targets via ratio transform.** See `cursor-math.md`. `x_new = center + (x_old - center) * newScale/oldScale`.

## Phase 8 - Render + ship

**18. Master-render at publish quality.**
- HD (LinkedIn, most platforms): `--crf=14 --image-format=png`
- 4K archival: `--scale=2 --crf=15 --image-format=png`
- Thumbnail: `remotion still <Comp> <frame> --image-format=jpeg --jpeg-quality=95`

**19. Spot-check against the beat map at 0.5× speed.** Every visual change should feel locked to a beat - not arbitrary. If something feels "off," it's probably a frame or two off the snare.

**20. Ship.** Don't over-polish. The beat grid + color discipline + consistent type already does 90% of the work.

## Phase 9 - Follow-ons

**If a vertical reel is also needed** and was not built in parallel, see `vertical-port.md` for the V2V parallel constants pattern and the horizontal-as-source-of-truth sync discipline. Porting is cheaper when started early.

**If the user keeps coming back with horizontal revisions** after a vertical port, use `git log --oneline <last-sync>..HEAD` and skip `Revert` pairs before porting changes.
