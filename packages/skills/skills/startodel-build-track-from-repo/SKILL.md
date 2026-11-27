---
name: startodel-build-track-from-repo
description: "Build a Track from a repository when the learning goal depends on a specific revision."
---

<!-- Generated from docs/agent-guide by pnpm skills:build. Do not edit. -->

# Build a Track from a repository

Use `get_profile` to establish the learner’s goal and `list_topics` to find relevant prior work. Ground the Track in a real repository revision before applying the Track design workflow.

1. **Pin the task.** Pair the learner’s project and experience with a change, diagnosis or design choice they want to make. Resolve the target release or branch to a commit. Continue when you can name the task and link to the revision.
2. **Trace one real call.** Use your own repository and web tools to check the release history and official docs against that revision. Follow a public entry point through its implementation to a test that exercises the behavior. Keep a permalink to each and distinguish the public guarantee from the implementation detail. If access is missing, get the source or a verifiable public revision before continuing.
3. **Choose the route.** Use comparison mode for a choice between approaches and deep-dive mode for a working change. For a comparison, trace the same operation on both sides. For a deep dive, locate the setup and a failure the learner can reproduce. Carry that evidence into **Design and verify a Track**. The outline is ready to build when it names the mode and the pinned revision. Write a one- or two-sentence Track description naming the learner’s task and the part of the repository they will study. Mention the revision briefly if it defines the scope. Put the commit and code permalinks in Track Sources.

# Design and verify a Track

Start with `get_profile` and `list_topics` to personalize the plan and find reusable Topics. After research and agreement on the outline, use `create_track`, `upsert_topics`, `add_edges` and `attach_topics_to_track`.

1. **Personalize the outcome.** Combine the Onboarding Questionnaire with what you know of the learner’s work. Name the task they want to perform, the starting Topic and a familiar example. Confirm the choice if their background or goal is uncertain.
2. **Verify the sources.** Before designing the Track, use your own web and repository tools to verify the current release and read a primary source for each technology. Check official documentation against recent release notes, a maintainer article or the primary repository. Proceed only when each design decision has a supporting source URL and its version or date.
3. **Choose a mode from the goal.** Agree on an outline that ends in an observable decision or working result.
   - **Comparison mode** for “How do X and Y differ?” Build a mental model of each, including its core problem and architecture. Apply both to the same case. Derive tradeoffs and decision criteria, then vary a constraint. End with a scenario-based Quiz asking which fits the new case, followed by “Why?” in chat.
   - **Deep-dive mode** for “Teach me X.” Connect a mental model to the learner’s concrete goal. Start with a working setup or configuration, trace the internals that explain its behavior, then diagnose a production failure. End with an Exercise where the learner changes the setup and verifies the result independently.
4. **Build and read back.** Reuse matching Topic Slugs. Create the private Track with a one- or two-sentence description of what the learner will be able to do and what the Track covers. Mention a major version briefly if it defines the scope. Set `language` explicitly when you know the language of the content, using a lowercase tag such as `en`, `ru` or `pt-br`. Put versioned documentation and dated release notes in Track Sources. Save the missing Topics, connect prerequisites to dependents and attach members in teaching order. Check `get_track` with either the UUID `id` or the `slug` for the citations and `get_track_graph` for the agreed first Topic and path to the outcome. The Track is ready when both match the plan.
5. **Revise an existing Track.** For a changed content language, source or goal use `update_track`. For an incorrect prerequisite use `remove_edge`. For a Topic that no longer belongs use `detach_topic_from_track`, which preserves its Lessons. Verify the affected sources, edges or memberships on readback.

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

# Rules for external agents

Call `get_guide` on connection and after each learning step. Use the returned Next Step and its reason to pick the workflow.

1. **Personalize first.** Use `get_profile` to combine the Onboarding Questionnaire with what you already know about the learner’s stack, experience, current project and preferred language. For someone new to the subject, teach foundations through a concrete analogy and add one step at a time. With an experienced developer, skip known foundations and bridge from a familiar concept to mechanisms and tradeoffs. In every Lesson, explain jargon in plain language on first use or introduce it in a later Block. Choose the starting Topic, depth, examples and language from that picture. If uncertain, confirm the choice with the learner. Start when you can name a first question in their preferred language.
2. **Record evidence.** Use the learner’s own answer. For free text, a strong Verdict means the answer addresses the prompt accurately, partial identifies a sound idea missing a material condition, and weak identifies faulty reasoning or an inability to apply the idea. Set Mastery 3 only with evidence that the learner explains the mechanism, or 4 with a trace of the internals. Save the specific evidence with `set_mastery`.
3. **Protect the Owner.** The MCP Token selects the Owner. Never pass User or Owner IDs to a Tool. Keep credentials out of prompts and learning records. If a token is lost, direct the learner to revoke it in Settings. Before a large rewrite, identify all affected Tracks and get the learner’s agreement. Preserve Topic Slugs and Block IDs across edits.
4. **Publish by request.** Tracks start private. Use `set_track_visibility` only when the learner explicitly requests that visibility change in this conversation. Publishing requires current Terms Acceptance in the app. If missing, direct the learner to the Track to accept the Publishing rules and Terms of Use. A Public Track shares Track Sources, member Topics and Lessons. Its public Lesson preview hides Quiz answers and Exercise solutions. A Fork starts private with working practice. Check the resulting visibility against the request.
