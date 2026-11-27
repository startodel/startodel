import { COMPLETE_LEVEL, isTopicComplete } from "@startodel/core";
import { Graph, layout } from "@dagrejs/dagre";
export { COMPLETE_LEVEL };

export interface BoardTopic {
  id: string;
  /** A short designator such as T04. */
  tag: string;
  title: string;
  level: number;
  hasUnreadLessons?: boolean;
}
export interface BoardEdge {
  /** The prerequisite Topic. */
  from: string;
  /** The Topic it unlocks. */
  to: string;
}
/** A complete Topic has reached Mastery 2 and has no unread Lessons. */
export type TopicState = "complete" | "ready" | "blocked";

export function topicStates(topics: BoardTopic[], edges: BoardEdge[]) {
  const level = new Map(topics.map((t) => [t.id, t.level]));
  const blocked = new Set(
    edges.filter((e) => (level.get(e.from) ?? 0) < COMPLETE_LEVEL).map((e) => e.to),
  );
  return new Map<string, TopicState>(
    topics.map((t) => [
      t.id,
      isTopicComplete(t.level, !!t.hasUnreadLessons)
        ? "complete"
        : blocked.has(t.id)
          ? "blocked"
          : "ready",
    ]),
  );
}

interface Point {
  x: number;
  y: number;
}

/**
 * One hop of a trace, drawn left to right the way a board routes copper: a horizontal run,
 * a 45-degree corner, a vertical run at `trunk`, another corner and a horizontal run.
 */
export function traceHop(from: Point, to: Point, trunk: number, chamfer = 8) {
  const rise = to.y - from.y;
  if (Math.abs(rise) < 0.5) return `H${round(to.x)}`;
  const cut = Math.min(
    chamfer,
    Math.abs(rise) / 2,
    Math.abs(trunk - from.x),
    Math.abs(to.x - trunk),
  );
  const sign = Math.sign(rise);
  return [
    `H${round(trunk - cut)}`,
    `L${round(trunk)} ${round(from.y + sign * cut)}`,
    `V${round(to.y - sign * cut)}`,
    `L${round(trunk + cut)} ${round(to.y)}`,
    `H${round(to.x)}`,
  ].join("");
}

const round = (value: number) => Math.round(value * 10) / 10;

export interface BoardLayout {
  width: number;
  height: number;
  nodes: { id: string; x: number; y: number }[];
  traces: { id: string; from: string; to: string; d: string; start: Point; end: Point }[];
}

export interface BoardOptions {
  nodeWidth?: number;
  nodeHeight?: number;
  /** The horizontal gap between ranks. Traces turn inside it. */
  rankGap?: number;
  nodeGap?: number;
  padding?: number;
}

/** Lays Topics out left to right by prerequisite depth and routes a trace for every TopicEdge. */
export function layoutBoard(
  topics: BoardTopic[],
  edges: BoardEdge[],
  { nodeWidth = 176, nodeHeight = 64, rankGap = 64, nodeGap = 20, padding = 24 }: BoardOptions = {},
): BoardLayout {
  const ids = new Set(topics.map((t) => t.id));
  const used = edges.filter((e) => ids.has(e.from) && ids.has(e.to) && e.from !== e.to);
  const graph = new Graph()
    .setGraph({
      rankdir: "LR",
      nodesep: nodeGap,
      ranksep: rankGap,
      marginx: padding,
      marginy: padding,
    })
    .setDefaultEdgeLabel(() => ({}));
  for (const t of topics) graph.setNode(t.id, { width: nodeWidth, height: nodeHeight });
  for (const e of used) graph.setEdge(e.from, e.to);
  layout(graph);

  const centre = new Map(topics.map((t) => [t.id, graph.node(t.id) as Point]));
  const ranks = [...new Set([...centre.values()].map((p) => round(p.x)))].sort((a, b) => a - b);
  // Reassign the occupied slots in each column, leaving long-edge passageways clear.
  for (const x of ranks) {
    const column = [...centre.values()].filter((point) => round(point.x) === x);
    const slots = column.map((point) => point.y).sort((a, b) => a - b);
    column.forEach((point, i) => (point.y = slots[i]!));
  }
  const rankOf = (x: number) => ranks.findIndex((rank) => Math.abs(rank - x) < 1);

  // Each trace is a list of waypoints: the source, one point per rank it passes, the target.
  const routes = used.map((e) => {
    const [a, b] = [centre.get(e.from)!, centre.get(e.to)!];
    const start = { x: a.x + nodeWidth / 2, y: a.y };
    const end = { x: b.x - nodeWidth / 2, y: b.y };
    const passes = ((graph.edge(e.from, e.to).points ?? []) as Point[]).filter((p) => {
      const rank = rankOf(p.x);
      return rank > rankOf(a.x) && rank < rankOf(b.x);
    });
    return { edge: e, points: [start, ...passes, end], firstRank: rankOf(a.x) };
  });

  // Hops that leave the same point share a trunk. Other hops in a gap get their own lane.
  const lanes = new Map<number, number[]>();
  for (const route of routes) {
    route.points.slice(0, -1).forEach((p, hop) => {
      const gap = route.firstRank + hop;
      const taken = lanes.get(gap) ?? [];
      if (!taken.some((y) => Math.abs(y - p.y) < 0.5)) taken.push(p.y);
      lanes.set(gap, taken);
    });
  }
  for (const taken of lanes.values()) taken.sort((a, b) => a - b);

  const traces = routes.map(({ edge, points, firstRank }) => {
    let d = `M${round(points[0]!.x)} ${round(points[0]!.y)}`;
    points.slice(0, -1).forEach((p, hop) => {
      const gap = firstRank + hop;
      const taken = lanes.get(gap)!;
      const lane = taken.findIndex((y) => Math.abs(y - p.y) < 0.5);
      const left = ranks[gap]! + nodeWidth / 2;
      const trunk = left + (rankGap * (lane + 1)) / (taken.length + 1);
      d += traceHop(p, points[hop + 1]!, trunk);
    });
    return {
      id: `${edge.from}:${edge.to}`,
      from: edge.from,
      to: edge.to,
      d,
      start: points[0]!,
      end: points.at(-1)!,
    };
  });

  const size = graph.graph();
  return {
    width: Math.ceil(size.width ?? 0),
    height: Math.ceil(size.height ?? 0),
    nodes: topics.map((t) => {
      const p = centre.get(t.id)!;
      return { id: t.id, x: round(p.x - nodeWidth / 2), y: round(p.y - nodeHeight / 2) };
    }),
    traces,
  };
}

/** The two part sizes. The compact one is for small decorative boards. */
export const BOARD_SIZES = {
  regular: { nodeWidth: 184, nodeHeight: 66, rankGap: 64, nodeGap: 18, padding: 28 },
  compact: { nodeWidth: 148, nodeHeight: 54, rankGap: 48, nodeGap: 14, padding: 20 },
} satisfies Record<string, Required<BoardOptions>>;

/** Everything a renderer needs: placed parts with their state, and routed traces. */
export function boardModel(
  topics: BoardTopic[],
  edges: BoardEdge[],
  options: {
    compact?: boolean;
    selected?: string;
    /** Draw the graph alone, with no Mastery and no locks. A Public Track has neither. */
    outline?: boolean;
  } = {},
) {
  const size = BOARD_SIZES[options.compact ? "compact" : "regular"];
  const board = layoutBoard(topics, edges, size);
  const states = topicStates(topics, edges);
  const byId = new Map(topics.map((t) => [t.id, t]));
  const near = new Set<string>();
  if (options.selected) {
    near.add(options.selected);
    for (const e of edges) {
      if (e.from === options.selected) near.add(e.to);
      if (e.to === options.selected) near.add(e.from);
    }
  }
  return {
    size,
    width: board.width,
    height: board.height,
    parts: board.nodes.map((n) => ({
      ...n,
      topic: byId.get(n.id)!,
      state: options.outline ? ("outline" as const) : states.get(n.id)!,
      selected: options.selected === n.id,
      faded: near.size > 0 && !near.has(n.id),
    })),
    traces: board.traces.map((t) => {
      const lit = options.selected === t.from || options.selected === t.to;
      return {
        ...t,
        live: !options.outline && byId.get(t.from)!.level >= COMPLETE_LEVEL,
        lit,
        faded: near.size > 0 && !lit,
      };
    }),
  };
}
export type BoardModel = ReturnType<typeof boardModel>;
