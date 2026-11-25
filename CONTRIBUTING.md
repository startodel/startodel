# Contributing

Follow the [quickstart](README.md#quickstart) to install Node.js, pnpm, and the workspace dependencies. Run commands from the repository root.

1. Fetch the latest `main` and create a short-lived branch from `origin/main`.
2. Keep the change focused and commit it using Conventional Commits.
3. Run `pnpm check`, `pnpm test`, and `pnpm build` before opening a PR. To fix formatting, run `pnpm exec vp fmt`.
4. Push your branch and open a draft PR against `main`. Describe what prompted the change and how you verified it.

Use `type(optional-scope): subject` for commit messages and PR titles. Allowed types are `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`, `build`, and `perf`.

- `feat(core): add TopicEdge type`
- `docs: define Track in the glossary`
