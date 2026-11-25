import { readFileSync } from "node:fs";
import { expect, test } from "vite-plus/test";
import { designShowcaseEnabled, isDesignShowcasePath } from "../app/utils/design-showcase";

const css = readFileSync(new URL("../app/assets/design/tokens.css", import.meta.url), "utf8");
const tokens = new Map(
  [
    ...css.matchAll(/--s-([a-z0-9-]+):\s*light-dark\(\s*(#[0-9a-f]{6}),\s*(#[0-9a-f]{6})\s*\)/g),
  ].map(([, name, light, dark]) => [name!, { light: light!, dark: dark! }]),
);

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((at) => {
    const channel = Number.parseInt(hex.slice(at, at + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high! + 0.05) / (low! + 0.05);
}

const grounds = ["bg", "surface", "raised", "sunken"];
const pairs: [foreground: string, background: string, minimum: number][] = [
  ...["ink", "ink-2", "ink-3", "copper", "verdigris", "brass", "oxide", "steel"].flatMap((ink) =>
    grounds.map((ground): [string, string, number] => [ink, ground, 4.5]),
  ),
  ...["copper", "verdigris", "brass", "oxide", "steel"].map((tone): [string, string, number] => [
    tone,
    `${tone}-soft`,
    4.5,
  ]),
  ["ink", "copper-soft", 4.5],
  ["ink", "verdigris-soft", 4.5],
  ["ink", "brass-soft", 4.5],
  ["ink", "oxide-soft", 4.5],
  ["ink", "steel-soft", 4.5],
  ["on-copper", "copper-fill", 4.5],
  ["on-copper", "copper-fill-hover", 4.5],
  ["on-inverse", "inverse", 4.5],
  ...[0, 1, 2, 3, 4].map((n): [string, string, number] => [`on-mastery-${n}`, `mastery-${n}`, 4.5]),
  ...[
    "code-text",
    "code-comment",
    "code-keyword",
    "code-string",
    "code-constant",
    "code-function",
    "code-parameter",
    "code-punctuation",
  ].map((token): [string, string, number] => [token, "code-bg", 4.5]),
  // Non-text parts need 3:1 against the ground they sit on (WCAG 1.4.11).
  ...grounds.flatMap((ground): [string, string, number][] => [
    ["line-strong", ground, 3],
    ["copper-fill", ground, 3],
    ["focus", ground, 3],
  ]),
];

test("design tokens define a light and a dark value for every colour pair in use", () => {
  const missing = pairs.flatMap(([a, b]) => [a, b]).filter((name) => !tokens.has(name));
  expect([...new Set(missing)]).toEqual([]);
});

test.each(["light", "dark"] as const)(
  "design tokens meet WCAG contrast in the %s theme",
  (theme) => {
    const failures = pairs.flatMap(([foreground, background, minimum]) => {
      const ratio = contrast(tokens.get(foreground)![theme], tokens.get(background)![theme]);
      return ratio >= minimum
        ? []
        : [`${foreground} on ${background}: ${ratio.toFixed(2)} < ${minimum}`];
    });
    expect(failures).toEqual([]);
  },
);

test("Mastery fills get steadily stronger so the scale reads without hue", () => {
  for (const theme of ["light", "dark"] as const) {
    const ground = tokens.get("bg")![theme];
    const steps = [0, 1, 2, 3, 4].map((n) => contrast(tokens.get(`mastery-${n}`)![theme], ground));
    expect(steps).toEqual([...steps].sort((a, b) => a - b));
  }
});

test("the design showcase is served only in development or behind its flag", () => {
  expect(designShowcaseEnabled(true, false)).toBe(true);
  expect(designShowcaseEnabled(false, true)).toBe(true);
  expect(designShowcaseEnabled(false, "true")).toBe(true);
  expect(designShowcaseEnabled(false, false)).toBe(false);
  expect(designShowcaseEnabled(false, "false")).toBe(false);
  expect(designShowcaseEnabled(false, undefined)).toBe(false);
});

test("only showcase paths skip the Session check", () => {
  expect(
    ["/design", "/design/", "/design/components", "/Design/screens/lesson"].map(
      isDesignShowcasePath,
    ),
  ).toEqual([true, true, true, true]);
  expect(
    ["/", "/designs", "/settings/design", "/api/design", "/designer"].map(isDesignShowcasePath),
  ).toEqual([false, false, false, false, false]);
});
