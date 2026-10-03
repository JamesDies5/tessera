# CLAUDE.md — Tessera

Tessera is a single-file HTML app (`tessera.html`, ~600 KB, no build step) that James uses on an iPad
Home Screen shortcut to author autotile sheets and rooms for LILA, his Godot 4.6 Metroidvania. It is
also his pixel editor: a second project type, Background, is a layered canvas he uses for backdrops
and for game sprites (portraits, enemies, rope pieces). Its
resolver is embedded verbatim in ATLAS (the level editor in the Godot project), so a change here can
be a change there. Current: **v6.121.12** (2026-10-03).

Four documents, each with one job. Read this file and the blueprint before touching code.

| Doc | Job |
|---|---|
| `CLAUDE.md` (this file) | HOW to work here and WHERE things are in the file |
| `tessera_blueprint.md` | what Tessera is today, and the standing design decisions (the WHY) |
| `tessera_roadmap.md` | what is next, in James's order, and every open item |
| `tessera_history.md` | HISTORY: the blueprint as it stood 2026-09-10, the build-by-build record. Never take current state from it |

## Who you are working with

- James is not a coder. Explain in plain language first, a few short sentences; code diffs don't help
  him, he verifies by testing. One change → he tests → next. Say what you are about to do before you
  do it.
- Tessera is an iPad app: touch and Apple Pencil. James never uses a keyboard with it beyond typing
  names (2026-10-03). Do not propose, extend or "fix" keyboard shortcuts; earlier sessions kept
  drifting back to them.
- Since 2026-10-03 this repo is worked on in Claude Code alongside the game repo
  (`/Users/jamesdies/platformer-test`, which holds ATLAS, the main `CLAUDE.md`, the house rules and
  the only palette canon, `global/palettes/palette_canon.md`). Stay inside those two folders.
- Edit the files here directly, as with the game; no manual hand-off. Give a short plain note of what
  changed. Commits are James's to make (GitHub Desktop).
- Surgical anchored edits over rewrites. Push back on scope creep. When unsure of a geometry/UI
  outcome, render it (a PNG mock) — he judges pictures, not descriptions.
- Keep the docs current in the same session as the change: what the app now does goes in blueprint
  §1, a decision or lesson in the blueprint section it belongs to, and the roadmap is updated at the
  end of every arc. The history file is frozen; do not add to it.

## The one file, by region (line numbers at v6.121.10 — anchor by function name, not line)

| Region | What lives there |
|---|---|
| `<style>` 10–321 | all CSS; trays and rail buttons (`.ibtn`, `.optline`, `.tool`) |
| markup 322–686 | header/tabs, brush / layers / colour flyouts, top trays (`#selbar`, `#shapebar`, `#gradbar`, `#outlinebar`, `#tiledbar`, `#symbar`, `#optbar` (wrench), `#cellbar`, `#rulesbar`, `#iobar`), projects gallery (`#projOverlay`, `#newDlg`), `#stage` = `#rail` + `#stageCol` (`#viewport` + `#rulesbot`) + `#rulesSide` |
| `/*__PURE_START__*/` 688 → `/*__PURE_END__*/` 2358 | **the resolver.** `CONTRACTS` (709), `expandSlopeRun` (1065), `maskAt` (1145), `resolveAll` (1210), `buildCells` (2243). Pure: no DOM, no app variables. See "Resolver rules" below. |
| app 2372+ | `LS` keys (2486), exports (`exportName` 2516), projects (2488+), GitHub sync (2803+: `ghPushProject` 3011, `ghPullProject` 3055), per-project layout and variation pool (3150–3204), `drawGrid` 3480 (the whole overlay: grids, labels, every ghost and handle), tone lanes (`LANES` 3867), undo (`snapshot` 3922, `levelSnapshot` 3925), room generator (`genRoom` 3945), pixel tools 4439–5345 (`putPx` 4439, brush, selection 4499+, outline 4617, gradient 4665+, shapes 4790+, move/transform float 5033+, clipboard 5179+, fills 5286+), `rebuild` 5349 → `renderPreviewNow` 5416, `blitResolved` 5394, pointer: `beginStroke` 5730 / `moveStroke` 5844 / `endStroke` 5964, Level select/move 5593+, slices (`sliceEdges` 5611), rules trays (`rulesRender` 6306), `setTab` 6779, `setTool` 6814, cell-mode (`syncCellMode` 6931), variation pool editing 7037+, rules / room export and import 7179+ (`importRoom` 7271), backgrounds mode 7606–8283 (`bgDoc`, layers and groups, `bgBoot` 8250), `APP_VERSION` 8305, `boot` 8536 |

The app boots into one of two modes, fixed at page load by the open project's type: a **Tileset**
project (tabs, rules, level tools) or a **Background** project (layers; tabs and rules hidden).
Tabs: Template (`activeTab === "ed"`), Level and Zoo (both `"pv"`, `layoutMode` `"field"` / `"zoo"`).
Level cell edits go through `fills` (`"c,r"` → `{t:1}`), `userSlopes` (runs), `cuts` / `icuts` (edge
sets), `roomDoors` / `roomSpawn`; every edit calls `levelSnapshot()` first, then `rebuild();
renderPreview(); persist…()`. Cell keys are room-relative and may be negative — the Level has a 4-cell
drawable margin (`PV_PAD`, helpers just below the pure region).

## Verification ritual — every build, no exceptions

1. Edit with anchored replacements: `assert count == 1` on every anchor; a miss aborts the whole edit.
2. Bump `APP_VERSION` (the `const` near the end of the script; the header reads it).
3. Parse gate: extract the `<script>` block and run `node --check` on it.
4. Confirm `grep -c 'APP_VERSION = "x.y.z"'` returns 1, then look at the change in the preview
   (below): header version, no console errors, the changed thing on screen. Show James a screenshot
   for anything visual. The build reaches his iPad when he commits and pushes, then taps Reload.
5. If the pure region moved at all: run `tools/resolver_harness.js` (below) in `--prev` mode against
   the previous build on every regression room, seamed and `--noseams`. "No cuts = no change" is an
   invariant; expected diffs must be explained cell by cell.

## Preview — see and try the app (since 2026-10-03)

`preview_start` with `tessera-local` (defined in the game repo's git-ignored `.claude/launch.json`:
a read-only Python file server on `127.0.0.1:8766` rooted at this repo), then open
`http://localhost:8766/tessera.html` in the built-in browser pane. That copy has its own browser
storage, separate from James's iPad, so projects made there are scratch: build test projects, use
every tool, mock things up. Two rules: never enter a GitHub token there and never push from it
(pulling one of James's projects to look at is fine; a pull needs no token and writes nothing to
the repo). The pane is a desktop browser with a mouse: touch, Pencil hover and palm behaviour
still need James on the iPad.

## Resolver rules (the pure region)

- It must load standalone: `node tools/resolver_harness.js` evaluates it under node. The region
  calls exactly one app function, `effDeepVariants` (the variation pool); the harness also hands it
  `maskRemapFor` and `roleRuleForSlope`, but the region never calls those — the app layers taught
  slope role rules and mask remaps on top afterwards, in `rebuild`. So the harness shows the
  resolver's own answer, before taught rules. Reading any other app variable breaks the standalone
  load — the v6.119 pad helpers did, and moved out in v6.121.5.
- ATLAS carries this region verbatim between the same markers (lifted at v6.121.5 → ATLAS v29.29;
  the region has not changed since, and on 2026-10-03 ATLAS v30.15.6's copy matched this file line
  for line apart from its three `[PORT]` lines). After any pure-region change the ATLAS re-lift is:
  replace the region, re-apply ATLAS's three `[PORT]` lines (deep pool, cadence world offset,
  solo-column edge pick), verify old-vs-new `resolveRoom` over the Lavune levels = 0 diffs. The
  game repo's `atlas/atlas-roadmap.md` and `docs/house-rules.md` cover the ATLAS side.
- Slices (§6b): `CUTS` / `INNER` are module-level sets the app assigns in `rebuild`. `maskAt` reads a
  plain-cut neighbour as air; inner cuts are read by the rim chooser's `isEdge` (and the pillar pass's
  `pe`) via `innerCut` / `innerReach` / `selfWall`. **Fix seam readings at pick time, never by
  teaching the pillar pass** — that was tried and it collapsed strips to core (v6.121.4).
- Role keys for slope ends look like `f:slope_3to1:asc:u:open:ff:o` (face : grad : dir : part :
  end : what sits beyond the end, own row then support row : what sits beyond it on the far row;
  `o` air, `f` fill, `p` slope). Mid-run cells stop after `part`. A one-step 45° connector is the
  only cell with a four-letter group (`…:open:ofoo:o`), because it probes both sides. A taught rule
  is looked up by the full seven-part key first, then by the first six parts. The 47-blob masks use
  N=1 NE=2 E=4 SE=8 S=16 SW=32 W=64 NW=128, corners masked when an orthogonal is off.
- No random variants outside the core today: edges and rims vary only by their ordered cycles
  (`EDGE_VARIANTS`, `RIM_VARIANTS`); corners, joints and every slope cell are single fixed tiles.
- Nothing about collision, semi-solid or hazard exists anywhere in the app yet (roadmap §1b and §2).

## Harness

`node tools/resolver_harness.js --app tessera.html --rules X.rules.json --room Y.room.json`
prints every cell's sheet label (same letters/numbers as the app's coords overlay). `--prev old.html`
prints only the cells that changed. `--block 10x8 --seam "0,3,S..9,3,S" --inner` builds a synthetic
case. The regression set is `rooms/regression/` (it has its own README): the two `tester-2` rooms +
their rules (5×5 joints set) and the `newtemp` slope room + rules, frozen copies. Run each with and
without `--noseams` before shipping a resolver change. The previous build for `--prev` comes from
git (`git show HEAD:tessera.html` into the session scratchpad).

## Data formats

- Rules JSON (`<slug>.rules.json`): `contract` (the per-set layout — `LOOKUP`, `TRANSITION`, `RIM_*`,
  `JOINTS`, slope stamps/caps, switches like `RIM_JOINTS`, `RIM_WEDGES`, `CADENCE_ANCHOR`),
  `maskRules`, `roleRules` (taught overrides), `deepVariants`. ATLAS reads the same file as a sidecar
  beside the terrain PNG.
- Room JSON (`<slug>.room.json`): `gcols`, `grows`, `pad`, `fills`, `slopes`, `cuts`, `innerCuts`,
  `resolved` (baked output), doors/spawn. Older files simply lack newer keys; loaders default them.
- Projects: two types, Tileset and Background. The open project lives in `localStorage`; the
  project library is an IndexedDB database (`tessera-projects`), each record a snapshot of the
  project's `localStorage` keys (`PROJECT_KEYS`). Palettes, brush, pen settings and the GitHub
  token stay on the device and never travel with a project.
- GitHub sync pushes to `JamesDies5/tessera` under `projects/<slug>/`, one commit per file, 0.7 s
  apart, up to 5 tries on a 409 or a server error, with a fresh SHA each try (v6.121.10). A tileset
  pushes `project.json` + `<slug>.png` + `<slug>.rules.json`; a background pushes `project.json` +
  the flattened `<slug>.png` + one `<slug>.layerN.png` per layer when it has more than one, and no
  rules file; since v6.121.12 a push also removes leftover `<slug>.layerN.png` files it no longer
  writes (and can remove nothing else). A pull reads `project.json` only (everything is inside it) and works without a token
  (public repo); pushes need the fine-grained token stored in `localStorage`. Last write wins.
- Background document (`tessera.bg.doc`): `w`, `h`, `active`, `tiled`, `sym`, and `layers` bottom
  to top, each `{id, name, visible, locked, opacity, png}` or a group header `{kind: "folder", …}`
  whose members sit directly below it (one level deep). `locked` means alpha lock, not an edit lock.
  Every layer's PNG is stored inside that one document.
- Exports are data URLs: PNG, and JSON as **base64** (the in-app preview host runs downloads through
  `atob`).

## Things that look wrong and aren't

- Floor and ceiling slope art are separate on purpose — never share via vertical flip. Non-negotiable.
- The rim-under-slopes transition tile is shelved deliberately (blueprint §6a) — don't reopen it
  unless its stated conditions are met.
- The Revise tool (tap a tile, name the right one) is the older way to fix a wrong tile and never
  worked well; prefer a rule or a per-set switch (blueprint §1.6).
- The 7×7 is still wanted as an option (James 2026-10-03). It is not scrapped; what needs a rethink
  is how it handles slopes (blueprint §1.2, §8; roadmap §1h).
- `RIM_WEDGES: "terminate"` on the 5×5 sets is the chosen look, not a gap.
- The Level margin cells render at 37.5 % opacity by design; Export Room PNG leaves them out by design.
- A Home Screen web app on iOS has **its own storage**: projects and the GitHub token live in the
  shortcut, not in Safari. Never add `apple-mobile-web-app-capable`. Never advise deleting/re-adding
  the shortcut without a push first.
- GitHub pushes: one project at a time, wait for green. A 409 means the branch moved or a stale
  SHA, not a token problem.
- Any slope or joint change is a per-set switch, default off, so older sheets such as Lavune Cave
  keep resolving exactly as before.

## Open threads (full list: `tessera_roadmap.md`)

Order set by James 2026-10-03: first finish the rule refinements — slope logic options (the Slopes
tray), collision drawing, variations for tiles other than the centre core, pattern-fill tilesets,
the canon 5×5 start-up ruleset, and a rethink of slopes on the 7×7 — then the full tileset exporter (art, rules, collision, hazard, slopes, semi-solid in one bundle that
ATLAS and Godot import ready to go), then Tech 3 into ATLAS/Godot. Also raised 2026-10-03: a
dedicated Sprites project type beside Tileset and Background, possibly with animation and onion
skinning (nothing of that exists yet). Delivered and awaiting James's test on the iPad: v6.121.12, a push
also clears a background's leftover per-layer PNGs from the repo. (The v6.121.11 tooltip tidy was
verified by James 2026-10-03.)
