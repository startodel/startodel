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

export async function guide(data: UserData) {
  const { state, id, why } = await nextStep(data);
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
