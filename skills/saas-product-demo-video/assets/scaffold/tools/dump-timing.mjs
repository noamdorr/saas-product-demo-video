#!/usr/bin/env node
// dump-timing.mjs - print the scene table (master frames and seconds) and
// write it to out/timing-dump.json, by evaluating src/timing.ts for real,
// outside Remotion, against the real beats.json.
//
// Other tools read the dump: stills.mjs "cuts", sheets.py (cut strips) and
// jerk.py (which abrupt changes are planned cuts), and each of them refuses
// a dump older than src/timing.ts or beats.json, so a stale table cannot
// mark the wrong frames as cuts. Run it again after any change to either.
//
//   node tools/dump-timing.mjs
//   total 1645 frames = 54.83s, 12 scenes, 12 cuts/min
//   hook           0 ->    98    0.00s  3.27s
//   ...
//
// How it evaluates: src/timing.ts and the local files it imports are
// transpiled with the project's own TypeScript into out/.timing-eval/, with
// "remotion" replaced by a stub and beats.json inlined, then imported. So
// SCENE_ENDS may hold anything TypeScript can run (a conditional, a mode
// constant, a helper), not only a flat object literal. An earlier version
// sliced the SCENE_ENDS literal out with a regex; it broke silently the day
// the file gained a ternary, and the stale dump misled three tools for
// eight iteration waves. If `typescript` cannot be found, it falls back to
// that slice and says so.

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const beatsPath = resolve(root, "beats.json");
const timingPath = resolve(root, "src/timing.ts");
const beats = JSON.parse(readFileSync(beatsPath, "utf8"));
const fps = beats.fps;

let timing;
try {
  timing = await evaluateWithTypeScript();
} catch (err) {
  console.error(`[dump-timing] ${err.message}\n[dump-timing] falling back to the regex slice of SCENE_ENDS (a conditional in it will break this)`);
  timing = evaluateWithRegexSlice();
}

const { SCENES, BEATS, BACKBEATS, DOWNBEATS, AUDIO_TRIM: trim } = timing;
const scenes = {};
for (const [name, s] of Object.entries(SCENES)) scenes[name] = { start: s.start, duration: s.duration, end: s.start + s.duration };
const total = Object.values(scenes).reduce((max, s) => Math.max(max, s.end), 0);

mkdirSync(resolve(root, "out"), { recursive: true });
writeFileSync(
  resolve(root, "out/timing-dump.json"),
  JSON.stringify(
    {
      fps, bpm: beats.bpm, audio: beats.audio_file, trim, total, scenes, BEATS, BACKBEATS, DOWNBEATS,
      // Consumers compare these with the files' current mtimes and refuse a stale dump.
      sources: { "src/timing.ts": statSync(timingPath).mtimeMs, "beats.json": statSync(beatsPath).mtimeMs },
      generated_at: new Date().toISOString(),
    },
    null,
    1,
  ),
);
const n = Object.keys(scenes).length;
console.log(`total ${total} frames = ${(total / fps).toFixed(2)}s, ${n} scenes, ${Math.round(((n - 1) / (total / fps)) * 60)} cuts/min`);
for (const [name, s] of Object.entries(scenes)) {
  const onBack = BACKBEATS.some((b) => Math.abs(b - s.start) <= 1) || s.start === 0;
  console.log(
    `${name.padEnd(10)} ${String(s.start).padStart(5)} -> ${String(s.end).padStart(5)}  ${(s.start / fps).toFixed(2).padStart(6)}s  ${(s.duration / fps).toFixed(2)}s${onBack ? "" : "  (starts off the backbeat)"}`,
  );
}

// --- evaluate src/timing.ts with the project's TypeScript ---------------------

async function evaluateWithTypeScript() {
  const require = createRequire(join(root, "package.json"));
  let ts;
  try {
    ts = require("typescript");
  } catch {
    throw new Error("typescript is not installed in this project (it is a devDependency of the scaffold)");
  }
  const evalDir = resolve(root, "out/.timing-eval");
  mkdirSync(evalDir, { recursive: true });
  // Remotion is only imported for getRemotionEnvironment() (dev-time warnings).
  writeFileSync(
    join(evalDir, "remotion-stub.mjs"),
    "export const getRemotionEnvironment = () => ({ isStudio: false, isRendering: false, isPlayer: false, isReadOnlyStudio: false });\n",
  );
  const done = new Map();
  const transpile = (absTs) => {
    if (done.has(absTs)) return done.get(absTs);
    const rel = relative(resolve(root, "src"), absTs).replace(/\.tsx?$/, "");
    const outFile = join(evalDir, rel + ".mjs");
    done.set(absTs, outFile);
    let code = readFileSync(absTs, "utf8");
    // Local imports: JSON is inlined, .ts files are transpiled beside this one.
    code = code.replace(/^(import\s+[^"';]*?\s+from\s+)["'](\.{1,2}\/[^"']+)["'];?$/gm, (whole, head, spec) => {
      const target = resolve(dirname(absTs), spec);
      if (/\.json$/.test(spec)) {
        const name = head.match(/import\s+(\w+)/)?.[1];
        if (!name) return whole;
        return `const ${name} = ${JSON.stringify(JSON.parse(readFileSync(target, "utf8")))};`;
      }
      const tsFile = [target + ".ts", target + ".tsx", join(target, "index.ts")].find((p) => existsSync(p));
      if (!tsFile) return whole;
      const out = transpile(tsFile);
      return `${head}${JSON.stringify("./" + relative(dirname(outFile), out).replace(/\\/g, "/"))};`;
    });
    code = code.replace(/from\s+["']remotion["']/g, `from "./${relative(dirname(outFile), join(evalDir, "remotion-stub.mjs")).replace(/\\/g, "/") || "remotion-stub.mjs"}"`);
    const js = ts.transpileModule(code, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.Preserve },
      fileName: absTs,
    }).outputText;
    mkdirSync(dirname(outFile), { recursive: true });
    writeFileSync(outFile, js);
    return outFile;
  };
  const entry = transpile(timingPath);
  const mod = await import(pathToFileURL(entry).href + `?t=${Date.now()}`);
  for (const key of ["SCENES", "BEATS", "BACKBEATS", "DOWNBEATS"]) {
    if (mod[key] === undefined) throw new Error(`src/timing.ts does not export ${key}`);
  }
  return { SCENES: mod.SCENES, BEATS: mod.BEATS, BACKBEATS: mod.BACKBEATS, DOWNBEATS: mod.DOWNBEATS, AUDIO_TRIM: mod.AUDIO_TRIM ?? 0 };
}

// --- fallback: the old regex slice ----------------------------------------------

function evaluateWithRegexSlice() {
  const src = readFileSync(timingPath, "utf8");
  const trim = parseInt((src.match(/export const AUDIO_TRIM = (\d+)/) || [0, "0"])[1], 10);
  const onTimeline = (frames) => frames.map((f) => f - trim).filter((f) => f >= 0);
  const BEATS = onTimeline(beats.beat_frames);
  const BACKBEATS = onTimeline(beats.backbeat_frames);
  const DOWNBEATS = onTimeline(beats.downbeat_frames);
  const start = src.indexOf("const SCENE_ENDS = {");
  if (start < 0) throw new Error("src/timing.ts has no `const SCENE_ENDS = {`");
  const body = src.slice(start, src.indexOf("};", start) + 2);
  const pick = (frames, n, kind) => {
    const f = frames[n];
    if (f === undefined) throw new Error(`${kind} ${n} does not exist: the track has ${frames.length} of them`);
    return f;
  };
  // eslint-disable-next-line no-new-func
  const SCENE_ENDS = new Function("backbeatFrame", "beatFrame", "atSeconds", body.replace("const SCENE_ENDS =", "return"))(
    (n) => pick(BACKBEATS, n, "backbeat"),
    (n) => pick(BEATS, n, "beat"),
    (s) => Math.round(s * fps),
  );
  const SCENES = {};
  let at = 0;
  for (const [name, end] of Object.entries(SCENE_ENDS)) {
    SCENES[name] = { start: at, duration: end - at };
    at = end;
  }
  return { SCENES, BEATS, BACKBEATS, DOWNBEATS, AUDIO_TRIM: trim };
}
