# Portfolio Redesign Project Brief

## Purpose

Build a simple, polished technical and research-oriented portfolio. The site should showcase current and previous projects, blog writing, and future papers or research work without using an over-the-top visual style.

## Agreed site structure

- Home
- Projects
- Blog
- Contact
- Future-ready architecture for Research/Papers

The homepage should lead with a concise introduction and then feature selected projects and writing. Projects should use browsable cards that link to dedicated technical detail pages.

## Visual direction

- Light editorial design
- Generous whitespace and strong readability
- Restrained color palette
- Typography-led identity; no portrait
- Font pairing to be selected during implementation with accessibility and readability as priorities
- Use structure and content, rather than heavy visual effects, to communicate technical depth

Initial redesign work will use placeholder content. Existing portfolio copy and project data will not be treated as final.

## Content and publishing

The admin dashboard should manage:

- Projects
- Blog posts
- Tags and categories
- Profile information
- Contact links
- Future papers/research content

Blog and long-form content will use Markdown with rendered previews. Posts should support drafts, publishing, tags/categories, publication dates, reading time, and featured images. There will be no built-in comments or reader accounts.

Images and downloadable files will initially be stored on the home server filesystem and managed through the API.

## Application architecture

- Use modern Angular, not legacy AngularJS 1.x.
- Keep the Angular frontend and Go backend in the same repository, with clear directory boundaries.
- The Go API will be a separate process/container from the Angular application.
- The Angular app must never connect directly to PostgreSQL.
- The Go API owns validation, authorization, business rules, file handling, and database access.
- Use Go's standard library plus `chi` for routing and middleware.
- Use `pgx` plus `sqlc` for explicit, type-safe PostgreSQL access.
- Use versioned SQL migration files.
- Use one administrator account initially.

## Security baseline

- Admin access will use a separate hostname protected by Cloudflare Access.
- The Go API will also require its own authenticated admin session.
- Use PostgreSQL-backed sessions so sessions can be revoked, expired, audited, and invalidated.
- Store only hashed random session identifiers in the database.
- Use Argon2id for password hashing.
- Use `HttpOnly`, `Secure`, and appropriate `SameSite` cookie settings.
- Protect state-changing requests against CSRF.
- Validate and authorize every API operation server-side.
- Use parameterized SQL through generated `sqlc` code.
- Validate upload size, type, filename, and storage path; never expose arbitrary filesystem paths.
- Rate-limit authentication attempts.
- Keep secrets outside source control.
- Sanitize rendered Markdown and avoid trusting arbitrary HTML.

## Hosting direction

Use Cloudflare Tunnel so the home server makes outbound connections and no router ports need to be exposed. Caddy can remain behind the tunnel as the internal reverse proxy:

`Internet -> Cloudflare Tunnel -> Caddy -> Angular site / Go API`

The public site may be internet-facing. The admin hostname will be separately protected by Cloudflare Access and Go authentication.

## Rendering strategy

Start with Angular client-side API calls while the content model and admin workflow stabilize. Add prerendering later for public routes to improve initial load performance and SEO. The Go API remains the source of truth.

## Deferred decisions

- Backup and restore strategy
- Exact font pairing
- Final copy and portfolio content
- Cloudflare DNS/domain configuration details
- API deployment and container layout

Backups are required before production deployment, even though the strategy is deferred for now.

## Next milestone

1. Define visual tokens and typography.
2. Build the Angular shell and navigation.
3. Create placeholder Home, Projects, Blog, and Contact pages.
4. Add reusable project cards, article previews, and project detail layouts.
5. Establish routes and content interfaces ready for future Papers content.

The current repository is already a modern Angular scaffold. See `package.json` and `src/app/app.ts`.
