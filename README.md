# Ali Alfridawi — Portfolio

A Hades-inspired portfolio built with React, TypeScript, Vite, and Tailwind CSS. The title-screen menu links to About, Experience, and Blog pages; résumé links open in a new tab, and email is available on About and in the footer. It deploys as a static site on Vercel.

The interface follows the original Hades main menu’s layout: a fractured white title above a widely spaced menu, yellow selected entries, a lower-left utility strip, and a framed lower-right artwork switch. Alegreya Sans SC and Alegreya SC are served locally, with their SIL Open Font License files in `public/fonts/`. The portfolio title and content sit over illustrated Hades backgrounds by Jane Bak at Studio Grackle and Joanne Tran at Supergiant Games, with credits updated for each slide.

The background cycles through seven Hades backgrounds: four finished Studio Grackle scenes and Tartarus, Asphodel, and Elysium by Joanne Tran, with manual switching through “Next artwork.” Optimized WebP images prioritize the opening background and prepare the next background one at a time, rather than fetching the whole gallery at startup. Backgrounds stay still until the visitor chooses another image; there is no automatic rotation or ambient ember animation. Reduced-motion preferences disable the transition between images. The layout adapts to phone, tablet, and short desktop screens. Menu captions are visible on desktop; utility controls use vector icons with 44px minimum touch heights on mobile.

Kevin MacLeod’s ambient track “Long Note Two” attempts to start automatically on a loop at 25% volume. If the browser blocks audible autoplay, playback retries on the first click or keyboard interaction; the music note in the bottom utility strip also provides an explicit Play/Pause control. The single music control toggles playback at 25% volume, and track credits remain at the bottom of the page. An explicit music pause cancels automatic startup. The MP3 is hosted locally and fetched when playback is attempted. Reuse details are in [MUSIC.md](public/music/MUSIC.md).

Use Tab to focus the menu, arrow keys to move between entries, and Enter to select. Mouse and touch navigation are also supported.

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

Import this repository into Vercel. `vercel.json` explicitly selects Vite, installs with `npm ci`, builds with `npm run build`, and serves `dist`. Legacy `/resume/` links permanently redirect to `/resume.pdf`, and `/contact/` redirects to `/about`. Generated files are served first, About and Experience use the app shell, and missing pages return HTTP 404 with a readable recovery page. The build generates `robots.txt` with the configured sitemap origin.

## Write and publish a blog post

Create a Markdown file in `content/blog/`. Its lowercase, hyphenated filename becomes the permanent URL: `learning-fourier-transforms.md` is published at `/blog/learning-fourier-transforms`. The slug `404` is reserved. Start each file with YAML metadata:

```markdown
---
title: "Learning Fourier Transforms"
date: "2026-10-08"
description: "Notes on connecting the math to physical signals."
tags: ["Mathematics", "Engineering"]
draft: true
---

The article starts here. Write headings at level two (`##`).
```

All five metadata fields are required. Quote dates and use the `YYYY-MM-DD` format. Posts appear newest first; equal dates sort by filename. Keep filenames stable after publishing so shared URLs continue to work. Reading times are estimated from the article length.

Run `npm run dev` and open `/blog` to preview. Drafts appear locally with a **Draft preview** label. New files and edits automatically reload the page. Set `draft: false`, run `npm run check`, and push or merge into the branch Vercel deploys to publish. Pull request deployments use the public build and exclude drafts too; draft previews are local only.

Markdown supports headings, lists, quotes, links, GitHub-style tables, fenced code with a language name (such as `typescript` or `python`), inline math with `$...$`, and display math with `$$` on separate lines. Math renders to accessible KaTeX HTML and MathML; syntax highlighting runs at build time. Raw HTML is omitted and unsafe links are stripped.

Level-two and level-three headings automatically get unique section links and appear in the article contents. The contents stay alongside the article on wide screens and collapse into an expandable menu on smaller screens. Section links also work without JavaScript. Readers can copy an article link and return to the notebook or the top of the article from its end.

Place images in `public/blog/<post-slug>/` and reference them with absolute paths, for example `![Descriptive alternative text](/blog/my-post/diagram.svg)`. Files in `public/` are always public, including images for drafts; keep unpublished or private assets outside that directory until publication. GitHub repository visibility also controls who can read Markdown drafts in the repository.

The build generates readable HTML at `/blog` and each published article URL, unique sharing metadata, `/rss.xml`, and `/sitemap.xml`. Draft bodies are excluded from public HTML, JavaScript, RSS, and the sitemap. The default canonical origin is `https://alialfridawi.dev`, configured in `src/data/site.ts`; set `SITE_URL` to an HTTP(S) origin at build time to override it. There is no database or runtime Markdown parser.

The welcome article is `content/blog/portfolio.md`.

## Verify the blog

`npm run check` checks application and build-tool types, creates a production build, and runs content and generated-HTML tests. Browser checks cover desktop and mobile navigation, history, focus, direct links, metadata, layout overflow, RSS, and reading with JavaScript disabled:

```bash
npx playwright install chromium
npm run test:dev
npm run build
npm run test:e2e
```

Development browser tests start Vite on port 5178 and check module loading and draft previews, including file additions, edits, and removals. Production browser tests start a preview on port 4175. Vite preview checks the static pages and client behavior; deployment-specific HTTP 404 routing is defined in `vercel.json`.

## Project layout

```text
src/
  App.tsx          Title menu and page navigation
  components/
    ArtworkBackground.tsx  Manual artwork switching and source credits
    MusicPlayer.tsx        Audio playback, volume, and music credits
    BlogPage.tsx           Blog index, article, and missing-page layouts
  data/artwork.ts  Image paths, artists, sources, and rotation interval
  data/music.ts    Music path and attribution
  data/site.ts     Portfolio identity and external links
  index.css        Layout, theme, animation, and responsive styles
  main.tsx         React application entry point
public/            Static files such as the résumé and favicon
content/blog/      Markdown articles and YAML metadata
scripts/           Build-time Markdown pipeline and static blog generation
tests/             Content, generated-output, and browser checks
```

Update the profile details in `src/data/site.ts`, experience records in `src/data/experience.ts`, and blog posts in `content/blog/`. Background images are stored locally in `public/art/`; update `src/data/artwork.ts` to change the selection or timing. Image sources and reuse details are recorded in [ARTWORK.md](public/art/ARTWORK.md). Display fonts are bundled locally; body text loads DM Sans from Google Fonts with a local sans-serif fallback.

Visual reference: [Hades main menu](https://interfaceingame.com/screenshots/hades-main-menu/). This is an independent personal portfolio.
