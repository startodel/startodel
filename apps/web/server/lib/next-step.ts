import type { forUser } from "@startodel/db";

export async function nextStep(
  data: ReturnType<typeof forUser>,
  profileRead = data.getProfile(),
  trackId?: string,
) {
  const [profile, progress] = await Promise.all([profileRead, data.getNextStepState(trackId)]);
  const { trackCount, topicCount, due, openGrills } = progress;
  const state = {
    onboarded: !!profile?.onboardedAt,
    tracks: trackCount,
    topics: topicCount,
    openGrills: openGrills.length,
    dueReviews: due?.total ?? 0,
  };
  if (!state.onboarded)
    return {
      state,
      id: "first-steps",
      why: "The Onboarding Questionnaire is unfinished.",
      href: "/onboarding",
      label: "Complete onboarding",
    };
  if (!state.tracks)
    return {
      state,
      id: "build-track-technology",
      why: "You have no Tracks yet.",
      prompt:
        "Call get_guide, then build me a Track for " +
        (profile?.goals.join(", ") || profile?.stack.join(", ") || "my learning goals") +
        ".",
    };
  const active = openGrills.find((g) => !g.questionCount || g.judged < g.questionCount);
  if (active)
    return {
      state,
      id: "grill-session",
      why: `Continue “${active.title}” (${active.id}): ${active.questionCount - active.answered} unanswered, ${active.answered - active.judged} answered and awaiting a Verdict.`,
      label: "Continue grill session",
      href: "/grills/" + active.id,
      sessionId: active.id,
      title: active.title,
      unanswered: active.questionCount - active.answered,
      waiting: active.answered - active.judged,
    };
  if (due)
    return {
      state,
      id: "review-loop",
      topicId: due.topicId,
      why: `${due.total} ${due.total === 1 ? "topic is" : "topics are"} due for review.`,
      label: "Review due topics",
      href: "/reviews",
    };
  const suggestions = await data.suggestedTopics(15, trackId);
  if (suggestions.length)
    return {
      state,
      id: "agent-workflow",
      why: "Ready to study: " + suggestions.map((t) => `${t.title} (${t.slug})`).join(", "),
      suggestions,
    };
  return {
    state,
    id: "agent-workflow",
    why: trackId
      ? "No Topics with Lessons are ready to study in this Track."
      : "No Track Topics are ready. Check for missing prerequisites or plan the next Track.",
    ...(trackId ? {} : { prompt: "Call get_guide and help me plan my next Track." }),
  };
}
