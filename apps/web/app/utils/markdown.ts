import MarkdownIt from "markdown-it";
import { httpUrl } from "./links";
const md = new MarkdownIt({ html: false, linkify: true });
md.validateLink = (value) => httpUrl(value) !== undefined;
md.renderer.rules.link_open = (tokens, i, options, _env, renderer) => {
  tokens[i]!.attrSet("rel", "noopener noreferrer");
  tokens[i]!.attrSet("target", "_blank");
  return renderer.renderToken(tokens, i, options);
};
export const renderMarkdown = (source: string, imageLabel: string) =>
  md.render(source, { imageLabel });
md.renderer.rules.image = (tokens, i, options, env, renderer) => {
  const token = tokens[i]!;
  const label =
    md.utils.escapeHtml(typeof env?.imageLabel === "string" ? env.imageLabel : "") +
    " " +
    md.utils.escapeHtml(renderer.renderInlineAsText(token.children ?? [], options, env));
  const href = httpUrl(String(token.attrGet("src") ?? ""));
  return href
    ? `<a href="${md.utils.escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`
    : label;
};

/** Use visible inline text so links, emphasis and fenced examples do not become outline headings. */
export function markdownOutlinePhrase(source: string) {
  const tokens = md.parse(source, {});
  let opening = "";
  for (const [index, token] of tokens.entries()) {
    if (token.type !== "inline") continue;
    const text = md.renderer.renderInlineAsText(token.children ?? [], md.options, {}).trim();
    if (text && tokens[index - 1]?.type === "heading_open") return text;
    if (!opening) opening = text.split(/\n|(?<=[.!?])\s/u, 1)[0] ?? "";
  }
  return opening;
}

/** Lift the first fence out of the rendered prompt, keeping reference links and later examples intact. */
export function renderExercisePrompt(source: string, imageLabel: string) {
  const env = { imageLabel };
  const tokens = md.parse(source, env);
  const index = tokens.findIndex((token) => token.type === "fence");
  const [fence] = index < 0 ? [] : tokens.splice(index, 1);
  // A nested fence belongs to a list or quote. Finish rendering that container before the editor.
  let split = fence ? index : tokens.length;
  while (split < tokens.length && (tokens[split]!.level > 0 || tokens[split]!.nesting === -1))
    split++;
  const code = fence?.content.replace(/\n$/, "") ?? "";
  const info = fence?.info.trim().split(/\s+/)[0]?.toLowerCase();
  return {
    before: md.renderer.render(tokens.slice(0, split), md.options, env),
    after: md.renderer.render(tokens.slice(split), md.options, env),
    code,
    language: exerciseLanguage(info, code),
  };
}

function exerciseLanguage(info: string | undefined, code: string) {
  const jsx = /<>|<\/[\w.:-]+>|<[\w.:-]+\b[^<>]*\/>/.test(code);
  switch (info) {
    case undefined:
    case "":
    case "js":
    case "javascript":
      return jsx ? "jsx" : "javascript";
    case "ts":
    case "typescript":
      return jsx ? "tsx" : "typescript";
    case "py":
      return "python";
    case "jsx":
    case "tsx":
    case "html":
    case "css":
    case "python":
    case "sql":
    case "json":
      return info;
    default:
      return "text";
  }
}
