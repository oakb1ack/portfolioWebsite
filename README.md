# Ali Alfridawi — Portfolio

A static, content-first portfolio for [alialfridawi.dev](https://alialfridawi.dev).
It uses Next.js, React, TypeScript, CSS Modules, and Git-managed MDX. There is no
database, CMS, contact backend, analytics script, or runtime server dependency.

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

This checks formatting, lint rules, TypeScript, content tests, and the production
static export. A successful build writes deployable files to `out/`.

## Editing content

- Project case studies live in `content/projects/`.
- Profile and contact details live in `lib/data/site.ts`.
- Education, experience, and leadership live in `lib/data/experience.ts`.
- The downloadable résumé is `public/resume.pdf`.

See [`content/README.md`](content/README.md) for the project frontmatter contract.
Project metadata is validated during tests and production builds.

## Deployment

Vercel can build this repository with the default Next.js settings. The application
uses `output: "export"`, so the resulting `out/` directory can also be hosted by any
static file server. The production domain is `alialfridawi.dev`.

No environment variables are required.
