# Startodel

Startodel is an open-source framework for personal, agent-driven developer learning. The goal is for each developer to bring an external agent that builds a Track around their goals and guides them through Lessons, practice, and review. The framework is intended for both self-hosted and cloud use.

**Status: early.** The workspace serves a home page and a database health endpoint, defines the shared learning vocabulary, and includes the initial PostgreSQL schema.

## Stack

The pnpm workspace contains the Nuxt 4 web app, the framework-free domain types in `@startodel/core`, and the Drizzle ORM schema, migrations, and client factory in `@startodel/db`. Vite+ provides linting, formatting, and tests.

## Quickstart

From the repository root, install the pinned Node.js and pnpm versions, then start the local PostgreSQL database and Nuxt.

```sh
nvm install
npm install --global pnpm@12.23.0
pnpm install
cp .env.example .env
. ./.env
export DATABASE_URL
docker compose up -d --wait
pnpm db:migrate
pnpm dev
```

Open [the home page](http://localhost:3000) or request [the health endpoint](http://localhost:3000/api/health). The endpoint returns HTTP 200 with `{"ok":true,"db":"up"}` when PostgreSQL answers `select 1`, or `{"ok":false,"db":"down"}` when the URL is missing or the connection fails.

To run the migration test, set `DATABASE_URL_TEST` to a separate, empty PostgreSQL database and run `pnpm test`. The test skips when the variable is unset.

See the [documentation index](docs/README.md) and [contribution guide](CONTRIBUTING.md).
