# Engraved chapter seals

Original vector artwork for this portfolio, authored programmatically with
[Paper.js](https://paperjs.org/) (MIT). Each seal shares an engraved diamond
bezel, brass bevels, dark enamel, and crimson inlays.

- `home.svg`: an arched gateway with layered stonework and steps.
- `about.svg`: curved laurel branches surrounding a carved A monogram.
- `experience.svg`: an astrolabe with orbital rings, graduations, and a faceted needle.
- `blog.svg`: an open codex with curved pages, a bookmark, and a feather quill.
- `uncharted.svg`: a fractured compass for missing routes.

Edit `scripts/chapter-artwork.mjs`, then run:

```sh
npx playwright install chromium # Once, if no Playwright browser is installed
npm run generate:crests
```

The generator uses Paper.js in a local headless browser to perform curve and
boolean geometry operations, then exports standalone SVGs. It prefixes gradient
and clipping IDs so multiple seals can coexist in a document. Generation is
deterministic. The finished assets are checked in; deployment builds do not
require a browser or regenerate them.

The application imports these trusted local SVGs as inline markup so the entire
set is ready before navigation and the frame and engraving can animate separately.
Paper.js is a development dependency and is not shipped to visitors.
