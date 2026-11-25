import sections from "./guide.generated.json";
import type { UserData } from "./register";
export { sections };

function section(id: string) {
  const match = sections.find((s) => s.id === id);
  if (!match) throw new Error(`Missing guide section ${id}`);
  return match;
}
const introduction = (body: string) => body.split("\n\n")[1]!;
export const instructions = introduction(section("platform").body);

export async function guide(data: UserData) {
  const [profile, progress] = await Promise.all([data.getProfile(), data.getProgress()]);
  const { perTrack, openGrills, dueReviewsCount, masteryDistribution } = progress;
  const onboarded = !!profile?.onboardedAt;
  const state = {
    onboarded,
    tracks: perTrack.length,
    topics: masteryDistribution.reduce((sum, n) => sum + n, 0),
    openGrills: openGrills.length,
    dueReviews: dueReviewsCount,
  };
  const active = openGrills.find((g) => g.questionCount === 0 || g.judged < g.questionCount);
  function next(id: string, why: string, related: string[] = []) {
    const current = section(id);
    const tools = [...introduction(current.body).matchAll(/`([a-z]+_[a-z_]+)`/g)].map((m) => m[1]);
    return {
      state,
      nextSteps: [{ id, title: current.title, why, tools }],
      guideSections: [current, ...related.map(section)],
    };
  }
  if (!onboarded)
    return next("first-steps", "The Onboarding Questionnaire is unfinished.", ["platform"]);
  if (!state.tracks)
    return next("build-track-technology", "You have no Tracks yet.", ["build-track-from-repo"]);
  if (active)
    return next(
      "grill-session",
      `Continue “${active.title}” (${active.id}): ${active.questionCount - active.answered} unanswered, ${active.answered - active.judged} answered and awaiting a Verdict.`,
    );
  if (dueReviewsCount) return next("review-loop", `${dueReviewsCount} ReviewItems are due.`);
  const suggestions = await data.suggestedTopics(15);
  return next(
    "agent-workflow",
    suggestions.length
      ? "Ready to study: " + suggestions.map((t) => t.slug).join(", ")
      : "No Track Topics are ready. Check for missing prerequisites or plan the next Track.",
    ["lessons-and-blocks"],
  );
}
