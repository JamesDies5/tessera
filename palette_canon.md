# Palette Canon

Companion to `display_canon.md`. Everything about how gray gets painted and
how it reaches the screen in color. If this document, `gradient_map.gdshader`,
and `palette_resource.gd` exist, the whole value system can be reconstructed
or audited from them alone.

Lives at `global/palettes/palette_canon.md`, beside the code it describes.
Written 2026‑08‑28; checked line by line against the project on 2026‑09‑20.

All values in this document are 0–255 gray unless marked otherwise.
Percent equivalents appear once, in the lookup table, and nowhere else.

## The contract (the whole system in three sentences)

Every sprite, tile, and background is painted from six neutral grays:
20 / 25 / 52 / 139 / 200 / 255 — five main stops plus a void-match tone. A per-zone gradient-map shader turns those grays
into that zone's five colors at runtime; the art never carries color. Each
layer of the game (background, tiles, characters/objects, UI) is allowed a
different subset of these, and that subset is what makes the layers read
as separate.

## The painted grays

| Name    | Paint | Percent | Layers that may use it                       |
|---------|-------|---------|----------------------------------------------|
| Void    | 20    | 8%      | backgrounds ONLY (renders exactly as the void) |
| Darkest | 25    | 10%     | tiles, UI bitmaps (renders ≈ 29, just above the void) |
| Dark    | 52    | 20%     | everyone                                     |
| Medium  | 139   | 55%     | everyone                                     |
| Light   | 200   | 80%     | tiles, characters, objects                   |
| White   | 255   | 100%    | characters, objects, effects ONLY            |

Plus one provisional tone (see "Backgrounds" below). Tessera has shipped 89 as
a paintable stop since v6.61 (2026‑09‑02); it stays provisional HERE until the
in-engine zone test below is run and James calls it:

| Name     | Paint | Percent | Layers that may use it                      |
|----------|-------|---------|---------------------------------------------|
| Mid-dark | 89    | 35%     | backgrounds ONLY — provisional, pending test |

Rules that follow from the table:

- **Neutral only.** R = G = B. The shader reads luminance, so a tinted gray
  such as (199,201,203) renders identically to 200 — but it is drift, not
  canon. Neutral 200 was chosen over the tinted export artifact on
  2026‑07‑20 (see Tessera `STOP_GRAYS`).
- **White belongs to the character layer.** No tile, background, or UI
  element may paint 255. It is the foreground's trump card: helmet
  highlights, buster flash, enemy eye-glints, impact effects.
- **Mid-dark (89) belongs to the background layer.** A pixel at 89 is, by
  definition, scenery. Tiles and characters never use it, which is what
  makes it a separation signal rather than just another shade.
- **20 belongs to the background layer; 25 belongs to tiles.** One step
  apart in paint, but on screen 20 IS the void and 25 sits just above it.
  A background painted at 25 would render at terrain's darkest tone —
  the one tone scenery must not share. See "How the shader treats 20 and 25."
- **There is no 29 and no 11%.** 29 is what the screen shows for a painted
  25; it is never painted.

## The shader keys (and why they are not the painted grays)

`gradient_map.gdshader` interpolates between five keys at luminance
0.078 / 0.204 / 0.545 / 0.784 / 1.0 — that is 20 / 52 / 139 / 200 / 255.
Four of the five painted grays sit exactly on a key. The darkest does not:
**you paint 25, the key is at 20.** This is intentional and must not be
"corrected" in either direction.

### How the shader treats 20 and 25

Anything at or below the darkest key (≤ 20) clamps to the zone's darkest
color — identical to the void. That is what 20 is for: void-matching
background pixels.

A source pixel of 25 lands 16% of the way from the darkest key toward the
dark key, so it renders as the zone's darkest color nudged slightly toward
its dark color — under the raw (grayscale) palette that comes out as 29.
The void behind the level is not shader-driven at all: `level.gd` paints it
directly with `color_darkest`, which is 25 exactly.

Result on screen: **void = 25, terrain darkest ≈ 29.** That one-step lift
is what separates terrain from empty space, in every zone, for free. It was
first observed accidentally, then confirmed as preferred (2026‑08‑28). It
is a feature. Do not align the key to 25 or the paint to 20.

### The general principle

The shader is a ramp, not a lookup table. Painted grays are an art
*convention* that keeps the value hierarchy consistent; the keys are the
*shape* of the color ramp. They are allowed to differ. This is also why
stray 198‑vs‑200 pixels have never caused a visible problem, and why an
in-between tone like 89 can be tried without touching the shader.

### Where the keys and grays live in code

- `global/shaders/gradient_map.gdshader` — `STOP_0..4` (the keys).
- `global/palettes/palette_resource.gd` — five colors per zone
  (`color_darkest` … `color_lightest`), `foreground_hue_shift` (10°) and
  `enemy_hue_shift` (20°), plus optional explicit foreground and enemy sets
  (`foreground_use_explicit`, `enemy_use_explicit`). The hue / sat / val
  "adjust" sliders are editor-only helpers that bake into the stored colors;
  the stored colors are the truth.
- `global/palettes/raw_palette.tres` — the grayscale identity palette
  (25 / 52 / 139 / 200 / 255). Screenshots taken under it show painted
  values passed through the shader; use it for value audits.
  **Drift found 2026‑09‑20:** its `color_light` is stored as (199,201,203) —
  the tinted 200 this document rules out. Harmless in play, but it means
  audit screenshots show a tinted light. Set it to neutral 200 when convenient.
- `global/palettes/lavune_palette.tres` stores no colors at all, so Lavune
  is whatever `palette_resource.gd`'s defaults are. Give it real values before
  those defaults are ever touched.
- Tessera `STOP_GRAYS = [25, 52, 89, 139, 200, 255]` since v6.61 (was five
  before 2026‑09‑02) and `PAL_STOPS` (a verbatim port of the shader keys).
  CONVERT snaps to `STOP_GRAYS`. Tessera lives in its own repo.

## Layer lanes

Fidelity increases toward the player's attention. Each lane is four tones
wide (backgrounds get a fifth, provisionally); what differs is *which* four.

### Void

The clear color. Always `color_darkest` (25). Nothing is painted here.

### Backgrounds (parallax art, ATLAS backdrops, `bg` tile band)

| Allowed | Role |
|---------|------|
| 20      | base / deepest shadow — renders exactly as the void |
| 52      | body |
| 89      | soft midtone — **provisional pending in-engine test** |
| 139     | sparse accent only (distant light, a highlight edge) |

- The 20 → 52 → 89 → 139 ramp is near-even, which is what lets background
  art recede instead of reading as high contrast. Without 89 the only
  choices were "nearly black" or "nearly foreground."
- 139 is the body tone of tiles, so heavy background use of it erodes the
  foreground/background split. Accents only.
- Never 25 (that is terrain's darkest, rendered 29). Never 200. Never 255.
- The ATLAS per-layer `value_scale` (pre-map brightness) and `contrast`
  uniforms are the tool for pushing a whole background darker or flatter per
  room. They operate on luminance *before* the gradient lookup, so the
  result stays on the zone's ramp.
- **Test to run before 89 becomes canon:** paint a background swatch at 89,
  view it under each zone palette, and check that the interpolated color
  (43% of the way from the zone's dark key to its medium key) is not muddy.
  If a zone looks off, the fix is a new explicit key in that zone's ramp —
  not a change to the painted value.

### Tiles (`main` and `fg` tile bands, autotile terrains)

| Allowed | Role |
|---------|------|
| 25      | dark line / deepest cast shadow (renders ≈ 29) |
| 52      | shadow |
| 139     | body |
| 200     | highlight |

- The wide 52 → 139 jump is the chunky NES/SNES read. Do not add a tone
  between them; use a 52/139 checker dither for a perceived midtone.
- Never 255. Never 89. Never 20.
- Keep 25 in cast-shadow interiors rather than top edges where possible —
  characters also outline in 52, and outlines merge against dark tile faces.

### Characters, enemies, items, objects, effects

| Allowed | Role |
|---------|------|
| 52      | outline / deepest shadow |
| 139     | shadow / base |
| 200     | light |
| 255     | highlight, flash, glint |

- Same step count as tiles, shifted up one and capped with white. Four
  values is what 16-bit character sprites actually used; a fifth would push
  them toward PS1-era rendering and out of the tile layer's era.
- Never 25. Never 89.
- Effects (dust, sparks, impacts) may be all-255 or 200/255 only; that is
  within lane.
- Shader-side dynamics (`charge_brightness`, `fire_flash`) blend toward
  pure white at runtime; `fire_flash` is gated so 52 and below stay put.

### UI (HUD, pause, item window, dialogue)

UI does not go through the shader. `PaletteManager` tints ColorRects and
self_modulate on nodes via the five `palette_*` groups, with `palette_tinted`
selecting the foreground treatment. Bitmap UI art (frames, icons) that
*does* carry a ShaderMaterial follows the **tile lane** (25 / 52 / 139 / 200).
No 255 in UI bitmaps — the HUD is scenery, not a character.

## Category treatment (how one zone becomes three color sets)

`PaletteManager.Category`:

- **BACKGROUND** — base zone colors, no hue shift. Tiles, backdrops, props.
- **FOREGROUND** — base colors rotated by `foreground_hue_shift` (default
  +10°), or the palette's explicit foreground set if `foreground_use_explicit`.
  LILA, player bullets, items, `palette_tinted` UI.
- **ENEMY** — base colors rotated by `enemy_hue_shift` (default +20°), or
  the explicit enemy set. Husks and the Stained — and their bullets, scraps
  and death bursts, which must be registered as ENEMY too. The 20° default
  never appears in a `.tres`, so a spawned effect left on BACKGROUND looks
  subtly wrong rather than obviously wrong (bug B2, fixed 2026‑09‑16).

Settled placements: save pads wear FOREGROUND (they carry LILA's tint).
Viridia carries a permanent Truce override in her own scene, as a matron
character, so she keeps her color in every zone.

The value hierarchy above is what keeps these readable; hue is secondary.
A foreground sprite painted with tile-lane grays would still be
hue-shifted but would lose its white and sit flat against the terrain.

`PaletteOverride` pins a subtree to a fixed palette regardless of zone. Same
grays, same lanes — only the color source changes. Since 2026‑09‑16 it needs
no "Make Unique" by hand. The contract, in two rules:

1. **An override speaks last, then owns.** It waits for the node it claims to
   finish `_ready`, claims its own duplicate of the material, and tells the
   manager which original it replaced. `PaletteManager.register_material`
   will not demote a material an override owns.
2. **Things spawned outside an override ask their source once**, via
   `PaletteOverride.get_palette_for(source)` — scraps, bullets, death bursts,
   bullet impacts.

Entities register with one plain `register_material` line; no per-entity
override code. Never guard duplication on the `pal_ov_unique` meta. Known
consequence: an overridden gated door loses its locked-tint fade. The full
text lives in `atlas/atlas-roadmap.md`, Part 3.

## Conformance

A file **conforms** when every opaque pixel is in its lane's set and is
neutral. Tiles/objects/characters: 25 / 52 / 139 / 200 / 255. Backgrounds:
20 / 52 / 89 / 139.

- **Tessera CONVERT** snaps a tile sheet to nearest-of-five by luminance in
  one undo step and hides the IN FILE row once the sheet conforms. Its
  button tooltip still reads "(20, …)" — the code snaps to 25.
- **Sprite sheets** exported from Procreate/Photoshop commonly pick up the
  tinted 200 (199,201,203) and occasional anti-aliased stragglers. Snap them
  (batch script, see "Cleanup") rather than repaint.
- Audit method: histogram the PNG's opaque pixels; anything not in the set
  is drift. Under `raw_palette.tres` a screenshot should show only
  25 / 29 / 52 / 139 / 200 / 255 (29 being shader-rendered 25).

## Known drift (surveyed 2026‑08‑28; re-checked 2026‑09‑20)

Re-check result: the table still holds. The batch snap has not been run —
tinted 200 is still present across LILA (54 sheets), doors, sentry, topper,
destructibles and effects; the door sheets still carry 73 / 62 / 185; effects
still carry 248. New art made since is clean: the rope sheet conforms fully.

Legend: **correct** = canon art, needs snapping; **placeholder** = reference
or sketch art that will be replaced, do not bother.

| File(s) | Found | Status |
|---|---|---|
| `actors/lila/sprites/*` | tinted 200; run-shoot sheet has stray 108/160 pixels | **correct** |
| `objects/doors/sprites/locked_door_{left,right}.png` | 73, 62, 185 | **correct** |
| `objects/doors/sprites/locked_door.png`, `door_anim1.png` | tinted 200 variants | **correct** |
| `global/ui/item_window/item_window_{center,corner}.png` | tinted 200; darkest painted 20 (void-match — decide 20 or 25 per piece) | **correct** (200 only) |
| `global/ui/item_window/item_window.png` | tinted 200 | **correct** |
| `objects/save_pad/save_pad.png`, `objects/destructibles/sprites/*` (except scrap) | tinted 200 | **correct** |
| `actors/enemies/sentry/*`, `topper/*`, `npcs/viridia/*`, `enemies/scrap.png` | tinted 200; viridia has trace stragglers | **correct** |
| `global/effects/sprites/*` (grayscale ones) | 248 instead of 255, tinted 200 | **correct** |
| `levels/lavune/tiles/lavune_bg*.png`, `test_level_imported/Backgrounds/lavune_*.png` | darkest 20 (void-match, in lane); uses 200/255 (out of lane) | **correct** (drop 200/255) |
| `actors/enemies/husk/*` | 162 / 40 / 53 — older ramp, unfinished sketch | placeholder |
| `objects/destructibles/sprites/block_scrap_1.png` | 37 / 93 / 181 | placeholder |
| `levels/test/tiles/test_tileset.png` | 156 / 207 / 44 | placeholder |
| `levels/shared/Backgrounds/*_room.png`, `core.png`, `ruins.png`, `lab_hall.png` | 19–29 distinct grays, heavy near-black | placeholder (legacy room art) |
| `global/ui/pause_assets/*` | 71, pure 0 | placeholder |
| `global/effects/sprites/big_shot.png`, `impact_charged.png`, `enemy_bullet.png` | full-color sources | placeholder (render fine via luminance) |
| `actors/cast_data/portraits/Lila_Test_Face.png` | full-color | placeholder |

## Cleanup (next steps)

1. Batch snap script for Photoshop (JSX): for each PNG, map every opaque
   pixel to the nearest gray in the chosen lane set by luminance, force
   neutral, preserve alpha. Run over the **correct** rows above.
2. Fix the Tessera CONVERT tooltip (20 → 25).
3. Run the 89 background test; promote or drop the provisional row.
4. When the husk and scrap block get real art, paint them in lane from the
   start.

## Related

ATLAS's Palettes tab edits these same `.tres` files. Its test rooms are painted
on the shader stops so previews are honest, its color tools work in OKLab
(not HSV), and a palette's filename is its identity (nine scenes reference
palettes by path, so renaming is parked). See `atlas/atlas-roadmap.md`.

## Decisions log

- 2026‑07‑20 — Painted grays fixed at 25 / 52 / 139 / 200 / 255 from
  Raw_Palette.png; neutral 200 chosen over tinted export. (Tessera)
- 2026‑08‑28 — Confirmed void 25 / terrain 29 split is intended. No key
  realignment. Backgrounds gain provisional 89. Tiles do NOT gain a
  between-tone; use dither. White stays character-exclusive. UI follows
  tile lane. Backgrounds paint 20 (void-match), never 25.
- 2026‑09‑02 — Tessera v6.61 ships 89 as a sixth paintable stop, background
  lane. No new shader key; the game interpolates it.
- 2026‑09‑16 — Palette override contract settled (speaks last, then owns;
  spawned things ask their source). Enemy bullets wear ENEMY. Save pads wear
  FOREGROUND. Viridia keeps a permanent override.
- 2026‑09‑20 — Document recovered (it was written but never filed in the
  project) and checked against code. Shader keys, categories and hue-shift
  defaults all confirmed unchanged.
