---
id: lessons-and-blocks
title: Write a Lesson with Blocks
order: 7
---

# Write a Lesson with Blocks

Use `get_profile` to calibrate the Lesson. Inspect `list_lessons` and `get_lesson` for the Topic, then use `create_lesson` or `update_lesson` once the content meets the criteria below.

1. **Choose a question.** Use the learner’s current project and prior knowledge to pick a question they can test in their preferred language. Before writing the Lesson, use your own web and repository tools to verify the behavior against a current primary source. Record its version or date and the passage, test or implementation that supports the answer.
2. **Show first, explain second.** Open with a minimal runnable or traceable example. Use about 5–10 lines in a `code` Block or a concrete scenario. A short framing line can set the scene. Show the example before asking for a prediction in a `quiz` or short `callout`. Keep the answer out of the framing, code comments and optional code `explanation`.
3. **Teach one idea per `theory` Block.** Trace the answer step by step in a later `theory` Block. Show what changed and explain why in your own words. Aim for 60–100 words. Use one or two short paragraphs. Give each new mechanism its own Block. Alternate explanation with code and quick checks.
4. **Use words the learner can follow.** Explain jargon in plain language on first use. For example, “React can group several state updates together. This is called batching.” If a term needs a later Block or Topic, introduce it there. Write like a colleague at a whiteboard. Use short, direct sentences. Cut academic filler, stock introductions and strings of em dashes.
5. **Make the caveat tangible.** Include a substantive Callout Block (`production`, `gotcha` or `tip`). Describe a production symptom or a non-obvious trick, the condition that causes it and one way to detect or address it.
6. **Make citations clickable.** Cite the verified primary source in a Link Block or Video Block with its version or date and what to inspect. For an inline citation, label the Markdown link with the publisher and page title. Move background reading to Track Sources. Remove unlinked parenthetical titles.
7. **Test understanding.** Use a Quiz to apply the idea or diagnose a failure, or a transfer Exercise that changes a constraint and asks for a prediction, fix or trace. Give feedback that explains the decisive condition.
8. **Check the saved Lesson.** When replacing Blocks, retain the content and stable IDs the learner still needs. Read the Lesson back with `get_lesson`. Check the order as well as the mechanism, example, substantive Callout, dated or versioned primary citation, and Quiz or Exercise.

## Good vs Bad Lesson opening

**Bad** (`theory`) “As an experienced developer, you’ll recall that primitive assignment, binding reassignment and snapshot semantics explain why the first log prints 2.”

**Good** (`theory`) “A player has two points. Save their score, then add a point.”

```js
let score = 2;
const before = score;
score += 1;
console.log(before);
console.log(score);
```

- `callout` “Which two numbers will you see, in order?”
- `theory` “The first log prints 2. When you saved `before`, `score` held the number 2. Adding a point changed only `score`, so the second log prints 3.”

For the complete [browser tasks Lesson](references/browser-tasks.md), call `resources/read` with URI `startodel://guide/references/browser-tasks`. Its Link Block names the standard and points to the exact steps to trace.

## Block checklist

Give each Block a `type` and a unique, stable `id` of 1–64 letters, digits, underscores or hyphens. Supply up to 200 ordered Blocks per Lesson.

| Type       | Required content                                                                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `theory`   | `markdown`                                                                                                                                                     |
| `code`     | `language` and `code`, optionally `explanation`                                                                                                                |
| `callout`  | `markdown` and `variant` (`gotcha`, `production` or `tip`)                                                                                                     |
| `link`     | `title` and HTTP(S) `url`, optionally `note`                                                                                                                   |
| `video`    | `title` and a YouTube video `url`, optionally `note`                                                                                                           |
| `quiz`     | 1–10 `questions`, each with a `prompt`, 2–6 nonempty `options` and a zero-based `correctIndex` into those options. Each question may include an `explanation`. |
| `exercise` | `prompt` and `solution`, optionally a list of `hints`                                                                                                          |
