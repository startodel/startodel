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
