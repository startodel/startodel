---
id: build-track-technology
title: Design and verify a Track
order: 5
skillDescription: Compare technologies for a decision or learn one technology for a concrete task.
---

# Design and verify a Track

Start with `get_profile` and `list_topics` to personalize the plan and find reusable Topics. After research and agreement on the outline, use `create_track`, `upsert_topics`, `add_edges` and `attach_topics_to_track`.

1. **Personalize the outcome.** Combine the Onboarding Questionnaire with what you know of the learner’s work. Name the task they want to perform, the starting Topic and a familiar example. Confirm the choice if their background or goal is uncertain.
2. **Verify the sources.** Before designing the Track, use your own web and repository tools to verify the current release and read a primary source for each technology. Check official documentation against recent release notes, a maintainer article or the primary repository. Proceed only when each design decision has a supporting source URL and its version or date.
3. **Choose a mode from the goal.** Agree on an outline that ends in an observable decision or working result.
   - **Comparison mode** for “How do X and Y differ?” Build a mental model of each, including its core problem and architecture. Apply both to the same case. Derive tradeoffs and decision criteria, then vary a constraint. End with a scenario-based Quiz asking which fits the new case, followed by “Why?” in chat.
   - **Deep-dive mode** for “Teach me X.” Connect a mental model to the learner’s concrete goal. Start with a working setup or configuration, trace the internals that explain its behavior, then diagnose a production failure. End with an Exercise where the learner changes the setup and verifies the result independently.
4. **Build and read back.** Reuse matching Topic Slugs. Create the private Track with a one- or two-sentence description of what the learner will be able to do and what the Track covers. Mention a major version briefly if it defines the scope. Set `language` explicitly when you know the language of the content, using a lowercase tag such as `en`, `ru` or `pt-br`. Put versioned documentation and dated release notes in Track Sources. Save the missing Topics, connect prerequisites to dependents and attach members in teaching order. Check `get_track` with either the UUID `id` or the `slug` for the citations and `get_track_graph` for the agreed first Topic and path to the outcome. The Track is ready when both match the plan.
5. **Revise an existing Track.** For a changed content language, source or goal use `update_track`. For an incorrect prerequisite use `remove_edge`. For a Topic that no longer belongs use `detach_topic_from_track`, which preserves its Lessons. Verify the affected sources, edges or memberships on readback.
