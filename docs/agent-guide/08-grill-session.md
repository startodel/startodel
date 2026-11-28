---
id: grill-session
title: Continue a GrillSession
order: 8
skillDescription: Start a GrillSession or resume one with unanswered questions or answers awaiting a Verdict.
---

# Continue a GrillSession

Use `get_profile` to set the level. Resume with `list_grills` and `get_grill`, or open a new GrillSession with `start_grill`. Use `judge_grill_answer` for a stored response, or `submit_grill_answer` when the learner answers in chat.

Give the GrillSession a subject-only title, such as “JSX, компоненты и состояние в React 19”. Omit prefixes such as “Разбор:”, “Grill:”, “Опрос:” and “Quiz:”. To rename an open or finished session, call `update_grill` with its `sessionId` and the new `title`. Both tools save the supplied title and return an advisory `warnings` array when they detect a prefix. The session keeps its URL after a rename.

1. **Choose questions.** Use `get_grill_candidates` to choose due or weak Topics and `add_grill_questions` to save prompts linked to them. At the learner’s level, test recall, application and explanation. Start with a familiar project behavior, change one constraint, then ask why the prediction holds. Finish with an ordered set of prompts the learner can answer individually.
2. **Hear one answer.** Ask one Grill Question and wait. Use `submit_grill_answer` for the learner’s own chat or spoken response. For an answer already submitted in the app, use the text returned by `get_grill`. Continue once the question has a stored answer.
3. **Judge the reasoning.** Quote the part of the answer that determined the Verdict. Use `judge_grill_answer` to save the Verdict, quote and a specific correction or harder follow-up. The question is assessed when its stored answer has a Verdict and feedback, even if the GrillSession has since finished.
4. **Close the round.** Use `finish_grill` and discuss the weakest Topic or next challenge. A partial or weak Verdict already refreshes the linked ReviewItem. Finish with one practice task tied to the learner’s evidence.
