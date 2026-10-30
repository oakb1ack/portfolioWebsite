# Minimal chapter symbols

Original vector artwork for this portfolio, authored programmatically with
[Paper.js](https://paperjs.org/) (MIT). Symbols share a 96-unit grid, a single
crimson fill (`#c4453c`), and transparent negative space. The transition pairs
each symbol with its section title on black.

- `home.svg`: an open arched doorway.
- `about.svg`: a single laurel sprig.
- `experience.svg`: a compass rose with a circular center cutout.
- `blog.svg`: a folded page with two text cuts.
- `uncharted.svg`: a broken compass for missing routes.

Edit `scripts/chapter-artwork.mjs`, then run:

```sh
npx playwright install chromium # Once, if no Playwright browser is installed
npm run generate:crests
```

The generator uses Paper.js in a local headless browser to perform curve and
boolean geometry operations, then exports standalone SVGs. It prefixes exported
IDs so multiple symbols can coexist in a document. Generation is
deterministic. The finished assets are checked in; deployment builds do not
require a browser or regenerate them.

The application imports these trusted local SVGs as inline markup so the entire
set is ready before navigation.
Paper.js is a development dependency and is not shipped to visitors.
