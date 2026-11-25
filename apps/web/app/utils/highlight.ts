import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
const highlighter = createHighlighterCore({
  engine: createJavaScriptRegexEngine(),
  themes: [import("shiki/themes/github-light.mjs")],
  langs: [
    import("shiki/langs/javascript.mjs"),
    import("shiki/langs/typescript.mjs"),
    import("shiki/langs/python.mjs"),
    import("shiki/langs/json.mjs"),
  ],
});
export async function highlight(code: string, language: string) {
  const engine = await highlighter;
  const lang = language.toLowerCase();
  return engine.codeToTokens(code, {
    lang: engine.getLoadedLanguages().includes(lang) ? lang : "text",
    theme: "github-light",
  }).tokens;
}
