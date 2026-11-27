import type { LessonBlocks } from "@startodel/core";
import MarkdownIt from "markdown-it";

// Keep escapes and entities in their own tokens so \<App> is distinguishable from <App>.
const markdown = new MarkdownIt({ html: false }).disable("text_join");
const tag = /<\/?[A-Za-z][\w.:-]*(?=\s|\/?>|$)/u;

export function lessonWarnings(lesson: { summary?: string | null; blocks: LessonBlocks }) {
  const warnings: string[] = [];
  function check(field: string, source?: string | null) {
    if (!source || !/[<`]/.test(source)) return;
    let hasTag = false;
    let brokenTicks = false;
    for (const { children } of markdown.parse(source, {})) {
      if (!children) continue;
      for (const [index, token] of children.entries()) {
        if (token.type !== "text") continue;
        hasTag ||= tag.test(token.content);
        // Unpaired ticks survive as text. A nested single tick can also split a call or
        // template literal into two code spans with its argument exposed between them.
        const left = children[index - 1];
        const right = children[index + 1];
        brokenTicks ||=
          token.content.includes("`") ||
          (left?.type === "code_inline" &&
            right?.type === "code_inline" &&
            left.markup === "`" &&
            right.markup === "`" &&
            token.content.trim() === token.content &&
            /[\s(=[{]$/u.test(left.content) &&
            /^[\s);,.\]}]/u.test(right.content));
      }
    }
    if (hasTag)
      warnings.push(
        `${field} contains a tag in prose. Escape the opening angle bracket or put the tag in code.`,
      );
    if (brokenTicks)
      warnings.push(
        `${field} may contain broken backticks. Match the delimiters and use a longer code span around literal backticks.`,
      );
  }

  check("summary", lesson.summary);
  for (const block of lesson.blocks) {
    const field = (name: string) => `${block.id}.${name}`;
    switch (block.type) {
      case "theory":
      case "callout":
        check(field("markdown"), block.markdown);
        break;
      case "code":
        check(field("explanation"), block.explanation);
        break;
      case "link":
      case "video":
        check(field("note"), block.note);
        break;
      case "quiz":
        for (const [i, question] of block.questions.entries()) {
          const path = field(`questions[${i}]`);
          check(`${path}.prompt`, question.prompt);
          question.options.forEach((option, j) => check(`${path}.options[${j}]`, option));
          check(`${path}.explanation`, question.explanation);
        }
        break;
      case "exercise":
        check(field("prompt"), block.prompt);
        block.hints?.forEach((hint, i) => check(field(`hints[${i}]`), hint));
        check(field("solution"), block.solution);
        break;
    }
  }
  return warnings;
}
