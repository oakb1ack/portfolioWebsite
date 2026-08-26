# Ali Alfridawi — Portfolio

A static portfolio for [alialfridawi.dev](https://alialfridawi.dev). It uses Next.js,
React, TypeScript, and CSS Modules. There is no database, CMS, contact backend,
analytics script, or runtime server dependency.

## Local development

Use a supported Node.js release, then install dependencies and start Next.js:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Quality checks

Run the complete local verification pipeline:

```bash
npm run check
```

This checks formatting, lint rules, TypeScript, and the production static export. A
successful build writes deployable files to `out/`.

## Editing content

- Profile, contact details, and navigation live in `lib/data/site.ts`.
- Homepage content lives in `app/page.tsx`.
- The downloadable résumé is `public/resume.pdf`.

## Deployment

Vercel can build this repository with the default Next.js settings. The application
uses `output: "export"`, so the resulting `out/` directory can also be hosted by any
static file server. The production domain is `alialfridawi.dev`.

No environment variables are required.
