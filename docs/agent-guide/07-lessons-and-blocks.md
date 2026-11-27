---
id: lessons-and-blocks
title: Write a Lesson with Blocks
order: 7
---

# Write a Lesson with Blocks

Use `get_profile` to calibrate the Lesson. Inspect `list_lessons` and `get_lesson` for the Topic, then use `create_lesson` or `update_lesson` once the content meets the criteria below.

1. **Choose a question.** Pick a question from the learner’s project or domain that they can test in the Track’s technology and their preferred language. Choose the depth and number of Blocks the Topic needs. Set no writing target for overall Lesson length or Block count. Before writing the Lesson, use your own web and repository tools to verify the behavior against a current primary source. Record its version or date and the passage, test or implementation that supports the answer.
2. **Show first, explain second.** Open with a minimal runnable or traceable example. Use about 5–10 lines in a `code` Block or a concrete scenario. Show the example before asking for a prediction in a `quiz`. For an unscored reflection, put a short prompt in the `theory` Block that sets up the question. Keep the answer out of the framing, code comments and optional code `explanation`.
3. **Teach one idea per `theory` Block.** Trace the answer step by step in a later `theory` Block. Show what changed and explain why in your own words. A typical explanation takes 60–100 words in one or two short paragraphs. Avoid one-line stubs that just pad the outline. Give each new mechanism its own Block. Alternate explanation with code and quick checks.
4. **Use words the learner can follow.** Explain jargon in plain language on first use. For example, “React can group several state updates together. This is called batching.” If a term needs a later Block or Topic, introduce it there. Write like a colleague at a whiteboard. Use short, direct sentences. Cut academic filler, stock introductions and strings of em dashes.
5. **Make the caveat tangible.** Include a substantive Callout Block (`production`, `gotcha` or `tip`). Reserve it for a tip, gotcha, production caveat or takeaway. Name the non-obvious condition and, where relevant, how to detect or address it. Cut filler Callouts. Never put prediction questions, Quiz prompts or Exercise prompts in a Callout.
6. **Make citations clickable.** Cite the verified primary source in a Link Block or Video Block with its version or date and what to inspect. For an inline citation, label the Markdown link with the publisher and page title. Move background reading to Track Sources. Remove unlinked parenthetical titles.
7. **Test understanding.** Use a Quiz to apply the idea or diagnose a failure, or a transfer Exercise that changes a constraint and asks for a prediction, fix or trace. Give feedback that explains the decisive condition.
8. **Check the saved Lesson.** When replacing Blocks, retain the content and stable IDs the learner still needs. Read the Lesson back with `get_lesson`. Check the order as well as the mechanism, example, substantive Callout, dated or versioned primary citation, and Quiz or Exercise.

## Good vs Bad Lesson opening

**Bad** (`theory`) “As an experienced developer, you’ll recall that primitive assignment, binding reassignment and snapshot semantics explain why the first log prints 2.”

**Good** (`code`)

```js
// Save a player's score, then add a point.
let score = 2;
const before = score;
score += 1;
console.log(before);
console.log(score);
```

- `quiz` “Which two numbers will you see, in order?” Choose “2 then 3” or “3 then 3”.
- `theory` “The first log prints 2. When you saved `before`, `score` held the number 2. Adding a point changed only `score`, so the second log prints 3.”

For the complete [browser tasks Lesson](references/browser-tasks.md), call `resources/read` with URI `startodel://guide/references/browser-tasks`. Its Link Block names the standard and points to the exact steps to trace.

## Block checklist

1. Give each Block a `type` and a unique, stable `id` of 1–64 letters, digits, underscores or hyphens. The schema accepts up to 200 ordered Blocks per Lesson.
2. Help learners scan the sticky Lesson contents sidebar. Set a short, descriptive `title` on major Theory, Callout and Exercise Blocks. Use the filename for a Code Block when it fits, for example `timers.cjs`. These titles are optional and accept up to 120 characters. Without one, the sidebar falls back to a short phrase from the body. For code it uses the code explanation, then the first line of code.
3. Give each Link and Video a title naming the resource. A Quiz can take an optional `title` of up to 120 characters, but its sidebar entry always shows the question count and ignores that `title`.

| Type       | Required content                                                                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `theory`   | `markdown`                                                                                                                                                     |
| `code`     | `language` and `code`, optionally `explanation`                                                                                                                |
| `callout`  | `markdown` and `variant` (`gotcha`, `production` or `tip`)                                                                                                     |
| `link`     | `title` and HTTP(S) `url`, optionally `note`                                                                                                                   |
| `video`    | `title` and a YouTube video `url`, optionally `note`                                                                                                           |
| `quiz`     | 1–10 `questions`, each with a `prompt`, 2–6 nonempty `options` and a zero-based `correctIndex` into those options. Each question may include an `explanation`. |
| `exercise` | `prompt` and `solution`, optionally a list of `hints`                                                                                                          |
