# Writing style - keep AI-tells out of user-facing copy

The on-screen text and the icebreaker copy are the most-judged parts of the film. Anything that reads as "obviously AI-generated" undermines the entire production. This reference is the style guide.

## Banned characters and constructions

These appear by default in AI-generated text and signal "machine" to a reader before they consciously notice:

| Avoid | Use instead |
|---|---|
| `—` (em-dash, U+2014) | `-` (hyphen-minus) |
| `–` (en-dash, U+2013) | `-` (hyphen-minus) |
| `"…"` (curly quotes) | `"…"` (straight quotes) |
| `'…'` (curly single) | `'…'` (straight single) |
| `…` (ellipsis character, U+2026) | `...` (three periods) |
| `–` in date/number ranges | `-` (just use a hyphen) |
| Oxford comma in punchy social copy | optional - prefer rhythm |

The biggest tell is the em-dash. It's used in writing tools' default style and is rare in casual real human writing - most humans type a hyphen.

## A pre-render check

Before any render, run:

```bash
# from the Remotion project root
grep -rn "—" src/ 2>/dev/null
grep -rn "–" src/ 2>/dev/null
grep -rn "…" src/ 2>/dev/null
grep -rn "[“”‘’]" src/ 2>/dev/null
```

All four should print nothing. A grep pointed at a folder that does not exist also prints nothing, so make sure `src/` is the folder your scenes are in. Check the script table in `docs/video/brief.md` the same way. If any prints something, fix before rendering. This includes data files (personas, copy constants), comments, and any string literal that ends up on screen.

A sed pass to bulk-fix:

```bash
find src -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -exec perl -pi -e 's/—/-/g; s/–/-/g; s/…/.../g' {} +
```

## Copy patterns that hurt

Beyond punctuation, these phrasing tics signal AI authorship:

- **"Effortlessly," "seamlessly," "robust," "powerful," "leverage," "unlock"** in headlines. Cut every adjective that doesn't add information.
- **Closing sentences that summarize what was just said.** ("In short, X is the best." - never the first version of a tagline.)
- **Headlines structured "X without Y, Y without X."** ("Productivity without burnout.") This is everywhere; readers tune it out.
- **Three-noun lists with the Oxford comma** in punchy display copy. ("Faster, smarter, and stronger." Drop the comma, drop the "and": "Faster. Smarter. Stronger." reads better.)
- **"Get started in seconds" / "Built for teams of all sizes."** Generic SaaS scaffolding. Replace with something specific to the product.
- **Don't repeat the subject.** Two consecutive sentences with the same grammatical subject read like a feature list, not a story. ("Acme watches your spend. Acme warns you before zero.") Vary the subject or shift POV - make the second line about the user: "Acme watches your spend. You'll know before zero."
- **Name the subject; watch your pronouns.** An ambiguous "it" or "they" grabs the nearest salient noun, which is often the brand or the mascot rather than the thing you mean. Name the subject outright. ("...so it never goes quiet again" can read as a mascot going silent rather than the user's outreach.)

## Word budget

Count the words that reach the screen, every label and name once. The numbers a film its owner liked sat at, and the ones that drew notes:

- About 4 words a second of runtime, 4.5 at most. A 28 s film with 117 words (35 of headline, 82 across three product cards) was right; a cut of the same film with 215 was "too much text".
- 15 to 30 words on a product card. A card is the one idea its scene is about, not the screen.
- Headlines under 12 words and on one line. A two-line headline does not read at the speed a cut moves; break the line yourself with `\n` where the sense breaks, never let it wrap.
- No prices, credits, plan names or "free" on screen unless the owner asks ("reveal LinkedIn for 1 credit" drew "why so much text in a marketing video? We just need to communicate the idea, not explain everything").
- No line that names the audience to itself ("How lenders stay ahead") when the audience is the only one who will see the film; one owner cut such a line a reviewer had added.
- The hook does not open with "Introducing" or the product's name. Lead with the pain, a result or a contrast; the name arrives with the product.

`scripts/check-copy.mjs` counts the words in `src/data/` (or the scene files), reports words per second against the runtime in `out/timing-dump.json`, lists the longest strings and fails on the tells below. Run it before every render; read the per-file numbers, because a data file also holds texture nobody reads.

Two kinds of text, two rules. Copy (headlines, card titles, a product's own sentences) is verbatim from the product's site or the owner's words, and a changed word is the owner's call. Sample data inside the UI (names, dates, amounts) may change to keep one story straight across scenes (gotcha 56), and every change from the site's sample is logged in `docs/video/notes.md` as "data that now differs from the site".

## Sizes that survive a phone

A film watched on a phone at night is the common case for a founder's review. Body copy at 36 px (in the 1920x1080 frame), a call to action at 40 px and a URL at 56 px survived; 26 to 32 px body was too small to read in the feed. A label over a lit field (a city name over map dots) needs an ink chip behind it; bare white type was lost.

## Emphasis in headlines

Emphasis comes from size, weight and the line break. One word of a headline set in italic, in the accent color, in a cursive face or in gradient text is the signature of AI-generated landing pages (with an eyebrow label above every heading and three equal icon cards), and a client who has seen that look will read the film as one more of them. Keep a colored word for a counter or a single word that is the whole point, and even then prefer weight. The same family of tells in slogans: an antithesis ("Signal, not noise") reads as machine-made even when it is verbatim from a sub-page; one owner called it "too claudesque" and took the home page's own line instead.

## Punctuation rules for on-screen text

- **No trailing punctuation on display headlines** unless the period is doing rhetorical work. ("Cold outreach is loud." with a period reads as a verdict. "Cold outreach is loud" without is also fine - be consistent across the film.)
- **One emoji max per scene.** Emojis are loud; multiple in one frame fights for attention.
- **No exclamation points in headlines** unless the brand is genuinely shouty. They're almost always weaker than no punctuation.

## Icebreakers - the highest-stakes copy

If your film demos personalized cold-outreach or icebreakers, those lines are what viewers will judge product quality on. Bad icebreaker copy = viewers think the product produces bad output.

Good icebreaker patterns:

- **Reference something specific that could only come from the prospect's actual content.** Half-marathon split times. A specific commit timestamp. A named pet. A podcast take. Generic "I see you work in RevOps" doesn't sell anything.
- **Use voice that sounds like a real human typed it.** Lowercase casualness when appropriate. Run-on phrasing. Genuine opinions ("aged well", "criminal", "banger").
- **Avoid scaffolding intro phrases.** "I noticed that..." / "I just wanted to reach out..." Cut everything before the actual observation.

Counter-examples that don't sell:

- "Congrats on your Series A" (the famous bad one - every founder ignores this)
- "I see you're in RevOps - have you considered..." (could apply to anyone)
- "Loved your recent post about X" (vague, low-effort)

## When a longer style guide is needed

If the user has a brand voice document, a tone-of-voice guide, or a "humanized writing" / "stop-slop" reference, prefer those over this default. This file is a fallback for when there is no brand-voice guide.

If the brand voice is loud, irreverent, or actively anti-corporate, override the punctuation defaults to match - but the AI-tell character bans (em-dash, curly quotes, ellipsis character) still hold. Those are dead giveaways regardless of voice.
