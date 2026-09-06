# Tessera Blueprint

**Status:** agreed 2026-09-04; updated 2026-09-06 (Edges mode: Rim + Cadence merged into a ring tray, per-side edge counts). §3 border depth and edge variants are built; the rest of §3–§7 is not.
**Purpose:** the single reference for where Tessera, ATLAS and the Godot terrain pipeline are going, so each arc starts from the same plan.

---

## 1. Where things stand

### Tessera v6.95.0 (current stable)
- **Edges mode (v6.92.0, ring tray v6.93–6.94).** Rim and Cadence are one mode. The lower tray is a **true tile grid**, one 40 px cell per tile, laid out as the tiles sit on the sheet: the four convex corners (LOOKUP 28/112/7/193, dimmed and fixed) at the corners, the four edge cycles (`EDGE_VARIANTS[mask].cells`) along the outside, the four rim cycles (`RIM_VARIANTS[side]`) one cell in. The top/bottom rim rows have fixed **inner-corner slots** at their ends (`TRANSITION` iTL/iTR, iBL/iBR): dimmed when the corner tile is only a corner, lit and draggable when the same tile is also the cycle's first/last member (on the 5×5, B2/D2 are both), so the cycle's middle stays under the edge row's middle whichever way the corners go (v6.94.2). × on a lit corner sends it out of the cycle; tapping a dimmed slot puts the tile back at its end of the cycle, or moves it there if it's already in the cycle elsewhere (v6.94.3). **v6.95.0 generalises the ring to every band a format has:** edge strips take their end slots from `EDGE_CAPS` (7×7: B1/F1, A2/A6, …) so the cycle sits over its rim; a third ring (`TRANSITION2` corners around `RIM_VARIANTS2`, dimmed below depth 3) draws inside the rim; all slots share the same lit/dim/tap-home behaviour; rim edits take a bank (`RIM_VARIANTS` / `RIM_VARIANTS2`). The 5×5 has neither caps nor a third band and is laid out cell-for-cell as before. A cycle of N tiles takes N cells, so the grid grows with its longest strip (`W` = longest horizontal cycle, `H` = longest vertical cycle or side rim + 2). Every gap between cells is a 20 px track, and a strip's half-size + button sits in the gap right after its own last tile (right of a horizontal strip, below a vertical one), Template tab only; spacing is identical with and without them and the ring is always a square when the cycles are. The anchor and sides checkboxes are below the ring. Chips are 40 px thumbnails, side colour on the border; cell names appear on the thumbnail in the sheet's label style only while the A1 coordinates toggle is on; an unassigned side shows a dashed ghost of the tile the resolver falls back to. Drag reorders along the strip (vertical on Left/Right), × removes, + arms a sheet tap (Template tab only). Half the height of the stacked rows it replaced. A side may hold any count ≥ 1 — the resolver already cycled by list length, so the resolver's pure region is byte-identical to v6.91.1 and no ATLAS lift is needed. The run/origin anchor checkbox applies to every row. Modes are now Depth · Edges · Variations.
- **Scope decisions (James 2026-09-06).** The inspirations (X, Fusion, Gravity Circuit) do not randomise edges; their variety is fixed-period cadence, interior panels and placed objects. So: *linked edge+rim stacks* (a variant that carries its rim cell) are **deferred** until a real sheet on a real room shows a rim landing wrong under its edge — if it does, it belongs with §6 wedges, which introduce the stack column anyway. A *layout-shaped tray* was first dropped, then built as the ring (v6.93.0) once the stacked rows proved too tall — it is a rearrangement of the same rows, not a free-form layout editor; the live level is still the only preview.
- **Projects own their layout.** A project may carry its own copy of the contract (`tessera.ct`). Nothing is copied until the project edits the layout or imports a rules file whose layout differs from the template. Opening an old project writes nothing. Fields the template gains later are filled in additively; an explicit `CADENCE_ANCHOR: "origin"` survives that fill. Reset to template drops the copy.
- **Rules (v6.85–v6.88, §5 built, then reshaped).** Rules is a rail **toggle**, not a tab (v6.88): persisted; on, the two trays stay up on every tab. Template + Rules on: the sheet is the template viewport, taps assign cells, drawing tools step aside. Level/Zoo + Rules on: level tools keep the pointer; the trays are for tuning what was assigned (depth, cadence, pool weights, cycle order) against the live level, which redraws on every commit. Modes: Depth · Rim · Cadence · Variations. Header: Projects | Template · Level · Zoo.
- **Variations is a rule (v6.87–v6.88.2).** Pool outlines/Draw/Erase on the sheet; a right-side rail (Variations mode, any tab) lists every entry with a live 0–100 weight slider, its share of picks, and a share bar; tap the thumbnail for spread/rotation/remove.
- **Disable variations (v6.91).** A/B preview switch at the top of the Variations rail: core resolves to the primary alone; pool untouched; export unaffected; session-only.
- **Rim (v6.89–v6.90.5).** Top/Bottom cycles plus optional Left/Right cycles on the 5×5 (unassigned = the ring's iL/iR straight, identical to before). Each row is the cycle in order; chips reorder by hold-and-drag. "Sides continue below corners" (`RIM_COLUMNS`): a corner cell used as a Top straight grows its assigned side beneath it through the core, picked by row as the wall is, until a rim row, edge or slope; leg cells leave the pool.
- **Border depth (v6.86, first row of §3 built).** Per project, 1–3 bands as the format allows. Pure contract data: a band is off when its gate key is null (`TRANSITION` for the rim; `RING_ROLES` + `TRANSITION2` for the deeper ring); `healContract` keeps explicit nulls; ATLAS reads them from the file. Only gate keys are touched, so custom rim straights survive depth 1. Slope stamps stay two deep until §6.
- **Fit-first deep roll (v6.86.1).** A core cell rolls only among pool entries that can be placed there; the primary always qualifies and at weight 0 is drawn only as the sole candidate. Unspread singles pools are byte-identical; spread/group pools move ~3–4% of core cells.
- **Resolver changes since July** (all gated on contract data no existing file carries; every existing contract and room byte-identical, 3,308 cells verified): fit-first deep roll (v6.86.1), optional sides read independently + `RIM_COLUMNS` (v6.90.3). Resolver region md5 `9259cf8b…`.
- **Export** writes the project's layout onto the rules file. **Import** adopts a file's layout if it differs from the template.
- **Project naming (v6.84.0–6.84.5).** A project's repo folder and file names are always its name (slugged). Reconciled at push time: if the folder it last lived in disagrees, the push writes under the name and removes the old folder (GitHub has no rename; move = write-new + delete-old, in one push). Duplicate asks for the name first. Delete removes the repo folder(s) too, repo first so a failure keeps the local record. Rename/Delete read the stored record, not the card's copy. Every write/delete retries on 409/5xx (3 attempts, 1.5 s / 3 s).

### ATLAS v29.27
- The embedded Tessera resolver is lifted from Tessera v6.90.3 (v29.24 from v6.86.1; v29.23 from v6.81.2; v29.25/26 withdrawn). Same three `[PORT]` lines. Verified by James 2026-09-05 on Lavune rooms after each lift.
- ATLAS resolves each terrain from the **contract block inside its own rules file**, not from a built-in table. A per-project layout change in Tessera therefore reaches ATLAS through the file alone; no ATLAS edit is needed for new rules to take effect.
- Consequences: run-anchored cadence works in ATLAS; 7×7 sheets can be used; any sheet size and any cell layout the file describes is accepted.
- Verified zero-diff over every owned cell of `tessera_test` and `tessera_test_2` before shipping.

### Godot
- `atlas_register_terrains.gd` still registers only sheets that match the 10×11 reference template. 5×5 (and any future) sheets are registered by hand until §7 lands.

### Shelved
- The 7×7 three-band-ring model and its diagonal-ring slope work (v6.83.0). Kept out of the working build. The lessons are recorded in §8 because they inform the wedge design.

---

## 2. Design principles (from studying Metroid Fusion and Gravity Circuit)

- **Borders are thin.** One tile does the work: highlight line, shadow line and detail inside 16 px; corners get a dedicated piece. A second band is an option, not the norm. Three bands (the 7×7) is what made diagonal rings intractable — those games never solve that problem because they never create it.
- **Interiors are a plain fill plus a few large panels**, not many small variants. Panels have their own corners, sit sparsely on the fill, never overlap. Placement is random, symmetric or hand-placed depending on the room.
- **Slopes are wedges** exactly as deep as the border. Nothing beneath a wedge knows it is there. Where a wedge meets a flat edge, the cap is an authored tile.
- **Anything with a silhouette is an object.** Pillars, pipes, girders, chains, spike blocks are ATLAS entities placed on or instead of terrain, never Tessera rules.
- **The run tools stay.** Tessera and ATLAS keep drawing slopes as runs; the resolver places wedges.

---

## 3. Contract redesign

One contract with explicit, per-tileset properties instead of behaviour baked into fixed layouts.

| Property | Today | Target |
|---|---|---|
| Border depth | **Built (v6.86):** 1–3 bands per project, contract-data only | Later maybe per side (thick floor rail, thin ceiling line) |
| Core | Single cell (5×5) | Everything inside the rim |
| Panels | Deep-variant groups, small, weighted | Multi-cell props at fixed sizes (2×2, 3×2, 3×3); sparsity; non-overlap; placement mode random / symmetric / hand-placed |
| Edge variants | **Built (v6.92):** any count ≥ 1 per side, ordered, from the Edges mode; caps stay the template's pair | Caps editable from the same rows, if ever needed |
| Slopes | Surface + underlay stamps, ring logic beneath | Wedge stamps as deep as the border; no logic beneath; authored caps at each end |

**Order of work:** ~~border depth~~ → ~~edge run length~~ → wedges → panels → backdrop pattern.

### Backdrop pattern (James 2026-09-05)
A repeating pattern drawn *behind* the terrain tiles, so any tile with transparent pixels reads as a frame over it — the NES/SNES interior technique (Mega Man X walls, Fusion panels). A second axis alongside variations, not a replacement: the pool decides which tile sits in a cell, the backdrop decides what shows through it.
- **Data:** per project, in the contract. A pattern source (a block on the sheet, any size — larger than a tile is the point), tiled in **world** coordinates so it runs seamlessly across any shape; a scope switch (every solid cell, or core + rim only).
- **No masking system (decided 2026-09-05).** The backdrop is laid per solid cell, never as a screen-wide layer; edge tiles are opaque within their cells, so that alone keeps it out of the air. Slope cells are the one exception: the exposed angle simply gets no backdrop — the slope's existing underlay does what it does today. Confirm on a real pattern when the item starts; the wedge work (§6) may make slope backdrops trivial anyway.
- **Pipeline:** Level view renders it; rules file carries it; ATLAS draws it; the Godot exporter writes it as a second `TileMapLayer` beneath terrain. Grayscale, so it takes the zone gradient; on its own layer it can carry its own `PaletteOverride` (a step darker for depth) and, later, its own palette under the dual-palette plan. Border depth first because the other three lean on it and because it can be tested on a real sheet in an afternoon.

---

## 4. Tile re-sort mode

Relocate tile art on the sheet without breaking behaviour.

- Every rule refers to a cell by coordinate, so a move is a rename. The tool rewrites every reference in one pass — contract layout, mask remaps, role rules, deep variants, wedge stamps — and refuses if anything would be left dangling.
- ATLAS levels are unaffected: terrain re-resolves from rules on the next paint.
- Godot's TileSet stores atlas coordinates, so a re-sort implies a re-export to Godot (free once §7 exists).
- Lives in the Rules tab's sheet view (§5): drag a tile; its outlines and every rule referencing it move with it.

---

## 5. Rules tab, restructured

Built like the Template tab so nothing has to be learned twice.

- **Top tray:** rule modes (rim, edges, wedges, panels, collision, re-sort…). Each new rule is a tray mode, not a new panel.
- **Sheet:** the tileset, with outlines on the cells the selected rule touches. Tap to assign.
- **Bottom tray:** expands for the selected rule's details.
- **No sample block** (decided 2026-09-05): Level view already gives live feedback after a change.
- The sheet draws on the real `#screen` viewport (zoom, pan, grid and `A1` toggles are the existing ones); the separate `#rulesSheet` canvas goes away. Upper tray = the bar between header and stage (where Shapes/Gradient/Outline live); lower tray = the `#selbar` slot under the stage.
- Built. Modes today: Depth · Edges (edge + rim rows per side, anchor checkbox) · Variations.

---

## 6. Slope wedges (detail)

- A wedge stamp column is exactly `border depth + 1` cells: the surface plus one cell per rim band. Below that is core.
- Per slope kind (45°, 2:1, 3:1) and face (floor, ceiling); descending is the horizontal mirror.
- Caps where a wedge meets a flat edge at its top and bottom are authored tiles, selected by the existing joint logic.
- Collision of a wedge is its outline (§7).

---

## 7. Physics arc — author collision in Tessera, import a finished set

The goal the other items serve.

- In Tessera, per cell: solid, wedge outline (from the slope kind), semi-solid, hazard. Shown as an overlay on the sheet and the sample.
- Export is **one bundle**: art (`.png`), rules (`.rules.json`), collision. Rules already carry the contract; collision joins it.
- ATLAS reads the bundle as it reads the rules file today.
- Godot's importer builds the TileSet from the bundle — tile rects, collision polygons, one-way flags for semi-solid, custom data for hazard — with **no reference sheet**. `atlas_register_terrains.gd` stops cloning collision from `autotile_template.png`; any sheet size, any layout.
- Until this lands: new sheets are registered by hand in Godot's TileSet editor, and a variant that points at an unregistered cell renders blank in Godot.

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
- **Uploaded files are ground truth.** Adopt the newest file before delivering.
- **One change, then playtest.** Each arc is a separate conversation with current files uploaded.
- **Never touch the resolver's pure region for UI work.** Contract *data* may be per-project; resolver *behaviour* is shared and versioned.
- **Probe before patching.** Reproduce in the harness with the real resolver and real files; render before and after; agree the geometry before anyone draws a tile.

---

## 10. Open items carried forward

- **One-column inner rims and convex inner corners have no authored tiles or rules (James 2026-09-05).** A 1-wide interior column between two walls, or a 1-tall interior row, resolves from whatever side/rim/edge straights the mask logic lands on — a random-looking mix. The 5×5 has no pinch tiles (the 7×7's JOINTS had pinchV/pinchH; the 5×5 never got them) and the inner ring only authors concave corners (the four `TRANSITION` slots), not convex ones. Take this on in full when the tile re-sort phase (§4) opens the sheet up: author pinch tiles for both axes and the four convex inner corners, and give the resolver a rule for each. Until then, avoid 1-wide interior gaps in level geometry.

- Two projects whose names slug to the same folder would overwrite each other in the repo; no guard yet (noted 2026-09-05).

- A rim can't hold the same cell twice, so "C2, C2, F12" (a panel every third rim tile) isn't expressible; sparsity belongs to §3 panels.
- Gateway-1: apply rim + cadence fix from the Rules tab, export, drop beside `gateway-1.png`; Godot registration by hand.
- The one-pixel drift at depth 27 in `A12`/`A13` on the Truce sheet.
- Save-pad style stale-snapshot gap: properties set on placed entities in Godot must be pulled into ATLAS before the next push (importer is destructive on entity roots).
