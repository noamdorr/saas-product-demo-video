#!/usr/bin/env node
// check-copy.mjs - the words of a Remotion product film, counted and checked
// before a render.
//
//   node <skill>/scripts/check-copy.mjs [project-root] [--seconds 28] [--max-words-per-second 4.5] [--max-card-words 30] [--max-headline-words 12]
//
// Reads the strings that reach the screen and reports, per file and in total:
// words, words per second of runtime, headlines over the budget, and the tells
// that make copy read as machine-written. Exit code 1 on a tell or on a film
// over the words-per-second ceiling, so a render step can gate on it; the rest
// are warnings.
//
// Where the words come from, in order: `src/data/**/*.ts` when the project
// keeps its copy there (the scaffold's rule: every on-screen string lives in
// the data file), else every string literal in `src/scenes/**/*.tsx` that
// looks like prose (two or more words with letters, no path, no CSS unit).
// Sketches, retired scenes and components are skipped. The runtime comes from
// out/timing-dump.json (run `node tools/dump-timing.mjs`) or --seconds.
//
// Read the per-file numbers and the longest strings, not only the total: a
// data file also holds texture nobody reads (a typeset page of a record, a
// table of sample rows, a client list), and on one 50 s film that texture
// doubled the count of a cut the owner was happy with. The words-per-second
// line is a warning for that reason; only a tell fails the run.
//
// The numbers behind the defaults: a 28 s film its owner liked carried 117
// words (35 of headline, 82 across three product cards, each label and name
// counted once), about 4 words a second; a cut with 215 read as "too much
// text". Headlines over 12 words wrap to two lines, which do not read at
// speed. These are defaults for a product film cut to music, not laws: a
// voiceover-led film or a one-card explainer sets its own, and says so in the
// brief.

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const argv = process.argv.slice(2);
const opts = {};
const positional = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith("--")) { opts[argv[i].slice(2)] = argv[i + 1]; i++; } else positional.push(argv[i]);
}
const root = resolve(positional[0] || ".");
const maxWps = parseFloat(opts["max-words-per-second"] || "4.5");
const targetWps = 4.0;
const maxCard = parseInt(opts["max-card-words"] || "30", 10);
const maxHeadline = parseInt(opts["max-headline-words"] || "12", 10);

// --- runtime -----------------------------------------------------------------
let seconds = opts.seconds ? parseFloat(opts.seconds) : null;
const dumpPath = join(root, "out/timing-dump.json");
if (seconds == null && existsSync(dumpPath)) {
  const d = JSON.parse(readFileSync(dumpPath, "utf8"));
  seconds = d.total / d.fps;
}

// --- gather strings ----------------------------------------------------------
const walk = (dir, out = []) => {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (/^(sketches|retired|_probe|node_modules)$/.test(name)) continue;
      walk(p, out);
    } else if (/\.(ts|tsx)$/.test(name) && !/\.d\.ts$/.test(name)) out.push(p);
  }
  return out;
};
const dataFiles = walk(join(root, "src/data"));
const files = dataFiles.length ? dataFiles : walk(join(root, "src/scenes"));
const source = dataFiles.length ? "src/data" : "src/scenes";
if (!files.length) {
  console.error(`check-copy: no ${source} files under ${root}`);
  process.exit(2);
}

const STRING = /(["'`])((?:\\.|(?!\1)[^\\\n])*)\1/g;
const looksLikeProse = (s) => {
  const words = s.trim().split(/\s+/).filter((w) => /[A-Za-z]/.test(w));
  if (words.length < 2) return false;
  if (/[\\/]|\.(tsx?|png|svg|mp3|mp4|wav|json)\b|^\.\.?\//.test(s)) return false;
  if (/\b\d+(px|em|rem|%|deg|ms|s)\b|^#?[0-9a-f]{6}\b|rgba?\(|translate|scale\(|rotate/i.test(s)) return false;
  if (/^[a-z-]+:\s/.test(s) && !/\s[a-z]+\s/.test(s)) return false;
  return true;
};
const strip = (s) => s.replace(/\$\{[^}]*\}/g, " ");
const countWords = (s) => strip(s).split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;

const TELLS = [
  [/—/, "em dash (U+2014)"],
  [/–/, "en dash (U+2013)"],
  [/[“”‘’]/, "curly quote"],
  [/…/, "ellipsis character (U+2026)"],
  [/&mdash;|&ndash;|&hellip;/, "HTML dash or ellipsis entity"],
];
const FILLER = /\b(seamless(ly)?|effortless(ly)?|robust|powerful|leverage|unlock|supercharge|game[- ]changing|next[- ]level|cutting[- ]edge|revolutioni[sz]e)\b/i;
const HOOK = /\bintroducing\b/i;
const ANTITHESIS = /^\s*\w[\w'\s]{0,30},\s*not\s+\w[\w'\s]{0,30}\.?\s*$/i; // "Signal, not noise"
const CARD_KEY = /(headline|title|hook|line|promise|tagline)/i;

const errors = [];
const warnings = [];
const perFile = [];
let total = 0;
let maxWordsInOne = 0;
const longest = [];

for (const file of files) {
  const rel = relative(root, file);
  const text = readFileSync(file, "utf8");
  let fileWords = 0;
  const seen = new Set();
  let m;
  STRING.lastIndex = 0;
  while ((m = STRING.exec(text))) {
    const s = m[2];
    if (!looksLikeProse(s)) continue;
    const lineNo = text.slice(0, m.index).split("\n").length;
    const line = text.split("\n")[lineNo - 1] || "";
    for (const [re, name] of TELLS) if (re.test(s)) errors.push(`${rel}:${lineNo}: ${name} in "${s.slice(0, 60)}"`);
    if (seen.has(s)) continue; // the same string repeated in a file is one string on screen
    seen.add(s);
    const n = countWords(s);
    fileWords += n;
    maxWordsInOne = Math.max(maxWordsInOne, n);
    longest.push([n, `${rel}:${lineNo}`, s]);
    if (FILLER.test(s)) warnings.push(`${rel}:${lineNo}: filler word in "${s.slice(0, 60)}"`);
    if (HOOK.test(s)) warnings.push(`${rel}:${lineNo}: "Introducing" opens a hook by naming the product; lead with the pain or the result`);
    if (ANTITHESIS.test(s)) warnings.push(`${rel}:${lineNo}: antithesis slogan ("X, not Y") in "${s.slice(0, 60)}"; one owner called it a tell`);
    if (CARD_KEY.test(line) && n > maxHeadline) warnings.push(`${rel}:${lineNo}: ${n}-word headline (over ${maxHeadline}, wraps to two lines): "${s.slice(0, 60)}"`);
  }
  perFile.push([rel, fileWords]);
  total += fileWords;
}

// --- report ------------------------------------------------------------------
console.log(`words on screen (${source}): ${total}`);
for (const [rel, n] of perFile.sort((a, b) => b[1] - a[1])) {
  const flag = n > maxCard && source === "src/scenes" ? `  (over ${maxCard}: a scene's card carries 15 to 30 words)` : "";
  console.log(`  ${String(n).padStart(4)}  ${rel}${flag}`);
}
if (seconds) {
  const wps = total / seconds;
  const verdict = wps > maxWps ? "OVER" : wps > targetWps ? "high" : "ok";
  console.log(`runtime ${seconds.toFixed(1)} s, ${wps.toFixed(2)} words/s (target ${targetWps}, ceiling ${maxWps}): ${verdict}`);
  if (wps > maxWps) warnings.push(`${wps.toFixed(2)} words per second is over ${maxWps}: if the long strings below are read by the viewer, cut words before cutting holds; if they are texture (a page, a table), say so in the brief`);
} else {
  console.log("runtime unknown: run `node tools/dump-timing.mjs` or pass --seconds");
}
console.log("longest strings:");
for (const [n, where, str] of longest.sort((a, b) => b[0] - a[0]).slice(0, 8)) console.log(`  ${String(n).padStart(3)}  ${where}  "${str.slice(0, 72)}"`);
for (const w of warnings) console.log(`warning: ${w}`);
for (const e of errors) console.log(`error: ${e}`);
console.log(`${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
