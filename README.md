# Knight's Eye Board UI

First-party code: **MIT**. Packaged artwork: **CC BY 4.0**. See [LICENSING.md](LICENSING.md) for scope and third-party terms.

Controlled, framework-free chess presentation: board, pieces, arrows, classification
icons, animation, interaction, and an optional moves strip. The host supplies chess
state and handles events. No engine, classifier, game-tree implementation, account,
or persistence service is required.

Private preview; licensed as described above. No public registry publication has been performed.
See [visual contract](docs/VISUAL-CONTRACT.md) and [asset provenance](assets/README.md).

## Ownership

| Board UI | Host |
| --- | --- |
| Squares, coordinates, orientation, pieces, named arrow geometry | Position, legality, history and applying move intentions |
| Default classification IDs, artwork, colors, labels and groups | Which classification applies and application analysis policy |
| Animation, drag, click, keyboard and promotion UI | Transition hints when chess semantics require them |
| Optional controlled strip, centering, live scroll navigation and gesture coordination | Main/variation display descriptions, current cursor and auto-follow policy |
| Named themes and runtime appearance updates | Build-time extensions and explicit runtime tokens |

The host needs references only to outer layout slots. It does not query or mutate
component internals. Both components use open shadow roots; automation can inspect
them, while application behavior uses APIs and events.

## Mount a board

Install a checked private archive, then serve the package assets through your build.
Installing npm files does not expose them through a web server. Copy
`assets/pieces/*.png` and `assets/icons/*.svg` or use bundler asset URL imports.

```js
import { mountControlledBoard } from '@knights-eye-chess/board-ui';
import { createBoardAppearance, PIECE_CODES } from '@knights-eye-chess/board-ui/appearance';

const appearance = createBoardAppearance({
  assetUrls: Object.fromEntries(PIECE_CODES.map(piece => {
    const file = `${piece === piece.toUpperCase() ? 'w' : 'b'}${piece.toLowerCase()}.png`;
    return [`pieces/${file}`, `/pieces/${file}`];
  }))
});
let state = {
  position: { e1:'K', e8:'k', e2:'P' }, orientation:'white',
  selectedSquare:null, positionKey:'root',
  permissions:{select:true,move:true,draggable:true}, legalMoves:['e2e3','e2e4']
};
const board = mountControlledBoard(document.querySelector('#board'), {
  appearance, state,
  onSelect(square) { state={...state,selectedSquare:square}; board.update(state); },
  onMove(intent) {
    // Validate/apply intent.uci in your chess model, then send authoritative state.
    // Echo acceptedIntentId:intent.intentId only when accepting this exact move.
    console.log(intent);
  }
});
board.updateAppearance({coordinates:{visible:true,size:14},animation:{durationMs:220}});
board.updateOverlays('reference', {
  highlights:[{square:'e4',tag:'answer-reference',color:'#a571ea'}],
  arrows:[{from:'e2',to:'e4',label:'Reference',style:'arrow-broad-head-rounded-tail',layer:24,tag:'answer-reference'}]
});
board.updateOverlays('reference',null);
board.dispose();
```

Give the outer slot a width; the board fills it and stays square. Position keys are
opaque occurrence tokens: change them on navigation even if placement repeats.
`onMove` emits `{from,to,uci,promotion?,source,intentId}`. Rejection retains state.
A matching `acceptedIntentId` suppresses duplicate drag travel. Pending IDs expire
at three seconds or the next unrelated state update. Overlay and appearance updates
preserve active gestures, focus and piece nodes. Position/legality/orientation changes
cancel stale gestures and promotions. All disposals are idempotent.

## Build-time appearance and runtime selection

`createBoardAppearance` accepts `pieceSets`, `iconSets`, `arrowStyles`, `squareThemes`
and `assetUrls`. Names are descriptive kebab-case. Defaults are `glossy`, `quality`,
`classic`, and `arrow-slim-point`, `arrow-broad-head`,
`arrow-broad-head-rounded-tail`. Custom piece sets must contain all twelve FEN piece
codes; assets accept scale/offset metadata. Icons accept assets, optional label,
group, color and scale. Custom arrow functions return SVG path layers from supplied
geometry. Assets/shapes are registered at build time; runtime selects registered
names. Collisions fail unless `replaceDefaults` explicitly opts in.

`updateAppearance({pieceSet,iconSet,squareTheme,themeTokens,qualityColors,coordinates,
animation})` changes presentation without rebuilding chess state. Themes accept
light/dark, focus, dialog/dialogText, lastMove, selected, target and coordinate colors.
Coordinate sizes are CSS pixels (6–48); durations are 0–1000 ms. Reduced-motion
preferences disable animation. Quality color overrides recolor default SVG artwork;
custom recolorable icons supply a `sourceSvg` template with `__ICON_COLOR__`.

Default classification vocabulary is exported as `DEFAULT_QUALITY_DEFINITIONS`.
This is presentation vocabulary, not classification policy. Overlays may supply
explicit colors/labels. `lastMoveColor` controls the translucent last-move highlight.
Named overlay groups clear independently; state overlays remain intact.

## Optional strip and composite viewer

`/move-strip` exports `mountMoveStrip`. Its controlled view contains `main`, optional
`branches` (ID, optional parent ID, canonical anchor and moves), `selectedLine`, and
`current`. Cursors are `{kind:'main',ply}` or `{kind:'branch',branchId,index}`. Items
supply labels, numbers, classification/icon IDs, comments and optional copy prefixes.
The ordered selected line includes the main prefix and all selected branch ancestors.

`onNavigate(cursor,{source})` requests host navigation. The strip never changes the
chess tree. Native scroll center crossings emit requests while the pointer remains
down. Programmatic centering does not navigate. Longer sibling variations remain
painted without extending the selected line's native scroll range. The selected
line's range is frozen at gesture start through finger contact and inertia, so
a short branch cannot scroll past its last move while the user is touching it.
`updateMove(cursor,patch)` updates late classification in place; `update`, `center`,
`setGestureBlocked`, `getInteractionState`, `getBranchRows`, `getCurrentBounds`,
`subscribe`, `relayout` and `dispose` expose behavior without DOM coupling. Auto-follow
is host policy: send current state and request centering when following; genuine user
scroll emits lifecycle events so the host can stop following.

`/viewer` exports `mountBoardViewer(host,{board,moveStrip:false|options,slots?,
moveStripPanel?,onNavigationCommand?})`. It shares appearance and coordinates board
and strip gestures. Its API exposes board/strip updates, incremental overlays/items,
appearance, navigation-control state, centering and disposal. Optional previous/next
slots have package-owned click/hold behavior. Navigation keys are scoped to the host,
ignore editors/promotion dialogs, and emit commands. Without a navigation callback,
the board retains its square keyboard controls. Viewer `keymap` maps keys to string command IDs; `repeatableCommands` permits auto-repeat (defaults to transport commands only), and `nonRepeatingCommands` explicitly denies chosen IDs; custom commands do not repeat by default; `{}` disables shortcuts. Strip
`keymap` likewise customizes a/b/l defaults; `figurines:false` preserves literal
localized SAN, or supply a letter-to-glyph map. The optional vertical panel owns
layout discovery/expansion, stylesheet and disposal; the host supplies outer slots.

## Styling and automation surface

Board parts: `board`, `square`, `last-move`, `selected`, `target`, `highlight`,
`piece-image`, `badge`, `arrow`. Stable attributes: `data-square`, arrow `data-uci`,
`data-arrow-tag`, highlight `data-highlight-tag`; square classes `last`/`selected`
and strip `data-cursor`/`aria-current` identify state for tests. Do not use internal
classes to implement host behavior. Runtime theme tokens are the primary board
styling API. Strip inherits `--font-ui`, `--move-font`, `--card`, `--secondary`,
`--line`, `--played`, `--muted`, `--green`, and supports `--move-strip-surface`,
`--move-strip-hover`, `--move-strip-focus` and `--move-quality-text`.

## Build and verification

Node 24+: `npm ci`, `npm run check`, `npm run test:browser`, `npm run pack:checked`.
Use `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` for system Chromium.
Tests cover original arrow geometry, extensions, transitions, drag intent acceptance,
promotion, live strip scrolling, nested branches and incremental updates. Desktop
and 375px Chromium are qualified; real iOS/touch hardware remains unqualified.
Archives are immutable: bump the version before producing different bytes.

Panel `classNames` (column/panel/viewport/expand/dialog) and `labels` (panel/viewport/expand/dialog) are optional host choices. Defaults use generic board-ui classes. Component-owned styling supports `--board-strip-line`, `--board-strip-surface`, `--board-strip-accent`, `--board-strip-text`, `--board-strip-dialog`; legacy `--line`, `--secondary`, `--green`, `--ink`, `--dialog-surface` remain fallbacks. Board drag defers an existing strip gesture; it does not cancel that gesture. Palette overrides are validated before initial painting and before an appearance update.
