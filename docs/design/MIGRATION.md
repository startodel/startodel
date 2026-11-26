# Design system migration

Every product page now uses Signal. This record maps the completed migration steps to their routes, layouts and showcase screens.

Each page has a mock screen in the showcase under `/design/screens`. A mock screen is built only from `Ui*` components and sample data, so it shows the target for the page and the components to use. It proves the layout, not the data wiring.

Read [the design concept](CONCEPT.md) and [ADR 0017](../adr/0017-design-system.md) first.

## Product page rules

- Every product page renders inside `UiRoot` and uses only `Ui*` components and `--s-*` tokens. It has no styles of its own beyond layout.
- Keep every user-facing string in `ru.json` and `en.json`. The showcase copy is English sample text and is not a source of messages. Use the Russian terms in [CONTEXT.md](../CONTEXT.md#russian-ui-terms).
- Link to app pages with `NuxtLinkLocale`. Components that take a link accept a `LinkTarget` and render it that way.
- Keep the content safety rules of [ADR 0014](../adr/0014-review-practice-and-ui-answers.md). `UiProse`, `UiCodeBlock`, `UiResourceLink` and `UiVideoEmbed` call the same `renderMarkdown`, `codeTokens`, `httpUrl` and `youtubeEmbed` utilities as the components they replace. `apps/web/test/rendering.test.ts` covers those utilities and stays as it is.

## Style rules that keep development and production identical

The development server and the production build emit the same stylesheets in a different order. Two rules of equal specificity from different files can therefore swap. This caused a real defect: text inputs in the production showcase had a second border and a white background, because a global rule in `app.vue` tied with the reset and won only in production.

Styles are ranked by specificity, never by order:

| Tier                            | Selector form                             | Specificity | Where                     |
| ------------------------------- | ----------------------------------------- | ----------- | ------------------------- |
| Element reset                   | `:where(.s-root) button`                  | (0,0,1)     | `reset.css`               |
| Shared classes                  | `:where(.s-root) .s-stack`                | (0,1,0)     | `base.css`                |
| Component rules                 | scoped `.s-card`, or `.s-root .s-control` | (0,2,0)     | components, `control.css` |
| A parent placing a child's root | `.s-shell .s-shell__tabs`                 | (0,3,0)     | the parent component      |

Follow the same form in new code. A parent that styles the root element of a child component must name its own block first, as in the last row.

`apps/web/test/cascade.mjs` finds any pair of rules that still depends on order. Run it against the development server after changes to page or component styles:

```sh
node apps/web/test/cascade.mjs http://localhost:3000 /design/components /settings
```

It needs Playwright and Chrome, which are not dependencies of the repository. Set `PLAYWRIGHT_MODULE` and `CHROME` to their paths. Pages behind the Session need a signed-in browser profile or a seeded Session.

## Step 0. Layouts

The three layouts each render `UiRoot` once. It hosts the theme, toasts and overlay layer `#s-layer`.

| Layout  | Built from                 | Mock                           | Data it needs                                                                                                 |
| ------- | -------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `app`   | `UiAppShell`               | `components/showcase/App.vue`  | The User from the Session, the Track list from `/api/tracks`, the due count from `/api/dashboard`, and logout |
| `site`  | `UiSiteHeader`, `UiFooter` | `components/showcase/Site.vue` | The Session, to choose between “Sign in” and “Dashboard”                                                      |
| `focus` | `UiFocusLayout`            | the Onboarding screen          | The User from the Session                                                                                     |

Each product page selects its layout with `definePageMeta({ layout: "app" })`. `UiAppShell` sets `--s-sticky-top`, which sticky elements inside a page use as their offset.

## Step 1 to 11. Pages

The order goes from pages with the least data and risk to the ones with the most. Each row names the mock screen to copy the structure from and the components replaced during the migration.

| #   | Route                                                                     | Layout  | Mock screen                                | Replaces                                                                                                                                                                             |
| --- | ------------------------------------------------------------------------- | ------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `/terms`, `/rules`                                                        | `site`  | `legal`                                    | `LegalDocument` → `UiDocument`                                                                                                                                                       |
| 2   | `/login`                                                                  | `site`  | `landing`                                  | page markup                                                                                                                                                                          |
| 3   | `/settings`                                                               | `app`   | `settings`                                 | `McpTokens` → `UiTable`, `UiCopyField`, `UiModal`; `LanguageSwitcher` → `UiLanguageSwitcher`                                                                                         |
| 4   | `/onboarding`, `/onboarding/connect`                                      | `focus` | `onboarding`, `connect`                    | `AgentConfig` → `UiTabs`, `UiCodeBlock`, `UiCopyField`; `AgentPrompt` → `UiAgentPrompt`                                                                                              |
| 5   | `/`                                                                       | `app`   | `dashboard`                                | `NextStep` → `UiNextUp`; Track rows → `UiTrackStrip`                                                                                                                                 |
| 6   | `/progress`                                                               | `app`   | `progress`                                 | page markup → `UiMasteryHistogram`, `UiVerdictTally`, `UiTable`, `UiTimelineItem`                                                                                                    |
| 7   | `/reviews`, `/reviews/[topicId]/practice`                                 | `app`   | `reviews`                                  | `QuestionChoices` → `UiQuiz`; rows → `UiReviewCard`                                                                                                                                  |
| 8   | `/lessons/[id]`                                                           | `app`   | `lesson`                                   | `LessonContent`, `LessonMarkdown`, `LessonCode`, `LessonQuiz` → `UiLessonBlock` with `UiProse`, `UiCodeBlock`, `UiCallout`, `UiResourceLink`, `UiVideoEmbed`, `UiQuiz`, `UiExercise` |
| 9   | `/tracks/[id]`, `/topics/[id]`                                            | `app`   | `track`                                    | `TrackGraph.client` → `UiTrackBoard`; `TopicPanel` → `UiTopicCard`, `UiLessonList`; `TrackVisibility` → `UiModal` with `UiCheckbox`                                                  |
| 10  | `/grills`, `/grills/[id]`                                                 | `app`   | `grill`                                    | page markup → `UiGrillStrip`, `UiGrillQuestion`, `UiGrillAnswer`, `UiGrillJudgment`, `UiVerdictTally`                                                                                |
| 11  | `/u/[login]`, `/u/[login]/[slug]`, `/u/[login]/[slug]/lessons/[lessonId]` | `site`  | `public-profile`, `public-track`, `lesson` | `ForkedFrom` → `UiForkedFrom`; page markup → `UiTrackMap` with `outline`, `UiForkButton`, `UiTrackCard`, `UiLessonList`                                                              |

Notes for single steps:

- **Step 2.** The landing mock is the signed-out page. Keep the GitHub sign-in link and the redirect behaviour of `/login`.
- **Step 3.** The plaintext MCP Token is shown once, in `UiCopyField`. Keep it out of logs and out of any stored state.
- **Step 7 and 8.** `UiQuiz` receives questions and options only. The correct option and the explanation arrive in the `result` prop after submission. `UiExercise` receives the solution only after `reveal`. Do not preload either.
- **Step 9.** `UiTrackBoard` and `UiTrackMap` share `boardModel()` in `components/ui/board.ts`, so the interactive board and the server-rendered board are identical. `@vue-flow/core` and `@dagrejs/dagre` stay. The board falls back to `UiTrackList` in a narrow container.
- **Step 11.** A Public Track has no Mastery. Pass `outline` to `UiTrackMap`. The public Lesson reuses the renderers of step 8 with the Quiz and Exercise in their read-only form.

### Data the mock screens assume

Some mock screens show more than the current handlers return. Decide for each item whether to derive it on the client, extend a handler in a separate change, or leave the element out. Check the handler before wiring.

| Screen             | Element                                                          | Current source                                                                                               |
| ------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Dashboard          | One cell per Topic in `UiTrackStrip`                             | `/api/dashboard` returns totals per Track. `/api/progress` has Mastery per Topic.                            |
| Dashboard, Reviews | `UiLeitnerRack` counts per Review Box, `UiWeekStrip` due per day | Derive from the ReviewItems of `/api/reviews`, which carry the Review Box and the due date.                  |
| Dashboard          | Recent Activity                                                  | `/api/progress` returns Activity. `/api/dashboard` does not.                                                 |
| Connect            | “Waiting” and “Connected” states                                 | `/api/mcp-tokens` returns when each MCP Token was last used. There is no push, so the page has to ask again. |
| Public Track       | Paged list of Public Forks                                       | The public Track response returns every Public Fork in one list. Page it on the client with `UiPagination`.  |
| Settings           | Theme and language controls                                      | Both are client-side: the `startodel-theme` cookie and the locale route.                                     |

## Step 12. Cleanup

The default layout, the global styles from `app.vue` and the superseded components in the table above have been removed. Nuxt keys pages by route path so moving between Public Tracks, Lessons or languages reloads the matching data and metadata.

The design entry point imports `reset.css` for element defaults. `UiRoot` retains `.s-root` and the overlay layer. Nuxt’s standalone error view renders outside this boundary. Every product page under `app/pages/` selects a Signal layout and participates in the colour, font and control checks. The showcase has its own roots and specimens.

## Checklist for each page

- The page matches its mock screen at 390 and 1440 pixels, in the light and the dark theme, under `/` and `/en`.
- Loading, empty and error states use `UiSkeletonList`, `UiEmptyState` and `UiNotice`.
- Every state is carried by a shape and a word, not by colour alone.
- Keyboard: every action is reachable, the focus ring is visible, and overlays return focus.
- `pnpm check`, `pnpm test` and `pnpm build` pass.
- `apps/web/test/cascade.mjs` reports no order-dependent declarations for the page.
- The page looks the same in `pnpm dev` and in the production build.
