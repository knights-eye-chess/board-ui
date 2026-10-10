# Development

Use Node 24 or newer and the existing npm lockfiles. Start from this checkout,
or clone the repository's `dev` branch.

## Run the demos

```sh
npm ci
npm ci --prefix examples/demos
npm run demo:serve
```

Open `http://localhost:4173`. The two demos show synchronized boards with shared
navigation, and selectable pieces, icons, arrow shapes and themes. See their
[integration notes](https://github.com/knights-eye-chess/board-ui/blob/dev/examples/demos/README.md) for the host implementation,
source downloads and Pages deployment.

## Build and test

```sh
npx playwright install --with-deps chromium webkit
# Linux/macOS: select the downloaded Chromium for all library checks.
export PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="$(node --input-type=module -e 'import { chromium } from "playwright"; console.log(chromium.executablePath())')"
npm run check
npm run test:browser
npm run demo:check
DEMO_BROWSER=webkit node examples/demos/tests/browser.mjs
```

`check` builds the library and runs its tests. `test:browser` exercises the
standalone host. `demo:check` builds the demos, tests the chessops model and runs
Chromium checks. The final command runs the same demo checks in WebKit.
Use `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` when using an installed
system Chromium instead of Playwright's downloaded one.

The desktop and phone-width checks cover dragging, keyboard navigation,
promotion, nested variations, live scrolling, themes and artwork. Chromium
and Linux WebKit are qualified; these checks do not claim testing on real iOS
hardware. Documentation screenshots are captured from the actual demo.

## Source and API

TypeScript sources are in `src/`; builds write JavaScript and declarations to
`dist/`. Public entry points are declared in `package.json`. The demos consume
those public exports, rather than depending on application code.

Read the [API reference](API.md) for integration contracts. The
[visual contract](VISUAL-CONTRACT.md) records the owner's original requirements
and implementation discussion; its historical release notes are not the current
API reference.

## Package an archive

When making a new package release, bump the version first and run:

```sh
npm run pack:checked -- artifacts
```

Keep previously committed archives unchanged. The repository's versioned archives
are the current installation route; no npm registry publication has been performed.
Public registry publishing remains a separate release decision.
