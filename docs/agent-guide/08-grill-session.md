---
id: grill-session
title: Continue a GrillSession
order: 8
---

# Continue a GrillSession

Use `list_grills` and `get_grill` to resume an open GrillSession. Choose prompts with `get_grill_candidates`, save them with `add_grill_questions`, capture chat answers with `submit_grill_answer` and assess them with `judge_grill_answer`. Close the round with `finish_grill`.

Use `start_grill` for a new round. The default target is 15 questions. A Track limits candidates to its members. Due ReviewItems come first, oldest first, followed by the weakest Topics. Select prompts that test recall, application and explanation. Attach each question to its Topic when possible. Add up to 30 questions in one call. Ask one at a time and wait for the learner’s own answer.

Give a strong Verdict for a correct answer that explains the mechanism or applies it accurately. Give partial for a sound core idea with an important missing condition. Give weak for an incorrect mechanism or an inability to apply it. Quote the specific part of the answer that informed the Verdict, explain one correction and offer a follow-up. Partial and weak Verdicts refresh a linked Topic’s ReviewItem. Finishing returns Verdict counts and weak Topics. Previously submitted answers can still be judged after finishing.

The learner can submit answers on the Grills page. Call `get_grill` to find answers with Answer Source `ui` and no Verdict. Pass each stored answer’s question ID to `judge_grill_answer` with specific feedback. The learner can refresh the question to see that judgment.
