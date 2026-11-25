# Startodel

Startodel is an open-source framework for personal, agent-driven developer learning. The goal is for each developer to bring an external agent that builds a Track around their goals and guides them through Lessons, practice, and review. The framework is intended for both self-hosted and cloud use.

**Status: early.** GitHub sign-in gives each User a private Profile and Tracks. The database health endpoint is public.

## Stack

The pnpm workspace contains the Nuxt 4 web app, the framework-free domain types in `@startodel/core`, and the Drizzle ORM schema, migrations, and client factory in `@startodel/db`. Vite+ provides linting, formatting, and tests.

## Quickstart

From the repository root, install the pinned Node.js and pnpm versions, then start the local PostgreSQL database and Nuxt.

```sh
nvm install
npm install --global pnpm@12.23.0
pnpm install
cp .env.example .env
```

In GitHub Settings, open **Developer settings → OAuth apps → New OAuth App**. Set the homepage to `http://localhost:3000` and the authorization callback URL to `http://localhost:3000/auth/github`. Register the app, generate a client secret, and put its values in `NUXT_OAUTH_GITHUB_CLIENT_ID` and `NUXT_OAUTH_GITHUB_CLIENT_SECRET` in the root `.env`. Set `NUXT_SESSION_PASSWORD` there to a random value of at least 32 characters, such as the output of `openssl rand -base64 32`. [GitHub OAuth App registration](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)

Load the settings into the environment before starting the workspace app.

```sh
set -a
. ./.env
set +a
docker compose up -d --wait
pnpm db:migrate
pnpm dev
```

Open [the home page](http://localhost:3000) or request [the health endpoint](http://localhost:3000/api/health). The endpoint returns HTTP 200 with `{"ok":true,"db":"up"}` when PostgreSQL answers `select 1`, or `{"ok":false,"db":"down"}` when the URL is missing or the connection fails.

To run the migration and isolation tests, set `DATABASE_URL_TEST` to a dedicated PostgreSQL test database and run `pnpm test`. The suite applies the migrations, creates two Users, and exercises the built app with sealed cookies issued through a local GitHub stand-in. The database-backed tests skip when the variable is unset.

See the [documentation index](docs/README.md) and [contribution guide](CONTRIBUTING.md).
