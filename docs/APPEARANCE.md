# Make the board yours

The included glossy pieces, classic squares, move-quality icons and arrow styles
are ready to use. You can change their presentation through the API or supply
your own named sets when building your app.

## Change the board while it is running

With a board created as in [Getting started](GETTING_STARTED.md):

```js
state = { ...state, orientation: 'black' };
board.update(state);

board.updateAppearance({
  themeTokens: { light: '#f1e4d1', dark: '#b88763' },
  coordinates: { visible: true, size: 14 },
  animation: { durationMs: 200 }
});
```

Set `coordinates.visible` to `false` to hide printed labels; accessible square
names remain available. Coordinate size is in CSS pixels (6–48). Animation
duration is 0–1000 milliseconds; use 0 to disable it. The board also honors the
device's reduced-motion preference.

Appearance changes preserve focus and active gestures. Orientation and chess
state changes cancel gestures that no longer apply.

## Arrows, highlights and badges

Overlays are organized into named groups, so you can clear a suggestion without
removing other annotations:

```js
board.updateOverlays('lesson', {
  highlights: [{ square: 'e4', color: '#a571ea', tag: 'lesson-square' }],
  arrows: [{
    from: 'e2', to: 'e4', label: 'Pawn advance',
    style: 'arrow-broad-head-rounded-tail', color: '#31715e'
  }],
  badges: [{ square: 'e4', text: '!', label: 'Key square', background: '#a571ea' }]
});

// Later, remove only this group.
board.updateOverlays('lesson', null);
```

Arrow styles describe their shape. Bundled choices are `arrow-slim-point`,
`arrow-broad-head` and `arrow-broad-head-rounded-tail`. Your app decides what an
arrow means and provides its label and color.

## Add a named square theme

Register extra styles when assembling your app, then select them at runtime.
For the display-only first-board example, keep its `state` and HTML and replace
the mount code with this:

```js
import { createBoardAppearance } from '@knights-eye-chess/board-ui/appearance';
import { mountControlledBoard } from '@knights-eye-chess/board-ui';

const appearance = createBoardAppearance({
  squareThemes: {
    'warm-sand': { light: '#f1e4d1', dark: '#b88763', focus: '#8e57cb' }
  }
});

const board = mountControlledBoard(document.querySelector('#board'), {
  state, appearance,
  pieceUrl: piece => `/pieces/${piece === piece.toUpperCase() ? 'w' : 'b'}${piece.toLowerCase()}.png`,
  onSelect() {}, onMove() {}
});
board.updateAppearance({ squareTheme: 'warm-sand' });
```

Extra names extend the defaults. Reusing an existing name requires the explicit
`replaceDefaults: true` option. Catalogues belong to each board instance; there
is no mutable global style registry.

## Use your own pieces and icons

For a simple piece replacement, use `pieceUrl` as in the getting-started example.
For selectable sets, register `pieceSets` through `createBoardAppearance`.
Each set supplies all twelve piece codes and an asset for each, with optional
scale and alignment offsets. Register `iconSets` similarly; you can add your
own icon IDs, such as the gallery's “Saved idea” bookmark.

Map asset names to browser URLs using `assetUrls`. The default pieces use names
such as `pieces/wn.png`; default icons use names such as `icons/best.svg`.
Your bundler can generate those URLs, or your build can copy images into a served
directory. Using only `pieceUrl` overrides piece images, not icon URLs.

To show bundled icon badges, copy `assets/icons/` to your public directory and
register their URLs. The demo's [appearance setup](../examples/demos/src/appearance.mjs)
shows complete piece/icon mappings, three extra themes and a custom arrow shape.
Its [asset generator](../examples/demos/generate-assets.mjs) contains the original
custom SVG artwork. Try them in the
[live gallery](https://knights-eye-chess.github.io/board-ui/gallery.html).

When changing icon sets, remove any overlays using IDs that the new set does not
contain, then supply badges valid for that set. The gallery demonstrates this
ordering. Unknown IDs fail explicitly.

## Colors and labels

The default icon IDs, colors and labels are exported as
`DEFAULT_QUALITY_DEFINITIONS`. Your app supplies the move classifications; the
component displays them. Explicit overlay labels and colors can override default
presentation. `qualityColors` recolors the bundled SVG icons; custom recolorable
icons need an SVG template as described in the [API reference](API.md).

Square themes can also configure selected-square, last-move, target, coordinate,
focus and promotion-dialog colors. See [the full appearance API](API.md#build-time-appearance-and-runtime-selection).

Artwork is licensed separately under CC BY 4.0. Preserve its attribution when
using it; see [licensing](../LICENSING.md).
