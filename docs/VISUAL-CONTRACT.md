# Board visual ownership and extension requirements

Owner requirements recorded on 2026-10-07. These are the target contract for
future implementation, not APIs already shipped in `0.1.0-dev.3`.

Related discussions:
- [Application #1: piece ownership](https://github.com/knights-eye-chess/knightseye-net/issues/1)
- [Application #2: board convergence](https://github.com/knights-eye-chess/knightseye-net/issues/2)
- [Board #1: arrow rendering](https://github.com/knights-eye-chess/board-ui/issues/1)

## Required ownership

Board UI must own the visual implementations and ship useful defaults for all
categories below. A standalone consumer must be able to use them without
depending on the Knight's Eye application.

| Category | Board-owned defaults | Host extension and selection |
| --- | --- | --- |
| Arrows | Existing beautiful tapered, outlined, layered arrow display and its geometry | Add named shapes/styles at build time; select a style for an arrow |
| Pieces | Piece assets and their alignment/size metrics | Add named piece sets with custom assets at build time |
| Classification icons | Icon assets and their visual presentation | Add named icon sets with custom assets at build time |
| Square themes | Named square palettes and presentation tokens | Add named themes at build time; select names or supply token overrides at runtime |
| Animation | Piece travel, captures, appearance/disappearance, reduced motion | Runtime duration/easing/enabled settings; host supplies transition hints |
| Interaction | Drag, click-to-move, keyboard and piece-image promotion chooser | Host supplies legality/permissions and handles move and gesture events |
| Optional moves strip | Moves/variations display, icons, centring, snap, scroll-to-scrub and scoped keys | Host supplies a controlled display view and handles navigation requests |

**Arrow names describe appearance, not application meaning.** For example,
`arrow-head-rounded-tail` is an appropriate descriptive identifier. Names such
as `candidate`, `alternative` and `legacy-alternative` belong to host policy,
not the board's style catalogue. Inventory the actual geometry before assigning
final default names; the example is not a claim about the current shape.

The host still owns chess legality, classification decisions, which arrows or
icons to show, game navigation decisions, analysis scheduling and persistence. The board owns
the standard classification vocabulary, matching default colors, default labels
and optional grouping metadata; hosts may override these or add icon IDs. Owning classification icon artwork does not make the board a
classifier. A host maps its semantic modes to descriptive arrow style names and
icon identifiers before passing presentation data to the board.

Coordinate labels must have runtime API controls for visibility and size, with
sensible defaults. These controls must work in both orientations. Accessible
square names must remain available when printed coordinates are hidden.

## Proposed implementation approach (for review)

Use a typed appearance catalogue assembled at build time from package defaults
and host extensions. Supply it explicitly to a board instance or shared renderer;
avoid a mutable global registry. Runtime state selects registered names and may supply square-theme token overrides.
No runtime upload or registration system is required.

- Piece definitions contain all twelve piece identities, asset references and
  alignment metrics. Keep the current artwork bytes and provenance intact.
- Icon entries contain stable IDs, artwork, defaultColor, optional defaultLabel
  and group. Defaults include best/great/brilliant/good/okay/dubious/mistake/miss/
  blunder/interesting/book/forced; hosts can add IDs or override defaults. Accessible
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
immediate replacement of the application's interaction controller. The migration must finish with package-owned interaction and animation as well
as rendering. The host is headless for both board and strip: its only connection
to their internal UI is the board-ui API and emitted events.

Suggested order:

1. Capture existing geometry, visuals, animation and interaction behavior; agree
   on catalogue types and descriptive style identifiers.
2. Extract the beautiful arrow renderer, then piece/icon sources and presentation.
   Consume package-owned assets through app build copying and hash verification.
3. Implement presentation-only updates for named themes, runtime tokens and
   coordinates. Updates must preserve focus, selection and active gestures.
4. Extract animation planning and rendering, with host-supplied transition hints.
5. Implement the controlled optional move strip, then qualify live scroll,
   range/clipping, snapping and auto-follow display behavior.
6. Converge drag/click/promotion/keyboard interaction to the package, preserving
   production appearance and adding explicit host lifecycle events. Remove the
   production app's competing visual and gesture implementation.

The strip accepts a display view model, not a mandatory game-tree dependency.
The host supplies move labels/numbers/comments/classification IDs, variation rows,
current cursor and the ordered selected line. Scroll and click navigation emit
requests using that cursor. The host retains game-tree mutations and analysis
policy. A package navigation model is optional future work, not a prerequisite.
Keyboard handling is scoped to component focus with explicit host command hooks.
Gesture state coordinates board dragging and deferred strip redraw; scrolling
still updates the shown position on each animation-frame center crossing while
pointer/touch remains down. Auto-follow is host-switchable.

Package implementation functions are injected through the native runtime object.
There is one shared implementation; a second inlineable classic-script format is
not required. New code must take explicit per-instance inputs rather than closing
over application state. Arrow shapes return typed drawing primitives; board-ui
owns SVG creation, accessibility, masks and collision-free instance IDs.

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


## Headless integration details confirmed during review

The board uses an open shadow root for style isolation. Hosts may configure
published CSS custom properties and named `part` surfaces; automation may use
stable square/cursor/arrow identity attributes through browser tooling. These
surfaces do not authorize host game logic to inspect or mutate internal DOM.
Geometry is exposed through the handle or the outer layout slot.

Late classification arrival updates badges, last-move color and strip metadata
in place, preserving decoded piece images, focus, gestures and scroll position.
Named overlay groups allow AI reference highlights/arrows to be cleared
independently of ordinary analysis overlays. Host tags carry opaque provenance;
arrow geometry remains appearance-named.

Move intents carry an instance-scoped intent ID. The host echoes that ID in the
state update accepting the move; drag travel suppression is associated with
that explicit acceptance. An unrelated update or expired pending intent cannot
suppress a later animation. A rejection leaves the authoritative position intact.

## Mobile parity correction

The controlled extraction must preserve the original widget's nested enclosing
segments, text-left anchoring, collision packing and native touch scrolling.
A flattened row overlay with custom pointer panning is not an equivalent UI.
Original desktop/mobile typography, padding, borders and quality-text blending
remain defaults. Empty board squares permit native page swipes. Live navigation
keeps clipping extent stable until touch/inertia settles. Compare actual original
versus new geometry and browser-native touch input, not viewport width alone.
