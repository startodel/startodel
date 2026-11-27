export function trackLevels(
  topics: { level: number; tracks: { id: string; ordinal: number }[] }[],
) {
  const levels = new Map<string, number[]>();
  for (const topic of topics) {
    for (const { id, ordinal } of topic.tracks) {
      const track = levels.get(id) ?? [];
      track[ordinal - 1] = topic.level;
      levels.set(id, track);
    }
  }
  return levels;
}
