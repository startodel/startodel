import { nextStep } from "../lib/next-step";
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

function russianReason(step: Awaited<ReturnType<typeof nextStep>>) {
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
      return "Пока нет тем, готовых к изучению. Проверьте предварительные требования или спланируйте следующий трек.";
  }
}

export async function guide(data: UserData) {
  const profileRead = data.getProfile();
  const [step, profile] = await Promise.all([nextStep(data, profileRead), profileRead]);
  const { state, id } = step;
  const why = profile?.preferredLanguage === "ru" ? russianReason(step) : step.why;
  const current = section(id);
  const related: Record<string, string[]> = {
    "first-steps": ["platform"],
    "build-track-technology": ["build-track-from-repo", "lessons-and-blocks"],
    "agent-workflow": ["lessons-and-blocks"],
  };
  const tools = [...introduction(current.body).matchAll(/`([a-z]+_[a-z_]+)`/g)].map((m) => m[1]);
  return {
    state,
    nextSteps: [{ id, title: current.title, why, tools }],
    guideSections: [current, ...(related[id] ?? []).map(section), section("rules")],
  };
}
