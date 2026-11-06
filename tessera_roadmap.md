# Tessera roadmap

**Status:** written 2026-10-03, at Tessera v6.121.10, from James's stated order of work that day plus every open item carried out of the old blueprint (its §3 backdrop, §4, §5, §7 and §10). Update this file at the end of every arc.
**Sibling documents:** `tessera_blueprint.md` (what is true today, and the standing decisions — section numbers such as §6a below point there) · `tessera_history.md` (the frozen build record) · `CLAUDE.md` (how to work here).

**The order (James 2026-10-03):** finish the rule refinements first, then build the full tileset exporter, because the exporter should carry finished rules. Getting a new terrain into the game today is many manual steps; the exporter is what removes them. Sprites are a separate track.

---

## 0. In hand

- **Documentation sweep (2026-10-03).** Done: blueprint rebuilt, this roadmap, the history file, `CLAUDE.md` corrected, regression rooms unpacked, and a preview of the app in Claude Code's browser pane (`CLAUDE.md`, "Preview").
- **Tooltip and wording tidy** (v6.121.11) — **verified by James on the iPad 2026-10-03.** Tooltips now match what each button does and no longer mention keyboard keys; a few on-screen messages corrected; the Pencil-hover tip now follows tooltips that change after load (background projects, Export on the Level tab); a background push with layers says so. Resolver untouched: identical on all three regression rooms.
- **Cropped previews** (v6.121.15) — delivered 2026-11-06, awaiting James's test. Third QOL item (§3a), extended at James's request the same day to the gallery: layer-panel thumbnails and sprite-project cards crop to the art's bounds plus an 8 % margin, never tighter than 16 × 9 source px (16 × 12 on cards); empty layers show the checkerboard; canvases over about 512 × 512 are measured on a shrunken copy so the panel stays quick. Tileset cards unchanged. Checked in the preview: a 9 px mark fills its thumbnail, a 254 × 177 px layer fills the height, no console errors. Resolver untouched.
- **Cut & Paste button** (v6.121.14) — **verified by James on the iPad 2026-11-06.** Second QOL item (§3a): a CUT & PASTE button between Copy All and Paste, sprite projects only, that runs Cut then Paste so the selection lands in place on a new layer as a float. Checked in the preview: pixels move layer to layer, placing commits them, an empty selection refuses without adding a layer, no console errors. Tilesets unchanged (the button is hidden there). Resolver untouched.
- **Sprites rename** (v6.121.13) — **verified by James on the iPad 2026-11-06** (real sprite projects, a tileset, the gallery filters and sync state). The first QOL item (§3a): every on-screen "Background" is now "Sprites" (gallery badge and filter, New dialog, header label, tooltips, status lines); the stored type and the repo folders are untouched. Checked in the preview: new sprite project, gallery, header, status, no console errors. Resolver untouched.
- **Leftover layer files** (v6.121.12) — **verified by James on the iPad 2026-10-03.** A push now also removes this project's own per-layer PNGs that it no longer writes, and nothing else; a failed removal never fails the push. Checked with a simulated push in the preview. Real leftovers in the repo at the time: Gunner 3, Rope Sprites 22.

---

## 1. Rule refinements — before the exporter

On the game's board (`platformer-test/docs/board/`, 2026-10-18) these are cards on the Tessera lane; James starred 1a, 1b, 1c and 1g the same day.

### 1a. Slope logic options (the Slopes tray)

A fourth Rules mode holding every slope switch in one place, so the next slope rule has a home (James 2026-09-09). Today the only slope switch on screen is *Rim meets wedges: terminate*, in the Edges tray; the others can only be changed by editing a rules file.

- Switches to bring in: mirrored descending art (`MIRROR_SLOPES`), slope surface reads as air from the side (`SLOPE_SIDE_AIR`), rim meets wedges (`RIM_WEDGES`: the July behaviour / terminate).
- **New mode: joints bend around slopes.** A third `RIM_WEDGES` reading: rim joints form right-angle bends around the underside of a wedge instead of stopping at it. Build it as a switch value, keep `terminate` as it is, expect it to surface resolver bugs — prove on the slope regression room and both tester-2 rooms before shipping.
- The shelved rim-under-slopes tile (blueprint §6a) would live here if its reopen conditions are ever met. Not before.
- Slopes honouring slices: define what a cut across a run should mean first.

Slope findings from the 2026-10-03 sweep, reported by the readers and **not yet reproduced** — check each in the harness when this work starts:
- The fallback tile for a non-45° tip underlay is a fixed sheet address that suits the 5×5 only.
- Some shipped slope-end corrections use a short key the lookup never tries, so they can never fire.
- A base cap gives the same tile to the base surface and the base underlay.
- One reserved ceiling cell in the 5×5 layout is defined but never used.

### 1b. Collision drawing

Per cell, in Tessera: solid, wedge outline (from the slope kind), semi-solid, hazard. Shown as an overlay on the sheet and on the Level. This is the authoring half of the exporter (§2) and comes first so the exporter has something finished to carry. Nothing exists yet. Per the house rule, mock up the overlay and the tray for James before building.

### 1c. Variations for tiles other than the core

Edges and rims get a weighted pool like the core's, alongside their ordered cycles. Corners, joints and slope cells have no variants at all today. Decide first which of those families are worth it; a rim cannot hold the same cell twice today, so "a panel every third rim tile" is not expressible, and sparsity like that may belong to panels instead.

### 1d. The canon 5×5 start-up ruleset

James 2026-10-03: the rules a new 5×5 project starts with still need tuning before they are canon. Tech 3 and Tester 2 are the frontier sets to take them from. Tied to it:
- **Template art.** James redraws the 5×5 template to show the inner rim joints (his own step); it then becomes the app's default 5×5 start-up art, the same lossless swap as v6.105.
- **Joints on by default for new sets** waits for this and for a one-time migration that writes "off" into every existing project first.
- A **Joints strip** in the Edges ring, so moving a joint cell no longer needs the rules file.

### 1e. Smaller rule items, as they come up

- Slices: cap joints for a partial inner seam ending in open core; the rim and cadence readers that still look at raw cells and ignore seams (take each as it shows in a real room). Reported by the sweep, not yet reproduced: a cadence counted from each corner does not restart at a slice, and inner slices do nothing on the 7×7, 4×4 or 3×3.
- Zoo coverage gaps: two of the T-joint roles never appear in the Zoo, and several hooked joints are only exercised by fixture rooms.
- Pixel selection, cut, copy and paste work on the Template tab only.
- Gateway: apply the rim and cadence fix from the Rules trays, export, drop beside its PNG in the game; Godot registration by hand.
- The one-pixel drift at depth 27 in `A12` / `A13` on the Truce sheet.
- 7×7: the hooked joint family and the continuity audit were parked for it; they wait for §1h.

### 1f. Tile re-sort mode (was blueprint §4)

Relocate tile art on the sheet without breaking behaviour.

- Every rule refers to a cell by coordinate, so a move is a rename. The tool rewrites every reference in one pass — contract layout, mask remaps, role rules, deep variants, wedge stamps — and refuses if anything would be left dangling.
- ATLAS levels are unaffected: terrain re-resolves from rules on the next paint.
- Godot's TileSet stores atlas coordinates, so a re-sort implies a re-export to Godot (free once §7 exists).
- Lives in the Rules tab's sheet view (§5): drag a tile; its outlines and every rule referencing it move with it.

### 1g. Pattern-fill tilesets (the backdrop pattern; was part of blueprint §3)

A rule feature, so it belongs with the refinements before the exporter. James 2026-10-03, in his words: a tileset where parts of a tile left transparent fill with a pre-defined set of pattern tiles — like the core variation, but sitting below all the tiles, with the tiles on top acting as a framed edge. "The only complication there would be slopes, where the outer part of the slope would need to mask somehow."

**Open point to settle before building:** the 2026-09-05 notes below decided on *no* masking — a slope cell's exposed angle simply gets no pattern. James's 2026-10-03 note says the slope's outer part needs masking somehow. Those are two different answers; mock both on a real pattern and let James choose. Also to settle: one large pattern block tiled across the world (the 2026-09-05 design) or a set of pattern tiles picked like a variation pool (the 2026-10-03 wording), or both.

The 2026-09-05 design notes, unchanged:

A repeating pattern drawn *behind* the terrain tiles, so any tile with transparent pixels reads as a frame over it — the NES/SNES interior technique (Mega Man X walls, Fusion panels). A second axis alongside variations, not a replacement: the pool decides which tile sits in a cell, the backdrop decides what shows through it.
- **Data:** per project, in the contract. A pattern source (a block on the sheet, any size — larger than a tile is the point), tiled in **world** coordinates so it runs seamlessly across any shape; a scope switch (every solid cell, or core + rim only).
- **No masking system (decided 2026-09-05).** The backdrop is laid per solid cell, never as a screen-wide layer; edge tiles are opaque within their cells, so that alone keeps it out of the air. Slope cells are the one exception: the exposed angle simply gets no backdrop — the slope's existing underlay does what it does today. Confirm on a real pattern when the item starts.
- **Pipeline:** Level view renders it; rules file carries it; ATLAS draws it; the Godot exporter writes it as a second `TileMapLayer` beneath terrain. Grayscale, so it takes the zone gradient; on its own layer it can carry its own `PaletteOverride` (a step darker for depth) and, later, its own palette under the dual-palette plan. Border depth first because the other three lean on it and because it can be tested on a real sheet in an afternoon.

### 1h. Slopes on the 7×7 (James 2026-10-03)

The 7×7 stays an option; it is not scrapped. Its flat-ground rules are solid. What broke down was merging slopes into three border bands: logic problems and a very large number of tile permutations (blueprint §8 has the lessons, and §6a the measured cost of a deep border following a slope). To rethink: how slopes should work on it at all. One idea on the table is no merged slopes, with slopes as placed ramp objects in ATLAS instead. Sweep finding to check when this starts, not yet reproduced: the 7×7's deeper joint code is switched off by the way it ships today, and its starting variation pool overlaps some joint cells.

---

## 2. The full tileset exporter (was blueprint §7)

**The goal the other items serve.** James 2026-10-03: one export from Tessera that says which tiles carry which collision, damage, slopes, semi-solid and so on, and imports into ATLAS and Godot ready to go, with every rule in sync for that set.

- In Tessera, per cell: solid, wedge outline (from the slope kind), semi-solid, hazard. Shown as an overlay on the sheet and the sample.
- Export is **one bundle**: art (`.png`), rules (`.rules.json`), collision. Rules already carry the contract; collision joins it.
- ATLAS reads the bundle as it reads the rules file today.
- Godot's importer builds the TileSet from the bundle — tile rects, collision polygons, one-way flags for semi-solid, custom data for hazard — with **no reference sheet**. `atlas_register_terrains.gd` stops cloning collision from `autotile_template.png`; any sheet size, any layout.
- Until this lands: new sheets are registered by hand in Godot's TileSet editor, and a variant that points at an unregistered cell renders blank in Godot.

Around it:
- The game side has its own stub for this in `atlas/atlas-roadmap.md` ("Tilesets — Tessera terrains into Godot", 2026-09-14): ATLAS as the manager of imported tilesets, a Godot-side injector, tiles keyed by terrain name so refreshing a sheet never shifts ids. Design the two halves together; that stub lists what to read first (`main_tileset.tres`, ATLAS's tile export and import, Tessera's export format). It touches the one file every level depends on.
- **Lavune Cave** is waiting on this: James's newer rules for it stay in Tessera until there is a clean way to update the game's copy.
- **Tech 3** and the other Tessera sets enter the game after it. Sequence agreed 2026-09-10 and still standing: collision → export → import Tech 3.

---

## 3. Sprites project type (raised by James 2026-10-03)

James already draws game sprites in Background projects. A dedicated third type beside Tileset and Background, possibly polished with animation frames and onion skinning. Nothing exists yet: the app has no frames, timeline or onion skin. Open questions to settle with a mock-up before any building: what a sprite project is beyond a background with a different default size, how frames relate to layers, and what it exports for Godot.

---

## 3a. QOL improvements for the pixel editor (James's board card, 2026-11-04)

James put a starred **QOL Improvements** card on the Tessera lane (status *next*) on 2026-11-04. Its seven steps are his, kept on the card; this is what each means in the app today and how big it is. None touches the resolver.

1. **Rename the Background category to "Sprites".** Done in v6.121.13, verified by James 2026-11-06. A label change: the gallery tag, the type filter, the New dialog and the header. The stored type key stays `bg`, so every existing project and its folder in the repo are untouched. Small. (It answers §3's first question: a sprite project is a background project under its real name, until animation gives it more.)
2. **Project folders.** Named groups of projects in the gallery. Needs a design: where the folder lives (a field on each project record, so a pull still works), what the gallery shows, and whether a folder is a real folder in the repo. Mock the gallery first. Medium.
3. **Move a layer group with the move tool.** Today the move tool refuses a group header ("select a layer inside it"); the fix is to float every member together and commit them back layer by layer. Medium; the move/transform float code assumes one layer.
4. **Cut & Paste button**, left of Paste: cut the selection from the current layer and paste it in place on a new layer, as Procreate does. Done in v6.121.14, verified by James 2026-11-06: one button that runs Cut then Paste. James's reference (Procreate's tray order: Cut, Copy, Copy All, Duplicate, Cut & Paste, Paste) matches ours apart from Duplicate, which is not on the card. Procreate's icon for it is a half-dashed, half-solid square; ours reuses the scissors for now.
5. **Cropped layer previews.** Thumbnails showed the whole canvas; now cropped to the bounds of the layer's own pixels, so a small sprite on a large canvas is readable. Done in v6.121.15 (2026-11-06), awaiting James's test; he asked the same day for the gallery cards too, and sprite cards crop the same way.
6. **Canvas size entry.** The New dialog already has separate width and height fields, but only after choosing "custom" in the preset menu; show them outright. Changing the size of an existing background still goes through the browser's text prompt (roadmap §5 lists it); James wants to drag the canvas edges with the numbers shown. The fields are small; the edge-drag needs a mock-up. Medium.
7. **Animation mode, Procreate style.** Each layer is a frame (a group counts as one frame), a timeline along the bottom, onion skinning, frame hold, FPS, loop / ping-pong / one-shot playback, and perhaps a sprite-sheet export. This is §3's "dedicated Sprites type" made concrete; nothing of it exists. Large; mock the timeline and the onion skin before building.

Order agreed with James 2026-11-06: the small ones first (1, 4, 5, the fields of 6), each its own build James tests on the iPad; then 3; then the three that need a mock-up (2, the edge-drag of 6, 7).

## 4. Cloud-save refinements

Sync is working well for James as his cloud save. Possible gaps, in the order worth closing:

1. **Leftover layer files.** When a background drops layers, the push used to leave the per-layer PNGs it no longer writes in the repo. Fixed in v6.121.12, verified by James 2026-10-03.
2. **Silent save failure.** A background keeps every layer inside one saved document in the browser's quick storage. If that ever fills, the save fails without a word, and a push would upload the last good save and still show success. Far from the limit today (the largest project, Rope Sprites with 26 layers, is a small fraction of it). Cheap protection: say so on screen when a save fails.
3. **Same folder name.** Two projects whose names reduce to the same folder would overwrite each other in the repo. No guard yet (noted 2026-09-05).

---

## 5. Housekeeping found by the sweep (parked; none urgent)

- Every error is reported twice (the error catcher is wired up twice).
- Unused leftovers in the app: a second set of flip icons, an old palette-file reader, a handful of helpers nothing calls, a one-time July repair marked "remove in a future pass".
- Stale comments inside the resolver region. They can only be cleaned as part of a deliberate resolver change with an ATLAS re-lift, because ATLAS carries that region word for word.
- The browser's own pop-up boxes are still used for renaming a layer, typing a canvas size and the reset confirmations; they do nothing where a host blocks them.
- The harness shows the resolver's answer before taught rules; the September notes describe a fuller harness that also applied them. If a slope investigation needs the taught layer, extend the harness then.

---

## Not doing

- **Keyboard shortcuts.** Tessera is an iPad app; James never uses a keyboard beyond typing names (2026-10-03). Earlier sessions kept drifting back to this. Do not propose, extend or "fix" keyboard handling.
- **Rim under slopes** — shelved, blueprint §6a, with its reopen conditions.
- **Depth-following slope columns** — withdrawn, blueprint §6.
- **Linked edge-plus-rim stacks** — deferred until a real sheet in a real room shows a rim landing wrong under its edge.
- **Hand-placed and symmetric panels as a Tessera rule** — anything with a silhouette is an ATLAS object (blueprint §2).

---

## ATLAS-side items carried from the old blueprint

These are ATLAS's to fix. Copied to `atlas/atlas-roadmap.md` ("Parked — small items") on 2026-10-03:
- **Opposite-facing slopes one row apart (noted 2026-09-06).** A floor wedge and a ceiling wedge with one row of fill between them both want the same underlay cell, and ATLAS evicts the older run whole. The geometry rule under two-deep wedges is two rows of solid between opposing surfaces. Wanted: ATLAS says so on commit instead of silently dropping the run.
- **Stale-snapshot gap.** Properties set on placed entities in Godot must be pulled into ATLAS before the next push; the importer is destructive on entity roots.
- ATLAS has not been exercised with a Tessera room that has margin cells (moot until room files are lifted; ATLAS bakes its own fill).

## Loose ends

- The old blueprint says three pictures from the 2026-09-09 slope study were kept: the exported room (`newtemp.room.png`) and two draw-list strips cut from James's hand redraw. They are not in this repo. The redraw itself is here as the "Slope rules" background project, and the room can be re-exported from the regression room. They only matter if §6a is ever reopened.
- `rooms/cave_tall_1.json`, `rooms/donut_room.json` and everything under `old/` are from July and are history.
