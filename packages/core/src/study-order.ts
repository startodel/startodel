/** Topics in an order where every prerequisite comes first. Ties keep the given order. */
export function studyOrder<T extends { id: string }>(
  topics: T[],
  edges: { from: string; to: string }[],
) {
  const ids = new Set(topics.map((t) => t.id));
  const waiting = new Map(topics.map((t) => [t.id, 0]));
  for (const e of edges) {
    if (ids.has(e.from) && ids.has(e.to)) waiting.set(e.to, waiting.get(e.to)! + 1);
  }
  const done: T[] = [];
  const rest = [...topics];
  while (rest.length) {
    const at = rest.findIndex((t) => waiting.get(t.id) === 0);
    // A cycle cannot be stored, but never loop forever on bad input.
    const [next] = rest.splice(Math.max(at, 0), 1);
    done.push(next!);
    for (const e of edges) {
      if (e.from === next!.id && waiting.has(e.to)) waiting.set(e.to, waiting.get(e.to)! - 1);
    }
  }
  return done;
}
