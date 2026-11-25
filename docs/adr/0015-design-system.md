# 15. Design system

## Status

Accepted

## Context

The web app has one global stylesheet in `app.vue` and no shared components for common controls. [The design concept](../design/CONCEPT.md) defines a visual identity that needs tokens, fonts, brand files and a component library, in a dark and a light theme.

The existing pages keep their current look until each one is migrated separately. The new system must therefore live beside the old styles without changing them.

## Decision

**Components live in the web app.** They are in `apps/web/app/components/ui/` and Nuxt registers them with the `Ui` prefix. A `packages/ui` workspace package was rejected: the app is the only consumer, a package would need its own build and type setup, and the image build copies each package manifest by name. Move the components into a package when a second consumer appears.

**Tokens are CSS custom properties.** `apps/web/app/assets/design/tokens.css` is the single source. Each colour is declared once with `light-dark()`. A `data-theme` attribute sets `color-scheme`, so a theme can be applied to the page or to any subtree. The choice is stored in the `startodel-theme` cookie so the server renders the right theme. A test reads the file and checks WCAG contrast for the documented pairs in both themes.

**No CSS or component framework.** Components use scoped styles and the tokens. The library is small, and a utility framework or a vendor kit would bring a second visual language and a larger dependency surface.

**Layout responds to its container.** Components use container queries, not viewport media queries. The app shell, for example, switches from the rail to the tab bar by its own width. This lets the showcase present narrow and wide variants side by side.

**Fonts are self-hosted.** Martian Mono, Onest and Literata come from the `@fontsource-variable` packages and are bundled by the build. All three are under the SIL Open Font License and cover Latin and Cyrillic. No font request leaves the site.

**The system is scoped to `.s-root`.** Every class and token uses the `s-` prefix. The stylesheet is imported only by pages that render inside `.s-root`. `legacy-shield.css` resets the element styles that `app.vue` still applies globally and hides its header. Delete that file when `app.vue` drops its global styles.

**Syntax highlighting uses token colours.** Shiki runs with a CSS-variables theme, so highlighted code follows the active theme. Tokens are rendered as text nodes, as [ADR 0014](0014-review-practice-and-ui-answers.md) requires.

**A showcase documents the system.** `/design` shows the tokens and every component state, and holds sample screens built from sample data. It is served in development, or when `NUXT_PUBLIC_DESIGN_SHOWCASE=true`. Otherwise it returns 404. The authentication middleware lets these paths through only when the showcase is enabled. The showcase reads no learning data and calls no API.

**Browser baseline.** The system relies on `light-dark()`, container queries, `:has()` and the native `dialog` element. All have shipped in current Chrome, Firefox and Safari since mid-2024.

## Consequences

Existing pages render exactly as before. Each page can adopt the system in its own change by rendering inside `.s-root`.

A token change reaches every component and both themes at once. A new colour needs a light and a dark value and a contrast pair in the test.

The showcase is the place to review visual changes. A new component needs a specimen there.

Three font packages are added to the web app. The build bundles their files, so the image grows by the size of the subsets in use.

Browsers older than the baseline get an unstyled or partly styled interface. Startodel's audience uses current browsers.

While the legacy shield exists, class names used by `app.vue`, such as `brand`, `bar`, `actions` and `muted`, must not be reused inside `.s-root`.
