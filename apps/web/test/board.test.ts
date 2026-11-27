import { studyOrder } from "@startodel/core";
import { expect, test } from "vite-plus/test";
import {
  BOARD_SIZES,
  type BoardEdge,
  type BoardTopic,
  boardModel,
  layoutBoard,
  topicStates,
  traceHop,
} from "../app/components/ui/board";

const topic = (id: string, level: number): BoardTopic => ({
  id,
  tag: id.toUpperCase(),
  title: id,
  level,
});

// a → b → d, a → c → d, d → e. a is complete, b is complete, c is not.
const topics = [topic("a", 3), topic("b", 2), topic("c", 1), topic("d", 0), topic("e", 0)];
const edges: BoardEdge[] = [
  { from: "a", to: "b" },
  { from: "a", to: "c" },
  { from: "b", to: "d" },
  { from: "c", to: "d" },
  { from: "d", to: "e" },
];

test("a Topic is complete at Mastery 2, blocked by any prerequisite below it, ready otherwise", () => {
  expect(Object.fromEntries(topicStates(topics, edges))).toEqual({
    a: "complete",
    b: "complete",
    c: "ready",
    d: "blocked",
    e: "blocked",
  });
});

test("a complete Topic stays complete when a prerequisite falls behind", () => {
  const states = topicStates([topic("a", 0), topic("b", 4)], [{ from: "a", to: "b" }]);
  expect(states.get("b")).toBe("complete");
});

test("study order puts every prerequisite first and keeps the given order on ties", () => {
  const shuffled = ["e", "d", "c", "b", "a"].map((id) => topics.find((t) => t.id === id)!);
  const order = studyOrder(shuffled, edges).map((t) => t.id);
  expect(order).toEqual(["a", "c", "b", "d", "e"]);
  for (const e of edges) expect(order.indexOf(e.from)).toBeLessThan(order.indexOf(e.to));
});

test("study order ignores edges to Topics outside the list and ends on a cycle", () => {
  const pair = [topic("a", 0), topic("b", 0)];
  expect(studyOrder(pair, [{ from: "zz", to: "a" }]).map((t) => t.id)).toEqual(["a", "b"]);
  const cycle = [
    { from: "a", to: "b" },
    { from: "b", to: "a" },
  ];
  expect(studyOrder(pair, cycle)).toHaveLength(2);
});

test("a trace hop is straight on one level and turns with two 45-degree corners otherwise", () => {
  expect(traceHop({ x: 0, y: 10 }, { x: 100, y: 10 }, 50)).toBe("H100");
  expect(traceHop({ x: 0, y: 0 }, { x: 100, y: 40 }, 50)).toBe("H42L50 8V32L58 40H100");
  expect(traceHop({ x: 0, y: 40 }, { x: 100, y: 0 }, 50)).toBe("H42L50 32V8L58 0H100");
});

test("a short rise shrinks the corners instead of overshooting", () => {
  expect(traceHop({ x: 0, y: 0 }, { x: 100, y: 6 }, 50)).toBe("H47L50 3V3L53 6H100");
});

test("the layout ranks Topics left to right and keeps every part inside the board", () => {
  const size = BOARD_SIZES.regular;
  const board = layoutBoard(topics, edges, size);
  const at = new Map(board.nodes.map((n) => [n.id, n]));
  for (const e of edges) expect(at.get(e.from)!.x).toBeLessThan(at.get(e.to)!.x);
  expect(at.get("b")!.x).toBe(at.get("c")!.x);
  for (const n of board.nodes) {
    expect(n.x).toBeGreaterThanOrEqual(0);
    expect(n.y).toBeGreaterThanOrEqual(0);
    expect(n.x + size.nodeWidth).toBeLessThanOrEqual(board.width);
    expect(n.y + size.nodeHeight).toBeLessThanOrEqual(board.height);
  }
  for (let i = 0; i < board.nodes.length; i++) {
    for (const other of board.nodes.slice(i + 1)) {
      const n = board.nodes[i]!;
      const apart =
        Math.abs(n.x - other.x) >= size.nodeWidth || Math.abs(n.y - other.y) >= size.nodeHeight;
      expect(apart).toBe(true);
    }
  }
});

test("every trace leaves the right edge of its source and enters the left edge of its target", () => {
  const size = BOARD_SIZES.regular;
  const board = layoutBoard(topics, edges, size);
  const at = new Map(board.nodes.map((n) => [n.id, n]));
  expect(board.traces.map((t) => t.id)).toEqual(edges.map((e) => `${e.from}:${e.to}`));
  for (const t of board.traces) {
    const [from, to] = [at.get(t.from)!, at.get(t.to)!];
    expect(t.start.x).toBeCloseTo(from.x + size.nodeWidth, 0);
    expect(t.start.y).toBeCloseTo(from.y + size.nodeHeight / 2, 0);
    expect(t.end.x).toBeCloseTo(to.x, 0);
    expect(t.end.y).toBeCloseTo(to.y + size.nodeHeight / 2, 0);
    expect(t.d).toMatch(/^M[\d.]+ [\d.]+(?:[HVL][\d. ]+)+$/);
    expect(t.d.endsWith(`H${Math.round(t.end.x * 10) / 10}`)).toBe(true);
  }
});

test("traces that leave one part share a trunk", () => {
  const board = layoutBoard(topics, edges, BOARD_SIZES.regular);
  const trunk = (id: string) => board.traces.find((t) => t.id === id)!.d.match(/L([\d.]+) /)![1];
  expect(trunk("a:b")).toBe(trunk("a:c"));
});

test("the layout drops self-edges and edges to Topics that are not on the board", () => {
  const board = layoutBoard(
    [topic("a", 0), topic("b", 0)],
    [
      { from: "a", to: "a" },
      { from: "a", to: "gone" },
      { from: "a", to: "b" },
    ],
  );
  expect(board.traces.map((t) => t.id)).toEqual(["a:b"]);
});

test("the model marks a trace live when its prerequisite is complete", () => {
  const board = boardModel(topics, edges);
  const live = Object.fromEntries(board.traces.map((t) => [t.id, t.live]));
  expect(live).toEqual({ "a:b": true, "a:c": true, "b:d": true, "c:d": false, "d:e": false });
  expect(board.parts.every((p) => !p.faded && !p.selected)).toBe(true);
});

test("selecting a Topic lights its traces and fades everything that is not a neighbour", () => {
  const board = boardModel(topics, edges, { selected: "d" });
  const part = Object.fromEntries(board.parts.map((p) => [p.id, p]));
  expect(part.d!.selected).toBe(true);
  expect(board.parts.filter((p) => p.faded).map((p) => p.id)).toEqual(["a"]);
  expect(board.traces.filter((t) => t.lit).map((t) => t.id)).toEqual(["b:d", "c:d", "d:e"]);
  expect(board.traces.filter((t) => t.faded).map((t) => t.id)).toEqual(["a:b", "a:c"]);
});

test("an outline board carries no Mastery state: a Public Track has none", () => {
  const board = boardModel(topics, edges, { outline: true });
  expect(new Set(board.parts.map((p) => p.state))).toEqual(new Set(["outline"]));
  expect(board.traces.some((t) => t.live)).toBe(false);
});

test("the compact board uses the smaller part size", () => {
  expect(boardModel(topics, edges, { compact: true }).size).toBe(BOARD_SIZES.compact);
  expect(boardModel(topics, edges, { compact: true }).width).toBeLessThan(
    boardModel(topics, edges).width,
  );
});

test("siblings stack in teaching order regardless of TopicEdge insertion order", () => {
  for (const links of [edges, [...edges].reverse()]) {
    const { nodes } = layoutBoard(topics, links);
    const b = nodes.find((node) => node.id === "b")!;
    const c = nodes.find((node) => node.id === "c")!;
    expect(b.x).toBe(c.x);
    expect(b.y).toBeLessThan(c.y);
  }
});
