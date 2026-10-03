# Tessera Blueprint

**Status:** rebuilt 2026-10-03 against `tessera.html` v6.121.10 (the first documentation sweep in Claude Code). §1 describes the app as it is, checked against the file. §2, §3, §6, §6a, §6b and §8 are the standing design decisions, carried over word for word from the 2026-09-10 blueprint under their old numbers, so older references still land. §9 is the invariants, brought up to date.
**Purpose:** what Tessera is today and why it is built that way.
**Sibling documents:** `CLAUDE.md` (how to work here, and where things are in the file) · `tessera_roadmap.md` (what is next, in order; the old §4, §5 plan, §7 and §10 moved there) · `tessera_history.md` (the old blueprint, frozen: the build-by-build record; never take current state from it). In the game repo (`/Users/jamesdies/platformer-test`): `atlas/atlas-roadmap.md` for ATLAS, and `global/palettes/palette_canon.md`, the only palette canon.

---

## 1. What Tessera is today (v6.121.10)

One HTML file, no build step, used on an iPad from a Home Screen shortcut with touch and Apple Pencil. It is not a keyboard app (James 2026-10-03: he only ever types file names); never design around keyboard shortcuts.

### 1.1 Two project types

The app starts in one of two modes, decided by the open project's type and fixed until the next reload.

- **Tileset** — an autotile sheet plus its rules. Tabs, rules trays and level tools are all available.
- **Background** — a layered canvas (§1.8). Tabs, rules and level tools are hidden. James uses it for backdrops and, increasingly, for game sprites: portraits, the Gunner, rope pieces, scraps.

A dedicated Sprites type is on the roadmap; nothing of it exists yet.

### 1.2 Sheet formats, and where each stands

A format (the code calls it a contract) says which cell of the sheet plays which part: edges, corners, rim, core, slope stamps. Four are built in.

| Format | Standing |
|---|---|
| **3×3** | The original, and the format the app falls back to. The game's Godot reference sheet (`autotile_template.png`, 10×11 cells) and its older terrains use it. |
| **4×4** | Adds a simple rim. No project uses it today. |
| **5×5** | **The standard** (James 2026-10-03). Every tileset project but one is a 5×5. The template is 11×18 cells and includes the 34 joint cells. **Tech 3** and **Tester 2** are the frontier sets: rim joints on, wedges terminate, all 34 joint roles drawn. **Lavune Cave** (11×15, no joints) is the only Tessera set in the game so far. |
| **7×7** | Three border bands. **Still wanted as an option** (James 2026-10-03). It has solid rules for flat ground, but it developed logic problems and needs a very large number of tile permutations once slopes are merged into it (lessons in §8). Only **Truce** uses it. What needs a rethink is how it works with slopes; one idea is no merged slopes at all, with slopes as placed ramp objects (roadmap §1h). |

Every slope or joint behaviour added since July is a per-set switch that is off unless the set asks for it, so older sheets resolve exactly as they always did.

The start-up ruleset a new 5×5 project gets still needs tuning before James would call it canon (roadmap).

### 1.3 The three tabs (tileset projects)

- **Template** — the tile sheet itself. All pixel tools work here.
- **Level** — an editable mock room resolved live from the sheet and its rules. The only tab with cell and slope tools. Painting a pixel here writes it back to the right tile on the sheet.
- **Zoo** — generated coverage: every edge and corner combination and all twelve slope stamps, plus the joint cases when rim joints are on. Read-only geometry.

Header: Projects, Reload (fetches the latest deployed build), the format picker, the wrench (Reset, Canvas size, Flip H / Flip V, Import, Export — Export follows the tab: sheet PNG on Template and Zoo, the room as a flat PNG on Level).

### 1.4 Level tools

**Cell mode is a toggle.** On, the cell tray opens and the pixel tools grey out; off, cell-only tools hand back to the pencil.

- **Select / Move** — Select *is* Move. Drag empty space to marquee (trimmed on release to what it touched); drag a cell, slope run, block, Lila or a door to move it with a green ghost. Settled rules: a slope run moves only when every cell of it is selected; a run under the drop is removed and reported; doors move vertically on their own wall; a lone Lila or door seats onto solid within two cells below; seams travel when both their cells move.
- **Paint · Erase · Rectangle** — whole cells. Rectangle skips slope cells and is one undo step. Erasing any cell of a slope run removes the whole run.
- **Floor slope · Ceiling slope** — drag to draw a run; the drag's shape picks the gradient (45°, 2:1 or 3:1) and direction. A new run replaces any it overlaps; tapping a run removes it; tapping an empty inside corner drops a single 45° connector.
- **Slice · Inner slice · Heal** — §6b.
- **Dice** rolls a generated test room (halls, shafts, chambers, with doors and a Lila spawn, sized to her jump). Doors and Lila come only from the generator; there is no tool to place or delete them, only to move them.
- **Reset** returns the room to the default layout.

**Out-of-bounds margin:** four cells on every side of the room, because in-game rooms continue past the camera. Margin cells draw dimmed, heal their in-room neighbours like any cell, and are left out of Export Room PNG.

Level edits have their own undo (40 steps), interleaved with pixel undo. Two-finger tap is undo, three-finger tap is redo.

**Import/Export tray:** rules as `<name>.rules.json`, the room as `<name>.room.json`. Importing rules replaces the stored rules for that format and is not undoable; importing a room is.

### 1.5 Rules (the main way to shape a set)

Rules is a toggle on the rail, not a tab, and it stays on across tabs. On Template, taps on the sheet assign cells and the drawing tools step aside. On Level and Zoo the trays tune what was assigned while the live room redraws.

Three modes:

- **Depth** — how many border bands the set uses, 1 to 3 as the format allows.
- **Edges** — a ring laid out as the tiles sit on the sheet: the four outer corners, the four edge cycles along the outside, the rim cycles one cell in (and a third ring on formats that have one). Each side holds an ordered cycle of one or more tiles; drag to reorder, × to remove, + then tap the sheet to add. Four switches sit under the ring: *Sides continue below corners*, *Rim joints*, *Rim meets wedges: terminate*, and *Count edge tiles from each corner* (off = count from the room's origin).
- **Variations** — the pool of alternative tiles for the **core** (the plain interior). Each entry has a weight slider with its live share of picks; a multi-cell entry is a panel. Per entry: Spread (keep a moat), Centre or Grid placement with H and V gaps, bias for an odd leftover, rotation. A *Disable variations* switch gives an A/B preview without touching the pool.

**Only the core has a random pool.** Edges and rims vary by their ordered cycles; corners, joints and every slope cell are single fixed tiles.

**Projects own their layout.** A project carries its own copy of the format once it edits the layout or imports a rules file that differs from the template; *Reset to template* drops the copy. Export writes the project's layout into the rules file, so ATLAS needs no change for new rules to take effect.

There is no Slopes mode, no collision mode, no tile re-sort and no joints strip yet (roadmap).

### 1.6 Taught rules (the Revise tool) — the older system

Tap a resolved cell on Level or Zoo and say which sheet tile it should have been, with optional flip and rotation. The correction is stored as a taught rule (one table for ordinary cells, one for slope ends) and laid over the resolver's answer from then on. Taught rules travel in the rules file and ATLAS applies them the same way.

This was the first way to fix a wrong tile. It lacked context and never worked very well (James 2026-10-03); the Rules trays replaced it as the real tool. It is still in the app, and the shipped slope-end tables for the 5×5 and 7×7 are built from it. Prefer a rule or a switch over a taught correction.

### 1.7 The pixel editor

Built 2026-09-02 (v6.61 → v6.81) by studying Aseprite's source; the ellipse, the curve, the pixel-perfect stroke and the outline rule are direct ports, credited in the code. Transform follows Procreate's model.

- **Pencil · Eraser** with a shared brush: size 1–16, square or circle, pixel-perfect stroke, dither at 25 / 50 / 75 %.
- **Fill** — contiguous or global. On a tileset the flood stops at the tile's own 16 px cell; on a background it floods the canvas.
- **Eyedropper** with a loupe; picking transparency arms the eraser. Hold to pick.
- **Shapes** — rectangle, ellipse, polygon, line, curve; outline or filled. A shape stays live with handles until placed.
- **Select** — rectangle, ellipse, lasso (drag freehand, or tap corners), magic wand; add and subtract; invert. Shown as a hatch over what is *not* selected. A selection confines painting.
- **Transform** — move, Flip H, Flip V, Rotate 90°. No scaling or free rotation.
- **Cut · Copy · Copy All · Paste** — inside the app only. On a background, paste lands on a new layer.
- **Outline** — outside or inside, four neighbour patterns, live preview.
- **Gradient** — linear or radial, two or more stops (one may be transparent), adjustable midpoints, ordered dither 2×2 / 4×4 / 8×8 or hard steps.
- **Drag a colour chip onto the canvas** to fill.
- **Canvas** — resize a tileset sheet by dragging its edges (a background's size is typed in); Flip H / Flip V for the whole canvas.
- **Finger drawing** toggle (on until a Pencil is seen), palm rejection, pinch to zoom and pan.

**Colour.** Art is painted in fixed gray tones and shown through a zone palette, exactly as the game's shader shows it. Tileset tones: 25, 52, 89, 139, 200, 255. Background projects add 20, the void-match tone. The colour menu shows the tones, any off-tone colours found in the file with a Convert button that snaps them to the nearest tone, and the preview palette. What each tone means is in the game repo's `palette_canon.md`.

### 1.8 Background projects

A canvas of any size from 16 to 4096 px a side; presets are one game screen (480×270) and its halves. The size shows in the header and can be changed later (shrinking crops, keeping the top-left).

**Layers:** add, delete, duplicate, rename, reorder by dragging, merge down, merge selected, per-layer opacity, hide, and **alpha lock** (paint only where the layer already has pixels — it is not an edit lock). Layers can be grouped, one level deep; a group can be hidden, collapsed, moved, duplicated, or flattened to one layer. Swipe right on rows to multi-select. There are no blend modes and no layer limit. Undo is 24 steps.

**Views:** tiled preview (across, down or both) for seamless art; symmetry painting (horizontal, vertical or quad).

**Import PNG** adds the image as a new layer, growing the canvas if it is larger.

**Export** saves the visible layers flattened to one PNG. Any single layer or group can be exported on its own from its options.

There is no animation: no frames, no timeline, no onion skin.

### 1.9 Projects and cloud saves

Each project is a named snapshot of everything about it: art, rules, room, layers. The open project lives in the browser's quick storage; the library of all projects lives in the browser's larger database. Both belong to the Home Screen shortcut, not to Safari. Palettes, brush and pen settings and the GitHub token stay on the device and do not travel with a project.

The gallery filters by type and offers New (name, type, size), Import PNG, Rename, Duplicate, Delete. The open project cannot be deleted.

**Sync is James's cloud save.** Pushing a project writes it to this repo under `projects/<name>/`: `project.json` (the whole project), the PNG, and for a tileset its `rules.json`; a background with more than one layer also gets one PNG per layer. A pull needs only `project.json`. The folder follows the project's name: a rename moves it on the next push, and Delete removes it from the repo too (when a token is set). Last write wins; there is no merge. Each card shows whether it matches what was last pushed.

Known gaps, none of which has bitten yet (roadmap):
- A background that loses layers leaves its old per-layer PNGs behind in the repo.
- If the browser's quick storage ever fills, the save fails silently, and a push would then upload the last good save while reporting success.
- Two projects whose names reduce to the same folder name would overwrite each other.

### 1.10 What reaches ATLAS and Godot today

- **ATLAS** carries a word-for-word copy of the resolver and reads a terrain's `<name>.rules.json` from beside its PNG in the game's `levels/shared/Terrains/`. It resolves each terrain from the layout inside that file, so any sheet size and layout the file describes works. ATLAS resolves room by room with a two-cell apron, so a core spanning two rooms is laid out as two rectangles; Tessera resolves the whole level as one and cannot show that.
- **Godot** gets tiles already resolved by ATLAS. But a new sheet must be registered in the shared TileSet **by hand** in Godot's TileSet editor, including its collision: `atlas_register_terrains.gd` only clones from the 10×11 reference sheet. A variant pointing at an unregistered cell renders blank.
- **In the game so far:** Lavune Cave only. James has since made small rule changes to Lavune Cave in Tessera; the game's copy is older, on purpose, until the exporter gives a clean way to update it.
- **Backgrounds and sprites** leave as plain PNGs and are placed by hand.
- **Nothing in Tessera knows about collision, semi-solid or hazard yet.** That, and one-step import, is the exporter arc (roadmap §2).

### 1.11 The resolver harness

`tools/resolver_harness.js` runs the resolver alone under node and prints which sheet tile every cell resolves to, or only the cells that changed between two builds. `rooms/regression/` holds the frozen test rooms (it has its own README). The harness shows the resolver's own answer, before taught rules. How and when to run it: `CLAUDE.md`.

---

## 2. Design principles (from studying Metroid Fusion and Gravity Circuit)

- **Borders are thin.** One tile does the work: highlight line, shadow line and detail inside 16 px; corners get a dedicated piece. A second band is an option, not the norm. Three bands (the 7×7) is what made diagonal rings intractable — those games never solve that problem because they never create it.
- **Interiors are a plain fill plus a few large panels**, not many small variants. Panels have their own corners, sit sparsely on the fill, never overlap. Placement is random, symmetric or hand-placed depending on the room.
- **Slopes are stamped wedges**, two cells deep at every border depth (James 2026-09-06: the two-deep column is a good universal baseline; a one- or three-deep column was drawn out and rejected). Nothing beneath a wedge knows it is there. Where a wedge meets a flat edge, the cap is an authored tile.
- **Anything with a silhouette is an object.** Pillars, pipes, girders, chains, spike blocks are ATLAS entities placed on or instead of terrain, never Tessera rules.
- **The run tools stay.** Tessera and ATLAS keep drawing slopes as runs; the resolver places wedges.

---

## 3. Contract redesign

One contract with explicit, per-tileset properties instead of behaviour baked into fixed layouts.

| Property | Today | Target |
|---|---|---|
| Border depth | **Built (v6.86):** 1–3 bands per project, contract-data only | Later maybe per side (thick floor rail, thin ceiling line) |
| Core | Single cell (5×5) | Everything inside the rim |
| Panels | **Built (v6.96–v6.99.1):** multi-cell groups in the pool with Centre / Grid layout, H/V gaps, bias; non-overlap and reserved gap rings | Hand-placed panels are ATLAS entities (§2), not a Tessera rule; symmetric placement not requested |
| Edge variants | **Built (v6.92):** any count ≥ 1 per side, ordered, from the Edges mode; caps stay the template's pair | Caps editable from the same rows, if ever needed |
| Slopes | **Settled (2026-09-06):** surface + underlay stamps, two deep at every border depth; authored caps at each end | Unchanged — no depth-following column |

**Order of work:** ~~border depth~~ → ~~edge run length~~ → ~~wedges~~ → ~~panels~~ → backdrop pattern.

The backdrop pattern, the last item in that order, is designed but not built: `tessera_roadmap.md`.

---

## 6. Slope wedges — closed 2026-09-06

**Decision (James 2026-09-06):** the slope column stays **two cells deep at every border depth** — surface plus one underlay. Rendering the alternative (one cell at depth 1, three at depth 3) against the current two-deep column showed the two-deep column is already a good universal baseline; neither the thinner nor the deeper wedge was worth its cost (a depth-1 column strands every end treatment that lives on the underlay; a depth-3 column needs a third authored stamp row). The depth-following column proposed on 2026-09-04 is withdrawn.

What stands, unchanged from today:
- Per slope kind (45°, 2:1, 3:1) and face (floor, ceiling); descending is the horizontal mirror (`MIRROR_SLOPES`).
- Caps where a wedge meets a flat edge, wall, peak or open air are authored tiles selected by the existing end/joint logic (`SLOPE_CAPS`, `BASE_CAPS`, `TIP45_UNDERLAY`, `SLOPE_WALL_JOINTS`, the attach cells).
- Nothing beneath the underlay knows the slope is there; it is core, or rim where the flat ground's band runs into it (`seamBand`).
- Collision of a wedge is its outline (§7).

No resolver change, no ATLAS lift. Gateway (depth 1) and Truce (depth 3) keep their two-deep slopes as-is.

---

## 6a. Rim under slopes — investigated and shelved 2026-09-09

**The problem.** The new 5×5 template (drawn on an 8×8-pixel block grid) makes the border three 8px bands — light rim, dark band, inner rim row — 24px, 1.5 tiles. A wedge stamp is two cells (surface + underlay), which holds the light and dark bands and only a sliver of the inner rim at 45°, none of it in the low columns of 2:1 and 3:1. Under `RIM_WEDGES: "terminate"` the inner rim row stops wherever a slope starts, because the cell two below the surface is an ordinary ring cell (deep, `iB`, `iR`, a corner) that has no idea a slope is above it. Slopes read thinner than the walls they join, and every slope end shows a broken ring. James's test room (`newtemp`, 33 runs, all three grads, both faces) exercises 31 distinct end situations built from 7 joint shapes (base on floor `ofof`, base against wall `ffof`, tip at wall `ffof`, peak `ppof`, base/tip over a ledge `ooof`, thin wedge `oooo`).

**What was measured (keep these numbers; they are the reason it is shelved).**
- Full rim-follows-slope with clean corners, single layer: James redrew his ideal by hand on the Room PNG (floor-ascending only). Diffed cell by cell: 42 changed cells → **27 distinct cells per face** after folding mirrors and 8px of hand variance (45°=7, 2:1=10, 3:1=10); ~55 with ceilings, which are always separate art (non-negotiable). The count is intrinsic to the look: the same stamp tile needed different art depending on its neighbours (`(2,9)` five ways, `(4,9)`/`(5,9)` four each).
- Quarter-tile (8×8) decomposition: the 27 cells contain 55 distinct quadrants — diagonal art shifts per column and does not repeat. Does not help.
- A second overlay layer: the added pieces were as position-specific as the whole cells (29 distinct). Does not reduce the count; it only moves it.
- Mock renders of overlay / stop-short / contact-stop hybrids: each was clean at some ends and broken at others; the turn-vs-run-past distinction (turn = tuck, run-past = butt) is computable from the end signature, but every contact cell is still a combined tile in a single layer.
- Research (2026-09-09 report): no shipped 2D game autotiles a deep multi-band border along arbitrary slopes. Celeste keeps the edge ~1 tile + infill; Sonic and Super Metroid hand-author slope blocks/chunks; Terraria's hammered slopes leave gaps the player fills. The one precedent that joined two-cell-deep edges across slopes (Levi Lindsey's Surface Tiler, Godot, per-quadrant closest-match with authored fallbacks) dropped its 27°/3:1 slopes as "way too many corner cases". Community answers: closest-match fallbacks, rules that reach beyond 3×3 (LDtk goes to 9×9), manual per-cell overrides, slopes terminating on caps/plateaus, or procedural (SDF/shader) bands.

**Smallest viable design, if it returns** (James 2026-09-09, then shelved the same day):
- A **transition-under-slope** tile in the cell two below the surface (one below the underlay), one per stamp column: 45°=1, 2:1=2, 3:1=3 → **6 per face, 12 total**, floor and ceiling drawn separately.
- Contract keys `SLOPE_TRANSITION` / `CEIL_SLOPE_TRANSITION`, shaped like `SLOPE_STAMPS` but one row deep; absent = off, so every existing sheet is byte-identical.
- Placement: one pass after `addSlopeSupports`; the cell takes the transition only if the ring gave it deep or a ring-1 tile (`iT/iB/iL/iR`, corners) — never an edge tile. Ends butt-join: the straight rim stops one cell early and the diagonal rim's own end shows. No corner tiles, no joint table.
- Sheet space on the 11×18 template: A12–F12 free for floor, D17–I17 free for ceiling (or grow a row).
- Lives in the Slopes tray (§5).

**Why shelved.** Anything past the 12-cell version is orders of magnitude more complexity for the corners, and even the 12-cell version buys butt joints, not clean ones. Three things may make it moot before it is worth building: the **pattern fill** under transparent interiors (§3 backdrop pattern), the **"joints bend around slopes"** `RIM_WEDGES` mode (§10 rim-joint arc item 1), and **art authored to terminate slopes on a cap or plateau** (the convention every shipped reference uses). Reopen only if, after those land, a real room still shows the missing row two-below-the-surface — and then build the 12-cell version, nothing more.

**Artifacts kept:** the exported room (`newtemp.room.png`), James's redraw (`slope-rules.png`), and the 27-cell draw-list extracted from it (`drawlist_floor_asc.png`, labelled; `drawlist_floor_asc_1x.png`, a 1× strip) — his own art for the first 27 cells if the full version is ever wanted.

---

## 6b. Slices — shipped 2026-09-09/10 (Tessera v6.120–v6.121.5, ATLAS v29.29–v29.30.1)

**What it is.** A room-construction tool, not a tileset rule: drawing along the line *between* tiles un-heals the geometry there, so one solid mass reads as panels and sections (Metroid's seams) with no new art. A cut lives on the **edge** between two plain-fill cells — `"c,r,E"` (the line east of cell c,r) or `"c,r,S"` (south of it) — never on a cell. Axis-aligned; the drag snaps to the grid line nearest its start along the dominant axis and covers every edge it passes; a tap takes the single nearest edge. Heal is the same gesture in reverse. Seams draw yellow (inner dashed, heal green) with a crosshair cursor. Cuts only exist between two plain fills of the same terrain; erase a cell or draw a slope through it and its cuts fall away.

**Two kinds.**
- **Slice** (`CUTS`): `maskAt` reads the neighbour across the cut as air, so both cells grow edge art facing each other and the rim rows stop at the seam. A diagonal neighbour is cut off only when *both* corner paths cross a seam (the 47-blob corner rule).
- **Inner slice** (`INNER`): invisible to the edge band; only the rim/core logic sees it, so cells either side resolve as rim facing rim with the core beyond untouched — no edge tiles inside the mass. It hooks the rim chooser's own "is my neighbour an edge cell?" test (`isEdge`) and the pillar pass's `pe`. Diagonal reads count *any* seam touching the corner (a seam ending at a corner is exactly the concave edge a hook is for). An edge is one kind or the other; inner-slicing a slice converts it.

**Rules that took a room each to settle (all proven on James's tester-2 rooms in the harness, each change diffed against every other room):**
- *v6.121.1 — hard cuts.* The first inner-slice hook fed the pillar pass but not the tile chooser, so rims never closed against the seam. Hook the chooser's `isEdge`.
- *v6.121.3 — a seam closes against the wall.* An inner seam ending beside a rim column reaches into that column when the column's own wall is on the far side (`innerReach`), so the column turns the corner: iBL above, iTL below (James's B4/B2), instead of running past a dangling end. "Wall" includes a pillar leg's own face (`selfWall`). A seam ending in open core still ends plainly.
- *v6.121.4 — the strip beside a seam end.* A column swept up as a pillar *leg* before the seam's own pillar existed (the pass walks columns top-down; the seam seeds its pillar lower) only took the wall on its own side. A leg now also takes a real wall on its other side at pick time (a real edge or a neighbouring pillar's face), so it resolves as a strip: cap over pinches (H14 / K15). **Rejected:** teaching the pillar pass itself to see the seam — the harness showed it collapsing strips to core in the first tester-2 room. Keep pass-side wall changes out; fix at pick time.
- Rooms with no cuts resolve byte-identically to pre-6.120 — verified on every room and both testers with all seams removed.

**Data.** Tessera room JSON: `cuts` and `innerCuts` (lists of keys); undo, dice, reset and Select/Move carry them (both cells moved → key shifts; one → dropped). ATLAS: `layer.cuts` map (1 / 2), world-keyed, rebased room-local per resolve; see the ATLAS entry in §1 for every path it rides.

**Known v1 limits.** Slopes ignore cuts (a drag across a run does nothing there). A partial inner seam ending in open core ends plainly — no cap joint yet. Diagonal seams are out of scope (a staircase of cuts). A few rim/cadence readers still peek at raw cells rather than masks; when a seam beside one reads wrong, reproduce it as roles first.

**Harness.** The pure region between `/*__PURE_START__*/` and `/*__PURE_END__*/` loads standalone in node (stub `maskRemapFor`, `roleRuleForSlope`, `effDeepVariants`; set `CUTS` / `INNER` directly). Regression set kept in the working folder: a 10×8 block with full, partial and hook-position seams, James's `tester-2` room and room 5 with his rules, and both with all seams removed. Every resolver change since v6.121.1 was diffed against all of it before shipping; the ATLAS lift was verified the same way over the real Lavune levels. Rebuild it from the file when the resolver moves again.

---

## 8. Lessons from the shelved 7×7 ring work

Recorded because they apply directly to wedges.

- **The art convention is vertical depth.** `A11`–`A14` are the flat edge profile laid down by *vertical* distance from the surface line, not perpendicular distance. Any generated diagonal tile must follow the same convention or it will not meet the flat tiles.
- **Under that convention, a diagonal band's stripes meet a vertical band's stripes exactly on a row boundary**, and a horizontal band's on a column boundary. No mitre or junction tile is needed; the bend is "diagonal cells inside the run's row span, flat cells outside it."
- **Erosion-based rings cannot follow a thin diagonal**: 8-neighbour erosion of a 45° boundary is a staircase. Anything beneath a slope that must look diagonal has to be stamped, not derived.
- **Depth from real edges only** (slope masked out, but only air that touches nothing except the slope) is a useful measurement and would carry over to wedge caps if ever needed.
- **Level geometry matters more than the rule.** Most of what looked broken on the Truce field was runs stopping two cells short of their walls.
- Five builds shipped under one version number that night. **Bump the version on every build.**

---

## 9. Invariants

- **ATLAS's resolver copy follows every resolver change.** Refresh it before exporting a sheet that relies on new behaviour, and verify zero-diff on existing rooms before shipping.
- **The files in the two repos are ground truth.** Read the current file before changing it; never work from memory of an earlier build.
- **One change, then James tests.** Never stack a second change on an untested one.
- **Never touch the resolver's pure region for UI work**, not even its comments: ATLAS carries it word for word. Format *data* may be per-project; resolver *behaviour* is shared and versioned.
- **Probe before patching.** Reproduce in the harness with the real resolver and real files; render before and after; agree the geometry before anyone draws a tile.
- **No cuts = no change.** Every slice rule is gated on the cut sets; a room without seams must resolve byte-identically, and every resolver change is diffed against the seam-free rooms as well as the seamed ones (§6b).
- **New behaviour is a per-set switch, off by default.** Older sheets, Lavune Cave above all, must keep resolving exactly as before.
- **The pure region loads standalone.** Nothing in it may read an app variable (the v6.119 pad helpers did, briefly, and moved out in v6.121.5). If it won't load under node, it isn't pure.
- **Pick-time over pass-time.** When a rim reading is wrong beside a seam, fix it where the tile is chosen; changing what the pillar/strip pass sees cascades (v6.121.4).
- **Floor and ceiling slope art are always separate.** Never share tiles by vertical flip.
- **Bump the version on every build.**

---

## Moved to the roadmap

The plans that used to live here are in `tessera_roadmap.md`: the backdrop pattern (was part of §3), tile re-sort (was §4), the Slopes tray (was the last item of §5), collision and the tileset exporter (was §7), and the open items (was §10). The long build-by-build notes that made up the old §1 and §10 are in `tessera_history.md`.
