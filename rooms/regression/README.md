# Resolver regression set

Frozen test rooms for the rule engine. They are deliberately old copies: do not refresh them from
the live projects, or they stop proving anything. Unpacked 2026-10-03 from the hand-off zip of the
last chat session (the two PNGs in that zip were identical to `projects/tester-2/tester-2.png` and
`projects/newtemp/newtemp.png`, and the harness does not read art, so they were not kept here).

Run before shipping any change inside the pure region (`/*__PURE_START__*/` … `/*__PURE_END__*/`),
in `--prev` mode against the previous build, each room with and without `--noseams`:

    node tools/resolver_harness.js --app tessera.html --prev tessera_prev.html --rules rooms/regression/tester-2_rules.json --room rooms/regression/tester-2_room.json
    node tools/resolver_harness.js --app tessera.html --prev tessera_prev.html --rules rooms/regression/tester-2_rules.json --room rooms/regression/tester-2_room.json --noseams
    (same for tester-2_room_5.json, and for newtemp_room.json with newtemp_rules.json)

The previous build comes from git: `git show HEAD:tessera.html > <scratch>/tessera_prev.html`.

| File | What it covers |
|---|---|
| `tester-2_rules.json` | James's 5×5 "Tech" layout with rim joints on (`RIM_JOINTS`, `RIM_WEDGES: terminate`, `CADENCE_ANCHOR: run`), as saved 2026-09-10 (v6.121.2) |
| `tester-2_room.json` | 30×17, three inner seams (19 edges); proves the B4/B2 corner rule (v6.121.3) |
| `tester-2_room_5.json` | 30×17, inner seams (22 edges), one ending beside a pillar leg; proves the strip rule (v6.121.4) — only four cells may differ from a build without it |
| `newtemp_rules.json` | the 5×5 template on the 8×8 block-grid art, as saved 2026-09-09 (v6.107.1) |
| `newtemp_room.json` | 60×51, 33 slope runs, all three grads, both faces, no seams — the slope regression room |

Rules of thumb: `--noseams` must print IDENTICAL for any change that only touches seams. A seam
change should move only the cells it targets; name each one when reporting the change.

The harness shows the resolver's own answer. Taught slope rules and mask remaps (the Revise tool)
are layered on by the app afterwards and are not part of this check.
