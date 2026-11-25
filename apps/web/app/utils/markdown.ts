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
