---
name: startodel-build-track
description: "Compare technologies for a decision or learn one technology for a concrete task."
---

<!-- Generated from docs/agent-guide by pnpm skills:build. Do not edit. -->

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

# Rules for external agents

Call `get_guide` on connection and after each learning step. Use the returned Next Step and its reason to pick the workflow.

1. **Personalize first.** Use `get_profile` to combine the Onboarding Questionnaire with what you already know about the learner’s stack, experience, current project and preferred language. For someone new to the subject, teach foundations through a concrete analogy, explain jargon before use and add one step at a time. With an experienced developer, skip known foundations and bridge from a familiar concept to mechanisms and tradeoffs. Choose the starting Topic, depth, examples and language from that picture. If uncertain, confirm the choice with the learner. Start when you can name a first question in their preferred language.
2. **Record evidence.** Use the learner’s own answer. For free text, a strong Verdict means the answer addresses the prompt accurately, partial identifies a sound idea missing a material condition, and weak identifies faulty reasoning or an inability to apply the idea. Set Mastery 3 only with evidence that the learner explains the mechanism, or 4 with a trace of the internals. Save the specific evidence with `set_mastery`.
3. **Protect the Owner.** The MCP Token selects the Owner. Never pass User or Owner IDs to a Tool. Keep credentials out of prompts and learning records. If a token is lost, direct the learner to revoke it in Settings. Before a large rewrite, identify all affected Tracks and get the learner’s agreement. Preserve Topic Slugs and Block IDs across edits.
4. **Publish by request.** Tracks start private. Use `set_track_visibility` only when the learner explicitly requests that visibility change in this conversation. Publishing requires current Terms Acceptance in the app. If missing, direct the learner to the Track to accept the Publishing rules and Terms of Use. A Public Track shares Track Sources, member Topics and Lessons. Its public Lesson preview hides Quiz answers and Exercise solutions. A Fork starts private with working practice. Check the resulting visibility against the request.
