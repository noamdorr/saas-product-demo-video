# Project scaffold

Minimal Remotion 4.x setup. Do NOT run `npx create-video@latest` inside an existing git repo - it blocks on an interactive arrow-key prompt ("You are already inside a Git repo... Do you want to continue? No / Yes") that you cannot push through a pipe.

Manually write the three config files below. Takes 30 seconds.

## Directory layout

```
remotion-video/
├── package.json
├── tsconfig.json
├── remotion.config.ts
├── public/
│   ├── logo.svg            # user-supplied
│   └── soundtrack.mp3      # user-supplied
├── docs/superpowers/
│   ├── specs/YYYY-MM-DD-<name>-design.md
│   └── plans/YYYY-MM-DD-<name>.md
└── src/
    ├── index.ts            # registerRoot(RemotionRoot)
    ├── Root.tsx            # Composition registrations + font loading
    ├── theme.ts            # base colors, fonts, VIDEO constants
    ├── anim/easings.ts     # centralized Easing.bezier() presets
    └── v2/
        ├── theme-v2.ts     # V2 (horizontal) + V2V (vertical) timing constants
        ├── Act2Master.tsx  # horizontal master - <Audio> + 6x <Sequence>
        ├── components/
        │   ├── SolidBg.tsx MaskReveal.tsx TypedText.tsx
        │   ├── PopIn.tsx Cursor.tsx ZoomPunch.tsx FloatingElements.tsx
        │   └── ui/         # product-specific cards
        ├── data/
        │   └── fictional.ts  # fictional reviewer, company, pitch, pain points
        ├── scenes/
        │   └── Scene01*.tsx ... SceneN*.tsx
        └── vertical/       # if 9:16 parallel - see vertical-port.md
            ├── Act2MasterVertical.tsx
            ├── components/
            │   └── FirstToKnowLayoutVertical.tsx
            └── scenes/
                └── Scene01Vertical.tsx ... SceneNVertical.tsx
```

## package.json

```json
{
  "name": "remotion-video",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "remotion studio",
    "build": "remotion render",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@remotion/cli": "4.0.448",
    "@remotion/google-fonts": "4.0.448",
    "@remotion/shapes": "4.0.448",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "remotion": "4.0.448"
  },
  "devDependencies": {
    "@types/react": "19.0.0",
    "@types/web": "0.0.166",
    "typescript": "5.8.2"
  }
}
```

Remotion + React + TS versions are pinned. Do not `npm update` after install - Remotion's internal version coordination is exact.

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "types": ["@types/react", "@types/web"]
  },
  "include": ["src/**/*"]
}
```

## remotion.config.ts

```typescript
import { Config } from "@remotion/cli/config";

Config.setEntryPoint("./src/index.ts");
Config.setPublicDir("./public");
Config.setConcurrency(8);
Config.setVideoImageFormat("png");   // lossless intermediates
```

Concurrency 8 is the sweet spot on Apple Silicon. On a beefier Linux box, bump to 12-16.

## src/index.ts

```typescript
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);
```

## src/Root.tsx

Load every font at the top level so both Studio and CLI renders pick them up. Pass `subsets: ["latin"]` to kill the 21-network-request warning.

```tsx
import { Composition } from "remotion";
import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as loadSlab } from "@remotion/google-fonts/RobotoSlab";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { Act2Master } from "./v2/Act2Master";
import { V2 } from "./v2/theme-v2";
// Per-scene debug compositions
import { Scene01SaturatedHell } from "./v2/scenes/Scene01SaturatedHell";
// ... etc

// Load fonts - subsets: ["latin"] kills the 21-request warning
loadJakarta("normal", { weights: ["600", "700", "800"], subsets: ["latin"] });
loadSlab("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });
loadInter("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });
// Note: Google Fonts doesn't ship Roboto Slab italic. Apply font-style: italic at use sites.

export const RemotionRoot: React.FC = () => (
  <>
    {/* Master composition */}
    <Composition
      id="Act2Master"
      component={Act2Master}
      durationInFrames={V2.totalFrames}
      fps={V2.fps}
      width={V2.width}
      height={V2.height}
    />

    {/* Per-scene debug compositions - IDs must use hyphens, not underscores */}
    <Composition
      id="v2-Scene01"
      component={Scene01SaturatedHell}
      durationInFrames={V2.scene1Dur}
      fps={V2.fps}
      width={V2.width}
      height={V2.height}
    />
    {/* ... repeat for each scene */}
  </>
);
```

**Gotcha**: composition IDs can only contain `a-z A-Z 0-9 CJK -`. Underscores are rejected at render time (not at registration time, which is worse - the error only fires when you try to render). Use hyphens everywhere.

## src/theme.ts

```typescript
export const VIDEO = {
  width: 1920,
  height: 1080,
  fps: 30,
} as const;

export const fonts = {
  display: "Plus Jakarta Sans, system-ui, sans-serif",
  editorial: "Roboto Slab, Georgia, serif",
  ui: "Inter, system-ui, sans-serif",
} as const;

export const colors = {
  // Brand
  pink: "#EE2E7F",
  deepPurple: "#390854",
  darkPurple: "#590D82",
  cream: "#FAFAF7",
  peach: "#FCE5D4",
  // Add more from user's brand palette
} as const;
```

## src/v2/theme-v2.ts

See `beat-sync.md` for the full V2 timing constants pattern. Start with this shape:

```typescript
export const v2Colors = {
  pink: "#EE2E7F",
  deepPurple: "#390854",
  cream: "#FAFAF7",
  blush: "#FDEEF1",
  lavender: "#E8DDF0",
  peach: "#FCE5D4",
  mutedInk: "#6B5878",
  cardBorder: "rgba(57,8,84,0.06)",
} as const;

export const V2 = {
  width: 1920, height: 1080, fps: 30, totalFrames: 840,
  scene1Start: 0,   scene1Dur: 120,
  scene2Start: 120, scene2Dur: 60,
  scene5Start: 180, scene5Dur: 150,
  scene6Start: 330, scene6Dur: 120,
  scene8Start: 450, scene8Dur: 180,
  scene9Start: 630, scene9Dur: 210,
  // Sum: 840 ✓
} as const;
```

If a 9:16 parallel cut is needed, add `V2V` with matching keys (see `vertical-port.md`).

## src/anim/easings.ts

```typescript
import { Easing } from "remotion";

export const easings = {
  violentPush: Easing.bezier(0.7, 0, 0.1, 1),    // fast middle, hard end - for portal pushes, marker sweeps
  slowInLand:  Easing.bezier(0.2, 0.9, 0.1, 1),  // anticipation + settle - for cards landing, hero settling
  standard:    Easing.bezier(0.4, 0, 0.2, 1),    // default material
  soft:        Easing.bezier(0.25, 0.46, 0.45, 0.94),  // gentle - for subtle moves
  whip:        Easing.bezier(0.85, 0, 0.15, 1),  // deliberate snap - for whip pans
  maskReveal:  Easing.bezier(0.33, 1, 0.68, 1),  // quick + smooth - for clip-path reveals, type-in
};
```

Remotion's implicit default is `Easing.bezier(0.4, 0, 0.2, 1)` - feels too digital for cinematic work. Authored-by-hand curves are essential.

## src/v2/Act2Master.tsx

```tsx
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile } from "remotion";
import { V2 } from "./theme-v2";
import { Scene01SaturatedHell } from "./scenes/Scene01SaturatedHell";
// ... etc

export const Act2Master: React.FC = () => (
  <AbsoluteFill>
    <Audio
      src={staticFile("soundtrack.mp3")}
      volume={(f) =>
        interpolate(f, [V2.totalFrames - 18, V2.totalFrames], [0.6, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      }
    />
    <Sequence from={V2.scene1Start} durationInFrames={V2.scene1Dur}>
      <Scene01SaturatedHell />
    </Sequence>
    <Sequence from={V2.scene2Start} durationInFrames={V2.scene2Dur}>
      <Scene02GoodThing />
    </Sequence>
    {/* ... etc */}
  </AbsoluteFill>
);
```

## Install + verify

```bash
cd remotion-video
npm install
npm run typecheck      # verify tsc passes
npm run dev            # opens Remotion Studio at localhost:3030
```

If Studio shows the composition list, registration is working. If a `delayRender` warning fires about font network requests, you forgot `subsets: ["latin"]` somewhere.

## Commit checklist - before any phase ends

The most common "phase looks done but actually broke" bug: a TypeScript file imports a generated artifact (like `beats.json`) that was created on disk but never committed. A fresh clone of the branch fails `npm run typecheck` because the import target doesn't exist.

Before each `git commit` that closes a phase:

- [ ] `git status` - any untracked files in `remotion-video/` that aren't in `.gitignore`?
- [ ] If a TypeScript file `import`s a JSON or asset under the project, verify that file is committed.
- [ ] `npm run typecheck` passes.
- [ ] No bare `import` paths that resolve to deleted/renamed files.

If untracked files appear that should be committed (`beats.json`, `public/personas/`, `public/b-rolls/`), stage them before the commit.

## Plan template hygiene - review the plan before dispatching

When the writing-plans skill produces an implementation plan with code blocks, give it a once-over before handing to subagents. Watch for:

1. **Unused props.** Any `interface FooProps { barRef?: ... }` where `barRef` never appears in the body? Remove it before subagents implement (they'll dutifully copy the unused prop).
2. **Hardcoded fps.** Any `* 30 /* fps */` literal? Should be `* useVideoConfig().fps`. If the user later changes fps, hardcoded values silently break.
3. **`process.env` direct access.** Should be `(globalThis as any).process?.env?.NODE_ENV` to avoid pulling `@types/node` (Remotion bundlers inject `process.env` at build time).
4. **Empty `// TODO` comments.** Should be filled in or removed before dispatch.
5. **Imports that point at not-yet-existing files.** If Task 5 imports from a file Task 7 creates, dispatch order matters.

These are catchable in 60 seconds. Each one caught saves a code-quality review cycle.

## .gitignore essentials

Drop a `.gitignore` at the project root with at minimum:

```
.env
.env.local
node_modules/
out/
.DS_Store
```

If you'll be using `.skill` archives for distribution and storing them under the project, add `*.skill` too.
