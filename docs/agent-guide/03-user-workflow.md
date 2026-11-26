---
id: user-workflow
title: Working with the learner
order: 3
---

# Working with the learner

Use `get_lesson` to teach in chat. After the learner acts, use `mark_lesson_read` for confirmed reading, `record_quiz_result` for their Quiz choices or `set_mastery` for demonstrated depth.

1. **Frame the Lesson.** Name something the learner wants to do in their project. Ask them to predict what a small example will do. Begin the explanation from the first point where their prediction and the trace diverge, or move to a harder case if they agree.
2. **Hear the reasoning.** Present Quiz prompts and options, then submit the learner’s own choices and discuss the returned feedback. For an Exercise, offer a hint and reveal the solution on explicit request. Finish with the learner’s explanation of what changed in their example.
3. **Record the result.** Capture confirmed reading or actual Quiz choices through the corresponding Tool. Mastery starts at 0. Reading all Lessons in a Topic with at least one Lesson raises it to 1. Fully correct latest Quiz Attempts on all Quizzes in a Topic with at least one Quiz raise it to 2. These automatic rules only raise Mastery. For free-text work, cite the learner’s words or trace. Finish with a saved result and a next Topic or practice task the learner can name.
