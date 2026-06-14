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
grep -rn "—" remotion-video/src/ remotion-video/public/personas* 2>/dev/null
grep -rn "–" remotion-video/src/ 2>/dev/null
grep -rn "…" remotion-video/src/ 2>/dev/null
```

All three should print nothing. If any prints something, fix before rendering. This includes data files (personas, copy constants), comments, and any string literal that ends up on screen.

A sed pass to bulk-fix:

```bash
find remotion-video/src remotion-video/public -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i '' 's/—/-/g; s/–/-/g; s/…/.../g' {} +
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
