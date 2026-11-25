# Contributing

Follow the [quick start](README.md#quick-start) to install Node.js, pnpm, and the workspace dependencies. Run commands from the repository root.

1. Fetch the latest `main` and create a short-lived branch from `origin/main`.
2. Keep the change focused and commit it using Conventional Commits.
3. Run `pnpm check`, `pnpm test`, and `pnpm build` before opening a PR. To fix formatting, run `pnpm exec vp fmt`.
4. Push your branch and open a draft PR against `main`. Describe what prompted the change and how you verified it.

Use `type(optional-scope): subject` for commit messages and PR titles. Allowed types are `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`, `build`, and `perf`.

- `feat(core): add TopicEdge type`
- `docs: define Track in the glossary`

## Interface languages

Add each UI message under the same key in `apps/web/i18n/locales/ru.json` and `en.json`. Translate complete phrases with named parameters. Use the Russian UI terms in [the glossary](docs/CONTEXT.md#russian-ui-terms). Pass the count to the translator for plurals and use the active locale for dates and numbers. Link to app pages with `NuxtLinkLocale`.

Run `pnpm i18n:check` for catalog parity, empty, missing and unused messages, and literal template text. Reference keys literally in `t()`, `$t()` or `i18n-t`. Enumerate dynamic domain values in `scripts/i18n.mjs`.
