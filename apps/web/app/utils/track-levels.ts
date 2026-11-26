export function trackLevels(topics: { level: number; tracks: { id: string }[] }[]) {
  const levels = new Map<string, number[]>();
  for (const topic of topics) {
    for (const { id } of topic.tracks) {
      const track = levels.get(id) ?? [];
      track.push(topic.level);
      levels.set(id, track);
    }
  }
  return levels;
}
