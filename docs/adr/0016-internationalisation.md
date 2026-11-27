# 16. Internationalisation

## Status

Accepted

## Context

Startodel originally served Russian at the root. With startodel.com as the public host, first-time visitors should see English. Learners need shareable links to either language version of a Public Track or legal document.

## Decision

Use the Nuxt i18n module with lazy Russian and English message catalogs. English pages use unprefixed paths. Russian pages use the same paths under `/ru`. Legacy `/en` and `/en/…` URLs redirect permanently to their unprefixed equivalents, retaining the query string and browser fragment. Both the header and footer switch to the corresponding page. An explicit selection sets the first-party `startodel_language` cookie for one year. At the root, a Russian preference selects the Russian Landing or the signed-in learner’s Russian dashboard. Other page URLs determine the language directly. Browser language headers have no effect. Legacy legal links with a supported `lang` query redirect permanently to the matching locale.

Public SSR sets the HTML language and emits current-locale canonical and Open Graph metadata, with English and Russian alternate links on the configured public origin. The `x-default` alternate points to the unprefixed English URL in both the page head and the sitemap. The sitemap advertises both versions of UI-translated pages. Both route trees use the same Session checks, public projections and cache policy. API and MCP endpoint paths stay stable.

Translate UI chrome, including prompts supplied by the app, with the terminology in the [glossary](../CONTEXT.md#russian-ui-terms). Show authored content in its original language. Agents use the learner’s conversation or onboarding notes to choose the language of learning content and ask once if it is unclear. Code, identifiers and established technical terms stay in English.

## Amendment — Track content language

A Track records its authored content language as a lowercase language tag. Existing Tracks use `ru` if the title contains a Cyrillic letter, otherwise `en`. On creation, an explicit tag wins, followed by the Owner’s preferred UI language (`en` or `ru`), then the same title rule. Forks copy the source tag. Changing the UI language or renaming a Track preserves its content language.

Public Tracks and their Lessons render in both UI route trees. Their canonical URLs and sitemap entries use the unprefixed path, with no language alternates. HTML, Open Graph and structured data describe the Track’s language.

## Consequences

The language in a shared link is predictable across browsers. UI language is a browser preference. A learner can study content in another language without changing their Profile. A UI change needs messages in both catalogs and passes `pnpm i18n:check`. Legal documents continue to share a version and their existing drift check.
