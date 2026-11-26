import source from "~/assets/design/tokens.css?raw";

/** Colour tokens read from tokens.css, so the showcase cannot drift from the stylesheet. */
export const colorTokens = Object.fromEntries(
  [
    ...source.matchAll(/--s-([a-z0-9-]+):\s*light-dark\(\s*(#[0-9a-f]{6}),\s*(#[0-9a-f]{6})\s*\)/g),
  ].map(([, name, light, dark]) => [name!, { light: light!, dark: dark! }]),
);

export const colorGroups = [
  {
    title: "Board",
    note: "The layers a screen is built from, back to front.",
    tokens: [
      ["bg", "Page ground"],
      ["surface", "Cards and bars"],
      ["raised", "Controls and overlays"],
      ["sunken", "Wells and read-only fields"],
      ["line", "Hairlines"],
      ["line-strong", "Control outlines"],
    ],
  },
  {
    title: "Ink",
    note: "Three steps of text. All pass WCAG AA on every board layer.",
    tokens: [
      ["ink", "Primary text"],
      ["ink-2", "Secondary text"],
      ["ink-3", "Labels and metadata"],
      ["inverse", "Selected chips"],
    ],
  },
  {
    title: "Copper",
    note: "The single accent. Action, progress and anything that carries signal.",
    tokens: [
      ["copper", "Text and icons"],
      ["copper-fill", "Primary fills and live traces"],
      ["copper-fill-hover", "Hover"],
      ["copper-soft", "Tinted ground"],
      ["copper-line", "Tinted outline"],
    ],
  },
  {
    title: "Patina",
    note: "Semantic colours. Each one always appears with a shape and a word.",
    tokens: [
      ["verdigris", "Strong, success"],
      ["verdigris-soft", "Ground"],
      ["brass", "Partial, caution"],
      ["brass-soft", "Ground"],
      ["oxide", "Weak, danger"],
      ["oxide-soft", "Ground"],
      ["steel", "Production, information"],
      ["steel-soft", "Ground"],
      ["focus", "Focus ring"],
    ],
  },
] as const;

export const typeScale = [
  ["5xl", "4rem", "Landing display", "s-display"],
  ["4xl", "2.75rem", "Lesson and Track titles", "ramp__sample ramp__sample--read"],
  ["3xl", "2rem", "Page titles and readouts", "s-title"],
  ["2xl", "1.5rem", "Section titles", "s-title"],
  ["xl", "1.25rem", "Card titles and Grill Questions", "ramp__sample ramp__sample--read"],
  ["lg", "1.0625rem", "Lead text", "ramp__sample"],
  ["md", "0.9375rem", "Interface text", "ramp__sample"],
  ["sm", "0.8125rem", "Controls and tables", "ramp__sample"],
  ["xs", "0.75rem", "Captions", "ramp__sample"],
  ["2xs", "0.6875rem", "LABELS AND DESIGNATORS", "ramp__sample ramp__sample--mono"],
] as const;

export const spaceScale = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24] as const;
