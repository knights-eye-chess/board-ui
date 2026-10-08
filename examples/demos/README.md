# Board UI playground

Two static, framework-free demos using the public Board UI API and events.
The host owns game state and outer layout slots. No engine, classifier, account,
database or Knight's Eye service is required.

## Run locally

Use Node 24+ from the repository root:

```sh
npm ci
npm ci --prefix examples/demos
npm run demo:serve
```

The server listens on port 4173 (`DEMO_PORT` overrides it). `npm run demo:build`
produces `examples/demos/dist/`, which any static web server can serve. Both pages
use relative URLs and work at a subpath such as `/board-ui/`. All runtime bundles
and artwork are local; no CDN, fonts or API requests are needed.

```sh
npm run demo:test
npx playwright install --with-deps chromium webkit
npm run demo:check
DEMO_BROWSER=webkit node examples/demos/tests/browser.mjs
```

`demo:check` builds the site, tests the host model and exercises desktop/phone
layouts in Chromium. The additional command exercises the same checks in WebKit;
the Pages workflow runs both. This does not qualify real iOS hardware. Select an installed Chromium with
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Screenshots, browser results and bundle
input/size reports are generated in `dist/` and excluded from source archives.

## One game, three views

[src/model.mjs](src/model.mjs) uses Lichess's
[chessops](https://github.com/niklasf/chessops) 0.15.1 for legal moves, SAN/FEN and
its actual PGN `Node`/`ChildNode` variation tree. Position snapshots, parent links
and Board UI cursors are metadata on those nodes; there is no second host tree.
The map indexes exact occurrences rather than matching repeated positions by FEN.
Conventional board castling destinations are adapted to chessops's king-to-rook
move representation. This showcase is not a full draw-claim adjudicator.

[src/sync.mjs](src/sync.mjs) mounts White, Black and miniature boards with independent
appearance and orientation. One **full-width shared moves strip** navigates all
three. Every legal move, selection or navigation updates the shared host model,
then calls the board/strip APIs. Playing an existing move reuses its node; a new
alternative adds a branch. Previous/next and End preserve the chosen variation.
The accepted drag intent ID is echoed only to its source board.

The prepared opening contains nested variations. Promotion and castling labs
exercise underpromotion and both castling sides. Board drag events coordinate
`setGestureBlocked` on the shared strip; strip gestures cancel board gestures via
the viewer API. Component internals are not queried by host logic. Expand **See
the integration** for the bounded live event log, model snapshot and API example.
Up/Down switches between visible branch rows from either a board or a focused
strip move, preserving ply where possible. The host uses `getBranchRows()` and
its chessops tree; it does not read component internals. This demo sets
`classifications:false` for compact moves in ordinary dark/light theme text.

## Make it yours

[src/appearance.mjs](src/appearance.mjs) registers build-time extensions: three
square themes, a complete twelve-piece SVG set, a diamond icon set with a custom
`bookmark` ID, and an `arrow-chevron-head` shape function.
[generate-assets.mjs](generate-assets.mjs) contains the original custom SVG artwork.

[src/gallery.mjs](src/gallery.mjs) uses runtime APIs to select themes, pieces, icons,
arrow shapes/colors, perspective, coordinate visibility/size and animation duration.
**Replay knight move** demonstrates animation. Icon labels are artwork samples;
no classifications are calculated. The custom **Saved idea** badge illustrates
host-defined vocabulary. Hiding printed coordinates retains accessible square names.
The host clears its set-specific overlays before changing icon sets, then supplies
IDs available in the new set (`bookmark` in the custom set, `book` in the default).

Both pages share a **dark/light switch**, start from the device preference and
remember explicit choices. Shell dark mode and board square themes are independent.

## Dependencies and licenses

| Component | Added runtime dependencies |
| --- | --- |
| Board UI library | None |
| Appearance gallery | None |
| Synchronized demo host | chessops 0.15.1 + @badrap/result 0.3.1 |
| Bundler/browser checks | Existing esbuild/Playwright tools |
| Static server | Node built-ins |

The chess dependency is isolated in this example's package/lockfile. Builds resolve
only the Board UI package's declared public exports and reject third-party runtime
inputs in the gallery. No framework or game-tree package is needed.

Our source is **MIT**. Default and original custom artwork is **CC BY 4.0** with
visible project attribution. chessops is **GPL-3.0-or-later**; @badrap/result is
**MIT**. The combined synchronized demo is distributed subject to GPL terms;
the standalone Board UI source and independent gallery retain their MIT grant.
The site includes full license texts and a downloadable corresponding-source
archive with library/demo/dependency source, assets, lockfiles and build scripts.
The examples remain inspectable even when the repository is private.
The build uses an explicit source allowlist, excluding private history, credentials,
test traces and generated qualification screenshots.

## GitHub Pages

The owner approved public hosting of this static site. Run **Deploy demo playground
to Pages** from the Actions tab on `dev`. It builds and checks the demos, rebuilds a
clean public output, uploads that output and deploys to the `github-pages` environment.
It is manual; pushing ordinary library commits does not automatically publish a site.
Turn off the **Publish to Pages** input to run the same checks and save a seven-day
Actions preview artifact while Pages configuration is pending.

An administrator must first set **Settings → Pages → Build and deployment → Source →
GitHub Actions**. Pages for a private organization repository requires **GitHub Team
or Enterprise**. The published site can be public while repository/history access
stays private. With a free organization plan, public-repository Pages or another
hosting choice needs a separate owner decision; this workflow does not change visibility.
The owner enabled Pages after making the repository public. The workflow uses the
standard GitHub-provided Pages token; no extra token secret is needed for normal
deployments.

Expected project URL, once enabled and successfully deployed:
`https://knights-eye-chess.github.io/board-ui/`.

## Reproduce from the public source download

Download `source/board-ui-demo-source.tar.gz` from the demo footer and extract it.
The Board UI source tree is under `source/board-ui/`; run the local commands above
from that directory. Unmodified chessops/helper source and compiled modules are
included under `third-party/`. The lockfile pins the exact npm distributions;
`vendor/chessops/SOURCE.json` records the upstream revision and build configuration.
This source archive includes everything used by the demo build except standard
Node/npm and the separately installed esbuild/TypeScript toolchain.
