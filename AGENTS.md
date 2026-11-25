# Working in Startodel

- `apps/web/` contains the Nuxt app. Pages live in `app/pages/` and HTTP handlers in `server/api/`.
- `packages/core/` contains shared domain types. Keep it framework-free.
- Put project documentation in `docs/`. Use the exact terms in [CONTEXT.md](docs/CONTEXT.md) when naming types or describing the domain. Never replace them with synonyms.
- Record architectural decisions in numbered ADRs under `docs/adr/`. Follow [ADR 0001](docs/adr/0001-record-architecture-decisions.md).
- Keep PRs small and focused. Keep secrets out of source, configuration examples, and logs.
- Use Conventional Commits for commits and PR titles, for example `feat(core): add Lesson type` or `ci: run workspace checks`. See [CONTRIBUTING.md](CONTRIBUTING.md) for allowed types and the branch workflow.

## Per-user isolation

Access user-owned learning data only through `forUser(db, userId)` in `@startodel/db`. In HTTP handlers, use `userData(event)` to bind the Owner from the Session. Assign that Owner on insert and include it in every SQL read, update, and delete, joining through the owning Track for child rows. Return 404 for both missing and foreign rows. Never import raw schema tables into the web server. See [ADR 0004](docs/adr/0004-authentication-and-per-user-isolation.md).

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

Run `pnpm check` and `pnpm test` before submitting changes.
