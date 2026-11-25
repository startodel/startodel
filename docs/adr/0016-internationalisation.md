# 16. Internationalisation

## Status

Accepted

## Context

Russian is the primary product language. Learners need English from the first release and must be able to share a particular language version of a Public Track or legal document.

## Decision

Use the Nuxt i18n module with lazy Russian and English message catalogs. Russian pages use unprefixed paths. English pages use the same paths under `/en`. Both the header and footer switch to the corresponding page. An explicit selection sets the first-party `startodel_language` cookie for one year. The root respects that preference. Other page URLs determine the language directly. Browser language headers have no effect. Legacy legal links with a supported `lang` query redirect permanently to the matching locale.

Public SSR sets the HTML language and emits current-locale canonical and Open Graph metadata, with Russian, English and Russian-default alternate links on the configured public origin. The sitemap advertises both versions of published content, including Lessons. Both route trees use the same Session checks, public projections and cache policy. API and MCP endpoint paths stay stable.

Translate UI chrome, including prompts supplied by the app, with the terminology in the [glossary](../CONTEXT.md#russian-ui-terms). Show authored content in its original language. Agents use the learner’s conversation or onboarding notes to choose the language of learning content and ask once if it is unclear. Code, identifiers and established technical terms stay in English.

## Consequences

The language in a shared link is predictable across browsers. UI language is a browser preference. A learner can study content in another language without changing their Profile. A UI change needs messages in both catalogs and passes `pnpm i18n:check`. Legal documents continue to share a version and their existing drift check.
