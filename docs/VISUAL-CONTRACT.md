# Board visual ownership and extension requirements

Owner requirements recorded on 2026-10-07. These are the target contract for
future implementation, not APIs already shipped in `0.1.0-dev.3`.

Related discussions:
- [Application #1: piece ownership](https://github.com/knights-eye-chess/knightseye-net/issues/1)
- [Application #2: board convergence](https://github.com/knights-eye-chess/knightseye-net/issues/2)
- [Board #1: arrow rendering](https://github.com/knights-eye-chess/board-ui/issues/1)

## Required ownership

Board UI must own the visual implementations and ship useful defaults for all
four categories below. A standalone consumer must be able to use them without
depending on the Knight's Eye application.

| Category | Board-owned defaults | Host extension and selection |
| --- | --- | --- |
| Arrows | Existing beautiful tapered, outlined, layered arrow display and its geometry | Add named shapes/styles at build time; select a style for an arrow |
| Pieces | Piece assets and their alignment/size metrics | Add named piece sets with custom assets at build time |
| Classification icons | Icon assets and their visual presentation | Add named icon sets with custom assets at build time |
| Square themes | Named light/dark square palettes | Add named themes at build time; select a theme through the runtime API |

**Arrow names describe appearance, not application meaning.** For example,
`arrow-head-rounded-tail` is an appropriate descriptive identifier. Names such
as `candidate`, `alternative` and `legacy-alternative` belong to host policy,
not the board's style catalogue. Inventory the actual geometry before assigning
final default names; the example is not a claim about the current shape.

The host still owns chess legality, classification decisions, which arrows or
icons to show, explanatory labels, colors expressing domain meaning, navigation
and persistence. Owning classification icon artwork does not make the board a
classifier. A host maps its semantic modes to descriptive arrow style names and
icon identifiers before passing presentation data to the board.

Coordinate labels must have runtime API controls for visibility and size, with
sensible defaults. These controls must work in both orientations. Accessible
square names must remain available when printed coordinates are hidden.

## Proposed implementation approach (for review)

Use a typed appearance catalogue assembled at build time from package defaults
and host extensions. Supply it explicitly to a board instance or shared renderer;
avoid a mutable global registry. Runtime state selects already registered names.
No runtime upload or registration system is required.

- Piece definitions contain all twelve piece identities, asset references and
  alignment metrics. Keep the current artwork bytes and provenance intact.
- Icon sets contain named asset references and presentation metrics. Accessible
  meaning comes from host-provided labels; decorative image content must not
  duplicate those labels for screen readers.
- Arrow definitions implement a shared shape interface receiving board-space
  endpoints and presentation parameters such as color, width/weight and opacity.
  Preserve deterministic layering and allow custom shapes. Share square-center
  calculations across orientations. Do not pass application classification or
  candidate-selection policy into a shape implementation.
- Square themes contain palette tokens. Runtime theme selection and coordinate
  changes are presentation updates, independent of move legality and occurrence.
- Validate incomplete sets, unknown selected names and duplicate names with
  useful errors. Prefer explicit replacement over silent default collisions;
  final merge and error contracts need review.

Illustrative API shape only (names and signatures are not implemented):

```ts
const appearance = createBoardAppearance({
  defaults: defaultBoardAppearance,
  pieceSets: { 'my-pieces': customPieceAssets },
  iconSets: { 'my-icons': customClassificationAssets },
  arrowStyles: { 'my-curved-head': customArrowShape },
  squareThemes: { 'my-squares': customSquarePalette }
});

// Mount options supply appearance; host arrows specify descriptive style names.
// A dedicated presentation update does not replace authoritative chess state.
board.updateAppearance({
  pieceSet: 'my-pieces', iconSet: 'my-icons', squareTheme: 'my-squares',
  coordinates: { visible: true, size: 12 }
});
```

Define the coordinate size unit explicitly in the final API (CSS pixels are the
proposal), including validation and scaling behavior. The required runtime
controls are theme, coordinate visibility and coordinate size; runtime selection
of other registered sets is a useful proposal, not an additional owner mandate.

Asset references must work with bundler URL imports and static build-time copying.
The package must not hard-code application public paths. Consumers choose served
URLs; installing a package alone does not expose its assets over HTTP.

## Convergence and migration proposal

Converge by shared rendering leaves first. Both `mountControlledBoard` and the
application's existing interaction controller must call the same board-owned
renderers. This puts the production visuals in the package without requiring an
immediate replacement of the application's interaction controller. Later full
interaction convergence remains a separate qualification decision.

Suggested order:

1. Inventory default assets, alignment metrics, arrow geometry and icon variants;
   agree on catalogue types and descriptive style identifiers. Transfer piece
   source ownership and consume package assets through the app build, preserving
   existing public URLs and hash checks. Inventory chat and SVG variants before
   deciding which are board defaults versus other host presentation.
2. Extract the beautiful arrow geometry into a pure shared renderer, use it in
   both consumers, and keep the semantic-mode-to-style mapping in the host.
3. Move classification icon assets and piece/icon rendering leaves into the
   package. Remove duplicated app sources after the app consumes the package.
4. Add the shared square-theme catalogue and runtime theme/coordinate controls;
   qualify the complete appearance extension API in a standalone example.
5. Evaluate promotion, drag ghosts, animation and remaining interaction overlap
   separately. Do not leave competing visual implementations as the end state.

The first asset-only change should preserve the generated widget fingerprint.
Renderer/API changes may legitimately change generated bytes; use the app's
documented behavior-change and fingerprint qualification process rather than
calling such changes structural cleanup.

## Acceptance evidence

- All 32 starting pieces load correctly, with matching asset hashes and alignment.
- Existing arrow appearance is preserved in reference screenshots covering
  overlaps, layers, knight moves, both orientations and representative sizes.
- Classification icons preserve existing appearance and readable labels.
- A standalone host adds its own named piece set, icon set, arrow shape and
  square theme at build time, without importing application code.
- Runtime theme and coordinate visibility/size updates work on separate board
  instances without leaking styles or changing chess state. Check focus and
  active gestures during presentation-only updates.
- Both interactive mounting and rendering-leaf consumers use the same visual
  implementation; app-owned semantic mapping remains outside the package.
- Existing keyboard, promotion and move-intention behavior remains qualified
  through each adopted rendering change. Record any touch/platform limitations.

Current release status: dev.3 includes optional glossy piece assets, but the app
still consumes dev.2. Named catalogues, the beautiful shared arrow renderer,
classification icon ownership and runtime theme/coordinate APIs remain pending.
This document does not close any linked issue or claim these features shipped.

The goal is a reusable open-source component. Public publication, licensing and
support commitments still require a separate owner decision; this work remains
in the private repository.
