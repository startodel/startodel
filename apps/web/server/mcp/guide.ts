import { nextStep } from "../lib/next-step";
import sections from "./guide.generated.json";
import { resolveTrack, type UserData } from "./register";
export { sections };

function section(id: string) {
  const match = sections.find((s) => s.id === id);
  if (!match) throw new Error(`Missing guide section ${id}`);
  return match;
}
const introduction = (body: string) => body.split("\n\n")[1]!;
export const instructions = introduction(section("platform").body);

function russianReason(step: Awaited<ReturnType<typeof nextStep>>, scoped: boolean) {
  if (step.suggestions)
    return "Можно изучать: " + step.suggestions.map((t) => `${t.title} (${t.slug})`).join(", ");
  switch (step.id) {
    case "first-steps":
      return "Анкета при настройке профиля ещё не заполнена.";
    case "build-track-technology":
      return "У вас пока нет треков.";
    case "review-loop":
      return `Пора повторить темы: ${step.state.dueReviews}.`;
    case "grill-session":
      return `Продолжите «${step.title}». Без ответа: ${step.unanswered}. Ожидают оценки: ${step.waiting}.`;
    default:
      if (scoped) return "В этом треке пока нет тем с уроками, готовых к изучению.";
      return "Пока нет тем, готовых к изучению. Проверьте предварительные требования или спланируйте следующий трек.";
  }
}

export async function guide(data: UserData, track?: string) {
  const selected = track ? await resolveTrack(track, data.getTrack) : undefined;
  if (track && !selected) return;
  const profileRead = data.getProfile();
  const [step, profile, nextTopics] = await Promise.all([
    nextStep(data, profileRead, selected?.id),
    profileRead,
    selected && data.nextTopicsToAuthor(selected.id),
  ]);
  const { state, id } = step;
  const why = profile?.preferredLanguage === "ru" ? russianReason(step, !!selected) : step.why;
  const current = section(id);
  const related: Record<string, string[]> = {
    "first-steps": ["platform"],
    "build-track-technology": ["build-track-from-repo", "lessons-and-blocks"],
    "agent-workflow": ["lessons-and-blocks"],
  };
  const relatedSections = new Set(related[id]);
  if (selected && (!state.topics || nextTopics?.length))
    relatedSections.add("build-track-technology");
  relatedSections.delete(id);
  const tools = [...introduction(current.body).matchAll(/`([a-z]+_[a-z_]+)`/g)].map((m) => m[1]);
  return {
    state,
    nextSteps: [
      {
        id,
        title: current.title,
        why,
        tools,
        ...((selected || step.lessonId) && step.topicId && { topicId: step.topicId }),
        ...(step.lessonId && { lessonId: step.lessonId }),
        ...(selected && step.sessionId && { sessionId: step.sessionId }),
      },
    ],
    ...(selected && { authoring: { track: { id: selected.id, slug: selected.slug }, nextTopics } }),
    guideSections: [current, ...Array.from(relatedSections, section), section("rules")],
  };
}
