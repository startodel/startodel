import { studyOrder } from "@startodel/core";

export function trackLevels(
  topics: { id: string; level: number; tracks: { id: string; ordinal: number }[] }[],
  edges: { from: string; to: string }[],
) {
  const members = new Map<string, { id: string; level: number }[]>();
  for (const topic of topics) {
    for (const { id, ordinal } of topic.tracks) {
      const track = members.get(id) ?? [];
      track[ordinal - 1] = topic;
      members.set(id, track);
    }
  }
  return new Map(
    [...members].map(
      ([id, track]) => [id, studyOrder(track, edges).map((topic) => topic.level)] as const,
    ),
  );
}
