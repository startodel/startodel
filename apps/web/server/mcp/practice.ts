import { QuizAnswers, DEFAULT_GRILL_SIZE, MasteryLevel, Verdict } from "@startodel/core";
import { z } from "zod";
import {
  entityUrl,
  empty,
  id,
  lessonLookup,
  limit,
  resolveTopic,
  title,
  topicRef,
  type Register,
  type UserData,
} from "./register";

export function registerPractice(register: Register, data: UserData, origin: string) {
  const questionId = z.strictObject({ questionId: id });
  const sessionId = z.strictObject({ sessionId: id });
  register(
    "get_progress",
    "Plan study using Mastery counts by level, completed (level 2+ with every Lesson read) and total Topics per Track, due review count, ten latest Quiz Attempts and open GrillSessions.",
    empty,
    () => data.getProgress(),
  );
  register(
    "set_mastery",
    "Record an assessed level (0–4) and optional evidence for one Topic. Returns the Mastery record.",
    z.strictObject({ topic: topicRef, level: MasteryLevel, evidence: z.string().optional() }),
    async ({ topic, level, evidence }) => {
      const parent = await resolveTopic(data, topic);
      if (parent) return data.setMastery(parent.id, level, evidence);
    },
  );
  register(
    "record_quiz_result",
    "Identify the Lesson by lessonId or id and submit one zero-based option index per Quiz question (1–10). Returns the stored scored Quiz Attempt with MCP Answer Source and the resulting Topic Mastery.",
    lessonLookup.safeExtend({
      blockId: z.string().min(1).max(64),
      answers: QuizAnswers,
    }),
    ({ lessonId, id, blockId, answers }) =>
      data.recordQuizAttempt(lessonId ?? id!, blockId, answers, "mcp"),
  );
  register(
    "mark_lesson_read",
    "Mark a Lesson by lessonId or id as read when the learner confirms. Returns Lesson Progress with the read time and resulting Topic Mastery.",
    lessonLookup,
    ({ lessonId, id }) => data.markLessonRead(lessonId ?? id!),
  );
  register(
    "list_due_reviews",
    "List ReviewItems due now, oldest first. Defaults to 15 and accepts up to 100.",
    z.strictObject({ limit: limit.default(15) }),
    ({ limit }) => data.listDueReviews(new Date(), limit),
  );
  register(
    "record_review_result",
    "After reviewing one Topic, record the Verdict and optional reason. Returns the ReviewItem with resulting box and next due time.",
    z.strictObject({ topic: topicRef, verdict: Verdict, reason: z.string().optional() }),
    async ({ topic, verdict, reason }) => {
      const parent = await resolveTopic(data, topic);
      if (parent) return data.recordReviewResult(parent.id, verdict, reason);
    },
  );
  function grillLink<T extends { id: string }>(session: T) {
    return { ...session, url: entityUrl(origin, "grills", session.id) };
  }
  const trackId = id.optional();
  register(
    "start_grill",
    "Open a GrillSession, optionally for one Track. Returns the session and ranked candidate Topics. Target defaults to 15 (up to 100).",
    z.strictObject({ trackId, title, targetSize: limit.default(DEFAULT_GRILL_SIZE) }),
    async (input) => {
      const grill = await data.startGrillWithCandidates(input);
      if (grill) return { ...grill, session: grillLink(grill.session) };
    },
  );
  register(
    "get_grill_candidates",
    "Choose prompts from due ReviewItems first and then the weakest Topics. Optionally restrict to one Track. Returns up to 100 candidates, default 15.",
    z.strictObject({ trackId, limit: limit.default(DEFAULT_GRILL_SIZE) }),
    (input) => data.grillCandidates(input),
  );
  register(
    "add_grill_questions",
    "Append 1–30 ordered prompts to an open GrillSession, optionally linked to Topics by slug or ID. Returns the saved Grill Questions.",
    sessionId.extend({
      questions: z
        .array(z.strictObject({ prompt: title, topic: topicRef.optional() }))
        .min(1)
        .max(30),
    }),
    async ({ sessionId, questions }) => {
      const rows = [];
      for (const { prompt, topic } of questions) {
        const parent = topic && (await resolveTopic(data, topic));
        if (topic && !parent) return undefined;
        rows.push({ prompt, topicId: parent ? parent.id : null });
      }
      const saved = await data.addGrillQuestions(sessionId, rows);
      return saved?.length ? saved : undefined;
    },
  );
  register(
    "get_grill",
    "Resume or inspect a GrillSession by ID. Returns its ordered questions, answers, sources, Verdicts and feedback.",
    sessionId,
    async ({ sessionId }) => {
      const session = await data.getGrill(sessionId);
      if (session) return grillLink(session);
    },
  );
  register(
    "list_grills",
    "List your GrillSessions newest first, optionally filtered by open or finished status.",
    z.strictObject({ status: z.enum(["open", "finished"]).optional() }),
    async ({ status }) => (await data.listGrills(status)).map(grillLink),
  );
  register(
    "submit_grill_answer",
    "Save the learner's voice or chat answer to an open Grill Question with MCP Answer Source and the resulting Topic Mastery. Returns the question ready for judgment.",
    questionId.extend({ answer: title }),
    ({ questionId, answer }) => data.answerGrillQuestion(questionId, answer, "mcp"),
  );
  register(
    "judge_grill_answer",
    "Assess a submitted answer with a strong, partial or weak Verdict and optional feedback. Returns the judged question. Partial and weak refresh its Topic's ReviewItem.",
    questionId.extend({ verdict: Verdict, feedback: z.string().optional() }),
    ({ questionId, verdict, feedback }) => data.judgeGrillQuestion(questionId, verdict, feedback),
  );
  register(
    "finish_grill",
    "Close question and answer entry. Returns the finished session, counts by Verdict and distinct Topic IDs with weak answers.",
    sessionId,
    ({ sessionId }) => data.finishGrillWithSummary(sessionId),
  );
}
