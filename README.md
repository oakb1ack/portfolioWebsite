# Ali Alfridawi — Portfolio

A Hades-inspired portfolio with About, Experience, and Blog pages.
Built with React, TypeScript, Vite, and Tailwind CSS; deployed on Vercel.

## Run locally

Use Node.js 20.19+ (20.x) or 22.12+ and npm.

```bash
npm ci
npm run dev
```

## Build and check

```bash
npm run check    # Type checks, production build, and blog tests
npm run preview  # Preview the built site
```

The build outputs to `dist/`. Vercel deployment settings are in `vercel.json`.
For browser tests, install Chromium with `npx playwright install chromium`,
then run `npm run test:dev` or `npm run test:e2e`.

## Pull request checks

GitHub Actions runs the `Build and test` check on every pull request and push to
`main`, alongside Vercel's deployment checks. It uses Node.js 24 and `npm ci`, then
runs `npm run check`, production browser tests on desktop and mobile Chromium,
and development-server tests for blog draft previews.

Browser reports, screenshots, and failure traces are available in the
`playwright-results` artifact on the workflow run for 14 days. New commits cancel
older runs for the same pull request.

To block merges when tests fail, add `Build and test` as a required status check
in the GitHub branch protection rule or ruleset for `main` after its first run.

## Update content

- Profile and links: `src/data/site.ts`
- Experience: `src/data/experience.ts`
- Blog posts: Markdown files in `content/blog/`; filenames become URLs.

Posts require YAML fields: `title`, `date` (quoted `YYYY-MM-DD`), `description`,
`tags` (a list), and `draft` (a boolean). Preview drafts with `npm run dev`.
Set `draft: false` to publish; keep published filenames stable.

## Credits

Tartarus artwork by Joanne Tran: [sources and reuse details](public/art/ARTWORK.md).
Music: “Long Note Two” by Kevin MacLeod: [license and credits](public/music/MUSIC.md).
This is an independent personal portfolio inspired by Hades.
