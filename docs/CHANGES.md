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
