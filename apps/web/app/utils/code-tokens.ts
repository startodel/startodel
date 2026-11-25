import { createCssVariablesTheme, createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

// Token colours are CSS variables, so highlighted code follows the active theme without a rerun.
const theme = createCssVariablesTheme({ name: "startodel", fontStyle: true });
const grammars = {
  javascript: () => import("shiki/langs/javascript.mjs"),
  typescript: () => import("shiki/langs/typescript.mjs"),
  tsx: () => import("shiki/langs/tsx.mjs"),
  jsx: () => import("shiki/langs/jsx.mjs"),
  vue: () => import("shiki/langs/vue.mjs"),
  python: () => import("shiki/langs/python.mjs"),
  go: () => import("shiki/langs/go.mjs"),
  rust: () => import("shiki/langs/rust.mjs"),
  sql: () => import("shiki/langs/sql.mjs"),
  json: () => import("shiki/langs/json.mjs"),
  yaml: () => import("shiki/langs/yaml.mjs"),
  bash: () => import("shiki/langs/bash.mjs"),
  html: () => import("shiki/langs/html.mjs"),
  css: () => import("shiki/langs/css.mjs"),
  diff: () => import("shiki/langs/diff.mjs"),
} as const;
const aliases: Record<string, keyof typeof grammars> = {
  js: "javascript",
  mjs: "javascript",
  ts: "typescript",
  py: "python",
  golang: "go",
  rs: "rust",
  yml: "yaml",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
};
let highlighter: ReturnType<typeof createHighlighterCore> | undefined;

export function codeLanguage(language: string) {
  const name = language.trim().toLowerCase();
  return name in grammars ? (name as keyof typeof grammars) : aliases[name];
}

export interface CodeToken {
  content: string;
  color?: string;
  italic: boolean;
}

/** Split code into lines of coloured text tokens. Unknown languages come back as plain text. */
export async function codeTokens(code: string, language: string): Promise<CodeToken[][]> {
  highlighter ??= createHighlighterCore({
    engine: createJavaScriptRegexEngine(),
    themes: [theme],
    langs: [],
  });
  const engine = await highlighter;
  const lang = codeLanguage(language);
  if (lang && !engine.getLoadedLanguages().includes(lang))
    await engine.loadLanguage(grammars[lang]());
  return engine
    .codeToTokens(code, { lang: lang ?? "text", theme: "startodel" })
    .tokens.map((line) =>
      line.map((t) => ({ content: t.content, color: t.color, italic: t.fontStyle === 1 })),
    );
}
