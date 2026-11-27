import { expect, test } from "vite-plus/test";
import { trackLevels } from "../app/utils/track-levels";

test("each meter follows its Track's Topic ordinals even when titles sort differently", () => {
  const levels = trackLevels([
    {
      level: 0,
      tracks: [
        { id: "forward", ordinal: 2 },
        { id: "reverse", ordinal: 1 },
      ],
    },
    {
      level: 2,
      tracks: [
        { id: "forward", ordinal: 1 },
        { id: "reverse", ordinal: 2 },
      ],
    },
  ]);
  expect(levels.get("forward")).toEqual([2, 0]);
  expect(levels.get("reverse")).toEqual([0, 2]);
});
