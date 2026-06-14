# Schematic UI fidelity - designing fake UI that earns trust

When the user's product has no real UI to record (early-stage, API-only, or browser-extension-only), scenes that "show the product working" need invented schematic UIs. This is its own design discipline - generic placeholder boxes look amateurish; convincing schematic UIs read as polished without being literal.

## When you need this

- Demo scenes that show "the product on a website" but the product is a Chrome extension, an API, or a CLI.
- Scenes that show third-party platforms (LinkedIn, Gmail, Slack) where you can't legally record real screenshots.
- Scenes that show data visualizations or dashboards that don't yet exist in production.

## The "adjacent but not exact" naming pattern

The cardinal rule: schematic UIs should *evoke* a real platform without copying it. The viewer should think "ah, this is the LinkedIn moment" without you using LinkedIn's actual brand assets.

Concrete patterns:

| Real platform | Schematic equivalent |
|---|---|
| LinkedIn header (`#0A66C2` blue) | Slate-blue gradient (`#3D5A80`) - adjacent but desaturated |
| Gmail compose | Coral border + cream bg + your brand title bar |
| Slack thread | Cream bubbles + your brand avatar circles |
| Stripe Checkout | Your brand colors + a familiar layout (logo, line items, button) |

Never use the actual brand color, logo, or trademarked icon from the platform you're evoking. Either you'll get a takedown, or the scene reads as a real product screenshot and you've now mis-attributed credit.

## Components, not screenshots

Build schematic UIs as React components, not as static images. Components let you:

- Drive content from data (personas, products, pricing).
- Animate in primitives (cursor clicks, button squishes, card slides).
- Reuse across scenes with different props.

Skip Photoshop or Figma exports. Inline SVG + CSS rendered components scale to 4K cleanly.

## Three reference patterns

### 1. Schematic profile card (LinkedIn-ish)

For "view a prospect's profile" scenes:

```
┌────────────────────────────────────────────┐
│ ████████████████ slate gradient header █████│
│   ⬤                                  [pill] │
│                                             │
│   ⬤  cutout-style avatar                   │
│                                             │
│   Sarah Chen                                │
│   Head of RevOps at Ramp                    │
│   San Francisco, CA                         │
│                                             │
│   [+ Connect]                               │
└────────────────────────────────────────────┘
```

Visual cues that signal "professional network":
- Slate-blue gradient header bar
- Profile photo in a circle, overlapping the header bottom edge
- Name in heavy display weight
- Title + company on one line, lighter weight
- Location on a third line, mutest gray
- "Connect" pill button in slate, white text, rounded

What NOT to include:
- Real LinkedIn blue (`#0A66C2`) - pick a desaturated slate instead
- "in" wordmark in any form
- LinkedIn's three-dot menu icon

### 2. Schematic email composer

For "the bad email" or "compose a message" scenes:

```
┌────────────────────────────────────────────┐
│ New Message                          ⬤ ⬤ ⬤ │
├────────────────────────────────────────────┤
│ To       sarah@ramp.com                    │
├────────────────────────────────────────────┤
│ Subject  Quick intro                       │
├────────────────────────────────────────────┤
│ Congrats on your Series A 👋               │
│ |                                           │
│                                             │
├────────────────────────────────────────────┤
│ [Send]                              🗑      │
└────────────────────────────────────────────┘
```

Visual cues:
- Branded title bar at top (your brand color, not Gmail red)
- Three dots in title bar (close/minimize/expand)
- Two header rows: "To" and "Subject"
- Body area where typing happens
- Bottom action bar: brand-colored Send button + a recycle bin or archive icon (recycle bin reads as "delete" more clearly)

### 3. Schematic API panel (developer-facing)

For "the product is an API" scenes:

```
┌──────────────── REQUEST ─────────────────┐
│┃                                          │
│┃  POST  https://yourapi.example.com/v1/x  │
│┃  ─────────────────────────────────────   │
│┃                                          │
│┃  {                                       │
│┃    "linkedin": "in/sarahchen"            │
│┃  }                                       │
└──────────────────────────────────────────┘

┌──────────────── RESPONSE ────────────────┐
│┃  [200 OK]                                 │
│┃                                          │
│┃  {                                       │
│┃    "icebreaker": "Saw your..."           │
│┃  }                                       │
└──────────────────────────────────────────┘
```

Visual cues:
- Vertical accent rule on the left (your brand color, ~4px)
- Mono font (JetBrains Mono, IBM Plex Mono)
- Soft paper-cutout shadow for warmth (vs flat tech)
- "200 OK" status pill in your brand color
- JSON in graphite, never bright-colored syntax highlighting

What NOT to include:
- Real API endpoints from competitors
- Authentic-looking tokens or API keys (even fake ones can read as a real leak)

## Inventing personas

Schematic UIs need fake people. Make them up cleanly:

- **Names** that don't accidentally match real public figures. Mix common first names with common last names ("Sarah Chen", "Marcus Reyes", "Priya Iyer").
- **Job titles** that match the target audience of the product. For a B2B SaaS targeting RevOps, prospects should be RevOps / Founding GTM / Outbound Lead at recognizable B2B companies.
- **Companies** that are real but unrelated to the user's actual customers. Pick well-known B2B SaaS (Ramp, Linear, Vanta, Notion). Avoid names of the user's actual customers.
- **Photos** as paper-cutout silhouettes or AI-generated portraits, NOT photos of real people scraped from the internet.

Document the persona inventory in a `data/personas.ts` file.

## Brand consistency across schematic UIs

All schematic UIs in the same film should use:

- The same brand palette (don't introduce new colors in schematic UIs).
- The same fonts (display + UI + mono - no rogue typefaces).
- The same shadow / corner radius / border treatments.

This is what separates a polished schematic from a placeholder. The schematic UI feels like *your brand* expressing *another platform's idea* - not a generic mockup.

## Vary repeated rows or it reads fake

A mock dashboard or table where every row has the same sparkline shape, the same trend, and the same value instantly looks synthetic - real data has spread. Vary each row *deterministically* by seeding a hash off the row index (see `animation-patterns.md` -> "Deterministic variation (never Math.random)"), so the spread is reproducible across renders rather than reshuffling every frame. Drive trend shape, balance, and status from that seed: some rows trending down, some flat, a couple healthy and one in the danger state. A dashboard that looks lived-in sells the product; eight identical rows announce that it's a prop.

## Animating schematic UIs

Schematic UIs are static React components. To animate them, wrap with primitives:

```tsx
<SlidePopIn startFrame={0} fromY={80}>
  <BreathingPulse startFrame={20}>
    <SchematicProfileCard persona={sarah} />
  </BreathingPulse>
</SlidePopIn>
```

The schematic doesn't know it's being animated. This separation keeps the components clean and reusable.

For interactions (cursor clicks on a button inside the schematic), use either:

- A computed click target (`SCHEMATIC_PROFILE_CARD_LAYOUT.brandButton.center` exported from the component).
- A render-time bounding-box ref (via `getBoundingClientRect()` on a `useRef`).

See `references/click-positioning.md` for the trade-offs.

## Past production note

The Meltly demo invented three schematic UIs:

- Profile card (LinkedIn-ish) - used in scenes 4 and 6, with 4 different personas.
- Email composer - used in scene 3, with one fake email body.
- API panel - used in scene 8, with one fake request/response.

All three were defined as React components in `src/ui/`, parameterized by data props, and wrapped with animation primitives in scenes. Total component lines: ~250. Total schematic-UI-related iteration churn: 3 small fixes across 4 waves (most flagged by the user as "the click missed the button" - see `click-positioning.md`).
