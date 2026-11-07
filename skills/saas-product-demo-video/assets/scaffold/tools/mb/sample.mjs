#!/usr/bin/env node
// sample.mjs - real motion blur: render the samples inside each frame's shutter
// through a SubClock composition (src/SubClock.tsx), then blend them.
//
//   node tools/mb/sample.mjs --out out/mb/test --from 100 --to 130 --n 12
//   node tools/mb/sample.mjs --out out/mb/base --n 1 --scale 0.25
//   node tools/mb/sample.mjs --out out/mb/final --plan out/mb/plan.json
//
// The second line is the quarter-size pass plan.py reads; the third renders what
// the plan asks for. The commands and the costs are in references/render-export.md.
//
// --out <dir>         where the blended frames go, f00000.png and on (required)
// --comp <id>         the SubClock composition (default Master-Sub)
// --from, --to <f>    frames to make, inclusive (default: the plan's range, else the whole film)
// --n <count>         samples per frame when there is no plan (default 8)
// --plan <file>       {frame: count} from plan.py; a frame it does not list gets one sample
// --shutter <x>       how much of the frame the shutter is open, 0 to 1 (default 0.5, 180 degrees)
// --chunk <count>     samples on disk at once (default 720): each chunk is deleted once blended
// --scale <x>         render scale (default 1; 0.25 for the plan's pass, 2 for 4K)
// --concurrency <n>   passed to Remotion (default: Remotion's own)
// --gl <renderer>     passed to Remotion as --gl (angle for a scene drawn with WebGL;
//                     headless Chrome's default draws a blank or software canvas)
// --bundle <dir>      where the bundle goes (default out/mb-bundle)
// --no-bundle         reuse the bundle already there
// --gamma             average the stored values instead of linear light, to compare
// --segments <dir>    encode each chunk to <dir>/seg-<first>-<last>.mp4 and delete its frames:
//                     for 4K, where the frames alone can fill a disk. join.sh makes the film
// --crf <n>           the segments' quality (default 15)
// --fps <n>           the segments' frame rate (default 30)
//
// A frame whose PNG is already in --out is skipped, and with --segments so is a chunk
// whose segment exists, so an interrupted run resumes and deleting one frame's PNG or
// one segment redoes it. Keep --chunk the same to resume: other chunks make other
// segments, and join.sh refuses the overlap. After changing the film, use a new --out
// and --segments: what is already there is of the old film.
// Needs python3 with numpy and Pillow (set PYTHON to use a virtual environment's).

import { selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const o = {};
for (let i = 0; i < argv.length; i++) {
  if (!argv[i].startsWith("--")) continue;
  const eq = argv[i].indexOf("=");
  if (eq > 0) {
    o[argv[i].slice(2, eq)] = argv[i].slice(eq + 1);
    continue;
  }
  const v = argv[i + 1];
  if (v === undefined || v.startsWith("--")) o[argv[i].slice(2)] = true;
  else {
    o[argv[i].slice(2)] = v;
    i++;
  }
}
if (!o.out) {
  console.error("usage: node tools/mb/sample.mjs --out <dir> [--n 8 | --plan plan.json] [--from f --to f] [--comp Master-Sub] [--scale 1]");
  process.exit(1);
}

const out = o.out;
const comp = o.comp ?? "Master-Sub";
const shutter = Number(o.shutter ?? 0.5);
if (!(shutter > 0 && shutter <= 1)) throw new Error("--shutter is a fraction of the frame, above 0 and at most 1");
const scale = Number(o.scale ?? 1);
const CHUNK = Number(o.chunk ?? 720);
const bundleDir = path.resolve(o.bundle ?? "out/mb-bundle");
const blendScript = path.join(path.dirname(fileURLToPath(import.meta.url)), "blend.py");
const python = process.env.PYTHON ?? "python3";
const plan = o.plan ? JSON.parse(readFileSync(o.plan, "utf8")) : null;

const pad = (F) => String(F).padStart(5, "0");
const run = (cmd, args) => execFileSync(cmd, args, { stdio: ["ignore", "pipe", "inherit"], maxBuffer: 1 << 28 });

if (!o["no-bundle"]) {
  console.log("bundling...");
  run("npx", ["remotion", "bundle", "src/index.ts", "--out-dir", bundleDir, "--log=error"]);
}

const planned = plan ? Object.keys(plan).map(Number) : [];
const from = Number(o.from ?? (plan ? Math.min(...planned) : 0));
const to =
  o.to !== undefined
    ? Number(o.to)
    : plan
      ? Math.max(...planned)
      : (await selectComposition({ serveUrl: bundleDir, id: comp, inputProps: {}, logLevel: "error" })).durationInFrames - 1;

const frames = [];
for (let F = from; F <= to; F++) frames.push({ F, n: plan ? Number(plan[F] ?? 1) : Number(o.n ?? 8) });

mkdirSync(out, { recursive: true });
const tmpRoot = path.join(out, "_tmp");
const total = frames.reduce((s, x) => s + x.n, 0);
const t0 = Date.now();
let done = 0;
let i = 0;
while (i < frames.length) {
  const chunk = [];
  let count = 0;
  while (i < frames.length && (count === 0 || count + frames[i].n <= CHUNK)) {
    chunk.push(frames[i]);
    count += frames[i].n;
    i++;
  }
  const first = chunk[0].F;
  const last = chunk[chunk.length - 1].F;
  const segFile = o.segments ? path.join(o.segments, `seg-${pad(first)}-${pad(last)}.mp4`) : null;
  const todo = segFile && existsSync(segFile) ? [] : chunk.filter((c) => !existsSync(path.join(out, `f${pad(c.F)}.png`)));
  if (todo.length) {
    // The samples sit at the middles of n equal slices of [F, F + shutter), so
    // none crosses into the next frame and a hard cut stays hard.
    const times = [];
    const manifest = [];
    for (const { F, n } of todo) {
      manifest.push({ frame: F, first: times.length, n });
      for (let k = 0; k < n; k++) times.push(n === 1 ? F : F + ((k + 0.5) / n) * shutter);
    }
    rmSync(tmpRoot, { recursive: true, force: true });
    mkdirSync(tmpRoot, { recursive: true });
    const propsFile = path.join(tmpRoot, "props.json");
    writeFileSync(propsFile, JSON.stringify({ times }));
    const manifestFile = path.join(tmpRoot, "manifest.json");
    writeFileSync(manifestFile, JSON.stringify(manifest));
    const samples = path.join(tmpRoot, "s");
    run("npx", [
      "remotion", "render", bundleDir, comp, samples,
      "--sequence", `--props=${propsFile}`, `--frames=0-${times.length - 1}`,
      "--image-format=png", `--scale=${scale}`, "--log=error", "--overwrite",
      ...(o.concurrency ? [`--concurrency=${o.concurrency}`] : []),
      ...(o.gl ? [`--gl=${o.gl}`] : []),
    ]);
    run(python, [blendScript, manifestFile, samples, out, ...(o.gamma ? ["--gamma"] : [])]);
    rmSync(tmpRoot, { recursive: true, force: true });
  }
  if (segFile && !existsSync(segFile)) {
    mkdirSync(o.segments, { recursive: true });
    // Written under another name first, so a run killed mid-encode leaves nothing for join.sh to pick up.
    const tmp = `${segFile}.tmp`;
    run("ffmpeg", [
      "-v", "error", "-y", "-framerate", String(o.fps ?? 30), "-start_number", String(first), "-i", path.join(out, "f%05d.png"),
      "-frames:v", String(chunk.length),
      "-vf", "scale=in_range=pc:out_range=tv:out_color_matrix=bt709:flags=accurate_rnd+full_chroma_int+lanczos,format=yuv420p",
      "-c:v", "libx264", "-preset", "slow", "-crf", String(o.crf ?? 15), "-profile:v", "high",
      "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "iec61966-2-1", "-color_range", "tv",
      "-f", "mp4", tmp,
    ]);
    renameSync(tmp, segFile);
    for (const c of chunk) rmSync(path.join(out, `f${pad(c.F)}.png`), { force: true });
  }
  done += count;
  const el = (Date.now() - t0) / 1000;
  console.log(`samples ${done}/${total}  frames to ${last}  ${el.toFixed(0)} s  ${(done / el).toFixed(1)} samples/s`);
}
