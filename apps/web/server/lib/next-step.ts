import type { forUser } from "@startodel/db";

export async function nextStep(data: ReturnType<typeof forUser>) {
  const [profile, progress] = await Promise.all([data.getProfile(), data.getProgress()]);
  const { perTrack, openGrills, dueReviewsCount, masteryDistribution } = progress;
  const state = {
    onboarded: !!profile?.onboardedAt,
    tracks: perTrack.length,
    topics: masteryDistribution.reduce((sum, n) => sum + n, 0),
    openGrills: openGrills.length,
    dueReviews: dueReviewsCount,
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
      title: active.title,
      unanswered: active.questionCount - active.answered,
      waiting: active.answered - active.judged,
    };
  if (dueReviewsCount)
    return {
      state,
      id: "review-loop",
      why: `${dueReviewsCount} ${dueReviewsCount === 1 ? "topic is" : "topics are"} due for review.`,
      label: "Review due topics",
      href: "/reviews",
    };
  const suggestions = await data.suggestedTopics(15);
  if (suggestions.length)
    return {
      state,
      id: "agent-workflow",
      why: "Ready to study: " + suggestions.map((t) => t.slug).join(", "),
      suggestions,
    };
  return {
    state,
    id: "agent-workflow",
    why: "No Track Topics are ready. Check for missing prerequisites or plan the next Track.",
    prompt: "Call get_guide and help me plan my next Track.",
  };
}
