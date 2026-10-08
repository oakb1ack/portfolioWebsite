# Ali Alfridawi — Portfolio

A Hades-inspired portfolio scaffold built with React, TypeScript, Vite, and Tailwind CSS. A title-screen menu opens About, Experience, Blog, and Contact panels; résumé links in About and Experience open in a new tab. It deploys as a static site on Vercel.

The interface follows the original Hades main menu’s layout: a fractured white title above a widely spaced menu, yellow selected entries, a lower-left utility strip, and a framed lower-right artwork switch. Alegreya Sans SC and Alegreya SC are served locally, with their SIL Open Font License files in `public/fonts/`. The portfolio title and content sit over illustrated Hades backgrounds by Jane Bak at Studio Grackle and Joanne Tran at Supergiant Games, with credits updated for each slide.

The background cycles through eleven Hades backgrounds: four finished Studio Grackle scenes, four background studies, and Tartarus, Asphodel, and Elysium by Joanne Tran, with manual switching through “Next artwork.” Optimized WebP images prioritize the opening background and prepare the next background one at a time, rather than fetching the whole gallery at startup. Backgrounds stay still until the visitor chooses another image; there is no automatic rotation or ambient ember animation. Reduced-motion preferences disable the transition between images. The layout adapts to phone, tablet, and short desktop screens. Menu captions are visible on desktop; utility controls use vector icons with 44px minimum touch heights on mobile.

Kevin MacLeod’s ambient track “Long Note Two” attempts to start automatically on a loop at 25% volume. If the browser blocks audible autoplay, playback retries on the first click or keyboard interaction; the music note in the bottom utility strip also provides an explicit Play/Pause control. The single music control toggles playback at 25% volume, and track credits remain at the bottom of the page. An explicit music pause cancels automatic startup. The MP3 is hosted locally and fetched when playback is attempted. Reuse details are in [MUSIC.md](public/music/MUSIC.md).

Use Tab to focus the menu, arrow keys to move between entries, Enter to select, and Escape to close a panel. Mouse and touch navigation are also supported.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Develop

```bash
npm install
npm run dev
```

Vite prints the local URL after starting the development server.

## Build

```bash
npm run check
npm run build
npm run preview
```

The production site is written to `dist/`.

## Deploy to Vercel

Import this repository into Vercel. Vercel detects Vite automatically; the build command is `npm run build` and the output directory is `dist`. `vercel.json` includes the SPA fallback for direct navigation to client-side paths.

## Project layout

```text
src/
  App.tsx          Title menu and native dialog panels
  components/
    ArtworkBackground.tsx  Manual artwork switching and source credits
    MusicPlayer.tsx        Audio playback, volume, and music credits
  data/artwork.ts  Image paths, artists, sources, and rotation interval
  data/music.ts    Music path and attribution
  data/site.ts     Portfolio identity and external links
  index.css        Layout, theme, animation, and responsive styles
  main.tsx         React application entry point
public/            Static files such as the résumé and favicon
```

Update the profile details in `src/data/site.ts` and fill the Experience and Blog placeholders in `src/App.tsx` as you add content. Background images are stored locally in `public/art/`; update `src/data/artwork.ts` to change the selection or timing. Image sources and reuse details are recorded in [ARTWORK.md](public/art/ARTWORK.md). Display fonts are bundled locally; body text loads DM Sans from Google Fonts with a local sans-serif fallback.

Visual reference: [Hades main menu](https://interfaceingame.com/screenshots/hades-main-menu/). This is an independent personal portfolio.
