import { expect, test } from "vite-plus/test";
import { trackLevels } from "../app/utils/track-levels";

test("each meter follows its Track's Topic ordinals even when titles sort differently", () => {
  const levels = trackLevels(
    [
      {
        id: "a",
        level: 0,
        tracks: [
          { id: "forward", ordinal: 2 },
          { id: "reverse", ordinal: 1 },
        ],
      },
      {
        id: "b",
        level: 2,
        tracks: [
          { id: "forward", ordinal: 1 },
          { id: "reverse", ordinal: 2 },
        ],
      },
    ],
    [],
  );
  expect(levels.get("forward")).toEqual([2, 0]);
  expect(levels.get("reverse")).toEqual([0, 2]);
});

test("a prerequisite precedes its dependent even when attached later", () => {
  const levels = trackLevels(
    [
      { id: "b", level: 3, tracks: [{ id: "one", ordinal: 1 }] },
      { id: "a", level: 1, tracks: [{ id: "one", ordinal: 2 }] },
    ],
    [{ from: "a", to: "b" }],
  );
  expect(levels.get("one")).toEqual([1, 3]);
});
