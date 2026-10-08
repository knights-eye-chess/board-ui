# Repository guidance

This repository owns `@knights-eye-chess/board-ui` source. Read README.md and SOURCE-ORIGIN.json before changing code. The source originated in the preserved Shedal/KnightsEye backup; future changes belong here.

For visual ownership, rendering or appearance API work, also read docs/VISUAL-CONTRACT.md. It records owner requirements and distinguishes the proposed implementation from currently shipped APIs.

Use Node 24+, npm ci, npm run check and npm run pack:checked. Internal source-build dependencies use hash-pinned local archives and the lockfile; the pack helper emits exact version dependencies. Never overwrite committed archives with different bytes at the same filename/version. Bump the version for a new artifact.

The owner made this repository public on 2026-10-08 for open-source access and demo hosting. Licensing and public demo hosting are approved as recorded below. Public npm publishing, support commitments and automatic CI require a separate owner decision. The manual package-quality workflow does not deploy websites; the separately approved demo-pages workflow does. Do not alter classifier semantics or host UI behavior as part of a structural cleanup.

## Approved licensing decision (2026-10-08)

The owner approved MIT for first-party code and CC BY 4.0 for owner-controlled artwork. See LICENSING.md. This supersedes earlier statements that a license has not been selected. Preserve third-party notices and immutable historical archives. Public registry publication, repository visibility and support commitments remain separate owner decisions.

## Approved demo hosting (2026-10-08)

The owner approved public GitHub Pages hosting of the static Board UI demos. The manual demo-pages workflow builds the static site; this is distinct from public npm publishing or exposing private repository history. Preserve MIT code, CC BY 4.0 artwork and dependency notices in the public build. The owner has made the repository public; the workflow does not itself change visibility.
