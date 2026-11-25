# Startodel

Startodel is an open-source framework for personal, agent-driven developer learning. The goal is for each developer to bring an external agent that builds a Track around their goals and guides them through Lessons, practice, and review. The framework is intended for both self-hosted and cloud use.

**Status: early.** This first release is a workspace skeleton. It serves a home page and a health endpoint, and defines the shared learning vocabulary. Persistence, GitHub sign-in, the MCP server, and deployment are planned for later releases.

## Stack

A pnpm workspace contains the Nuxt 4 web app and a framework-free TypeScript ESM package, `@startodel/core`. Vite+ provides linting, formatting, and tests.

## Quickstart

From the repository root, install the pinned Node.js LTS and pnpm versions and start Nuxt:

```sh
nvm install
npm install --global pnpm@12.23.0
pnpm install
pnpm dev
```

Open [the home page](http://localhost:3000) or request [the health endpoint](http://localhost:3000/api/health) for `{"ok":true}`. The skeleton runs without credentials.

See the [documentation index](docs/README.md) and [contribution guide](CONTRIBUTING.md).
