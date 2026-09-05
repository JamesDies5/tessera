# Tessera Blueprint

**Status:** agreed 2026-09-04; updated 2026-09-05 (naming arc shipped, sample block dropped). Nothing in §3–§7 is built yet.
**Purpose:** the single reference for where Tessera, ATLAS and the Godot terrain pipeline are going, so each arc starts from the same plan.

---

## 1. Where things stand

### Tessera v6.84.5 (current stable)
- **Projects own their layout.** A project may carry its own copy of the contract (`tessera.ct`). Nothing is copied until the project edits the layout or imports a rules file whose layout differs from the template. Opening an old project writes nothing. Fields the template gains later are filled in additively; an explicit `CADENCE_ANCHOR: "origin"` survives that fill. Reset to template drops the copy.
- **Rules tab** (placeholder for §5): inner rim straights (tap slot, tap cell), "count edge tiles from each corner", reset, live sample block. Sheet and sample honour the rail's cell-grid and `A1` toggles.
- **Export** writes the project's layout onto the rules file. **Import** adopts a file's layout if it differs from the template.
- The resolver (pure region) is byte-identical to the July baseline.
- **Project naming (v6.84.0–6.84.5).** A project's repo folder and file names are always its name (slugged). Reconciled at push time: if the folder it last lived in disagrees, the push writes under the name and removes the old folder (GitHub has no rename; move = write-new + delete-old, in one push). Duplicate asks for the name first. Delete removes the repo folder(s) too, repo first so a failure keeps the local record. Rename/Delete read the stored record, not the card's copy. Every write/delete retries on 409/5xx (3 attempts, 1.5 s / 3 s).

### ATLAS v29.23
- The embedded Tessera resolver was re-lifted from Tessera v6.81.2 (it had been frozen at v6.38.0).
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
| Border depth | Fixed by layout (5×5 = 2 bands, 7×7 = 3) | 1 or 2 rim bands, per tileset; later maybe per side (thick floor rail, thin ceiling line) |
| Core | Single cell (5×5) | Everything inside the rim |
| Panels | Deep-variant groups, small, weighted | Multi-cell props at fixed sizes (2×2, 3×2, 3×3); sparsity; non-overlap; placement mode random / symmetric / hand-placed |
| Edge variants | 3 per side + caps | Configurable count per side; caps separate |
| Slopes | Surface + underlay stamps, ring logic beneath | Wedge stamps as deep as the border; no logic beneath; authored caps at each end |

**Order of work:** border depth → edge run length → wedges → panels. Border depth first because the other three lean on it and because it can be tested on a real sheet in an afternoon.

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
- The current Rules tab (rim + cadence) is the placeholder this replaces.

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

- Two projects whose names slug to the same folder would overwrite each other in the repo; no guard yet (noted 2026-09-05).
- Border depth (§3) needs no resolver change: `TRANSITION` / `TRANSITION2` set to `null` in the project's layout copy switch the rings off; `healContract` keeps explicit nulls; ATLAS reads `rules.contract` as-is. Still to probe: what gates the 7×7 `RING_ROLES` path, which runs before the `TRANSITION` block.

- Rules tab visual pass (match the app's existing panels).
- Gateway-1: apply rim + cadence fix from the Rules tab, export, drop beside `gateway-1.png`; Godot registration by hand.
- The one-pixel drift at depth 27 in `A12`/`A13` on the Truce sheet.
- Save-pad style stale-snapshot gap: properties set on placed entities in Godot must be pulled into ATLAS before the next push (importer is destructive on entity roots).
