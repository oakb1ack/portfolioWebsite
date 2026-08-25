# Portfolio content

Project case studies live in `content/projects` as MDX files. The filename and
`slug` must match. Frontmatter is written as JSON between `---` markers; JSON is
a valid subset of YAML and lets the site validate content without a YAML parser.

Each project needs:

- a unique kebab-case `slug`;
- a concise card `summary` and a fuller MDX body;
- its `period`, `status`, disciplines, technologies, role, and outcome;
- a unique `featuredOrder` when `featured` is true;
- HTTPS links and root-relative media paths.

`links` and `media` can be empty until authentic destinations and artifacts are
available. Do not invent a screenshot or placeholder path: a missing file would
only fail after the content schema has passed.

The loader in `lib/content/projects.ts` validates every file and rejects invalid
fields, duplicate slugs, duplicate feature ordering, and filename mismatches.
Use the exported loader only from server components or build-time code because
it reads the repository with Node's filesystem API.
