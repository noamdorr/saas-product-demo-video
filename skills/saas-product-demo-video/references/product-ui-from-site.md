# The product's real UI, rebuilt from its public site

`schematic-ui-fidelity.md` covers products with no interface to show. The more common case is a product whose marketing site already shows its UI: a dashboard in the hero, feature cards with real rows, tags and dates. A film that redraws those screens from memory gets the note "the dashboard was invented" (a real one did); a film that rebuilds them from measurements reads as the product. This page is the recipe.

## Why rebuild instead of pasting the screenshot

A screenshot cannot land its rows on beats, lift the row the cursor clicks, draw its donuts in, or be pushed through at 4K without going soft. Components can. The site's screens are the spec, not the asset.

## Capture and measure, by an agent, before any scene exists

Give one agent the site's URLs and the blocks to find by their text, and ask for three things:

1. **Crops at 2x.** Playwright with `deviceScaleFactor: 2`, the privacy banner hidden, a slow scroll down the page to fire scroll-triggered animations, then `element.screenshot()` on the smallest ancestor that contains each block, with a little padding. Plus a contact sheet of all crops so a human can check them at a glance.
2. **The copy, verbatim.** `innerText` of each block: every label, cell, date, amount and pill, in the order rendered. This becomes the film's data file; nothing on screen is typed from memory.
3. **Measurements from the DOM, not by eye.** For each block: its bounding box in CSS px; background, border, radius, shadow; for every text role (title, row label, value, pill, table header, cell): font family, size, weight, line height, letter spacing, color; row pitch, paddings, gaps; status colors (dot and pill, background and text); the tab bar's active and inactive styles. Page-level: the display and body faces and sizes, the primary button, the section backgrounds, any gradient panel's CSS value. The agent writes it all to `docs/screens.md`, one section per block, and replies with the eight most useful numbers.

The measurement itself is `getComputedStyle` and `getBoundingClientRect` on a tree walk under the block, run through `page.evaluate`. When a hero is an image rather than DOM (common for dashboards), the agent says so and samples pixels from the native file instead: proportions, colors and transcribed copy, marked as inferred.

Capture today's site, and say when. A site is redeployed between sessions (one owner asked "did you check today's website? after the changes?"), and the checkout you are reading may sit on a feature branch, so read the live look from `origin/main` after a fetch and record the commit and the fetch time in the brief (gotcha 80). The font the home page uses today is the film's UI font; the brand's own display face (the one in the app and the wordmark) wins over the site's heading font when they differ, and the brief logs the conflict.

**A desktop app renders its own screens.** Before screen-recording a native app, grep it for `--snapshot`, `--screenshots`, `--render-scenes` or `--demo` flags: one app wrote 204 PNGs of every state offscreen with fixture data and no screen-recording permission. Notifications and menu-bar items cannot be captured that way; draw them in code in the platform's real shape.

Also ask for the logo: what it is (inline SVG, `<img>`, a Next image), its rendered size in the header and footer, the files, and how the footer shows it on dark (often `brightness(0) invert(1)` on an ink wordmark, which the film can copy).

## Build at 1x, show scaled

Lay each component out at the site's 1x pixel sizes, exactly as measured (`fontSize: 14`, `rowH: 45`, `padX: 20`), and show it through a scaling wrapper:

```tsx
export const UIScale: React.FC<{ s: number; width: number; height?: number; children: React.ReactNode }> = ({ s, width, height, children }) => (
  <div style={{ width: width * s, height: height ? height * s : undefined, position: "relative" }}>
    <div style={{ width, height, transform: `scale(${s})`, transformOrigin: "top left", position: "absolute", left: 0, top: 0 }}>{children}</div>
  </div>
);
```

Every number from `docs/screens.md` is then typed in as it was read, the component matches the site at 1x, and the scene chooses the display scale (1.5 to 1.7 makes a 560px card about 900px wide in a 1920 frame). Keep the chosen scale and the card's canvas position as constants: click targets and camera origins are derived from them, and the reviewer will ask for them.

A dashboard whose hero is an image is built the same way from pixel proportions: measure the 2x capture, divide by its scale, and keep the window's 1x size (a 1180x640 window at 1.12x filled a 1600x800 panel).

## Palette discipline

The product's own status colors (an amber dot for one status, a purple one for another, a green "On" pill) are usually outside the brand palette the film must keep to. Collapse them to the palette's semantic pair (the accent for risk, a neutral for information) in one place, the theme, and say so in the brief. Chart segments follow the same rule: one ring per chart in the brand's family, the accent on the segment that is the point.

## Rearranging for the frame

Keep the words, the states and the order; move the layout. A feature card beside its headline (the site's layout) mirrors fine; a seven-row list becomes six with the seventh under the fold; a fade the site paints over its last rows reads on a web page but not in a film, so size the card to its content instead. Write every rearrangement in the brief's assumptions.

What stays off limits: a state the product does not show (a "Downloaded" label after a click), a number it does not have, a control it does not have.

## Cards that grow

A card whose rows land one per beat sits as an empty white block until they arrive, which reads wrong at the cut. Make the card as tall as its landed rows:

```tsx
const rowProgress = (i: number) => interpolate(frame, [ROW_AT[i], ROW_AT[i] + ROW_IN], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easings.maskReveal });
const liveHeight = border * 2 + headerH + rows.reduce((h, _, i) => h + rowProgress(i) * rowH, 0);
```

with `overflow: hidden` on the card. The first row lands before frame 0 (`ROW_AT[0] = -12`) so the cut lands on a one-row card, and the card grows a row per beat. The same applies to a chat card while a question types: a fixed-height card is mostly empty for two seconds.

Grow only what the product grows: a chat does get longer; an inbox, a window, a list does not, and the owner of one film fixed its window size in so many words and had to say it again when a later wave built a collapse-and-open version (`animation-patterns.md`, "Cards that grow with their rows"). A window keeps one size for its scene; zoom the camera to make it bigger.

## Checklist for the first product scene

- The cut frame shows the card with its title and first row, or the bar, not an empty rectangle.
- The copy on screen is the data file's, character for character.
- Status colors are the palette's; nothing outside the theme file.
- The card's bottom row is inside the frame at the end of the camera move (a 1.08 push about a card's center carries a card that starts at x 930 off a 1920 frame; it did).
- Column headers do not cross column rules (widen or right-align the numeric columns).
- Numbers on the cut frame are the real values, not zeros: draw the chart arcs in, keep the legend numbers static.
