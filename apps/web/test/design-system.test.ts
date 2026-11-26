import { readdirSync, readFileSync } from "node:fs";
import ts from "typescript";
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

test("light-dark() holds colours only, so a token works without the production build", () => {
  // A browser accepts nothing but colours here. The production build lowers the function to plain
  // variables and so hides the mistake: the token then works when deployed and not in development.
  const colour = /^(#[0-9a-f]{3,8}|rgb\([^()]*\)|transparent)$/;
  const declarations = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const wrong = [...declarations.matchAll(/light-dark\(((?:[^()]|\([^()]*\))*)\)/g)]
    .map(([, body]) => body!)
    .filter((body) => {
      const parts = body.split(/,(?![^(]*\))/).map((part) => part.trim());
      return parts.length !== 2 || !parts.every((part) => colour.test(part));
    });
  expect(wrong).toEqual([]);
});

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

test("tokens are declared on every theme scope so a nested theme survives the production build", () => {
  expect(css).toMatch(/:root,\s*\[data-theme\]\s*\{\s*\/\*[^*]*\*\/\s*--s-bg:/);
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
    ["/design", "/design/", "/design/components", "/Design/screens/lesson", "/en/design"].map(
      isDesignShowcasePath,
    ),
  ).toEqual([true, true, true, true, true]);
  expect(
    ["/", "/designs", "/settings/design", "/api/design", "/designer", "/en/designs", "/en"].map(
      isDesignShowcasePath,
    ),
  ).toEqual([false, false, false, false, false, false, false]);
});

const appDir = new URL("../app/", import.meta.url);

function vueFiles(dir: string) {
  return readdirSync(new URL(dir, appDir), { recursive: true, encoding: "utf8" })
    .filter((name) => name.endsWith(".vue"))
    .map((name) => dir + name);
}

function sourceOf(file: string) {
  return readFileSync(new URL(file, appDir), "utf8");
}

test.each(["s-display", "s-title"])(
  "%s tightens word spacing relative to its font size",
  (name) => {
    const base = sourceOf("assets/design/base.css");
    const rule = base.match(new RegExp(`:where\\(\\.s-root\\) \\.${name}\\s*\\{([^}]*)\\}`));
    const spacing = rule?.[1]?.match(/\bword-spacing:\s*(-?[\d.]+)em\s*;/);
    expect(Number(spacing?.[1])).toBeLessThan(0);
  },
);

test("every UI component is rendered by a showcase specimen", () => {
  const components = new Map(
    vueFiles("components/ui/").map((file) => ["Ui" + file.split("/").at(-1)!.split(".")[0], file]),
  );
  // A specimen also exercises its nested parts, e.g. the rail and tab bar in UiAppShell.
  const pending = [...vueFiles("pages/design/"), ...vueFiles("components/showcase/")];
  const visited = new Set<string>();
  while (pending.length) {
    const file = pending.pop()!;
    if (visited.has(file)) continue;
    visited.add(file);
    for (const [, tag] of sourceOf(file).matchAll(/<(Ui\w+)\b/g)) {
      const component = components.get(tag!);
      if (component) pending.push(component);
    }
  }
  expect([...components.values()].filter((file) => !visited.has(file))).toEqual([]);
});

function usesDesignLayout(source: string) {
  const script = [...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
    .map(([, block]) => block)
    .join("\n");
  if (!script.includes("definePageMeta")) return false;
  const { statements } = ts.createSourceFile(
    "page.ts",
    script,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TS,
  );
  for (const statement of statements) {
    if (!ts.isExpressionStatement(statement) || !ts.isCallExpression(statement.expression))
      continue;
    const {
      expression,
      arguments: [meta],
    } = statement.expression;
    if (
      !ts.isIdentifier(expression) ||
      expression.text !== "definePageMeta" ||
      !meta ||
      !ts.isObjectLiteralExpression(meta)
    )
      continue;
    return meta.properties.some(
      (prop) =>
        ts.isPropertyAssignment(prop) &&
        (ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name)) &&
        prop.name.text === "layout" &&
        ts.isStringLiteral(prop.initializer) &&
        ["app", "site", "focus"].includes(prop.initializer.text),
    );
  }
  return false;
}

const productPages = vueFiles("pages/").filter((file) => !file.startsWith("pages/design/"));

test("every product page explicitly selects a design layout", () => {
  expect(productPages.filter((file) => !usesDesignLayout(sourceOf(file)))).toEqual([]);
});

test("a layout must be declared directly in page metadata", () => {
  const page = (meta: string) => `<script setup>definePageMeta(${meta})</script>`;
  expect(usesDesignLayout("<template><input /></template>")).toBe(false);
  expect(usesDesignLayout(page('{ layout: "default" }'))).toBe(false);
  expect(usesDesignLayout(page('{ custom: { layout: "app" } }'))).toBe(false);
  for (const layout of ["app", "site", "focus"])
    expect(usesDesignLayout(page(`{ custom: {}, layout: "${layout}" }`))).toBe(true);
});

test("every product page uses tokens and UI controls", () => {
  for (const file of productPages) {
    const source = sourceOf(file);
    for (const [, style] of source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)) {
      expect(style, file).not.toMatch(/#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?)\(|\bfont-family\s*:/i);
    }
    const template = source.match(/<template\b[^>]*>([\s\S]*)<\/template>/)?.[1];
    expect(template, file).toBeDefined();
    expect(template, file).not.toMatch(/<(?:input|select|textarea|button)(?=[\s/>])/i);
  }
});

test.each([
  ["u/[login]/index", "site"],
  ["u/[login]/[slug]/index", "site"],
  ["u/[login]/[slug]/lessons/[lessonId]", "site"],
  ["onboarding/index", "focus"],
  ["onboarding/connect", "focus"],
  ["index", "site"],
  ["dashboard", "app"],
  ["progress", "app"],
  ["reviews/index", "app"],
  ["reviews/[topicId]/practice", "app"],
  ["lessons/[id]", "app"],
  ["tracks/[id]", "app"],
  ["topics/[id]", "app"],
  ["grills/index", "app"],
  ["grills/[id]", "app"],
])("%s selects the %s layout", (page, layout) => {
  const file = "pages/" + page + ".vue";
  expect(productPages).toContain(file);
  expect(sourceOf(file)).toContain('layout: "' + layout + '"');
});

test("the practice page binds the projected questions and submission result to UiQuiz", () => {
  const page = sourceOf("pages/reviews/[topicId]/practice.vue");
  const quiz = page.match(/<UiQuiz\b[^>]+>/)?.[0];
  expect(quiz).toContain('v-bind="quiz"');
  expect(quiz).not.toMatch(/:(?:questions|result)=/);
  expect(page).toContain("practiceQuizProps(data.value?.questions ?? [], result.value?.results)");
});

test("the Lesson page binds projected Blocks and supplies feedback only from submission or reveal", () => {
  const page = sourceOf("pages/lessons/[id].vue");
  expect(page).toContain("blocks: lesson.blocks.map(publicBlock)");
  const quiz = page.match(/<UiQuiz\b[^>]+>/)?.[0];
  expect(quiz).toContain(':questions="b.questions"');
  expect(quiz).toContain(':result="results.get(b.id)"');
  expect(quiz).toContain('@submit="submit(b.id)"');
  const exercise = page.match(/<UiExercise\b[^>]+>/)?.[0];
  expect(exercise).toContain(':solution="solutions.get(b.id)"');
  expect(exercise).toContain('@reveal="reveal(b.id)"');
  for (const binding of [quiz, exercise])
    expect(binding).not.toMatch(/v-bind=|correctIndex|explanation|b\.solution/);
});

test("both Track board views use the shared layout and the narrow view uses the Topic list", () => {
  for (const view of ["TrackBoard", "TrackMap"]) {
    expect(sourceOf("components/ui/" + view + ".vue")).toContain(
      "boardModel(props.topics, props.edges",
    );
  }
  expect(sourceOf("components/ui/TrackBoard.vue")).toContain("<UiTrackList");
});
