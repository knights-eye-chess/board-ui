# Board assets and documentation — 6 October 2026

The renderer's host-supplied `pieceUrl` contract remains unchanged. Its compiled
JavaScript is byte-identical to the installed `.2` preview. Keeping this contract
does not require keeping the reusable default artwork outside this repository.

Private `.3` adds the twelve existing glossy PNGs as optional `/pieces/*` exports,
asset hashes/provenance, an updated standalone example, a real browser screenshot,
and documentation of host responsibilities, state, accessibility and asset setup.
Original source PNGs are byte-identical; no artwork was edited. Asset ownership
and the application's retained static copies are described in `assets/README.md`.

Build/three unit tests, two browser viewports and a fresh installed-archive
consumer pass. The screenshot asserts 64 squares, 32 loaded sprites and no page
errors. Existing private application `.2` pins and all accepted previous archives
remain unchanged; there was no deployment or public publication. Actual touch/iOS
and public-release artwork rights remain existing qualification checkpoints.

The accepted archive was packed before final repository-only qualification notes
and this change record. Its runtime/assets/README/screenshot are qualified; source
receipts distinguish later documentation edits. Do not repack the same version
and replace the accepted bytes.

# Headless board and optional strip — 7 October 2026

Private dev.5 adds package-owned appearance catalogues, default pieces and icons,
three descriptive arrow styles with original geometry, transitions/animation,
production drag/promotion behavior, runtime themes/coordinates, incremental named
overlays and a controlled move-strip/composite API. The host supplies chess state,
legality and view models and receives intentions; it no longer implements these
visuals/gestures. Explicit accepted intent IDs prevent duplicate drag travel.

Eleven source and eleven independently installed archive tests pass, with eighteen
original arrow-geometry goldens and desktop/mobile Chromium checks. The app's
native-host browser scenario separately verifies canonical branch navigation and
live center crossings. dev.4 was an unadopted packaging iteration; dev.5 is the
accepted immutable candidate. Qualification records/change notes follow packing;
no runtime was repacked or overwritten. Existing archives remain unchanged.

Private dev.6 additionally retains viewer focus when endpoint navigation disables
the focused transport button. The regression covers the subsequent Home command.
The app adopted dev.6 with workspace dev.17; dev.5 was not deployed by this task.

Private dev.8 incorporates Claude's independent review recommendations: all12
recolor templates are tied to the shipped artwork by a sync test; ≥.9 outlined
arrow opacity has production coverage; palette validation happens before painting;
keymaps emit configurable string IDs and SAN figurines are optional/customizable;
vertical panel classes, accessibility labels and documented tokens are configurable
with generic defaults. Default coordinate contrast is corrected (dev.7 was an
unadopted packaging iteration). Fourteen source and fourteen installed archive tests
pass. Existing strip gestures are deferred, not canceled, when board drag begins.

Private dev.11 is the final headless candidate. Viewer command repeat is safe by
default: only transport command IDs repeat, with explicit host allow/deny APIs.
Custom destructive command IDs cannot auto-repeat accidentally. Tagged highlights
survive position rebuilds and controlled overlay inputs are copied. Native host
shortcuts (including uppercase variants) are verified against installed archives.
dev.9/dev.10 were unadopted private qualification iterations; accepted archive
bytes remain immutable. Fourteen source and fourteen ordinary-installed archive
tests and both Chromium viewports pass.

## Private dev.12: preserve current centering through layout

Resize, panel relayout and font loading recenter the controlled current move until
user scrolling takes ownership. Active or manually positioned gestures retain
their scroll position. Added resize/font-center and held-font regression coverage.
Source and ordinary-installed dev.12 archive tests pass14/14; Chromium desktop
and375px matrix passes. Qualification notes were recorded after immutable packing.

## Private dev.13: controlled positioning ownership

Every controlled recenter clears stale user-positioned state. Font regression now
changes actual glyph/button widths and covers manual scroll then controlled
navigation then changed metrics. While testing a late-main to short-branch jump,
range clamping exposed stale translated branch positions; synchronously realign
those overlays on clamp before subsequent measurement to avoid double shrinking.
Source and ordinary-installed archive tests14/14 and desktop/mobile Chromium pass.
Qualification notes follow immutable packing.
