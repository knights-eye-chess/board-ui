# Optional Knight's Eye piece set

The twelve `pieces/*.png` files are unchanged copies of the active glossy set
from `knights-eye-chess/knightseye-net/public/pieces/glossy` at application commit
`94edf1e176f0bf99d51c696b5ba62c85b6a018f5`. Their hashes are in `PIECES.json`.
No pixel editing, rescaling, recoloring or vector conversion was performed.

This repository owns the default reusable piece source. The application copies
and hash-checks these package assets into its existing served URLs at build time.
Hosts can provide named piece sets through the appearance catalogue, resolve
asset URLs through their bundler/static build, or override `pieceUrl`.

`icons/` owns the live default classification artwork, with byte provenance and
SHA-256 hashes in `icons/ICONS.json`. The default vocabulary, colors and optional
labels/groups are exported from `/appearance`; hosts decide classification and
may override presentation. Chat-specific raster assets and the alternate SVG
piece set remain application presentation outside this default board set.

The repository and package remain private. Artwork rights and attribution for
public release remain part of the existing publication checkpoint; inclusion
here does not establish a new public license or invent authorship attribution.
