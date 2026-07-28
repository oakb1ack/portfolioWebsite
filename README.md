# PortfolioWebsite

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.0.8.

## Development server

To start a local development server, run:

```bash
npm start
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.
Requests under `/api` are proxied to the Go service at `http://127.0.0.1:8080`.
The authenticated content studio is available at `http://localhost:4200/admin`.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
npm test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## API development

The production-shaped backend lives in `backend/`. It is a Go API backed by
PostgreSQL and serves same-origin routes under `/api/v1`. The first content
foundation covers projects, posts, taxonomy, profile, contact links, media,
admin sessions, CSRF protection, publication scheduling, and optimistic
concurrency.

Run the backend checks with:

```bash
cd backend
go test ./...
go test -race ./...
go vet ./...
```

For local API development, start PostgreSQL, apply
`backend/migrations/001_portfolio_foundation.up.sql`, then provide at least:

```bash
export APP_ENV=development
export API_ADDRESS=:8080
export DATABASE_URL='postgres://portfolio:password@127.0.0.1:5432/portfolio?sslmode=disable'
export PUBLIC_BASE_URL=http://localhost:4200
export MEDIA_ROOT=./var/media
go run ./backend/cmd/api
```

Create the first admin explicitly rather than during server startup:

```bash
printf '%s\n' 'replace-this-password' | \
  ADMIN_BOOTSTRAP_EMAIL=you@example.com \
  ADMIN_BOOTSTRAP_DISPLAY_NAME='Site administrator' \
  ADMIN_BOOTSTRAP_PASSWORD_FILE=/dev/stdin \
  go run ./backend/cmd/api admin-bootstrap
```

The intended home-server deployment is defined in `compose.yml`. Copy
`.env.example` to `.env`, replace its placeholders, and see
`docs/operations.md` before bringing up the stack. The architecture and API
surface are documented in `docs/backend-architecture.md`.
