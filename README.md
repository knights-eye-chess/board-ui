# @knights-eye-chess/board-ui (private phase-8 preview)

An actual controlled browser board, requiring no framework, chess engine, classifier, AI, game tree, storage, or chess.js. Import `mountControlledBoard` and pass a host element. Each instance owns one child with isolated Shadow DOM styles and supports complete state replacement and idempotent disposal. No artwork or external requests are bundled; the host supplies every piece URL.

```js
import { mountControlledBoard } from '@knights-eye-chess/board-ui';
let state = {
  position: { e1: 'K', e8: 'k', e2: 'P' },
  orientation: 'white', selectedSquare: null,
  permissions: { select: true, move: true, draggable: true },
  legalMoves: ['e2e3', 'e2e4'], positionKey: 'game-one:root'
};
const board = mountControlledBoard(document.querySelector('#board'), {
  state,
  pieceUrl: piece => `/my-pieces/${piece === piece.toUpperCase() ? 'w' : 'b'}${piece.toLowerCase()}.png`,
  onSelect: square => { state = { ...state, selectedSquare: square }; board.update(state); },
  onMove: intent => {
    // Validate intent.uci against your authoritative game, apply it there,
    // then replace position, legalMoves, selectedSquare and positionKey.
    console.log(intent.uci, intent.source);
  }
});
board.update({ ...state, orientation: 'black' });
board.dispose();
```

Square keys are algebraic coordinates; piece values are FEN letters. Supply exact permitted UCI moves, including promotion suffixes; the board never generates chess moves or commits a position itself. Click an origin and destination, drag a permitted piece, or focus a square and use arrows plus Enter/Space. Home/End focus row endpoints, Escape cancels selection or promotion, and Tab stays inside an open promotion chooser. Permission updates, new position/occurrence/orientation or move list cancel pending promotion and drag. A host that rejects an intent can simply keep its state.

Optional `lastMove`, `badges` and `arrows` are presentation data. Badge labels/text/colors and arrow labels/colors/opacity/width are caller supplied, with no classification semantics. Labels render as text, never executable HTML. Optional `label` names the grid. Customize square colors through inherited `--board-light`, `--board-dark`, focus through `--board-focus`, and chooser colors through `--board-dialog` / `--board-dialog-text`. Set the host's width to control the responsive square board.

State replacement is detached from mutable host objects. `update` after disposal throws; repeated disposal does nothing. Changing `positionKey` cancels transient gestures when two occurrences have the same placement. Callbacks may synchronously call `update`. Multiple mounts on different hosts have separate DOM, event listeners, focus and gesture state.

This preview supports modern browsers with Shadow DOM, Pointer Events and CSS aspect-ratio. Mouse/pointer Chromium is qualified; actual phone/iOS input is not claimed. The package is private and does not imply a public SDK release.


The packed artifact includes canonical TypeScript source, its own build and tests,
and an npm shrinkwrap with pinned development tools. To rebuild and verify it
after extracting the tarball outside the application checkout:

```sh
npm ci
node -e "require('node:fs').rmSync('dist', { recursive: true, force: true })"
npm run build
npm test
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser
```

Without a supplied browser executable, install Playwright Chromium with
`npx playwright install chromium` and run `npm run test:browser`. The browser
check serves the shipped independent host example and writes `browser-results.json`.
The runtime uses neither these development tools nor application code. Version
`0.1.0-phase.8.1` identifies the source-complete preview; it supersedes the earlier
dist-only qualification.

## Standalone repository build

Use Node 24 or newer. From a clean checkout:

```sh
npm ci
npm run check
npm run pack:checked
```

The source snapshot is recorded in `SOURCE-ORIGIN.json`. This private preview
uses version `0.1.0-dev.2`; earlier `0.1.0-dev.1` artifacts remain immutable.
Internal dependencies are pinned archives in `vendor/npm`. Update an existing
dependency with `node scripts/update-dependency.mjs @knights-eye-chess/name
/absolute/path/package.tgz`, then run `npm ci` and `npm run check`. Review the
manifest, lockfile, archive hash and tests together before committing.
No registry, automatic CI or website deployment is required for these commands.

`pack:artifact` packs a temporary copy and records exact package versions for
sibling dependencies. Use it instead of bare `npm pack`; repository-local file
pins belong to the source build and are not published as consumer dependencies.
