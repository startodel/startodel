import type { PublicBlock } from "@startodel/core";
import type { LinkTarget } from "../components/ui/nav";
import { markdownOutlinePhrase } from "./markdown";

/** Read 200 words/minute, plus one minute per code example or Quiz question and three per Exercise.
 * Include only learner-visible prose. Round the total up, with a minimum of one minute.
 */
export function lessonMinutes(blocks: PublicBlock[]) {
  let words = 0;
  let practice = 0;
  function count(text = "") {
    words += text.split(/\s+/u).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
  }
  for (const block of blocks) {
    switch (block.type) {
      case "theory":
      case "callout":
        count(block.markdown);
        break;
      case "link":
      case "video":
        count(block.note);
        break;
      case "code":
        count(block.explanation);
        practice += 1;
        break;
      case "quiz":
        for (const q of block.questions) {
          count(q.prompt);
          q.options.forEach(count);
        }
        practice += block.questions.length;
        break;
      case "exercise":
        count(block.prompt);
        block.hints?.forEach(count);
        practice += 3;
        break;
    }
  }
  return Math.max(1, Math.ceil(words / 200 + practice));
}

function shortPhrase(text: string) {
  const chars = Array.from(text.trim());
  if (chars.length <= 52) return chars.join("");
  const start = chars.slice(0, 51).join("");
  return (start.replace(/\s+\S*$/u, "") || start) + "…";
}

export function blockOutlineTitle(
  block: PublicBlock,
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  if (block.type === "quiz") return t("lesson.quizOutline", { count: block.questions.length });
  let title = block.title?.trim();
  if (!title) {
    switch (block.type) {
      case "theory":
      case "callout":
        title = shortPhrase(markdownOutlinePhrase(block.markdown));
        break;
      case "exercise":
        title = shortPhrase(markdownOutlinePhrase(block.prompt));
        break;
      case "code":
        title = shortPhrase(
          markdownOutlinePhrase(block.explanation ?? "") ||
            block.code.trim().split("\n", 1)[0] ||
            "",
        );
        break;
    }
  }
  if (!title) return t(`block.${block.type}`);
  return block.type === "exercise" ? t("lesson.exerciseOutline", { title }) : title;
}

export const lessonTag = (ordinal: number) => "L" + String(ordinal).padStart(2, "0");

export function lessonTrail(
  ordinal: number,
  topic: { title: string; to: LinkTarget },
  track?: { title: string; to: LinkTarget; topicOrdinal: number },
) {
  const tag = lessonTag(ordinal);
  const topicTag = track && "T" + String(track.topicOrdinal).padStart(2, "0");
  return {
    tag,
    topicTag,
    crumbs: [
      ...(track ? [{ label: track.title, to: track.to }] : []),
      { label: topicTag ? topicTag + " " + topic.title : topic.title, to: topic.to },
      { label: tag },
    ],
  };
}
