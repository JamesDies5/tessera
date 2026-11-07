# Tessera roadmap

**Status:** written 2026-10-03, at Tessera v6.121.10, from James's stated order of work that day plus every open item carried out of the old blueprint (its §3 backdrop, §4, §5, §7 and §10). Update this file at the end of every arc.
**Sibling documents:** `tessera_blueprint.md` (what is true today, and the standing decisions — section numbers such as §6a below point there) · `tessera_history.md` (the frozen build record) · `CLAUDE.md` (how to work here).

**The order (James 2026-10-03):** finish the rule refinements first, then build the full tileset exporter, because the exporter should carry finished rules. Getting a new terrain into the game today is many manual steps; the exporter is what removes them. Sprites are a separate track.

---

## 0. In hand

- **Documentation sweep (2026-10-03).** Done: blueprint rebuilt, this roadmap, the history file, `CLAUDE.md` corrected, regression rooms unpacked, and a preview of the app in Claude Code's browser pane (`CLAUDE.md`, "Preview").
- **Tooltip and wording tidy** (v6.121.11) — **verified by James on the iPad 2026-10-03.** Tooltips now match what each button does and no longer mention keyboard keys; a few on-screen messages corrected; the Pencil-hover tip now follows tooltips that change after load (background projects, Export on the Level tab); a background push with layers says so. Resolver untouched: identical on all three regression rooms.
- **Animation mode, stage 1** (v6.121.33–35) — delivered 2026-11-06, awaiting James's test. v6.121.34 fixes blank timeline thumbnails right after opening a project (the strip now redraws once the layer images have decoded). v6.121.35, from James's two Procreate screenshots: the bar is a centred floating panel with small text buttons above the strip; the strip scrubs, gliding frames past a centre mark that always holds the current frame (scroll-snap, selection follows the mark); onion skin has a True mode (real art, faded; the default) beside the Color mode (red before / blue after). v6.121.36 (James): the panel now floats over the canvas instead of taking a strip under it, and its padding is pulled in tight like Procreate's; the status chip steps up above it. v6.121.42 (James, on a 3-frame 32 × 64 project, "Water 2": the strip would not scroll and the mark and highlight fell out of step on the iPad; fine in the desktop preview): CSS scroll-snap is gone from the strip, since iOS WebKit fights programmatic centring and short tracks under it; the app now snaps the nearest frame onto the mark itself when the strip rests, with `touch-action: pan-x` and contained overscroll. Lesson: avoid CSS scroll-snap on anything the app also scrolls programmatically. v6.121.43 (James, in the preview pane: frames could be scrolled past the mark): the strip's end padding was measured once at render and went stale when the panel's width changed; it is now a live CSS percentage (half the strip minus half a cell), so the first and last frame stop exactly on the mark at any width. v6.121.44 (James: on the iPad the strip would not scroll at any length, while taps and Play worked): the panel's full-width container carried `pointer-events: none` (so taps beside the panel reached the canvas) with `auto` on the panel; iOS WebKit does not register touch scrolling inside a descendant of a `pointer-events: none` element, though taps get through. The container is now sized and centred to the panel itself, so nothing needs `pointer-events: none`. Lesson, with the scroll-snap one: on iOS, keep scrollers out from under `pointer-events: none` ancestors and away from CSS scroll-snap. v6.121.45 (James saw the desync reproduce in the preview pane): after every centring the strip ignored all scroll events for 450 ms to avoid reacting to its own glide, so a finger moving the strip in that window was ignored and the mark and highlight parted; now a scroll always arms the settle step, which only re-centres when the frame is not already on the mark, so it cannot loop. James then reported: Lila run (10 frames) scrubs perfectly on the iPad, Water 2 (3 frames, 32 × 64) starts on frame 1 and will not scroll at all; the desktop pane cannot reproduce it. v6.121.46 is a **diagnostic build**: opening SETTINGS prints the strip's measurements (scroll width / view width, scroll position, cells × width, padding, heights, touch-action, overflow, touch points) in the status chip for James to read back. Remove the readout once the cause is known. v6.121.40 (James): the hold count moves above its frame and the centre mark sits centred between the frames and the panel's bottom edge. v6.121.39 (James): the panel lifted to 30 px off the bottom edge, clear of the iPad's up-swipe home gesture. v6.121.38 (James): a salmon #FF517B swatch in the canvas-background chooser, a bright ground to animate against. v6.121.37 (James: scrubbing "skipped them all then played the last frame, with lag"): the canvas now redraws on every scroll frame from the frame under the mark alone, and the heavier layer selection and panel refresh wait until the strip rests; a little margin returned above the buttons. Mocked on the real app first with James's run cycle (10 frames of 48 × 48, bottom layer = frame 1), agreed with his answers: hidden layers skipped; tap a frame for Procreate's frame options; sheet export first, individual frames later. Built: header button right of the wrench (remembered in the project), timeline under the canvas, current-frame display with red-before / blue-after onion skins (Aseprite's model: behind the frame, fading with distance; Procreate uses red/green), Loop / Ping-Pong / One Shot, 1–60 fps, hold per frame with the number under the thumbnail, Duplicate / Delete, + FRAME. Research: Procreate handbook (frame options = hold up to 120 + duplicate + delete; fps 1–60; onion 0–12 frames) and Aseprite's `render/onionskin_options.h`, `render.cpp` (renderOnionskin) and `data/pref.xml` defaults (1 prev / 1 next, opacity 68 falling 28 per frame, drawn behind). Checked in the preview: 10 frames in the strip; loop played 0→9→0 at the set speed; ping-pong reversed at the ends; settings and holds persisted; + FRAME lands outside a group; undo removes it; off shows all layers; the mode survives a reload. **Sheet export** landed in v6.121.41 (2026-11-06, awaiting James's test): with the mode on, Export opens a choice, SPRITE SHEET (one row of canvas-sized cells, visible frames, holds not repeated) or CURRENT FRAME; checked in the preview cell by cell against the layers (10 × 48 × 48 → 480 × 48). Whole-set individual frames stay deferred (one share sheet per file). A test project for the iPad, **Lila run** (James's 10-frame run cycle, 48 × 48, animation on at 12 fps), was written straight into the repo as `projects/lila-run/` in push format on 2026-11-06, so it appears in the Sync panel's GitHub list after he pushes and pulls like any other project.
- **Stable project order + Sort mode** (v6.121.30–32) — **verified by James 2026-11-06** ("works well"); v6.121.31 makes the other cards slide to their new slots during a drag, as layer rows do (each card is pinned where it was for a frame, then released into a 0.16 s transform transition). James tried v6.121.31 in the browser pane: cards "fly around wildly". Cause: the drop target was hit-tested on the sliding box, so the card that had just slid out from under the pointer still counted as under it and was swapped back, every frame. v6.121.32 hit-tests the layout box (the measured box minus its current transform). Lesson for any list that animates reflow: test hits against where things belong, not where they are mid-animation. James: cards jumping to "last opened" order was disorienting. Now each record carries `order`; the gallery never re-sorts by date; records without one (older, new, pulled) go to the top newest-first and get one; a Duplicate sits right after its source. A Sort button right of Sync (chosen over long-press, which would fight scrolling and the open-on-tap) turns on drag-to-reorder: cards take a dashed outline, their buttons sleep, a drag anywhere on a card carries it and the others reflow live, the gallery auto-scrolls near its edges, and letting go writes every project's order (filtered-out ones keep their places in between). Close ends the mode. The order is device-local, not pushed.
- **Wider Layers panel, wrapping names, narrower thumbnails** (v6.121.26–28) — v6.121.26 and 27 seen by James ("works well"); v6.121.28, at his request with a Procreate screenshot: a wrapped group name hangs under its text instead of under the folder icon, and thumbnails go from 80 × 45 to 60 × 45 (4:3 like Procreate's), giving names 20 px more. v6.121.29, at his request: thumbnails enlarged to 72 × 54 in 68 px rows, about Procreate's size. **Verified by James on the iPad 2026-11-06** ("looks great and really feels more natural"). At James's request (a marked screenshot) the panel grew from 352 to 400 px so layer names indented inside a group are not cut short; the extra width all goes to the name column.
- **Group rows** (v6.121.23–25) — v6.121.23 seen by James ("looks good"); the icon went right of the name in v6.121.24 at his request and back to the left in v6.121.25 on second thought, awaiting his test. A group's row in the Layers panel shows a folder icon, then its name in the app's light blue instead of the old yellow.
- **Group transform and group selections** (v6.121.22) — **verified by James on the iPad 2026-11-06.** QOL item 3 (§3a), to James's spec of the same day (Procreate's model): a selected group moves, flips and rotates as one piece, and a selection made with a group selected gathers everything under it from every member layer. Built as a group float: one piece per member layer sharing the float's box, mask, position and transforms, composited for display, dropped back onto each layer; the undo step is the whole-stack snapshot. Hidden and alpha-locked members move too. Checked in the preview: whole-group move + flip lands per layer and one undo restores both; a partial selection takes only what lies under it from each layer; the wand on a group reads the group's composite; no console errors.
- **Switch marker + gallery filter** (v6.121.21) — delivered 2026-11-06, awaiting James's test. The remaining narrower window after v6.121.20 (the app killed between the dozen key writes of a switch) is closed by a switch-in-progress marker: set before the writes, cleared after the last; a launch that finds it loads that project fresh from the library and reloads, with saves off meanwhile. Also, at James's request, the Projects gallery opens on the open project's own kind (Sprites / Tilesets) instead of All. Checked in the preview: a simulated cut-short switch recovers into the named project with the marker cleared; the gallery opens on Sprites from a sprite project.
- **Project-switch save race** (v6.121.20) — **verified by James on the iPad 2026-11-06** (Rope Sprites pulled back from GitHub, fix pushed, everything saved). Found by James: Rope Sprites showed Mini Sentry's art after a push and a switch. Cause: switching projects saves the open one, loads the next one's keys into localStorage, then reloads; in that window the page-hidden / pagehide "snapshot insurance" fired with the old active id and the new keys, writing the next project's art into the old project's record. Long-standing; the same three-step pattern sits behind Switch, New / Import and a pull into the workspace. Fix: `projLoadKeys` now moves the active id to the loaded record at once and sets a reloading flag that makes every save a no-op until the reload. Recovery: the push made at 2:56 PM holds the correct Rope Sprites (496 × 669, 3 layers); a pull of `rope-sprites` restores it.
- **Canvas size mode** (v6.121.18, guides in v6.121.19) — delivered 2026-11-06, awaiting James's test. v6.121.19 (James's note): with the cell grid on, the 16 px guides extend past the canvas across the view during the mode, so the frame can be aligned to them by eye; dragging stays free. Mocked on the real app first and agreed (James: no tools while the mode is on, no hint text, Done returns to the pencil, one-tap undo, a warning before cropping art). A Canvas button left of Brush for sprite projects; a tray with WIDTH / HEIGHT fields, Cancel, Done; eight handles; drag inside to reposition every layer; fields anchor top-left; nothing cropped until Done; art outside dimmed; exact check of the four cut-off strips before warning; Done is one structural undo step (the restore now also updates the header size). The wrench's Canvas item is hidden for sprites; tilesets unchanged. Checked in the preview: handle, corner, inside-move and typed width all update the frame; Done gives 90 × 54 with the art shifted as dragged; undo returns 64 × 48; the eraser is refused during the mode; Cancel restores; no console errors.
- **Width and height fields** (v6.121.17) — delivered 2026-11-06, awaiting James's test. The New dialog shows WIDTH and HEIGHT fields outright for a sprite project; the preset menu moved beneath them and only fills them; typing picks the matching preset or "Custom size"; Create reads the fields. Checked in the preview: typing 64 × 48 flips the preset to Custom size, picking a preset fills the fields, and Create makes a 64 × 48 canvas. Tilesets unchanged (the rows stay hidden). The edge-drag resize of an existing canvas is still to mock up (§3a item 6).
- **Cropped previews** (v6.121.15, refined in v6.121.16) — v6.121.15 seen by James on the iPad 2026-11-06 ("much better") with three notes, all taken up in v6.121.16, awaiting his test: no minimum crop (a 2 × 2 mark may fill the thumbnail, as Procreate does); thumbnails drawn at screen resolution and enlarged by whole numbers only, reduced smoothly when the art is bigger, so sprites no longer look blobby; sprite cards sized to fill the card to a 92 % margin by the same rule, re-fitted on rotation. Third QOL item (§3a), extended at James's request to the gallery. Layer-panel thumbnails and sprite-project cards crop to the art's bounds plus an 8 % margin; empty layers show the checkerboard; canvases over about 512 × 512 are measured on a shrunken copy so the panel stays quick. Tileset cards unchanged. Resolver untouched.
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
3. **Move a layer group with the move tool.** Done in v6.121.22, verified by James 2026-11-06: Transform on a group floats every member together and commits them back layer by layer; selections on a group gather across its layers (James's spec, Procreate's behaviour).
4. **Cut & Paste button**, left of Paste: cut the selection from the current layer and paste it in place on a new layer, as Procreate does. Done in v6.121.14, verified by James 2026-11-06: one button that runs Cut then Paste. James's reference (Procreate's tray order: Cut, Copy, Copy All, Duplicate, Cut & Paste, Paste) matches ours apart from Duplicate, which is not on the card. Procreate's icon for it is a half-dashed, half-solid square; ours reuses the scissors for now.
5. **Cropped layer previews.** Thumbnails showed the whole canvas; now cropped to the bounds of the layer's own pixels, so a small sprite on a large canvas is readable. Done in v6.121.15 (2026-11-06); he asked the same day for the gallery cards too, and sprite cards crop the same way. His iPad notes (no minimum, blobby scaling, cards still small) are answered in v6.121.16, awaiting his test.
6. **Canvas size entry.** The New dialog's width and height fields are shown outright since v6.121.17 (2026-11-06, awaiting James's test), with the presets as fillers beneath. The edge-drag resize of an existing canvas is v6.121.18 (2026-11-06, awaiting James's test): see §0. Only the crop warning still uses a browser confirm box (roadmap §5).
7. **Animation mode, Procreate style.** Each layer is a frame (a group counts as one frame), a timeline along the bottom, onion skinning, frame hold, FPS, loop / ping-pong / one-shot playback, and perhaps a sprite-sheet export. Built 2026-11-06 in v6.121.33–41 (stage 1, then the Procreate-shaped floating bar, scrubbing, onion True/Color, and the sheet export), awaiting James's test. This is §3's "dedicated Sprites type" made concrete; what remains of §3 is only onion-skin polish and individual-frame export, as they come up.

Order agreed with James 2026-11-06: the small ones first (1, 4, 5, the fields of 6), each its own build James tests on the iPad; then 3; then the three that need a mock-up (2, the edge-drag of 6, 7).

## 4. Cloud-save refinements

Sync is working well for James as his cloud save. Possible gaps, in the order worth closing:

1. **Leftover layer files.** When a background drops layers, the push used to leave the per-layer PNGs it no longer writes in the repo. Fixed in v6.121.12, verified by James 2026-10-03.
2. **Project-switch save race** — fixed in v6.121.20 and hardened with a switch marker in v6.121.21 (2026-11-06; §0). Noted here because it is the one case so far where sync mattered as a backup: GitHub's copy was the good one.
3. **Silent save failure.** A background keeps every layer inside one saved document in the browser's quick storage. If that ever fills, the save fails without a word, and a push would upload the last good save and still show success. Far from the limit today (the largest project, Rope Sprites with 26 layers, is a small fraction of it). Cheap protection: say so on screen when a save fails.
4. **Same folder name.** Two projects whose names reduce to the same folder would overwrite each other in the repo. No guard yet (noted 2026-09-05).

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
