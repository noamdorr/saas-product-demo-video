#!/usr/bin/env node
// stills.mjs - render many stills from one bundle through Remotion's Node API,
// and optionally tile them into a contact sheet.
//
// `scripts/render-stills.sh` renders a run of nearby frames in one pass. This
// script adds: frames spread anywhere in the composition from one bundle
// (twelve 1080p stills in about six seconds), sampling (`every:N`), the first
// and last frame of each scene (`cuts`), a tiled sheet, input props for debug
// overlays, and the render tab's console, which the CLI never shows (a probe's
// console.log is lost there); any page log that starts with "PROBE " is printed.
//
//   node tools/stills.mjs Scene-03 0 30 60 90
//     -> out/check/Scene-03-f0000.png ...
//   node tools/stills.mjs Master 0 44 90 150 --sheet out/check/sheet.png --cols 4
//   node tools/stills.mjs Master every:30 --sheet out/check/sheet.png --cols 8
//     every 30th frame of the composition
//   node tools/stills.mjs Master cuts --sheet out/check/cuts.png
//     the first and last frame of every scene (needs: node tools/dump-timing.mjs)
//
// --out <dir>     where stills go (default out/check)
// --scale <n>     render scale (1 = the composition's size)
// --props <json>  input props, e.g. '{"debugClicks":true}' for DebugClickTargets
// The sheet needs python3 with Pillow (pip install pillow).

import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const opts = {};
const pos = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith("--")) {
    const k = argv[i].slice(2);
    const v = argv[i + 1];
    if (v === undefined || v.startsWith("--")) opts[k] = true;
    else {
      opts[k] = v;
      i++;
    }
  } else pos.push(argv[i]);
}
const compId = pos[0];
if (!compId) {
  console.error("usage: node tools/stills.mjs <CompositionId> <frames...|every:N|cuts> [--sheet out.png] [--cols 4] [--scale 1] [--out dir]");
  process.exit(1);
}

const outDir = opts.out ?? "out/check";
mkdirSync(outDir, { recursive: true });

const inputProps = opts.props ? JSON.parse(opts.props) : undefined;
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), onProgress: () => {} });
const composition = await selectComposition({ serveUrl, id: compId, inputProps });

let frames = [];
for (const p of pos.slice(1)) {
  if (p.startsWith("every:")) {
    const step = parseInt(p.slice(6), 10);
    for (let f = 0; f < composition.durationInFrames; f += step) frames.push(f);
  } else if (p === "cuts") {
    const dump = "out/timing-dump.json";
    if (!existsSync(dump)) {
      console.error("cuts needs out/timing-dump.json: run `node tools/dump-timing.mjs` first");
      process.exit(1);
    }
    refuseStaleDump(dump);
    const scenes = JSON.parse(readFileSync(dump, "utf8")).scenes;
    for (const s of Object.values(scenes)) {
      frames.push(s.start);
      frames.push(s.start + s.duration - 1);
    }
  } else frames.push(parseInt(p, 10));
}
frames = [...new Set(frames)].filter((f) => f >= 0 && f < composition.durationInFrames).sort((a, b) => a - b);
if (frames.length === 0) {
  console.error(`no frames to render: give frame numbers inside 0..${composition.durationInFrames - 1}, every:N or cuts`);
  process.exit(1);
}

const scale = parseFloat(opts.scale ?? "1");
const files = [];
const t0 = Date.now();
for (const frame of frames) {
  const output = path.join(outDir, `${compId}-f${String(frame).padStart(4, "0")}.png`);
  await renderStill({
    serveUrl,
    composition,
    frame,
    output,
    scale,
    imageFormat: "png",
    inputProps,
    onBrowserLog: (l) => {
      if (l.text.startsWith("PROBE ")) console.log(l.text);
    },
  });
  files.push(output);
}
console.log(`${files.length} stills in ${((Date.now() - t0) / 1000).toFixed(1)}s -> ${outDir}`);

if (opts.sheet) {
  const cols = parseInt(opts.cols ?? "4", 10);
  const py = `
import sys
from PIL import Image, ImageDraw
files = sys.argv[2:]
cols = ${cols}
w, h = 480, 270
rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGB", (cols * w, rows * (h + 22)), (24, 24, 24))
d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(f).convert("RGB")
    im.thumbnail((w, h))
    x, y = (i % cols) * w, (i // cols) * (h + 22)
    sheet.paste(im, (x, y + 22))
    d.text((x + 6, y + 4), f.split("/")[-1], fill=(200, 200, 200))
sheet.save(sys.argv[1])
print("sheet", sys.argv[1], sheet.size)
`;
  execFileSync("python3", ["-c", py, opts.sheet, ...files], { stdio: "inherit" });
}

// A dump older than src/timing.ts or beats.json marks the wrong frames as cuts
// (it did, silently, for eight waves of one film). Refuse it unless --stale-ok.
function refuseStaleDump(dump) {
  if (process.argv.includes("--stale-ok")) return;
  const dumpAt = statSync(dump).mtimeMs;
  for (const src of ["src/timing.ts", "beats.json"]) {
    if (existsSync(src) && statSync(src).mtimeMs > dumpAt) {
      console.error(`${dump} is older than ${src}: run \`node tools/dump-timing.mjs\` first (or pass --stale-ok)`);
      process.exit(1);
    }
  }
}
