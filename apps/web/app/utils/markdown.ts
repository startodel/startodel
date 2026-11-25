import MarkdownIt from "markdown-it";
import { httpUrl } from "./links";
const md = new MarkdownIt({ html: false, linkify: true });
md.validateLink = (value) => httpUrl(value) !== undefined;
md.renderer.rules.link_open = (tokens, i, options, _env, renderer) => {
  tokens[i]!.attrSet("rel", "noopener noreferrer");
  tokens[i]!.attrSet("target", "_blank");
  return renderer.renderToken(tokens, i, options);
};
export const renderMarkdown = (source: string) => md.render(source);
md.renderer.rules.image = (tokens, i, options, env, renderer) => {
  const token = tokens[i]!;
  const label =
    "Image: " +
    md.utils.escapeHtml(renderer.renderInlineAsText(token.children ?? [], options, env));
  const href = httpUrl(String(token.attrGet("src") ?? ""));
  return href
    ? `<a href="${md.utils.escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`
    : label;
};
