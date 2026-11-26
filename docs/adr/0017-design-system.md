# 17. Design system

## Status

Accepted

## Context

Before the migration the web app had one global stylesheet in `app.vue` and each page supplied its own controls. [The design concept](../design/CONCEPT.md) defines a visual identity that needs tokens, fonts, brand files and a component library, in a dark and a light theme.

Pages adopted the system in stages so each route could retain its data and navigation while its presentation changed.

## Decision

**Components live in the web app.** They are in `apps/web/app/components/ui/` and Nuxt registers them with the `Ui` prefix. A `packages/ui` workspace package was rejected: the app is the only consumer, a package would need its own build and type setup, and the image build copies each package manifest by name. Move the components into a package when a second consumer appears.

**Tokens are CSS custom properties.** `apps/web/app/assets/design/tokens.css` is the single source. Each colour is declared once with `light-dark()`. A `data-theme` attribute sets `color-scheme`, so a theme can be applied to the page or to any subtree. The tokens are declared on the root and on every `data-theme` element, because the production build lowers `light-dark()` to variables that resolve where a token is declared. The choice is stored in the `startodel-theme` cookie so the server renders the right theme. A test reads the file and checks WCAG contrast for the documented pairs in both themes. `light-dark()` takes colours only. A token with several parts, such as a shadow, is built from colour tokens or holds `light-dark()` inside each colour position. A test checks this, because the production build lowers the invalid form into something that works and the development server does not.

**No CSS or component framework.** Components use scoped styles and the tokens. The library is small, and a utility framework or a vendor kit would bring a second visual language and a larger dependency surface.

**Layout responds to its container.** Components use container queries, not viewport media queries. The app shell, for example, switches from the rail to the tab bar by its own width. This lets the showcase present narrow and wide variants side by side.

**Fonts are self-hosted.** Martian Mono, Onest and Literata come from the `@fontsource-variable` packages and are bundled by the build. All three are under the SIL Open Font License and cover Latin and Cyrillic. No font request leaves the site.

**The system is scoped to `.s-root`.** Every class and token uses the `s-` prefix. `UiRoot` renders the `.s-root` element, imports the stylesheet, applies the theme and hosts the layer that overlays render in. `reset.css` supplies the element defaults. Every product route uses the `app`, `site` or `focus` layout. [The migration record](../design/MIGRATION.md) maps each route to its layout and showcase screen.

**Styles are ranked by specificity, never by source order.** The development server and the production build emit the same stylesheets in a different order, so two rules of equal specificity from different files can swap between them. There are four tiers. Element defaults such as `:where(.s-root) button` count as one element. Shared classes in `base.css` are written as `:where(.s-root) .s-name` and count as one class. Component rules, scoped or written as `.s-root .s-name`, count as two. A parent that places the root of a child component names its own block first, as in `.s-shell .s-shell__tabs`. `apps/web/test/cascade.mjs` loads pages in a browser and reports every pair of rules that still depends on order.

**Interactive behaviour comes from Reka UI.** `reka-ui` is a headless library: it supplies focus management, keyboard interaction, dismissal, positioning and ARIA wiring, and ships no styles. It backs the dropdown menu, popover, tooltip, select, combobox, dialog, tabs, segmented control, toast, checkbox, radio group, switch, collapsible and pagination. Each `Ui*` component wraps the Reka parts and owns every style, so the library does not appear in pages. Writing this behaviour by hand was rejected: correct focus trapping, typeahead and collision-aware positioning are a large surface to maintain and test. Styled component kits were rejected for the reason given above. The version is pinned exactly and installs under the workspace's minimum release age without an exclusion.

**Overlays render in one layer.** Menus, popovers, tooltips, select lists, dialogs and toasts are teleported to `#s-layer`, an element inside `.s-root`. They therefore keep the tokens and the theme, and stack above the page without per-component `z-index` values. `useLayer()` returns the target.

**Text-entry controls share one box.** `control.css` defines `.s-control`: the border, radius, background, height and every state, which are hover, focus, invalid, read-only, disabled and autofill. `UiInput`, `UiTextarea`, `UiSelect` and `UiCombobox` put that class on their outer element and declare only layout and type. A state is therefore styled once. `UiField` gives its control an id and the id of its hint or error through `useField()`, so the label, `aria-describedby` and `aria-invalid` are wired without props. On a touch device the field tokens raise the height and set the text to 16 pixels, which stops iOS from zooming on focus.

**The Track board has one model.** `boardModel()` in `components/ui/board.ts` lays Topics out with dagre and routes every TopicEdge. `UiTrackBoard` draws it with Vue Flow for pan, zoom and selection. `UiTrackMap` draws the same model as static markup on the server, for a Public Track, where `outline` leaves out Mastery and locks, and for small decorative boards. In a narrow container the board becomes `UiTrackList`. `@vue-flow/minimap` is added for the overview, which appears only while part of the board is out of view.

**Syntax highlighting uses token colours.** Shiki runs with a CSS-variables theme, so highlighted code follows the active theme. Tokens are rendered as text nodes, as [ADR 0014](0014-review-practice-and-ui-answers.md) requires.

**A showcase documents the system.** `/design` shows the tokens and every component state, and holds sample screens built from sample data. It is served in development, or when `NUXT_PUBLIC_DESIGN_SHOWCASE=true`. Otherwise it returns 404. The authentication middleware lets these paths through only when the showcase is enabled. The showcase reads no learning data and calls no API.

**Links follow the locale.** A component that navigates takes a `LinkTarget` and renders it with `NuxtLinkLocale`, as [ADR 0016](0016-internationalisation.md) requires. `UiLanguageSwitcher` switches between the routes of the current page.

**Component text comes from the message catalogs.** A label that a component supplies itself, such as “Copy” or a Mastery name, is a message under `ui.*` or an existing key, in Russian and English, as [ADR 0016](0016-internationalisation.md) requires. Text that a page passes in is the page’s to translate. The showcase follows the same locale routing: `/design` renders this text in English and `/ru/design` in Russian. The showcase’s own copy is sample content in English, so `pnpm i18n:check` skips `pages/design/` and `components/showcase/` and still checks every `Ui` component.

**Browser baseline.** The system relies on `light-dark()`, container queries, `:has()` and `:where()`. All have shipped in current Chrome, Firefox and Safari since mid-2024.

## Consequences

The layout owns the theme, overlays and page chrome. The page guardrails apply to every route outside the showcase.

A token change reaches every component and both themes at once. A new colour needs a light and a dark value and a contrast pair in the test.

The showcase is the place to review visual changes. A new component needs a specimen there, and its built-in text needs a message in both catalogs.

Three font packages, `reka-ui` and `@vue-flow/minimap` are added to the web app. The build bundles the font files, so the image grows by the size of the subsets in use. Reka UI is imported per part, so a page ships only the behaviour it uses.

A Reka UI upgrade can change the parts or the `data-state` attributes that the styles rely on. Review the showcase after each upgrade.

A rule that ties with a rule in another file is a defect even when it looks right in development. Run `apps/web/test/cascade.mjs` after a style change. It needs Playwright and Chrome, which are not dependencies, so it does not run in CI.

Browsers older than the baseline get an unstyled or partly styled interface. Startodel's audience uses current browsers.
