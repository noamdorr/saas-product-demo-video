# Project scaffold

The skill ships a complete, minimal Remotion project in `assets/scaffold/`. Copy it instead of typing config files by hand: a hand-typed scaffold is where version mismatches and missing tokens come from, and the shipped one is typechecked on every change to this skill.

You do not need `npx create-video`; the scaffold replaces it. If you use it anyway, pass `--yes`, because without it the command can stop at an interactive prompt that an agent cannot answer.

## Copy and install

```bash
SKILL=<path to this skill folder>

mkdir -p video
cp -R "$SKILL/assets/scaffold/." video/
cd video
npm install
npm run typecheck      # tsc --noEmit
npm run still          # renders out/scene-example.png
```

- Copy into a new, empty folder (here `video/`), because the copy brings its own `package.json`, `tsconfig.json`, `.gitignore` and `beats.json` and overwrites files with those names.
- Keep the `/.` at the end of the source path, because that is what makes `cp` include the `.gitignore` dotfile.
- The scaffold's `beats.json` is a placeholder grid (120 BPM, no soundtrack), there so the project renders before a soundtrack exists. Run `scripts/detect-beats.py` after the copy, with `--out beats.json` inside this folder. If you ran it before the copy, run it again, because the copy replaced its output with the placeholder.

If `npm run still` writes `out/scene-example.png`, the install, the fonts and the render pipeline all work. `npm run dev` opens Remotion Studio.

## Where everything lives

```
<project root>/
├── video/            # the Remotion project (this scaffold): run npm and render-stills.sh from here
├── docs/video/       # brief.md and notes.md
└── references/       # reference-video breakdowns and sampled frames
```

Run `sample-reference-frames.sh` and `analyze-reference-video.sh` from the project root, because they write to `references/` under the current folder. Run `detect-beats.py` with `--out video/beats.json` from the root, or `--out beats.json` from inside `video/`.

## What is in it

```
video/
├── package.json          # Remotion + React, exact versions
├── tsconfig.json
├── remotion.config.ts
├── .gitignore
├── beats.json            # placeholder until detect-beats.py writes the real one
├── public/               # create it: soundtrack.mp3, logo, b-rolls go here
├── tools/                # stills.mjs (one bundle, many frames), dump-timing.mjs (the scene table),
│                         # sheets.py (contact sheet, cut strips), jerk.py (abrupt-change check)
└── src/
    ├── index.ts          # registerRoot(RemotionRoot)
    ├── Root.tsx          # font loading, Master + one debug composition per scene
    ├── theme.ts          # brand tokens: colors, fonts, canvas size (placeholders)
    ├── timing.ts         # beat grid from beats.json, and the scene list
    ├── easings.ts        # named Easing.bezier() presets
    ├── scene-frames.ts   # master frame <-> scene-local frame helpers
    ├── Master.tsx        # soundtrack + one <Sequence> per scene
    ├── components/       # Cursor, TypedText, MaskReveal, PopIn, ZoomPunch
    └── scenes/
        └── ExampleScene.tsx
```

The files to edit first, in this order:

1. **`src/theme.ts`** - every color and font in it is a placeholder. Replace them with the product's brand, and load the same font families in `Root.tsx`. Components read these tokens and hard-code no hex values, so this one file re-skins the film.
2. **`beats.json` and `src/timing.ts`** - write the real `beats.json` with `scripts/detect-beats.py`, then list the scenes in `SCENE_ENDS` in `timing.ts`. See `beat-sync.md`.
3. **`src/scenes/`** - replace `ExampleScene.tsx`. Each new scene needs three registrations: its entry in `SCENE_ENDS` (`timing.ts`), a `<Sequence>` in `Master.tsx`, and a debug `<Composition>` in `Root.tsx`.

When you delete `ExampleScene.tsx`, also point the `still` script in `package.json` at one of your own compositions, because it names `Scene-Example`.

To confirm a font family and its weights exist before promising them to the user:

```bash
node -e "console.log(Object.keys(require('@remotion/google-fonts/Inter').getInfo().fonts))"
```

The debug composition per scene is what keeps iteration fast: rendering one five-second scene takes seconds, the whole film takes minutes.

Composition IDs take letters, digits and hyphens only. Use `Scene-Hook`, not `Scene_Hook`, because an underscore makes the composition throw when it registers, and that stops every render in the project, not just that scene's.

## Versions

The scaffold pins Remotion **4.0.532** with React 19.2.3 (the React version Remotion's own template pins). `remotion` and every `@remotion/*` package must be on the exact same version, because a mismatch installs two copies of `remotion` and it throws "Multiple versions of Remotion detected" when both load. To move to a newer release, run `npx remotion upgrade`, which moves all of them together, then `npm run typecheck`.

Media uses `<Audio>` and `<Video>` from `@remotion/media`, which is what Remotion recommends for new code. The older `<Audio>` exported from `remotion` is now named `<Html5Audio>`. See `gotchas.md` for the trim props, which changed names.

`remotion.config.ts` leaves concurrency at Remotion's default, because a hard-coded number fails on a machine with fewer cores. Pass `--concurrency` on the command line when tuning a render (`render-export.md`).

`tsconfig.json` loads only React and web types, with no Node types, because scene code runs in a browser. That means `process.env` does not typecheck in `src/`. For a Studio-only warning or debug overlay, use Remotion's own environment check, which the bundler does not need to rewrite:

```tsx
import { getRemotionEnvironment, useRemotionEnvironment } from "remotion";

// inside a component
const { isStudio } = useRemotionEnvironment();
// at module level (timing.ts does this)
if (getRemotionEnvironment().isStudio) { /* ... */ }
```

## Optional components

`assets/components/` holds pieces that only some films need. Copy the ones a scene uses into `src/components/`, which is where their imports (`../theme`, `../easings`, `../timing`) resolve:

```bash
cp "$SKILL/assets/components/Counter.tsx" src/components/
```

| File | What it is |
|---|---|
| `Counter.tsx` | Number ramp with optional overshoot |
| `BRollLayer.tsx` | Muted video layer with trim, opacity and blend (`b-roll-integration.md`) |
| `FloatingElements.tsx` | Deterministic ambient drift for background shapes |
| `IceCrack.tsx` | Frost overlay that cracks and clears to reveal its children |
| `SchematicProfileCard.tsx`, `SchematicEmailComposer.tsx`, `SchematicApiPanel.tsx` | Invented UI cards (`schematic-ui-fidelity.md`) |
| `MasterVertical.tsx` | The 9:16 master (`vertical-port.md`) |
| `Stage.tsx` | A scene's camera plus its enter and exit move, and `Depth` planes (`animation-patterns.md`, "Scene transitions", "Depth planes") |
| `Title.tsx` | One text move for display text, if the look suits it: words rise behind a line mask and leave with the Stage's exit. Needs `Stage.tsx` (`animation-patterns.md`, "Text moves through one primitive") |
| `TestBed.tsx` | A few seconds of film around one scene or sketch, with the music, for judging directions in context (`iteration-playbook.md`, "When a scene has to be reinvented") |

## Checking the scaffold itself

`scripts/verify-scaffold.sh` copies the scaffold and every optional component into a temp folder, installs, and typechecks. With `--render` it also renders the example still. Run it after changing anything under `assets/`, and when a fresh install misbehaves and you need to know whether the skill or the project is at fault.

## Commit checklist - before any phase ends

The most common "phase looks done but actually broke" bug: a TypeScript file imports a generated artifact (like `beats.json`) that was created on disk but never committed. A fresh clone of the branch fails `npm run typecheck` because the import target doesn't exist.

Before each `git commit` that closes a phase:

- [ ] `git status` - any untracked files in the video folder that aren't in `.gitignore`?
- [ ] If a TypeScript file `import`s a JSON or asset under the project, verify that file is committed.
- [ ] `npm run typecheck` passes.
- [ ] No bare `import` paths that resolve to deleted/renamed files.

If untracked files appear that should be committed (`beats.json`, `public/personas/`, `public/b-rolls/`), stage them before the commit.

## Plan template hygiene - review the plan before dispatching

When an implementation plan contains code blocks, give it a once-over before handing it to subagents. Watch for:

1. **Unused props.** Any `interface FooProps { barRef?: ... }` where `barRef` never appears in the body? Remove it before subagents implement (they'll dutifully copy the unused prop).
2. **Hardcoded fps.** Any `* 30 /* fps */` literal? Should be `* useVideoConfig().fps`. If the user later changes fps, hardcoded values silently break.
3. **`process.env` access.** It does not typecheck in the scaffold (see Versions above). Use `useRemotionEnvironment()` or `getRemotionEnvironment()`.
4. **Hand-typed frame numbers.** A scene start or a click frame written as a literal will drift from the music. Derive it from `timing.ts` (`beat-sync.md`).
5. **Empty `// TODO` comments.** Should be filled in or removed before dispatch.
6. **Imports that point at not-yet-existing files.** If Task 5 imports from a file Task 7 creates, dispatch order matters.

These are catchable in 60 seconds. Each one caught saves a code-quality review cycle.
