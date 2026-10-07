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
