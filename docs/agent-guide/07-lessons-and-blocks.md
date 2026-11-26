---
id: lessons-and-blocks
title: Write a Lesson with Blocks
order: 7
---

# Write a Lesson with Blocks

Use `get_profile` to calibrate the Lesson. Inspect `list_lessons` and `get_lesson` for the Topic, then use `create_lesson` or `update_lesson` once the content meets the criteria below.

1. **Choose a prediction.** Use the learner’s current project and prior knowledge to pick a question they can test in their preferred language. Before writing the Lesson, use your own web and repository tools to verify the behavior against a current primary source. Record its version or date and the passage, test or implementation that supports the prediction.
2. **Teach the mechanism.** Write an original explanation of why the behavior follows from the mental model. Show a minimal runnable or traceable example. Give the starting state, the change and the expected observation so the learner can check the prediction.
3. **Make the caveat tangible.** Include a substantive Callout Block (`production`, `gotcha` or `tip`). Describe a production symptom or a non-obvious trick, the condition that causes it and one way to detect or address it. Cite the verified primary source in a Link Block or Video Block with its version or date and what to inspect.
4. **Test understanding.** Use a Quiz to apply the idea or diagnose a failure, or a transfer Exercise that changes a constraint and asks for a prediction, fix or trace. The learner should face a fresh case, with feedback that explains the decisive condition.
5. **Check the saved Lesson.** When replacing Blocks, retain the content and stable IDs the learner still needs. Read the Lesson back. It is ready only when the mechanism, example, substantive Callout, dated or versioned primary citation, and Quiz or Exercise are all present.

For the complete [browser tasks Lesson](references/browser-tasks.md), call `resources/read` with URI `startodel://guide/references/browser-tasks`.

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
