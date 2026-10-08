# Add a moves strip

The moves strip displays the game line and its variations. People can tap a move,
swipe to navigate a line, or use the keyboard. Your app owns the game tree and
decides which position to display; the strip reports navigation choices.

Use `mountMoveStrip` on its own, or `mountBoardViewer` to combine it with a board
and coordinate their gestures.

## A complete board-and-strip example

Use the installation and served pieces from [Getting started](GETTING_STARTED.md).
Add this HTML:

```html
<div id="viewer" style="width: min(100%, 480px)"></div>
```

This example lets you navigate between the starting position and e4:

```js
import { mountBoardViewer } from '@knights-eye-chess/board-ui/viewer';

const positions = [
  { e1: 'K', e8: 'k', e2: 'P' },
  { e1: 'K', e8: 'k', e4: 'P' }
];
const main = [
  { cursor: { kind: 'main', ply: 0 }, label: 'Start' },
  { cursor: { kind: 'main', ply: 1 }, label: 'e4', number: '1.' }
];
let ply = 0;
const boardState = () => ({
  position: positions[ply], orientation: 'white', positionKey: String(ply),
  selectedSquare: null, permissions: { select: false, move: false }, legalMoves: [],
  lastMove: ply ? ['e2', 'e4'] : []
});
const stripView = () => ({
  main, selectedLine: main.map(move => move.cursor), current: main[ply].cursor
});
function navigate(cursor) {
  ply = cursor.ply;
  viewer.updateBoard(boardState());
  viewer.updateStrip(stripView());
}

const viewer = mountBoardViewer(document.querySelector('#viewer'), {
  board: {
    state: boardState(),
    pieceUrl: piece => `/pieces/${piece === piece.toUpperCase() ? 'w' : 'b'}${piece.toLowerCase()}.png`,
    onSelect() {}, onMove() {}
  },
  moveStrip: {
    view: stripView(), classifications: false, figurines: false,
    onNavigate: navigate
  }
});
```

Tap e4 or swipe the strip to see the board change. While a move is focused,
Left/Right chooses another move and Enter opens it. Use `viewer.dispose()` when
removing the viewer.

## Plain moves or classified moves

Use `classifications: false` for a game viewer whose moves will not be assessed.
There are no classification icons or reserved slots, and moves use your theme's
normal text color. `--move-strip-text` can override that color; it otherwise
inherits `--ink`, with black as the fallback. Classifications arriving later do
not alter this presentation.

The default reserves space for icons, keeping moves steady while analysis
arrives. Supply an icon resolver for a standalone strip, or use a viewer with an
appearance catalogue containing served icon URLs. Update individual moves with
`updateMove` on a strip, or `updateStripMove` on a viewer. Late updates preserve
focus, gestures and scroll position.

`figurines: false` keeps ordinary SAN letters such as Nf3; the default displays
piece symbols. A custom letter-to-symbol map is also supported. Copied text and
accessible labels retain the original notation.

## Variations

Each branch has an ID, an anchor move and its own move list. Nested branches also
provide a parent ID. Your app sends the current cursor and the ordered selected
line, including its main-line prefix and branch ancestors. This tells the strip
which path to follow when swiping.

The strip handles layout, native scrolling, centering and gesture coordination.
Its selected line ends at that line's last move; a longer sibling does not extend
the scrolling range. Your app chooses auto-follow behavior and performs all game
tree changes through its own model.

The [three-board demo](../examples/demos/src/sync.mjs) uses one standalone strip
for all three boards. Its [chessops model](../examples/demos/src/model.mjs) converts
PGN variations into the strip's display view. The component itself has no game-tree
dependency.

## Keyboard navigation

You can map keys to commands through `keymap`. The strip emits them through
`onCommand`; a viewer emits them through `onNavigationCommand`. These shortcuts
are scoped to component focus and ignore text editors.

Branch switching remains your app's navigation policy. The three-board demo maps
Up/Down to branch commands and uses the public `getBranchRows()` API to choose a
nearby row, preserving the move number where possible. Left/Right and Enter then
continue on the selected line. No component HTML needs to be queried.

For cursor shapes, method lists, key defaults and gesture lifecycle details, see
the [API reference](API.md#optional-strip-and-composite-viewer).
