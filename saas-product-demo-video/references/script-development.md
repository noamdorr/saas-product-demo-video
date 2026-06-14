# Script development - screen-by-screen methodology

Most users come in with a rough product idea and a vague sense of "I want a demo video," not a finished script. This reference is the skill's structured way to develop a 20-45s SaaS demo script through dialogue with the user, before any code is written.

It pairs with `superpowers:brainstorming` (which handles open-ended creative discovery). Brainstorming surfaces the *idea*; this reference shapes the idea into a *shootable script*.

## When to use this

Run this after asset intake (Pillar 1) is complete and before scene-building begins. Two signs the user needs script help:

- They describe the product but haven't written any specific lines.
- They have a draft headline or two, but no scene-by-scene breakdown.

If the user already has a full screen-by-screen script with locked copy, skip this and proceed.

## The 4-act default arc (good starting structure)

Most good 30-second SaaS demos fit a four-act shape. This is a *recommendation* - many successful demos break this in interesting ways, but the structure is a useful default.

| Act | Time (≈) | Beat | Energy |
|---|---|---|---|
| 1. Pain | 0:00 - 0:08 (~25%) | The problem the product solves. Make the viewer feel it. | Loud, fast |
| 2. Quality moment | 0:08 - 0:17 (~30%) | One hero use case, shown not told. The product working. | Tight, satisfying |
| 3. Pivot to scale | 0:17 - 0:26 (~30%) | What the product unlocks at volume / over time. | Calm, technical |
| 4. Brand + CTA | 0:26 - 0:30 (~15%) | Logo, tagline, single call-to-action. | Resolved, warm |

The 4-act split has two important properties:

- **Pain takes a quarter of the runtime** - less and the payoff doesn't feel earned; more and viewers bounce.
- **Acts 2 and 3 are roughly equal** - neither "quality" nor "scale" should dominate the message.

Variations that work:

- **Two-act (pain to resolution)** for very simple products where scale isn't the story.
- **Demo-first arc (show working then tease pain it removes then CTA)** for tools where the demo is visually rich enough to lead.
- **Testimonial-driven** if the user has strong customer quotes.

If the user has a strong instinct for a different structure, follow them. The 4-act is a default, not a rule.

## The dialogue flow

Walk through these questions one at a time. Multiple-choice when possible. Don't batch them - the user's answer to question N often shifts the right question N+1.

### Question 1 - What's the punchline of these 30 seconds?

The single thing the viewer should take away. Examples:

- "Personalization, on every prospect" (lead with quality)
- "Personalization at scale, via API" (lead with volume)
- "Hybrid" (open with quality moment, pivot to scale)

The punchline determines the ratio between Act 2 and Act 3. Lock this before writing scene copy.

### Question 2 - Visual language?

- **A. Cinematic / minimal** - real footage, soft focus, lots of negative space. Apple-ish. Premium feel.
- **B. Editorial collage / playful** - paper-cutout aesthetic, cutout-on-flat-color. Vox/Instagram-explainer energy. Indie.
- **C. SaaS-clean motion graphics** - UI shots + animated diagrams + typography. Builder-ish, technical. Speaks to engineers.
- **D. Hybrid** - cinematic for the pain side, motion graphics for the proof side. The cut between the halves becomes the rhetorical pivot.

This determines how you'll approach Phase 2 (reference videos) and the b-roll selection (if any).

### Question 3 - Voice direction?

- **A. Text-only + music + sfx** - punchy on-screen typography drives every beat. Most common.
- **B. Voiceover** - friendly human voice carries the narrative. Adds personality, adds production cost.
- **C. Subtitled-style** - captions written like spoken voice. Cluely / TikTok energy.
- **D. Hybrid** - silent first half, VO kicks in for the payoff.

If text-only, on-screen copy must carry every beat. If VO, drop the beat-sync rule and align to phrase boundaries (see `beat-sync.md`).

### Question 4 - Where does this 30s live?

- **Landing-page hero (16:9, autoplay muted)** - needs to read with sound off for the first 3 seconds.
- **LinkedIn / Twitter feed (1:1 or 4:5)** - stop-the-scroll energy. Phone-vertical UI fits well.
- **Vertical (9:16)** - TikTok / Reels / LinkedIn-vertical. Cropping discipline.
- **Multi-cut (master 16:9 + social cutdowns)** - design with center-safe composition.

Aspect ratio decisions affect every layout downstream. Lock before writing the screen-by-screen.

### Question 5 - CTA?

- **"Try free"** / "Get an API key" - for self-serve SaaS.
- **"Book a demo"** - for sales-led SaaS.
- **"Sign up for waitlist"** - for unreleased products.
- Brand-only (no explicit CTA) - for awareness campaigns.

The CTA is the single closing frame. It must match how the user actually wants to convert.

## Writing the lines along the arc

Once the macro shape and the punchline are locked, these three principles keep the copy moving the way the arc does.

- **POV arc: you to product to you.** State the pain in second person ("your sending goes quiet"), name the product for the fix ("Acme watches every balance"), then return the payoff to the viewer ("now you'll know"). Ending on "you" makes the win feel like the viewer's, not the tool's. A film that ends on what the product does, rather than what the viewer gets, leaves the viewer outside the result.
- **Answer the pain's halves; use the inversion.** If the pain is two-part (no visibility *and* no warning), give it two solution beats - one for each half - so nothing is left dangling. The literal inversion of the pain line is a strong spine for the payoff: pain "and no one tells you" becomes payoff "now you'll know." The arc reads as a closed loop instead of two loosely related halves.
- **Save the metaphor for the CTA.** If the brand has a central metaphor, land it once, in the CTA. Repeating it earlier - or foreshadowing it in Act 1 - dilutes the payoff and can muddy the literal copy in the beats that need to land plainly. Let the metaphor be the last thing the viewer hears.

## The screen-by-screen format

Once the macro shape is locked, draft the screen-by-screen. Each scene gets four fields:

```markdown
**Scene N · 0:XX - 0:YY · "scene-name"**
- Visual: <what's on screen - b-roll, schematic UI, motion graphics>
- On-screen copy: <**bold the lines that will appear** - placeholder vs locked>
- Motion: <how things enter, snap, settle. Specific verbs.>
- Sfx: <audio cues that anchor beats - clicks, dings, whooshes>
```

Mark every copy line as either **locked** (won't change without an explicit user OK) or **placeholder** (still tunable). Iterating becomes much easier when the user knows which lines are open for revision.

### Why these four fields and not more

- **Visual** says what frame the viewer will see.
- **On-screen copy** is the load-bearing text. Everything else amplifies copy.
- **Motion** is the directorial verb - type-on, slide-in, zoom-out, etc.
- **Sfx** anchors the beat for the editor.

Resist adding camera moves, transitions, or layout details at this stage. Those go in the spec doc after the script is locked.

## Schematic UI inventories

If the product has no real UI to record, identify which schematic UIs you'll need to invent. For each one:

- Name it (e.g. "schematic LinkedIn-ish profile card", "schematic API request panel").
- Note which scenes use it.
- Reference `references/schematic-ui-fidelity.md` for the design pattern.

Get this list locked before the spec doc is written. It tells you how many schematic UI components Phase 5 will build.

## Reference video integration

If Phase 2 produced reference-video breakdowns (`references/gemini-*.md`), each scene's "Motion" field can borrow specific transition verbs from the references. Cite the source: `// match-cut zoom OUT (absorbed from gemini-vercel-launch.md, 0:14)`.

This makes review faster - the user can see exactly which references inspired which scene moves.

## Locked-copy reference page

After the screen-by-screen is approved, extract every on-screen string into a single "locked copy reference" section in the spec doc. One scan to verify spelling, punctuation (see `writing-style.md`), and consistency with the brand.

Example:

```markdown
## Locked copy reference
- **"Cold outreach is loud."** (Scene 1.1)
- **"Inboxes are full."** (Scene 1.2)
- **"Saw your half-marathon split last Sunday - that 7:42 mile is criminal."** (Scene 2.2 icebreaker)
- **"Now do this for ten thousand."** (Scene 3.1)
- **"Scalable warmth for cold outreach"** (Scene 4.2 tagline, 'warmth' in coral)
- **"Try for free · yourapp.com →"** (Scene 4.2 CTA)
```

Run the writing-style check (`grep -rn "—"`) against this section before moving on.

## Output

The script-development phase produces:

1. The macro shape (4-act split + timing budgets per act)
2. The screen-by-screen breakdown with locked/placeholder labels
3. The schematic UI inventory (if any)
4. The locked-copy reference page

These slot directly into the spec doc (Phase 5), which adds visual fidelity, animation primitives, beat-sync, and risk flags.
