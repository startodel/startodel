# Working in Startodel

- `apps/web/` contains the Nuxt app. Pages live in `app/pages/` and HTTP handlers in `server/api/`.
- `packages/core/` contains shared domain types. Keep it framework-free.
- Put project documentation in `docs/`. Use the exact terms in [CONTEXT.md](docs/CONTEXT.md) when naming types or describing the domain. Never replace them with synonyms.
- Record architectural decisions in numbered ADRs under `docs/adr/`. Follow [ADR 0001](docs/adr/0001-record-architecture-decisions.md).
- Keep PRs small and focused. Keep secrets out of source, configuration examples, and logs.
- Use Conventional Commits for commits and PR titles, for example `feat(core): add Lesson type` or `ci: run workspace checks`. See [CONTRIBUTING.md](CONTRIBUTING.md) for allowed types and the branch workflow.

## Per-user isolation

Access private learning data only through `forUser(db, userId)` in `@startodel/db`. In Session API handlers, use `userData(event)` to bind the Owner from the Session. Assign that Owner on insert and include it in every SQL read, update, and delete. Return 404 for both missing and foreign rows. Never import raw schema tables into the web server. See [ADR 0004](docs/adr/0004-authentication-and-per-user-isolation.md).

Use `publicReader` for Public Profiles, Public Tracks, Lessons and the sitemap. Forks read through the public layer and write through the recipient’s `forUser` in one transaction. See [ADR 0015](docs/adr/0015-public-read-layer.md) for the fork-only Lesson projection and Terms Acceptance.

Reference user-owned parents with composite foreign keys from `(user_id, parent_id)` to the parent's unique `(user_id, id)`. Test foreign references with two Users. See [ADR 0011](docs/adr/0011-composite-ownership.md).

Validate Lesson Block payloads on every write through the Zod schemas in `@startodel/core`. See [ADR 0008](docs/adr/0008-lesson-blocks.md).

Treat agent-authored Lesson content as untrusted. Escape HTML in Markdown, allow only HTTP(S) resource URLs, and embed videos only through a validated 11-character YouTube ID on youtube-nocookie.com. Render highlighted code as text tokens. Render Markdown images as outbound links. Session Lesson and Practice Quiz reads expose questions and options. Return Quiz feedback on submission and Exercise solutions on explicit reveal. See [ADR 0014](docs/adr/0014-review-practice-and-ui-answers.md).

Every MCP Tool uses the request’s `forUser(db, userId)`, bound to the Owner of the MCP Token. Never accept a `userId`, `ownerId`, or equivalent Tool argument. For every new Tool, add two-User HTTP isolation tests and describe when to call it in the [agent guide](docs/agent-guide/README.md). To change agent guidance, edit `docs/agent-guide`, then run `pnpm guide:build && pnpm skills:build`. See [ADR 0005](docs/adr/0005-mcp-transport-and-token-model.md).

Add UI strings to both Russian and English message catalogs. Follow the [contributor instructions](CONTRIBUTING.md#interface-languages) and run `pnpm i18n:check`.

## Commands

Run from the workspace root:

- `pnpm install` installs the workspace dependencies.
- `pnpm db:generate` generates a migration after a schema change.
- `pnpm db:migrate` applies pending migrations to `DATABASE_URL`.
- `pnpm db:studio` opens Drizzle Studio for `DATABASE_URL`.
- `pnpm dev` starts the web app.
- `pnpm check` validates formatting, lint rules, and types.
- `pnpm test` runs the unit tests.
- `pnpm build` builds the web app for production.
- `docker build -t startodel:local .` builds the production image.

Run `pnpm check` and `pnpm test` before submitting changes.
