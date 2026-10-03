#!/usr/bin/env node
/* Tessera resolver harness — runs the PURE resolver region of tessera.html standalone in node.
   No browser, no DOM. Use it to see WHAT ROLE each cell resolves to and to diff two builds.

   node tools/resolver_harness.js --app tessera.html --rules my.rules.json --room my.room.json
   node tools/resolver_harness.js --app tessera.html --prev tessera_prev.html --rules my.rules.json --room my.room.json
   node tools/resolver_harness.js --app tessera.html --rules my.rules.json --block 10x8 --seam "0,3,S..9,3,S" --inner

   --room    a Tessera .room.json (fills, slopes, cuts, innerCuts)      --block WxH  a solid block instead of a room
   --seam    cut edges to add, "c,r,E" / "c,r,S", ranges "c0,r,S..c1,r,S"   --inner  make --seam inner cuts (default: plain)
   --noseams drop the room's own cuts (regression check: no cuts must equal the pre-slice output)
   --prev    a second tessera.html to diff against (prints only the cells whose tile changed)
   --window c0,r0,c1,r1   print only this cell range

   Labels: sheet column letter + 1-based row (A1 = ax 0, ay 0), the same as the app's coords overlay. */
const fs = require("fs");
const args = process.argv.slice(2); const opt = {};
for (let i = 0; i < args.length; i++) if (args[i].startsWith("--")) { const k = args[i].slice(2); const v = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : true; opt[k] = v; }
if (!opt.app || !opt.rules || (!opt.room && !opt.block)) { console.log(fs.readFileSync(__filename, "utf8").split("*/")[0].split("\n").slice(1).join("\n")); process.exit(1); }

function loadResolver(file) {
  const html = fs.readFileSync(file, "utf8");
  const a = html.indexOf("/*__PURE_START__*/"), b = html.indexOf("/*__PURE_END__*/");
  if (a < 0 || b < 0) throw new Error(file + ": pure-region markers not found");
  const src = html.slice(a, b);
  // the three app-side hooks the region calls into; the harness stubs them (no taught rules, base deep pool)
  return new Function("maskRemapFor", "roleRuleForSlope", "effDeepVariants", src +
    `;return { resolveAll, buildCells, K, CONTRACTS, setCuts: (c, i) => { CUTS = c; INNER = i; } };`)(
    () => null, () => null, (ct) => (ct.DEEP_VARIANTS && ct.DEEP_VARIANTS.length ? [ct.DEEP_VARIANTS[0]] : [{ ax: 2, ay: 2, weight: 1 }]));
}
const rules = JSON.parse(fs.readFileSync(opt.rules, "utf8"));
let fills, slopes, cuts, inner;
if (opt.room) { const room = JSON.parse(fs.readFileSync(opt.room, "utf8")); fills = room.fills; slopes = room.slopes || []; cuts = opt.noseams ? [] : (room.cuts || []); inner = opt.noseams ? [] : (room.innerCuts || []); }
else { const [w, h] = opt.block.split("x").map(Number); fills = {}; for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) fills[c + "," + r] = { t: 1 }; slopes = []; cuts = []; inner = []; }
if (opt.seam) {
  const keys = [];
  for (const part of String(opt.seam).split(/\s+/)) {
    const m = part.match(/^(-?\d+),(-?\d+),([ES])\.\.(-?\d+),(-?\d+),([ES])$/);
    if (m) { const [c0, r0, c1, r1] = [m[1], m[2], m[4], m[5]].map(Number); for (let c = Math.min(c0, c1); c <= Math.max(c0, c1); c++) for (let r = Math.min(r0, r1); r <= Math.max(r0, r1); r++) keys.push(c + "," + r + "," + m[3]); }
    else keys.push(part);
  }
  if (opt.inner) inner = inner.concat(keys); else cuts = cuts.concat(keys);
}
function run(file) {
  const api = loadResolver(file);
  const ct = Object.assign({}, api.CONTRACTS[rules.contractId] || api.CONTRACTS.v3, rules.contract);
  api.setCuts(new Set(cuts), new Set(inner));
  const cells = api.buildCells(fills, ct, slopes);
  return { res: api.resolveAll(cells, ct), ct };
}
const L = "ABCDEFGHIJKLMNOP";
const lab = (t) => (t ? L[t.ax] + (t.ay + 1) + (t.flipH ? "'" : "") : ".");
const cur = run(opt.app);
let c0 = Infinity, r0 = Infinity, c1 = -Infinity, r1 = -Infinity;
for (const k of Object.keys(cur.res)) { const [c, r] = k.split(",").map(Number); c0 = Math.min(c0, c); r0 = Math.min(r0, r); c1 = Math.max(c1, c); r1 = Math.max(r1, r); }
if (opt.window) [c0, r0, c1, r1] = String(opt.window).split(",").map(Number);
if (opt.prev) {
  const prev = run(opt.prev); let n = 0;
  for (const k of new Set([...Object.keys(cur.res), ...Object.keys(prev.res)])) { const a = JSON.stringify(prev.res[k]), b = JSON.stringify(cur.res[k]); if (a !== b) { n++; console.log(k.padEnd(8), lab(prev.res[k]).padEnd(5), "->", lab(cur.res[k])); } }
  console.log(n ? n + " cell(s) differ" : "IDENTICAL — no cell changed");
} else {
  console.log("     " + Array.from({ length: c1 - c0 + 1 }, (_, i) => String(c0 + i).padEnd(5)).join(""));
  for (let r = r0; r <= r1; r++) { let line = String(r).padStart(3) + "  "; for (let c = c0; c <= c1; c++) line += lab(cur.res[c + "," + r]).padEnd(5); console.log(line); }
  console.log("\n" + Object.keys(cur.res).length + " cells · " + slopes.length + " runs · " + cuts.length + " cuts · " + inner.length + " inner cuts");
}
