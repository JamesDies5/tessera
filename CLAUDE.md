# CLAUDE.md — Tessera

Tessera is a single-file HTML app (`tessera.html`, ~600 KB, no build step) that James uses on an iPad
Home Screen shortcut to author autotile sheets and rooms for LILA, his Godot 4.6 Metroidvania. Its
resolver is embedded verbatim in ATLAS (the level editor in the Godot project), so a change here can
be a change there. `tessera_blueprint.md` is the design canon — the WHY and the decisions. This file
is the HOW and WHERE. Read both before touching code. Current: **v6.121.10** (2026-09-10).

## Who you are working with

- James is not a coder. Explain in plain language first, a few short sentences; code diffs don't help
  him, he verifies by testing. One change → he tests → next. Say what you are about to do before you
  do it, and stay inside this repo.
- He integrates files himself. Deliver whole files, verified, with a one-paragraph note of what changed.
- Surgical anchored edits over rewrites. Push back on scope creep. When unsure of a geometry/UI
  outcome, render it (a PNG mock) — he judges pictures, not descriptions.
- Keep the blueprint current in the same session as the change: a decision or lesson goes in the
  section it belongs to; status line + §1 for shipped versions; §10 for open items.

## The one file, by region (line numbers at v6.121.10 — anchor by function name, not line)

| Region | What lives there |
|---|---|
| `<style>` 10–321 | all CSS; trays and rail buttons (`.ibtn`, `.optline`, `.tool`) |
| markup 322–686 | header/tabs, top trays (`#selbar`, `#shapebar`, …), `#rulesbar`, `#cellbar`, `#optbar` (wrench), `#stage` = `#rail` + `#stageCol` (`#viewport` + `#rulesbot`) + `#rulesSide` |
| `/*__PURE_START__*/` 688 → `/*__PURE_END__*/` 2358 | **the resolver.** `CONTRACTS` (709), `expandSlopeRun` (1065), `maskAt` (1145), `resolveAll` (1210), `buildCells` (2243). Pure: no DOM, no app variables. See "Resolver rules" below. |
| app 2372+ | `LS` keys (2486), exports (`exportName` 2516), projects (2488+), GitHub sync (2803+: `ghPushProject` 3011, `ghPullProject` 3055), rules tab (`rulesRender` 6306), `drawGrid` 3480 (every overlay/ghost), `rebuild` 5349 → `renderPreviewNow` 5416, `blitResolved` 5394, pointer: `beginStroke` 5730 / `moveStroke` 5844 / `endStroke` 5964, `setTab` 6779, `setTool` 6814, cell-mode (`syncCellMode` 6931), Level select/move 5593+, slices (`sliceEdges` 5611), room import (`importRoom` 7271), backgrounds mode 7606+ |

Tabs: Template (`activeTab === "ed"`), Level and Zoo (both `"pv"`, `layoutMode` `"field"` / `"zoo"`).
Level cell edits go through `fills` (`"c,r"` → `{t:1}`), `userSlopes` (runs), `cuts` / `icuts` (edge
sets), `roomDoors` / `roomSpawn`; every edit calls `levelSnapshot()` first, then `rebuild();
renderPreview(); persist…()`. Cell keys are room-relative and may be negative — the Level has a 4-cell
drawable margin (`PV_PAD`, helpers just below the pure region).

## Verification ritual — every build, no exceptions

1. Edit with anchored replacements: `assert count == 1` on every anchor; a miss aborts the whole edit.
2. Bump `APP_VERSION` (the `const` near the end of the script; the header reads it).
3. Parse gate: extract the `<script>` block and run `node --check` on it.
4. Deploy, then verify the **deployed** bytes independently: md5 matches the working file, and
   `grep -c 'APP_VERSION = "x.y.z"'` on the deployed file returns 1.
5. If the pure region moved at all: run `tools/resolver_harness.js` (below) in `--prev` mode against
   the previous build on every regression room, seamed and `--noseams`. "No cuts = no change" is an
   invariant; expected diffs must be explained cell by cell.

## Resolver rules (the pure region)

- It must load standalone: `node tools/resolver_harness.js` evaluates it with three stubs
  (`maskRemapFor`, `roleRuleForSlope`, `effDeepVariants`). Reading any app variable breaks that —
  the v6.119 pad helpers did, and moved out in v6.121.5.
- ATLAS carries this region verbatim between the same markers (currently lifted at v6.121.5 →
  ATLAS v29.29). After any pure-region change the ATLAS re-lift is: replace the region, re-apply
  ATLAS's three `[PORT]` lines (deep pool, cadence world offset, solo-column edge pick), verify
  old-vs-new `resolveRoom` over the Lavune levels = 0 diffs. ATLAS's own `CLAUDE.md`/roadmap covers it.
- Slices (§6b): `CUTS` / `INNER` are module-level sets the app assigns in `rebuild`. `maskAt` reads a
  plain-cut neighbour as air; inner cuts are read by the rim chooser's `isEdge` (and the pillar pass's
  `pe`) via `innerCut` / `innerReach` / `selfWall`. **Fix seam readings at pick time, never by
  teaching the pillar pass** — that was tried and it collapsed strips to core (v6.121.4).
- Role keys for slope ends look like `f:slope_3to1:asc:u:base:ofof` (face : grad : dir : part :
  end : abutment). The 47-blob masks use N=1 NE=2 E=4 SE=8 S=16 SW=32 W=64 NW=128, corners masked
  when an orthogonal is off.

## Harness

`node tools/resolver_harness.js --app tessera.html --rules X.rules.json --room Y.room.json`
prints every cell's sheet label (same letters/numbers as the app's coords overlay). `--prev old.html`
prints only the cells that changed. `--block 10x8 --seam "0,3,S..9,3,S" --inner` builds a synthetic
case. Keep a `rooms/regression/` folder with: the two `tester-2` rooms + their rules (5×5 joints set),
`newtemp` room + rules, and run each with and without `--noseams` before shipping a resolver change.

## Data formats

- Rules JSON (`<slug>.rules.json`): `contract` (the per-set layout — `LOOKUP`, `TRANSITION`, `RIM_*`,
  `JOINTS`, slope stamps/caps, switches like `RIM_JOINTS`, `RIM_WEDGES`, `CADENCE_ANCHOR`),
  `maskRules`, `roleRules` (taught overrides), `deepVariants`. ATLAS reads the same file as a sidecar
  beside the terrain PNG.
- Room JSON (`<slug>.room.json`): `gcols`, `grows`, `pad`, `fills`, `slopes`, `cuts`, `innerCuts`,
  `resolved` (baked output), doors/spawn. Older files simply lack newer keys; loaders default them.
- Projects: a project is a snapshot of `localStorage` keys (`PROJECT_KEYS`); the GitHub sync pushes
  `project.json` + `<slug>.png` + `<slug>.rules.json` per project to `JamesDies5/tessera`, one commit
  per file, 0.7 s apart, 5 retries on 409 with a fresh SHA each attempt (v6.121.10). Pulls work
  without a token (public repo); pushes need the fine-grained token stored in `localStorage`.
- Exports are data URLs: PNG, and JSON as **base64** (the in-app preview host runs downloads through
  `atob`).

## Things that look wrong and aren't

- Floor and ceiling slope art are separate on purpose — never share via vertical flip. Non-negotiable.
- The rim-under-slopes transition tile is shelved deliberately (blueprint §6a) — don't reopen it
  unless its stated conditions are met.
- `RIM_WEDGES: "terminate"` on the 5×5 sets is the chosen look, not a gap.
- The Level margin cells render at 37.5 % opacity by design; Export Room PNG leaves them out by design.
- A Home Screen web app on iOS has **its own storage**: projects and the GitHub token live in the
  shortcut, not in Safari. Never add `apple-mobile-web-app-capable`. Never advise deleting/re-adding
  the shortcut without a push first.

## Open threads (see blueprint §10 for the full list)

Collision arc (§7) is next, then the export arc, then Tech 3 into ATLAS/Godot. Slice follow-ups: cap
joints for a partial inner seam ending in open core; slopes honouring cuts (define first). Slopes
rules tray (§5). Two projects with the same slug would overwrite each other in the repo (no guard).
