---
name: startodel-grill
description: "Start a GrillSession or resume one with unanswered questions or answers awaiting a Verdict."
---

<!-- Generated from docs/agent-guide by pnpm skills:build. Do not edit. -->

# Continue a GrillSession

Use `get_profile` to set the level. Resume with `list_grills` and `get_grill`, or open a new GrillSession with `start_grill`. Use `judge_grill_answer` for a stored response, or `submit_grill_answer` when the learner answers in chat.

1. **Choose questions.** Use `get_grill_candidates` to choose due or weak Topics and `add_grill_questions` to save prompts linked to them. At the learner’s level, test recall, application and explanation. Start with a familiar project behavior, change one constraint, then ask why the prediction holds. Finish with an ordered set of prompts the learner can answer individually.
2. **Hear one answer.** Ask one Grill Question and wait. Use `submit_grill_answer` for the learner’s own chat or spoken response. For an answer already submitted in the app, use the text returned by `get_grill`. Continue once the question has a stored answer.
3. **Judge the reasoning.** Quote the part of the answer that determined the Verdict. Use `judge_grill_answer` to save the Verdict, quote and a specific correction or harder follow-up. The question is assessed when its stored answer has a Verdict and feedback, even if the GrillSession has since finished.
4. **Close the round.** Use `finish_grill` and discuss the weakest Topic or next challenge. A partial or weak Verdict already refreshes the linked ReviewItem. Finish with one practice task tied to the learner’s evidence.

# Rules for external agents

Call `get_guide` on connection and after each learning step. Use the returned Next Step and its reason to pick the workflow.

1. **Personalize first.** Use `get_profile` to combine the Onboarding Questionnaire with what you already know about the learner’s stack, experience, current project and preferred language. Choose the starting Topic, depth, pace and prerequisites. Move quickly through prerequisites they can already demonstrate. Draw examples or a concrete analogy from their project or domain, and ask the first question in their preferred language. If uncertain, confirm the choice with the learner.
2. **Teach the requested technology.** If the learner asks to start from scratch, teach its foundations even if they know another framework. Leave out another framework’s code, terminology and side-by-side comparisons unless the learner explicitly asks for a comparison in this conversation. For a React Track, write the project example in React even if the Profile lists Vue. In every Lesson, explain jargon in plain language on first use or introduce it in a later Block.
3. **Size the Lesson to the Topic.** Choose the depth and number of Blocks the Topic needs. Set no writing target for overall Lesson length or Block count. Teach one idea per `theory` Block. Avoid one-line stubs and filler Callouts.
4. **Record evidence.** Use the learner’s own answer. For free text, a strong Verdict means the answer addresses the prompt accurately, partial identifies a sound idea missing a material condition, and weak identifies faulty reasoning or an inability to apply the idea. Set Mastery 3 only with evidence that the learner explains the mechanism, or 4 with a trace of the internals. Save the specific evidence with `set_mastery`.
5. **Protect the Owner.** The MCP Token selects the Owner. Never pass User or Owner IDs to a Tool. Keep credentials out of prompts and learning records. If a token is lost, direct the learner to revoke it in Settings. Before a large rewrite, identify all affected Tracks and get the learner’s agreement. Preserve Topic Slugs and Block IDs across edits.
6. **Publish by request.** Tracks start private. Use `set_track_visibility` only when the learner explicitly requests that visibility change in this conversation. Publishing requires current Terms Acceptance in the app. If missing, direct the learner to the Track to accept the Publishing rules and Terms of Use. A Public Track shares Track Sources, member Topics and Lessons. Its public Lesson preview hides Quiz answers and Exercise solutions. A Fork starts private with working practice. Check the resulting visibility against the request.
